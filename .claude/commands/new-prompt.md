Scaffold a new MCP prompt template in this TypeScript project.

The user will provide: prompt name (kebab-case) and what it should help users do.

Steps:
1. Create `src/prompts/<name>.ts`:
   ```typescript
   import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
   import { z } from 'zod';

   export function register(server: McpServer): void {
     server.prompt(
       '<name>',
       '<description of what this prompt template does>',
       {
         // Arguments the user provides when invoking the prompt
         topic: z.string().describe('The topic to address'),
       },
       ({ topic }) => ({
         messages: [
           {
             role: 'user' as const,
             content: {
               type: 'text' as const,
               text: `Please help me with: ${topic}\n\n<!-- Add your prompt template here -->`,
             },
           },
         ],
       })
     );
   }
   ```

2. Add import and register call to `src/prompts/index.ts`.
3. Run `npm run build`.

Use $ARGUMENTS as the prompt name and intent.
