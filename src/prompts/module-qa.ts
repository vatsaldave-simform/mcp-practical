import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function register(server: McpServer): void {
  server.prompt(
    'module-qa',
    {
      module: z.string().describe('Module name or topic to scope the search (e.g. "payments", "auth")'),
      question: z.string().describe('Natural language question about the module'),
    },
    (args) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Answer the following question about the "${args.module}" module using the knowledge base.

Steps:
1. Call the \`search-knowledge-base\` tool with query: "${args.question}". Optionally pass a filePath containing "${args.module}" to narrow results.
2. Synthesize the returned chunks into a clear, direct answer.
3. Cite every source as: Source: [filePath] — [heading trail]
4. If no results are returned, tell the user to run \`sync-knowledge-base\` first.

Question: ${args.question}`,
          },
        },
      ],
    })
  );
}
