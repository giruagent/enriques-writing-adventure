import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, resolve, sep} from 'node:path';
const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
const root = resolve('out');
const types = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.webmanifest':'application/manifest+json', '.png':'image/png', '.txt':'text/plain'};
createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  if (base && path === base) {res.writeHead(301, {Location: `${base}/`}).end(); return;}
  if (!path.startsWith(`${base}/`)) {res.writeHead(404).end(); return;}
  const relative = decodeURIComponent(path.slice(base.length));
  const file = resolve(root, `.${relative.endsWith('/') ? `${relative}index.html` : relative}`);
  if (!file.startsWith(root + sep)) {res.writeHead(403).end(); return;}
  try {const data = await readFile(file); res.writeHead(200, {'Content-Type': types[extname(file)] || 'application/octet-stream'}).end(data);}
  catch {res.writeHead(404).end();}
}).listen(Number(process.env.PORT || 4173), '127.0.0.1');
