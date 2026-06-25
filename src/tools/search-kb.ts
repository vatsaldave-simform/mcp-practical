import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getConfig } from '../lib/config.js';
import { Embedder } from '../lib/embedder.js';
import { VectorStore } from '../lib/vector-store.js';

export function register(server: McpServer): void {
  server.tool(
    'search-knowledge-base',
    'Semantically search the local knowledge base vector index and return the most relevant document chunks.',
    {
      query: z.string().min(3).describe('Natural language question to search the knowledge base'),
      topK: z.number().int().min(1).max(20).optional().describe('Number of results to return (default from config)'),
      filePath: z.string().optional().describe('Restrict search to a single source file'),
    },
    async (args) => {
      const cfg = getConfig();
      const embedder = new Embedder(cfg.google.apiKey);
      const store = new VectorStore(cfg.index.dir);

      await store.init();

      const { chunkCount } = await store.stats();
      if (chunkCount === 0) {
        return {
          content: [{ type: 'text', text: 'Knowledge base is empty. Run sync-knowledge-base first.' }],
        };
      }

      const [queryVector] = await embedder.embedBatch([args.query]);
      const results = await store.query(queryVector, args.topK ?? cfg.index.searchTopK, args.filePath);

      if (results.length === 0) {
        return {
          content: [{ type: 'text', text: 'No results found.' }],
        };
      }

      const formatted = results
        .map((r, i) => {
          const section = r.headingTrail.length > 0 ? r.headingTrail.join(' > ') : '(top level)';
          return `## Result ${i + 1} (score: ${r.score.toFixed(2)})\n**Source:** ${r.filePath}\n**Section:** ${section}\n\n${r.text}`;
        })
        .join('\n\n---\n\n');

      return {
        content: [{ type: 'text', text: formatted }],
      };
    }
  );
}
