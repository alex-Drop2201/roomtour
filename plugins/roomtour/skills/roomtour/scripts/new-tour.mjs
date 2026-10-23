#!/usr/bin/env node
// ROOMTOUR: create (or refresh) a tour folder.
// Usage: node new-tour.mjs <tours folder> <tour name> [--lang en|uk|ru] [--title "Title"] [--public]
//        node new-tour.mjs <tours folder> --engine-only      (copy or refresh the engine only)
// Creates:  <tours>/_roomtour/roomtour.css, roomtour.js, serve.mjs   the engine and the server, refreshed every run
//           <tours>/<name>/index.html          the page shell, replaced every run
//           <tours>/<name>/tour.data.js        a starter, only if it does not exist yet
//           <tours>/<name>/shots/.gitignore    keeps private screenshots out of git (skipped with --public)
// Node 18+, no dependencies, macOS and Windows.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const assets = path.join(here, '..', 'assets');
const LANGS = ['en', 'uk', 'ru'];
const USAGE = `Usage:
  node new-tour.mjs <tours folder> <tour name> [--lang en|uk|ru] [--title "Title"] [--public]
  node new-tour.mjs <tours folder> --engine-only`;

function die(msg, withUsage = false) {
  console.error(msg + (withUsage ? `\n\n${USAGE}` : ''));
  process.exit(1);
}

// ---- arguments ----
const args = process.argv.slice(2);
if (!args.length) die(USAGE);
const opt = { lang: null, title: null, public: false, engineOnly: false };
const positional = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  const eq = a.match(/^--(lang|title)=(.*)$/s);
  if (eq) { opt[eq[1]] = eq[2]; continue; }
  if (a === '--lang' || a === '--title') {
    const v = args[i + 1];
    if (v === undefined || v.startsWith('--')) die(`${a} needs a value, for example ${a === '--lang' ? '--lang uk' : '--title "GitHub pull request"'}.`, true);
    opt[a.slice(2)] = v; i++;
  } else if (a === '--public') opt.public = true;
  else if (a === '--engine-only') opt.engineOnly = true;
  else if (a === '--help' || a === '-h') { console.log(USAGE); process.exit(0); }
  else if (a.startsWith('--')) die(`Unknown option ${a}.`, true);
  else positional.push(a);
}
if (positional.length > 2) die(`Too many names: ${positional.join(' ')}. Put a title with spaces in quotes after --title.`, true);
if (opt.lang !== null && !LANGS.includes(opt.lang)) {
  die(`--lang must be en, uk or ru, not "${opt.lang}". For another language, write the tour in it and use --lang en (the buttons will be in English).`);
}
if (opt.title !== null && !opt.title.trim()) die('--title is empty. Give the tour a name, for example --title "GitHub pull request".');

const tours = path.resolve(positional[0]);
const slug = positional[1];
if (opt.engineOnly && slug) die('--engine-only takes only the tours folder, not a tour name.', true);
if (!opt.engineOnly && !slug) die(`Name the tour after the folder, for example: node new-tour.mjs "${positional[0]}" github-pr`, true);
if (slug && (!/^[a-z0-9][a-z0-9-]*$/.test(slug) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/.test(slug))) {
  die(`"${slug}" cannot be a tour folder name. Use lowercase Latin letters, digits and dashes, for example github-pr`);
}
if (fs.existsSync(tours) && !fs.statSync(tours).isDirectory()) die(`Not a folder: ${tours}. Pass the folder that holds your tours.`);

const line = (label, text) => console.log(label.padEnd(12) + text);

// ---- engine ----
const engineDir = path.join(tours, '_roomtour');
const engineFiles = [
  [path.join(assets, 'engine', 'roomtour.css'), 'roomtour.css'],
  [path.join(assets, 'engine', 'roomtour.js'), 'roomtour.js'],
  [path.join(here, 'serve.mjs'), 'serve.mjs']
];
for (const [from] of engineFiles) if (!fs.existsSync(from)) die(`The plugin is incomplete: ${from} is missing. Reinstall ROOMTOUR.`);
fs.mkdirSync(engineDir, { recursive: true });
for (const [from, name] of engineFiles) fs.copyFileSync(from, path.join(engineDir, name));
let version = '';
try {
  // Roomtour.version = '0.2.0', or the engine's const VERSION = '0.2.0' behind it
  const m = fs.readFileSync(path.join(engineDir, 'roomtour.js'), 'utf8').match(/Roomtour\.version\s*=\s*['"]([^'"]+)['"]|\bVERSION\s*=\s*['"]([^'"]+)['"]|\bversion\s*:\s*['"](\d+\.\d+\.\d+[^'"]*)['"]/);
  if (m) version = m[1] || m[2] || m[3];
} catch { /* the version is only for the record */ }
line('engine', `${engineDir}  (roomtour.css, roomtour.js, serve.mjs${version ? `; engine ${version}` : ''})`);
if (opt.engineOnly) {
  console.log(`\nNext: open your tours with  node "${path.join(engineDir, 'serve.mjs')}" "${tours}"`);
  process.exit(0);
}

