import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { registerTools } from './tools/index.js';
import { registerResources } from './resources/index.js';
import { registerPrompts } from './prompts/index.js';

const server = new McpServer({
  name: 'mcp-practical',
  version: '0.1.0',
});

registerTools(server);
registerResources(server);
registerPrompts(server);

if (process.env.TRANSPORT === 'http') {
  const port = parseInt(process.env.PORT ?? '3000', 10);
  const app = createMcpExpressApp({ host: '0.0.0.0' });
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  app.get('/healthz', (_req, res) => { res.json({ status: 'ok' }); });
  app.all('/mcp', (req, res) => { transport.handleRequest(req, res, req.body); });

  await server.connect(transport);
  app.listen(port, '0.0.0.0', () => console.error(`MCP HTTP server on :${port}`));
} else {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
