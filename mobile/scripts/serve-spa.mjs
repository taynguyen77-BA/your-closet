import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist-local');
const port = Number(process.argv[3] ?? 4174);
const mimeTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
};

function resolveRequestPath(url) {
  const pathname = decodeURIComponent(new URL(url ?? '/', `http://localhost:${port}`).pathname);
  const normalized = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  const requested = join(root, normalized);
  if (requested.startsWith(root) && existsSync(requested) && statSync(requested).isFile()) return requested;
  return join(root, 'index.html');
}

createServer((request, response) => {
  const file = resolveRequestPath(request.url);
  const extension = extname(file);
  response.writeHead(200, { 'Content-Type': mimeTypes[extension] ?? 'application/octet-stream' });
  createReadStream(file).pipe(response);
}).listen(port, () => {
  console.log(`SPA preview running at http://localhost:${port}`);
});
