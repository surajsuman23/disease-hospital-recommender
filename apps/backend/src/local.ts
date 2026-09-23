import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { existsSync } from 'node:fs';
import { Server } from 'node:http';
import { createApp } from './app';
if (existsSync('.env')) process.loadEnvFile('.env');
const port = Number(process.env.PORT ?? 8200);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('PORT must be 1–65535.');
const app = createApp({
  log:
    process.env.LOG_REQUESTS === 'true'
      ? (entry) => console.info(JSON.stringify(entry))
      : undefined,
});
app.get('*', serveStatic({ root: './dist/client' }));
const server = serve({
  fetch: app.fetch,
  hostname: process.env.HOST ?? '127.0.0.1',
  port,
});
if (server instanceof Server) {
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.keepAliveTimeout = 5000;
}
console.info(
  `Disease prediction app: http://${process.env.HOST ?? '127.0.0.1'}:${port}`,
);
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.once(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  });
