import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { register as registerKbStatus } from './kb-status.js';

export function registerResources(server: McpServer): void {
  registerKbStatus(server);
}
