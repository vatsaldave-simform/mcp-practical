import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { register as registerModuleQa } from './module-qa.js';

export function registerPrompts(server: McpServer): void {
  registerModuleQa(server);
}
