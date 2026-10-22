#!/usr/bin/env node
// ROOMTOUR: create (or refresh) a tour folder.
// Usage: node new-tour.mjs <tours folder> <slug> [--lang uk|en|ru] [--title "Title"] [--public]
//        node new-tour.mjs <tours folder> --engine-only      (just copy or refresh the engine)
// Creates:  <tours>/_roomtour/roomtour.{css,js}   the engine, refreshed every run
//           <tours>/<slug>/index.html             the page shell
//           <tours>/<slug>/tour.data.js           a starter, only if it does not exist yet
//           <tours>/<slug>/shots/.gitignore       keeps private screenshots out of git (skipped with --public)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const assets = path.join(here, '..', 'assets');
const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : null; };
const positional = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--') && ['--lang', '--title'].includes(args[i - 1])));

const tours = path.resolve(positional[0] || '.');
const slug = positional[1];
const lang = flag('--lang') || 'en';
const title = flag('--title') || (slug ? slug.replace(/[-_]+/g, ' ') : 'Tour');
const isPublic = !!flag('--public');
if (slug && !/^[a-z0-9][a-z0-9-]*$/.test(slug)) { console.error('The slug must be lowercase latin letters, digits and dashes, e.g. github-pr or my-app-billing'); process.exit(1); }

fs.mkdirSync(path.join(tours, '_roomtour'), { recursive: true });
for (const f of ['roomtour.css', 'roomtour.js']) {
  fs.copyFileSync(path.join(assets, 'engine', f), path.join(tours, '_roomtour', f));
}
console.log(`engine   ${path.join(tours, '_roomtour')}`);
if (flag('--engine-only') || !slug) process.exit(0);

const dir = path.join(tours, slug);
fs.mkdirSync(path.join(dir, 'shots'), { recursive: true });

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const shell = fs.readFileSync(path.join(assets, 'template', 'index.html'), 'utf8')
  .replace('{{LANG}}', esc(lang)).replace('{{TITLE}}', esc(title)).replace('{{DESCRIPTION}}', esc(`ROOMTOUR: ${title}`));
fs.writeFileSync(path.join(dir, 'index.html'), shell);
console.log(`page     ${path.join(dir, 'index.html')}`);

const data = path.join(dir, 'tour.data.js');
if (!fs.existsSync(data)) {
  fs.writeFileSync(data, `// ROOMTOUR tour data. Format: see the skill's references/data-format.md.
Roomtour.define(({ ui, chip, note, code }) => ({
  lang: ${JSON.stringify(lang)},
  title: ${JSON.stringify(title)},
  subtitle: 'ROOMTOUR',
  foot: '',
  categories: {},
  scenes: {},
  chapters: [],
  steps: []
}));
`);
  console.log(`data     ${data}  (starter)`);
} else {
  console.log(`data     ${data}  (kept as is)`);
}

const ignore = path.join(dir, 'shots', '.gitignore');
if (!isPublic && !fs.existsSync(ignore)) {
  fs.writeFileSync(ignore, '# Screenshots of private screens stay on this computer\n*\n!.gitignore\n');
  console.log(`private  ${ignore}`);
}
