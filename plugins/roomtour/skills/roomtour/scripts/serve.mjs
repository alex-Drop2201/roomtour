#!/usr/bin/env node
// ROOMTOUR: serve a folder of tours on 127.0.0.1 so the browser loads the screenshots beside each page.
// Usage: node serve.mjs <tours folder> [port]   (macOS, Windows, Linux; Node 18+, no dependencies)
// Only this computer can open it. Stop with Ctrl+C.
//
// Safety: answers only GET and HEAD for the Host 127.0.0.1:<port> or localhost:<port> (no DNS rebinding),
// never serves names that start with a dot (.git, .env, .gitignore), never leaves the folder (symlinks included),
// escapes everything it writes into a listing, and sends a strict Content-Security-Policy with every response.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WIN = process.platform === 'win32';
const EXAMPLE = 'node serve.mjs ~/Documents/roomtour';

// ---- arguments ----
const asked = path.resolve(process.argv[2] || '.');
let root;
try {
  if (!fs.statSync(asked).isDirectory()) throw new Error('not a folder');
  root = fs.realpathSync.native(asked);
} catch {
  console.error(`Not a folder: ${asked}. Pass your tours folder, for example: ${EXAMPLE}`);
  process.exit(1);
}
const portArg = process.argv[3];
let first = 8770;
if (portArg !== undefined) {
  if (!/^\d{1,5}$/.test(portArg) || +portArg < 1 || +portArg > 65535) {
    console.error(`Not a port: ${portArg}. Pass a whole number from 1 to 65535, for example: ${EXAMPLE} 8770`);
    process.exit(1);
  }
  first = +portArg;
}
const last = Math.min(first + 19, 65535);

// ---- responses ----
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.mp4': 'video/mp4'
};
const BASE = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'cross-origin-resource-policy': 'same-origin',
  'referrer-policy': 'no-referrer'
};
const CSP_PAGE = "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
const CSP_LIST = "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const unesc = (s) => String(s).replace(/&(amp|lt|gt|quot|#39|apos);/g, (m, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'" }[e]));

