Scaffold a new MCP resource in this TypeScript project.

The user will provide: resource name (kebab-case) and a URI pattern (e.g. `config://app` or `user://{userId}/profile`).

Steps:
1. If the URI contains `{param}` placeholders, create a **dynamic** resource using `ResourceTemplate`:
   ```typescript
   import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
   import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

   export function register(server: McpServer): void {
     server.resource(
       '<name>',
       new ResourceTemplate('<uri-template>', {
         list: async () => ({
           resources: [
             { uri: '<example-uri>', name: '<example-name>' },
           ],
         }),
       }),
       { title: '<Title>', mimeType: 'application/json' },
       async (uri, params) => ({
         contents: [{ uri: uri.href, text: JSON.stringify(params) }],
       })
     );
   }
   ```

   If the URI is static (no placeholders), use the simpler static form:
   ```typescript
   server.resource(
     '<name>',
     '<static-uri>',
     { title: '<Title>', description: '<desc>', mimeType: 'text/plain' },
     async (uri) => ({
       contents: [{ uri: uri.href, text: 'content here' }],
     })
   );
   ```

2. Add import and register call to `src/resources/index.ts`.
3. Run `npm run build`.

Use $ARGUMENTS as the resource name and URI pattern.
