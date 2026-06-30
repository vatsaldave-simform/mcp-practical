import { QdrantClient } from "@qdrant/js-client-rest";
import type { Chunk } from "./chunker.js";

export interface SearchResult {
  filePath: string;
  headingTrail: string[];
  text: string;
  score: number;
  syncedAt: string;
}

const VECTOR_SIZE = 768;

export class VectorStore {
  private client: QdrantClient;
  private collection: string;

  constructor(url: string, apiKey: string, collection: string) {
    this.client = new QdrantClient({ url, apiKey });
    this.collection = collection;
  }

  async init(): Promise<void> {
    try {
      await this.client.getCollection(this.collection);
    } catch {
      await this.client.createCollection(this.collection, {
        vectors: { size: VECTOR_SIZE, distance: "Cosine" },
      });
    }
  }

  async upsertFile(
    filePath: string,
    chunks: Chunk[],
    vectors: number[][],
  ): Promise<void> {
    await this.client.delete(this.collection, {
      filter: { must: [{ key: "filePath", match: { value: filePath } }] },
    });

    if (chunks.length === 0) return;

    const syncedAt = new Date().toISOString();
    await this.client.upsert(this.collection, {
      points: chunks.map((chunk, i) => ({
        id: crypto.randomUUID(),
        vector: vectors[i],
        payload: {
          filePath: chunk.filePath,
          headingTrailJson: JSON.stringify(chunk.headingTrail),
          text: chunk.text,
          syncedAt,
        },
      })),
    });
  }

  async query(
    vector: number[],
    topK: number,
    filterFilePath?: string,
  ): Promise<SearchResult[]> {
    const filter = filterFilePath
      ? { must: [{ key: "filePath", match: { value: filterFilePath } }] }
      : undefined;

    const results = await this.client.search(this.collection, {
      vector,
      limit: topK,
      filter,
      with_payload: true,
    });

    return results.map((r) => ({
      filePath: r.payload!.filePath as string,
      headingTrail: JSON.parse(
        r.payload!.headingTrailJson as string,
      ) as string[],
      text: r.payload!.text as string,
      score: r.score,
      syncedAt: r.payload!.syncedAt as string,
    }));
  }

  async stats(): Promise<{
    chunkCount: number;
    fileCount: number;
    lastSyncAt: string | null;
  }> {
    const { count } = await this.client.count(this.collection);
    if (count === 0) {
      return { chunkCount: 0, fileCount: 0, lastSyncAt: null };
    }

    const { points } = await this.client.scroll(this.collection, {
      limit: 10000,
      with_payload: ["filePath", "syncedAt"],
    });

    const fileSet = new Set(points.map((p) => p.payload?.filePath as string));
    const syncedAts = points
      .map((p) => p.payload?.syncedAt as string)
      .filter(Boolean)
      .sort();

    return {
      chunkCount: count,
      fileCount: fileSet.size,
      lastSyncAt: syncedAts.at(-1) ?? null,
    };
  }
}
