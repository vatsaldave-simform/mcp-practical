import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { timingSafeEqual } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { registerTools } from './tools/index.js';
import { registerResources } from './resources/index.js';
import { registerPrompts } from './prompts/index.js';

const MCP_API_TOKEN = process.env.MCP_API_TOKEN;

// Called per request — stateless mode requires a fresh server+transport each time.
function createServer(): McpServer {
  const server = new McpServer({ name: 'mcp-practical', version: '0.1.0' });
  registerTools(server);
  registerResources(server);
  registerPrompts(server);
  return server;
}

if (process.env.TRANSPORT === 'http') {
  const port = parseInt(process.env.PORT ?? '10000', 10);
  const RENDER_EXTERNAL_HOSTNAME = process.env.RENDER_EXTERNAL_HOSTNAME;

  const app = createMcpExpressApp({
    host: '0.0.0.0',
    allowedHosts: RENDER_EXTERNAL_HOSTNAME ? [RENDER_EXTERNAL_HOSTNAME] : undefined,
  });

  // Bearer token auth. Skipped for /health and when no token is configured (local dev).
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/health' || !MCP_API_TOKEN) {
      next();
      return;
    }
    const auth = req.headers.authorization ?? '';
    const expected = `Bearer ${MCP_API_TOKEN}`;
    if (auth.length === expected.length && timingSafeEqual(Buffer.from(auth), Buffer.from(expected))) {
      next();
      return;
    }
    res.status(401).json({ jsonrpc: '2.0', error: { code: -32001, message: 'Unauthorized' }, id: null });
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.post('/mcp', async (req: Request, res: Response) => {
    const server = createServer();
    try {
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      res.on('close', () => {
        transport.close();
        server.close();
      });
    } catch (error) {
      console.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null });
      }
    }
  });

  // GET and DELETE only apply to stateful servers — reject explicitly.
  app.get('/mcp', (_req: Request, res: Response) => {
    res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null });
  });
  app.delete('/mcp', (_req: Request, res: Response) => {
    res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null });
  });

  if (!MCP_API_TOKEN) {
    console.warn('WARNING: MCP_API_TOKEN is not set. The server is running without authentication.');
  }

  app.listen(port, '0.0.0.0', () => console.error(`MCP HTTP server on :${port}`));

  process.on('SIGINT', () => {
    console.error('Shutting down server...');
    process.exit(0);
  });
} else {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