// ---- page ----
const dir = path.join(tours, slug);
const page = path.join(dir, 'index.html');
const hadPage = fs.existsSync(page);
// Re-running without --title or --lang keeps what the page already says
let oldLang = null, oldTitle = null;
if (hadPage) {
  try {
    const old = fs.readFileSync(page, 'utf8');
    const l = old.match(/<html[^>]*\blang="([^"]*)"/i);
    const t = old.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (l && LANGS.includes(l[1])) oldLang = l[1];
    if (t && t[1].trim() && !t[1].includes('{{')) oldTitle = t[1].replace(/&(amp|lt|gt|quot|#39);/g, (m, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" }[e])).trim();
  } catch { /* fall back to the defaults */ }
}
const lang = opt.lang || oldLang || 'en';
const title = (opt.title ?? oldTitle ?? slug.replace(/-+/g, ' ')).trim();
const isPublic = opt.public;

const DESCRIPTION = {
  en: (t) => `A step-by-step tour: ${t}`,
  uk: (t) => `Покроковий тур: ${t}`,
  ru: (t) => `Пошаговый тур: ${t}`
};
const FALLBACK = {
  en: 'This tour did not start. Open it through the local server, or in Chrome or Edge. It needs the _roomtour folder beside its own folder.',
  uk: 'Тур не запустився. Відкрий його через локальний сервер або в Chrome чи Edge. Поруч із текою туру має лежати тека _roomtour.',
  ru: 'Тур не запустился. Открой его через локальный сервер или в Chrome либо Edge. Рядом с папкой тура должна лежать папка _roomtour.'
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const values = { LANG: lang, TITLE: title, DESCRIPTION: DESCRIPTION[lang](title), FALLBACK: FALLBACK[lang] };

fs.mkdirSync(path.join(dir, 'shots'), { recursive: true });
const template = fs.readFileSync(path.join(assets, 'template', 'index.html'), 'utf8');
// A function replacer, so $& or $' in a title stays literal text
const shell = template.replace(/\{\{([A-Z]+)\}\}/g, (m, key) => (key in values ? esc(values[key]) : m));
fs.writeFileSync(page, shell);
line('page', `${page}${hadPage ? '  (replaced)' : '  (new)'}`);

// ---- data ----
const data = path.join(dir, 'tour.data.js');
if (!fs.existsSync(data)) {
  fs.writeFileSync(data, `// ROOMTOUR tour data. Format: see the skill's references/data-format.md.
Roomtour.define(({ ui, chip, note, warn, code }) => ({
  lang: ${JSON.stringify(lang)},
  public: ${isPublic}, // true only for public pages captured signed out
  title: ${JSON.stringify(title)},
  subtitle: 'ROOMTOUR',
  foot: '',
  categories: {},
  scenes: {},
  chapters: [],
  steps: []
}));
`);
  line('data', `${data}  (new, empty)`);
} else {
  line('data', `${data}  (already there, not changed)`);
}

// ---- privacy ----
const ignore = path.join(dir, 'shots', '.gitignore');
if (isPublic) {
  if (fs.existsSync(ignore)) line('note', `${ignore} keeps screenshots out of git. Delete it only if every screenshot here is public.`);
  else line('public', `${path.join(dir, 'shots')}  (screenshots may go into git: --public)`);
} else if (!fs.existsSync(ignore)) {
  fs.writeFileSync(ignore, '# Screenshots of private screens stay on this computer\n*\n!.gitignore\n');
  line('out of git', ignore);
} else {
  line('out of git', `${ignore}  (already there, not changed)`);
}

console.log('\nNext: fill in tour.data.js, then run check.mjs on this folder.');
