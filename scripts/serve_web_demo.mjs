import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../02_网页演示/', import.meta.url));
const types = { 'index.html': 'text/html', 'styles.css': 'text/css', 'app.js': 'text/javascript', 'engine.js': 'text/javascript', 'favicon.svg': 'image/svg+xml' };
const port = Number(process.env.DEMO_PORT || 4178);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('DEMO_PORT must be between 1024 and 65535');
const server = createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
    let pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    if (pathname.startsWith('/customer-agent-demo/')) pathname = pathname.slice('/customer-agent-demo'.length);
    const name = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (!Object.hasOwn(types, name)) { response.writeHead(404); response.end('Not found'); return; }
    const bytes = await readFile(resolve(root, name));
    response.writeHead(200, { 'Content-Type': `${types[name]}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : bytes);
  } catch {
    response.writeHead(400); response.end('Bad request');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Duncan 客服网页演示: http://127.0.0.1:${port}/customer-agent-demo/`));
process.on('SIGINT', () => server.close(() => process.exit(0)));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
