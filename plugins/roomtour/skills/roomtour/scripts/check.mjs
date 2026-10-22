#!/usr/bin/env node
// ROOMTOUR: check a tour before showing it.
// Usage: node check.mjs <tour folder> [data file]   (default data file: tour.data.js)
// Prints FAIL / WARN / OK lines and exits 1 when anything fails. Node 18+, no dependencies.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const dir = path.resolve(process.argv[2] || '.');
const dataFile = path.join(dir, process.argv[3] || 'tour.data.js');
const fails = [], warns = [], oks = [];
const fail = (m) => fails.push(m), warn = (m) => warns.push(m), ok = (m) => oks.push(m);

const TONES = ['green', 'amber', 'red', 'blue', 'violet', 'grey'];
const LINES = ['solid', 'dashed', 'dotted', 'double'];
const ICONS = ['eye', 'users', 'alert', 'info', 'chart', 'flag', 'lock', 'star', 'check', 'mail', 'pointer', 'dot'];
const LANGS = ['en', 'uk', 'ru'];

if (!fs.existsSync(dataFile)) { console.log(`FAIL  no data file: ${dataFile}`); process.exit(1); }

// Run the data file with the same helpers the engine gives it
let cfg = null;
const helpers = {
  ui: (s) => `<span class="ui">${s}</span>`,
  code: (s) => `<span class="branch">${s}</span>`,
  chip: (id) => `<span class="chip-ref" data-cat="${id}"></span>`,
  note: (label, html) => `<p class="aside"><b>${label}</b> ${html}</p>`
};
try {
  vm.runInNewContext(fs.readFileSync(dataFile, 'utf8'), { Roomtour: { define: (fn) => { cfg = fn(helpers); } } }, { filename: dataFile });
} catch (e) { console.log(`FAIL  the data file does not run: ${e.message}`); process.exit(1); }
if (!cfg) { console.log('FAIL  the data file never calls Roomtour.define(...)'); process.exit(1); }

// PNG / JPEG size without dependencies
function imageSize(file) {
  const b = fs.readFileSync(file);
  if (b.slice(1, 4).toString() === 'PNG') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      if (marker >= 0xc0 && marker <= 0xc3) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}
const text = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const PLACEHOLDER = /\{[a-z_][a-z0-9_]*\}|\bTODO\b|\bTBD\b|lorem ipsum/i;

// ---- top level ----
if (!LANGS.includes(cfg.lang)) warn(`lang "${cfg.lang}" has no interface strings; English is used (known: ${LANGS.join(', ')})`);
if (!cfg.title) fail('title is missing');
for (const k of ['scenes', 'chapters', 'steps']) if (!cfg[k]) fail(`${k} is missing`);
if (cfg.steps && !cfg.steps.length) fail('the tour has no steps yet');
if (fails.length) report();

for (const k of ['title', 'subtitle', 'foot']) if (PLACEHOLDER.test(text(cfg[k]))) fail(`${k}: an unfilled placeholder is left in the text`);

// ---- categories ----
const cats = cfg.categories || {};
const catIds = Object.keys(cats);
if (!catIds.length) warn('no categories: zones will have no colour or label');
if (catIds.length > 5) warn(`${catIds.length} categories; more than 4 gets hard to tell apart`);
const looks = new Map();
for (const [id, c] of Object.entries(cats)) {
  if (!c.label) fail(`category "${id}" has no label`);
  if (PLACEHOLDER.test(text(c.label) + ' ' + text(c.note))) fail(`category "${id}": an unfilled placeholder is left in the text`);
  if (!TONES.includes(c.tone)) fail(`category "${id}": tone "${c.tone}" is not one of ${TONES.join(', ')}`);
  if (c.icon && !ICONS.includes(c.icon)) fail(`category "${id}": icon "${c.icon}" is not one of ${ICONS.join(', ')}`);
  if (c.line && !LINES.includes(c.line)) fail(`category "${id}": line "${c.line}" is not one of ${LINES.join(', ')}`);
  const look = `${c.tone}/${c.icon || 'dot'}/${c.line || 'solid'}`;
  if (looks.has(look)) fail(`categories "${looks.get(look)}" and "${id}" look the same (${look}); change the icon or the line`);
  looks.set(look, id);
}
const icons = catIds.map((id) => cats[id].icon || 'dot');
if (new Set(icons).size < icons.length) warn('two categories share an icon: colour-blind readers then rely on the words and the line alone');

