#!/usr/bin/env node
// ROOMTOUR: serve a folder of tours on 127.0.0.1 so the browser loads the screenshots beside each page.
// Usage: node serve.mjs <folder> [port]   (Mac, Windows, Linux; Node 18+, no dependencies)
// Only this computer can open it. Stop with Ctrl+C.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const wanted = Number(process.argv[3]) || 8770;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
  console.error(`Not a folder: ${root}`);
  process.exit(1);
}

function listing(dir, urlPath) {
  const items = fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => !d.name.startsWith('.'))
    .map((d) => `<li><a href="${encodeURI(path.posix.join(urlPath, d.name))}${d.isDirectory() ? '/' : ''}">${d.name}${d.isDirectory() ? '/' : ''}</a></li>`)
    .join('');
  return `<!doctype html><meta charset="utf-8"><title>ROOMTOUR</title><body style="font:16px system-ui;margin:2rem"><h1 style="font-size:1.2rem">${urlPath}</h1><ul>${items}</ul>`;
}

const server = http.createServer((req, res) => {
  let urlPath;
  try { urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400).end(); return; }
  const file = path.normalize(path.join(root, urlPath));
  // Never serve anything outside the folder
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end('Forbidden'); return; }
  fs.stat(file, (err, st) => {
    if (err) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found'); return; }
    if (st.isDirectory()) {
      if (!urlPath.endsWith('/')) { res.writeHead(301, { location: encodeURI(urlPath + '/') }).end(); return; }
      const index = path.join(file, 'index.html');
      if (fs.existsSync(index)) { send(index); return; }
      res.writeHead(200, { 'content-type': TYPES['.html'], 'cache-control': 'no-store' }).end(listing(file, urlPath));
      return;
    }
    send(file);
  });
  function send(f) {
    res.writeHead(200, { 'content-type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  }
});

function listen(port, triesLeft) {
  server.once('error', (e) => {
    if (e.code === 'EADDRINUSE' && triesLeft > 0) listen(port + 1, triesLeft - 1);
    else { console.error(e.message); process.exit(1); }
  });
  server.listen(port, '127.0.0.1', () => {
    console.log(`ROOMTOUR is serving ${root}`);
    console.log(`  open  http://127.0.0.1:${port}/`);
    console.log('  stop  Ctrl+C');
  });
}
listen(wanted, 20);