function plain(res, status, msg, extra = {}) {
  res.writeHead(status, { ...BASE, 'content-security-policy': CSP_LIST, 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-cache', ...extra });
  res.end(msg + '\n');
}
const notFound = (res) => plain(res, 404, 'Not found');

// Inside the root, and no part of the real path starts with a dot. Works when the root is / or C:\.
function inside(real) {
  const rel = path.relative(root, real);
  if (rel === '') return true;
  if (path.isAbsolute(rel) || rel === '..' || rel.startsWith('..' + path.sep)) return false;
  return !rel.split(path.sep).some((s) => s.startsWith('.'));
}

// ---- requests ----
const server = http.createServer((req, res) => {
  handle(req, res).catch((e) => {
    console.error(`  error  ${req.url}: ${e.code || e.message}`);
    if (!res.headersSent) plain(res, 500, 'Server error');
    else res.destroy();
  });
});

async function handle(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return plain(res, 405, 'Only GET and HEAD', { allow: 'GET, HEAD' });
  const port = server.address().port;
  const host = String(req.headers.host || '').toLowerCase();
  if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) return plain(res, 421, `This server answers only at http://127.0.0.1:${port}/`);

  const raw = String(req.url || '');
  if (!raw.startsWith('/')) return plain(res, 400, 'Bad request');
  const rawPath = raw.split('?')[0];
  const segs = [];
  for (const part of rawPath.split('/')) {
    if (!part) continue;
    let seg;
    try { seg = decodeURIComponent(part); } catch { return plain(res, 400, 'Bad request'); }
    // An encoded slash, backslash or NUL inside one segment is never a real file name here
    if (/[/\\\0]/.test(seg) || (WIN && seg.includes(':'))) return plain(res, 400, 'Bad request');
    if (seg.startsWith('.')) return notFound(res);              // .git, .env, .gitignore, and .. as well
    if (WIN && /[. ]$/.test(seg)) return notFound(res);         // Windows drops trailing dots and spaces
    segs.push(seg);
  }

  let real, st;
  try { real = await fs.promises.realpath(path.join(root, ...segs)); } catch { return notFound(res); }
  if (!inside(real)) return notFound(res);
  try { st = await fs.promises.stat(real); } catch { return notFound(res); }

  if (st.isDirectory()) {
    // The redirect is built from the decoded segments, re-encoded: always one leading slash, never another site
    if (!rawPath.endsWith('/')) {
      const location = '/' + segs.map(encodeURIComponent).join('/') + (segs.length ? '/' : '');
      res.writeHead(302, { ...BASE, 'content-security-policy': CSP_LIST, location, 'cache-control': 'no-cache' }).end();
      return;
    }
    const index = path.join(real, 'index.html');
    let ist = null;
    try { ist = await fs.promises.stat(index); } catch { /* no index: list the folder */ }
    if (ist && ist.isFile()) return sendFile(req, res, index, ist);
    return sendListing(req, res, real, segs);
  }
  if (!st.isFile() || rawPath.endsWith('/')) return notFound(res);
  return sendFile(req, res, real, st);
}

function sendFile(req, res, file, st) {
  const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const modified = new Date(Math.floor(st.mtimeMs / 1000) * 1000);
  const etag = `W/"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
  const headers = { ...BASE, 'content-security-policy': CSP_PAGE, 'cache-control': 'no-cache', 'last-modified': modified.toUTCString(), etag };
  // Revalidate on every load (no-cache), but answer 304 when the file has not changed
  const inm = req.headers['if-none-match'];
  const ims = Date.parse(req.headers['if-modified-since'] || '');
  if (inm ? inm.split(',').map((t) => t.trim()).includes(etag) : !Number.isNaN(ims) && modified.getTime() <= ims) {
    res.writeHead(304, headers).end();
    return;
  }
  if (req.method === 'HEAD') { res.writeHead(200, { ...headers, 'content-type': type }).end(); return; }
  const stream = fs.createReadStream(file);
  stream.on('open', () => { res.writeHead(200, { ...headers, 'content-type': type }); stream.pipe(res); });
  // EACCES, EBUSY, EPERM: answer this request and keep serving the others
  stream.on('error', (e) => {
    const denied = e.code === 'EACCES' || e.code === 'EPERM' || e.code === 'EBUSY';
    if (!res.headersSent) plain(res, denied ? 403 : 500, denied ? 'This file cannot be read right now' : 'Server error');
    else res.destroy();
  });
  res.on('close', () => stream.destroy());
}

async function tourTitle(folder) {
  let fh;
  try {
    fh = await fs.promises.open(path.join(folder, 'index.html'), 'r');
    const buf = Buffer.alloc(16384);
    const { bytesRead } = await fh.read(buf, 0, buf.length, 0);
    const m = buf.toString('utf8', 0, bytesRead).match(/<title[^>]*>([^<]*)<\/title>/i);
    return m ? unesc(m[1]).replace(/\s+/g, ' ').trim() : '';
  } catch { return ''; } finally { if (fh) await fh.close().catch(() => {}); }
}

async function sendListing(req, res, dir, segs) {
  let entries;
  try { entries = await fs.promises.readdir(dir, { withFileTypes: true }); } catch { return plain(res, 403, 'This folder cannot be read'); }
  const rows = [];
  for (const d of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    // Dot names stay private; _roomtour and _zones.html are plumbing, not tours
    if (d.name.startsWith('.') || d.name.startsWith('_')) continue;
    let isDir = d.isDirectory();
    if (d.isSymbolicLink()) {
      try { const real = await fs.promises.realpath(path.join(dir, d.name)); if (!inside(real)) continue; isDir = (await fs.promises.stat(real)).isDirectory(); } catch { continue; }
    }
    rows.push({ name: d.name, isDir, title: isDir ? await tourTitle(path.join(dir, d.name)) : '' });
  }
  rows.sort((a, b) => (b.isDir - a.isDir) || a.name.localeCompare(b.name));
  const where = '/' + segs.join('/') + (segs.length ? '/' : '');
  const items = rows.map((r) => {
    const href = encodeURIComponent(r.name) + (r.isDir ? '/' : '');
    const name = esc(r.name) + (r.isDir ? '/' : '');
    return r.title
      ? `<li><a href="${esc(href)}">${esc(r.title)}</a> <span class="name">${name}</span></li>`
      : `<li><a href="${esc(href)}">${name}</a></li>`;
  }).join('');
  const empty = segs.length ? 'Nothing here yet.' : 'No tours here yet.';
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>ROOMTOUR · ${esc(where)}</title>
<style>
:root{color-scheme:light dark;--ink:#1b1b1f;--soft:#5c5c66;--bg:#fff;--link:#3346d3}
@media (prefers-color-scheme:dark){:root{--ink:#ececf1;--soft:#a6a6b2;--bg:#141418;--link:#9fb0ff}}
body{font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink);background:var(--bg);max-width:44rem;margin:2.5rem auto;padding:0 1rem}
h1{font-size:1.25rem;margin:0 0 .25rem}p{margin:.25rem 0 1rem;color:var(--soft)}a{color:var(--link)}
ul{padding-left:1.25rem}li{margin:.4rem 0}.name{color:var(--soft);font-size:.875rem;margin-left:.375rem}
</style>
<h1>ROOMTOUR</h1><p>${esc(where)}</p>
${segs.length ? '<p><a href="../">Up one folder</a></p>' : ''}
${items ? `<ul>${items}</ul>` : `<p>${empty}</p>`}
</html>`;
  res.writeHead(200, { ...BASE, 'content-security-policy': CSP_LIST, 'content-type': TYPES['.html'], 'cache-control': 'no-cache' });
  res.end(req.method === 'HEAD' ? undefined : html);
}

// ---- start ----
let port = first;
server.on('error', (e) => {
  if (server.listening) { console.error(`  error  ${e.message}`); return; }
  if (e.code === 'EADDRINUSE' && port < last) { port++; server.listen(port, '127.0.0.1'); return; }
  if (e.code === 'EADDRINUSE') console.error(first === last ? `Port ${first} is busy. Pass a free port as the second argument.` : `Ports ${first}–${last} are busy. Pass a free port as the second argument.`);
  else if (e.code === 'EACCES') console.error(`Port ${port} is not allowed for this user. Pass a port above 1024 as the second argument, for example: ${EXAMPLE} 8770`);
  else console.error(`The server could not start: ${e.message}`);
  process.exit(1);
});
server.on('listening', () => {
  console.log(`ROOMTOUR is serving ${root}`);
  console.log(`  open  http://127.0.0.1:${port}/${port !== first ? `   (port ${first} was busy)` : ''}`);
  console.log('  Only this computer can open it.');
  console.log('  stop  press Ctrl+C here, or close this window');
});
server.listen(port, '127.0.0.1');
