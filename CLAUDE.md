# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
npm install                # install dependencies
npm run build              # compile TypeScript → build/
npm run dev                # watch mode (tsx, no compile step)
npm run start              # run compiled server
npm run typecheck          # type-check without emitting
npm run inspect            # open MCP Inspector UI against compiled server
npm test                   # run tests once
npm run test:watch         # run tests in watch mode
```

Always run `npm run build` before testing changes through Claude Code — the MCP server loads from `build/index.js`.

## Architecture

```
src/
  index.ts          # entry point: creates McpServer, calls register*(), connects transport
  tools/
    index.ts        # exports registerTools(server) — add tool imports here
    <name>.ts       # each file exports one register(server) function
  resources/
    index.ts        # exports registerResources(server)
    <name>.ts
  prompts/
    index.ts        # exports registerPrompts(server)
    <name>.ts
build/              # compiled output (gitignored)
.claude/
  settings.json     # Claude Code: MCP server registration + hooks
  commands/         # custom slash commands (skills)
  hooks/            # shell scripts for hook events
```

**Registration pattern** — every tool/resource/prompt file exports a single `register(server: McpServer)` function. `src/tools/index.ts` imports and calls all of them, keeping `src/index.ts` clean.

## MCP Primitives

| Primitive | When to use | SDK method |
|-----------|-------------|------------|
| **Tool** | Model-invoked function with side effects (API calls, writes) | `server.tool()` |
| **Resource** | Read-only data the model pulls on demand | `server.resource()` |
| **Prompt** | Reusable message template that the user triggers | `server.prompt()` |

Tools use Zod schemas for `inputSchema` (and optional `outputSchema`). Return `{ content: [...], isError: true }` for recoverable errors — never throw.

## Transport

- **stdio** (default): for Claude Code / Claude Desktop. `StdioServerTransport` reads from stdin / writes to stdout. **Never write to stdout** in server code — use `console.error` or `server.sendLoggingMessage()`.
- **Streamable HTTP**: for network-accessible servers. Use `StreamableHTTPServerTransport` from the SDK with an Express/Hono app.

## Claude Code Integration

The server is registered in `.claude/settings.json`:

```json
{
  "mcpServers": {
    "mcp-practical": {
      "type": "stdio",
      "command": "node",
      "args": ["./build/index.js"]
    }
  }
}
```

To register globally (available across all projects), add the same block to `~/.claude/settings.json`. Use `/add-to-claude` for a guided reminder.

## Debugging

- Use `npm run inspect` (MCP Inspector) for interactive testing of tools/resources/prompts before connecting to Claude Code.
- Server logs must go to stderr: `console.error(...)` or `await server.sendLoggingMessage({ level: 'info', data: '...' })`.
- Claude Code session logs: `~/.claude/logs/` — check here for MCP connection errors.

## Custom Slash Commands (Skills)

| Command | Purpose |
|---------|---------|
| `/new-tool <name> <description>` | Scaffold a new tool in `src/tools/` |
| `/new-resource <name> <uri>` | Scaffold a new resource in `src/resources/` |
| `/new-prompt <name>` | Scaffold a new prompt template in `src/prompts/` |
| `/inspect` | Build + open MCP Inspector |
| `/add-to-claude` | Guide to register server globally in Claude Code |

## Hooks

`PostToolUse` on `Write|Edit` → `.claude/hooks/rebuild.sh` auto-rebuilds when any `src/*.ts` file is saved, keeping `build/` in sync without manual `npm run build`.

## Subagents

- For complex tool input schemas, fork an agent: *"Design a Zod schema for a tool that does X, taking inputs Y and Z, returning W."*
- After implementing a new tool, run `/code-review` to catch missing `isError: true` returns, stdout writes, or incomplete input validation.
