import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { register as registerSyncKb } from './sync-kb.js';
import { register as registerSearchKb } from './search-kb.js';

export function registerTools(server: McpServer): void {
  registerSyncKb(server);
  registerSearchKb(server);
}
