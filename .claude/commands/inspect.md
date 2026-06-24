Build the MCP server and open the MCP Inspector for interactive testing.

Steps:
1. Run `npm run build` — fix any TypeScript errors before proceeding.
2. Run `npm run inspect` — this opens the MCP Inspector UI connected to `build/index.js` via stdio.

In the Inspector you can:
- Browse registered tools, resources, and prompts
- Call tools with custom arguments and see the JSON response
- Fetch resources by URI
- Render prompt templates with arguments

Tips:
- If a tool is missing, check that it's imported and called in `src/tools/index.ts`.
- If the inspector fails to connect, check that `build/index.js` exists and the server doesn't crash on startup (run `node build/index.js` directly and check stderr).
