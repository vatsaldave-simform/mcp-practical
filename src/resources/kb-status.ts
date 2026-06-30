import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getConfig } from '../lib/config.js';
import { VectorStore } from '../lib/vector-store.js';

export function register(server: McpServer): void {
  server.resource(
    'kb-status',
    'kb://status',
    async (uri) => {
      const cfg = getConfig();
      const store = new VectorStore(cfg.qdrant.url, cfg.qdrant.apiKey, cfg.qdrant.collection);
      await store.init();

      const { chunkCount, fileCount, lastSyncAt } = await store.stats();

      const payload =
        chunkCount > 0
          ? { status: 'ready', chunkCount, fileCount, lastSyncAt }
          : { status: 'not_initialized' };

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(payload),
          },
        ],
      };
    }
  );
}
