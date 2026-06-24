Guide the user to register this MCP server in Claude Code globally (user-wide) or confirm the project-level registration is active.

Explain:

**Project-level** (already configured at `.claude/settings.json`):
- Active only when Claude Code is opened in this directory.
- No additional steps needed — it's already set up.

**User-level** (global, works in any Claude Code session):
- Open `~/.claude/settings.json` (create if missing).
- Add the following under `"mcpServers"`:
  ```json
  {
    "mcpServers": {
      "mcp-practical": {
        "type": "stdio",
        "command": "node",
        "args": ["/home/vatsal/Desktop/mcp-practical/build/index.js"]
      }
    }
  }
  ```
- Use the **absolute path** to `build/index.js` — relative paths don't work for global registration.
- Restart Claude Code after editing the file.

**After registration**, the tools/resources/prompts from this server are available in Claude Code. Run `npm run build` first to make sure `build/index.js` is up to date.
