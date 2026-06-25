import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getConfig } from "../lib/config.js";
import { BitbucketClient } from "../lib/bitbucket-client.js";
import { chunkMarkdown } from "../lib/chunker.js";
import { Embedder } from "../lib/embedder.js";
import { VectorStore } from "../lib/vector-store.js";

export function register(server: McpServer): void {
  server.tool(
    "sync-knowledge-base",
    "Fetch markdown files from the Bitbucket knowledge base repo, embed them with Google Gemini, and store in the local vector index.",
    {
      filePath: z
        .string()
        .optional()
        .describe("Sync only this file path. Omit to sync the entire repo."),
    },
    async (args) => {
      const cfg = getConfig();
      const client = new BitbucketClient(cfg.bitbucket);
      const embedder = new Embedder(cfg.google.apiKey);
      const store = new VectorStore(cfg.index.dir);

      await store.init();

      const files = args.filePath
        ? [args.filePath]
        : await client.listMarkdownFiles();

      const errors: string[] = [];
      let totalChunks = 0;

      for (const filePath of files) {
        try {
          const content = await client.fetchFile(filePath);
          const chunks = chunkMarkdown(
            content,
            filePath,
            cfg.index.chunkMaxChars,
          );

          if (chunks.length === 0) {
            await server.sendLoggingMessage({
              level: "info",
              data: `Skipped ${filePath} (no chunks)`,
            });
            continue;
          }

          const embeddingInputs = chunks.map(
            (chunk) =>
              `${chunk.headingTrail.join(" > ")} — ${filePath}\n\n${chunk.text}`,
          );

          const vectors = await embedder.embedBatch(embeddingInputs);
          await store.upsertFile(filePath, chunks, vectors);
          totalChunks += chunks.length;

          await server.sendLoggingMessage({
            level: "info",
            data: `Synced ${filePath} (${chunks.length} chunks)`,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          errors.push(`${filePath}: ${message}`);
          await server.sendLoggingMessage({
            level: "error",
            data: `Failed ${filePath}: ${message}`,
          });
        }
      }

      const summary = `Sync complete. Files: ${files.length}, Chunks: ${totalChunks}, Errors: ${errors.length}`;
      return {
        content: [{ type: "text", text: summary }],
        isError: errors.length === files.length && files.length > 0,
      };
    },
  );
}
