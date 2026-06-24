import { mkdir } from 'fs/promises';
import { LocalIndex } from 'vectra';
import type { MetadataFilter, MetadataTypes } from 'vectra';
import type { Chunk } from './chunker.js';

interface ChunkMeta {
  filePath: string;
  headingTrailJson: string;
  text: string;
  syncedAt: string;
  [key: string]: MetadataTypes;
}

export interface SearchResult {
  filePath: string;
  headingTrail: string[];
  text: string;
  score: number;
  syncedAt: string;
}

export class VectorStore {
  private index: LocalIndex<ChunkMeta>;
  private updating = false;

  constructor(indexDir: string) {
    this.index = new LocalIndex<ChunkMeta>(indexDir);
  }

  async init(): Promise<void> {
    await mkdir(this.index.folderPath, { recursive: true });
    if (!(await this.index.isIndexCreated())) {
      await this.index.createIndex({ version: 1 });
    }
  }

  async upsertFile(filePath: string, chunks: Chunk[], vectors: number[][]): Promise<void> {
    if (this.updating) throw new Error('A sync is already in progress');
    this.updating = true;
    try {
      const staleItems = await this.index.listItemsByMetadata({ filePath: { $eq: filePath } });
      await this.index.beginUpdate();
      try {
        for (const item of staleItems) {
          await this.index.deleteItem(item.id);
        }
        const syncedAt = new Date().toISOString();
        for (let i = 0; i < chunks.length; i++) {
          await this.index.insertItem({
            vector: vectors[i],
            metadata: {
              filePath: chunks[i].filePath,
              headingTrailJson: JSON.stringify(chunks[i].headingTrail),
              text: chunks[i].text,
              syncedAt,
            },
          });
        }
        await this.index.endUpdate();
      } catch (err) {
        this.index.cancelUpdate();
        throw err;
      }
    } finally {
      this.updating = false;
    }
  }

  async query(vector: number[], topK: number, filterFilePath?: string): Promise<SearchResult[]> {
    const filter: MetadataFilter | undefined = filterFilePath
      ? { filePath: { $eq: filterFilePath } }
      : undefined;
    const results = await this.index.queryItems<ChunkMeta>(vector, '', topK, filter);
    return results.map(r => ({
      filePath: r.item.metadata.filePath,
      headingTrail: JSON.parse(r.item.metadata.headingTrailJson) as string[],
      text: r.item.metadata.text,
      score: r.score,
      syncedAt: r.item.metadata.syncedAt,
    }));
  }

  async stats(): Promise<{ chunkCount: number; fileCount: number; lastSyncAt: string | null }> {
    const items = await this.index.listItems<ChunkMeta>();
    const fileSet = new Set(items.map(i => i.metadata.filePath));
    const syncedAts = items.map(i => i.metadata.syncedAt).filter(Boolean).sort();
    return {
      chunkCount: items.length,
      fileCount: fileSet.size,
      lastSyncAt: syncedAts.at(-1) ?? null,
    };
  }
}
