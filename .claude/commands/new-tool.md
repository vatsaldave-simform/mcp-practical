Scaffold a new MCP tool in this TypeScript project.

The user will provide: tool name (kebab-case) and a short description of what it does.

Steps:
1. Create `src/tools/<name>.ts` using this pattern:
   ```typescript
   import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
   import { z } from 'zod';

   export function register(server: McpServer): void {
     server.tool(
       '<name>',
       '<description>',
       {
         // Define input parameters with Zod
         param: z.string().describe('Description of param'),
       },
       async ({ param }) => {
         try {
           // Tool logic here
           return {
             content: [{ type: 'text', text: `Result: ${param}` }],
           };
         } catch (error) {
           return {
             content: [{ type: 'text', text: `Error: ${error}` }],
             isError: true,
           };
         }
       }
     );
   }
   ```

2. Add the import and register call to `src/tools/index.ts`:
   ```typescript
   import { register as register<PascalName> } from './<name>.js';
   register<PascalName>(server);
   ```

3. Run `npm run build` to verify compilation.

Use the $ARGUMENTS as the tool name and description.