// ---- scenes ----
const sizes = {};
for (const [id, s] of Object.entries(cfg.scenes)) {
  const f = path.join(dir, s.src || '');
  if (!s.src || !fs.existsSync(f)) { fail(`scene "${id}": screenshot not found: ${s.src}`); continue; }
  const real = imageSize(f);
  if (!real) { warn(`scene "${id}": could not read the image size of ${s.src}`); continue; }
  sizes[id] = real;
  if (real.w !== s.w || real.h !== s.h) fail(`scene "${id}": says ${s.w}x${s.h} but ${s.src} is ${real.w}x${real.h}`);
  if (!s.alt) warn(`scene "${id}": no alt text`);
  for (const r of s.redact || []) {
    if (r.length !== 4 || r[0] < 0 || r[1] < 0 || r[0] + r[2] > real.w || r[1] + r[3] > real.h) fail(`scene "${id}": redact box ${JSON.stringify(r)} is outside the image`);
  }
}

// ---- chapters and steps ----
const chIds = cfg.chapters.map((c) => c.id);
const used = new Set();
let lastCh = -1, outOfOrder = false;
cfg.steps.forEach((st, i) => {
  const at = `step ${i}${st.t ? ` "${text(st.t).slice(0, 40)}"` : ''}`;
  if (!chIds.includes(st.ch)) fail(`${at}: chapter "${st.ch}" does not exist`);
  const ci = chIds.indexOf(st.ch);
  if (ci < lastCh) outOfOrder = true;
  lastCh = Math.max(lastCh, ci);
  used.add(st.ch);
  if (!cfg.scenes[st.scene]) fail(`${at}: scene "${st.scene}" does not exist`);
  if (!st.t) fail(`${at}: no title`);
  if (!st.b) fail(`${at}: no explanation`);
  if (st.r) {
    if (!Array.isArray(st.r) || st.r.length !== 4) fail(`${at}: r must be [x, y, w, h]`);
    else {
      const sz = sizes[st.scene];
      const [x, y, w, h] = st.r;
      if (w <= 0 || h <= 0) fail(`${at}: zone has no size`);
      if (sz && (x < -2 || y < -2 || x + w > sz.w + 2 || y + h > sz.h + 2)) fail(`${at}: zone ${JSON.stringify(st.r)} is outside the ${sz.w}x${sz.h} screenshot`);
    }
    if (!st.k) warn(`${at}: highlighted zone without a category`);
    else if (!cats[st.k]) fail(`${at}: category "${st.k}" does not exist`);
  }
  if (st.mb && !['l', 'r', 't'].includes(st.mb)) fail(`${at}: mb must be l, r or t`);
  const all = text(st.b);
  if (PLACEHOLDER.test(all + ' ' + text(st.t))) fail(`${at}: an unfilled placeholder is left in the text`);
  // Paragraphs, list items and headings end a sentence even without a full stop
  const blocks = String(st.b || '').split(/<\/(?:p|li|h3|ul|ol)>|<br\s*\/?>/i).map(text).filter(Boolean);
  for (const sentence of blocks.flatMap((bl) => bl.split(/(?<=[.!?…])\s+/))) {
    const words = sentence.split(/\s+/).filter(Boolean).length;
    if (words > 22) warn(`${at}: a sentence of ${words} words; keep it to 20 or fewer`);
  }
});
for (const id of chIds) if (!used.has(id)) warn(`chapter "${id}" has no steps`);
if (outOfOrder) warn('steps jump back to an earlier chapter; keep each chapter together');
const titles = cfg.steps.map((s) => text(s.t));
const dup = titles.filter((t, i) => titles.indexOf(t) !== i);
if (dup.length) warn(`repeated step titles: ${[...new Set(dup)].join('; ')}`);
if (!cfg.steps.some((s) => s.map)) warn('no cheat-sheet step (map: true)');

// ---- privacy ----
const shots = path.join(dir, 'shots');
if (fs.existsSync(shots) && !fs.existsSync(path.join(shots, '.gitignore')) && !cfg.public) {
  warn('shots/ has no .gitignore: screenshots may end up in git. Add one, or set public: true for a public demo');
}

ok(`${cfg.steps.length} steps, ${chIds.length} chapters, ${Object.keys(cfg.scenes).length} scenes, ${catIds.length} categories`);
report();

function report() {
  for (const m of fails) console.log('FAIL  ' + m);
  for (const m of warns) console.log('WARN  ' + m);
  for (const m of oks) console.log('OK    ' + m);
  console.log(fails.length ? `\nRESULT: FAIL (${fails.length})` : `\nRESULT: PASS${warns.length ? ` with ${warns.length} warning(s)` : ''}`);
  process.exit(fails.length ? 1 : 0);
}
