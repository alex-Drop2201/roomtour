#!/usr/bin/env node
// ROOMTOUR: check a tour before showing it.
// Usage: node check.mjs <tour folder> [data file] [--pair <other data file>] [--code <folder>] [--sizes] [--sheet]
//   data file   default tour.data.js
//   --pair      the same tour in another language: scenes, zones, categories and the map must match step by step
//   --code      the product's code folder: every code:<path>:<line> source must exist there
//   --sizes     list every image in shots/ with its size, then stop
//   --sheet     also write shots/_zones.html: one 1:1 crop per zone step, to compare each zone with its text
// Prints FAIL / WARN / INFO / OK lines and exits 1 when anything fails. INFO lines are not warnings.
// Node 18+, no dependencies, macOS and Windows.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const USAGE = 'Usage: node check.mjs <tour folder> [data file] [--pair <other data file>] [--code <folder>] [--sizes] [--sheet]';
const TONES = ['green', 'amber', 'red', 'blue', 'violet', 'grey'];
const LINES = ['solid', 'dashed', 'dotted', 'double'];
const ICONS = ['eye', 'users', 'alert', 'info', 'chart', 'flag', 'lock', 'star', 'check', 'mail', 'pointer', 'dot'];
const LANGS = ['en', 'uk', 'ru'];
const IMG_EXT = /\.(png|jpe?g|webp|gif|avif)$/i;

// ---- arguments ----
const argv = process.argv.slice(2);
const opt = { pair: null, code: null, sizes: false, sheet: false };
const pos = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--pair' || a === '--code') {
    const v = argv[i + 1];
    if (!v || v.startsWith('--')) usage(`${a} needs a value, for example ${a === '--pair' ? '--pair tour.data.uk.js' : '--code ~/code/the-product'}.`);
    opt[a.slice(2)] = v; i++;
  } else if (a === '--sizes') opt.sizes = true;
  else if (a === '--sheet') opt.sheet = true;
  else if (a === '--help' || a === '-h') { console.log(USAGE); process.exit(0); }
  else if (a.startsWith('--')) usage(`Unknown option ${a}.`);
  else pos.push(a);
}
if (pos.length > 2) usage(`Too many arguments: ${pos.join(' ')}.`);
function usage(msg) { console.log(`FAIL  ${msg}\n${USAGE}`); process.exit(1); }

const dir = path.resolve(pos[0] || '.');
if (!isDir(dir)) { console.log(`FAIL  not a folder: ${dir}. Pass the tour folder, for example: node check.mjs ~/Documents/roomtour/github-pr`); process.exit(1); }
const SHOTS = path.join(dir, 'shots');

function isDir(p) { try { return fs.statSync(p).isDirectory(); } catch { return false; } }
function isFile(p) { try { return fs.statSync(p).isFile(); } catch { return false; } }
function shotFiles() {
  try { return fs.readdirSync(SHOTS, { withFileTypes: true }).filter((d) => d.isFile() && !d.name.startsWith('.') && IMG_EXT.test(d.name)).map((d) => d.name).sort(); }
  catch { return null; }
}

// ---- image sizes without dependencies: PNG, JPEG, WebP, GIF ----
const SOF = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
function imageSize(file) {
  let b;
  try { b = fs.readFileSync(file); } catch (e) { return { why: `cannot read it (${e.code || e.message})` }; }
  try {
    if (b.length >= 8 && b.readUInt32BE(0) === 0x89504e47 && b.readUInt32BE(4) === 0x0d0a1a0a) {
      if (b.length < 24 || b.toString('latin1', 12, 16) !== 'IHDR') return { why: 'the PNG is cut off before its size' };
      return { size: { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }, cut: b.length < 32 || b.toString('latin1', b.length - 8, b.length - 4) !== 'IEND' };
    }
    if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i + 1 < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m === 0xff) { i++; continue; }                                    // fill byte
        if (m === 0x01 || m === 0xd8 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; } // markers without a length
        if (m === 0xd9 || m === 0xda) break;                                  // end of image, start of scan: no size before it
        if (i + 4 > b.length) break;
        const len = b.readUInt16BE(i + 2);
        if (len < 2) break;
        if (SOF.has(m)) {
          if (i + 9 > b.length) break;
          return { size: { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) }, cut: !(b[b.length - 2] === 0xff && b[b.length - 1] === 0xd9) };
        }
        i += 2 + len;
      }
      return { why: 'no size found in the JPEG: it is cut off or damaged' };
    }
    if (b.length >= 10 && /^GIF8[79]a$/.test(b.toString('latin1', 0, 6))) {
      return { size: { w: b.readUInt16LE(6), h: b.readUInt16LE(8) }, cut: b[b.length - 1] !== 0x3b };
    }
    if (b.length >= 16 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') {
      const kind = b.toString('latin1', 12, 16), cut = b.readUInt32LE(4) + 8 > b.length;
      if (kind === 'VP8 ' && b.length >= 30 && b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) return { size: { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff }, cut };
      if (kind === 'VP8L' && b.length >= 25 && b[20] === 0x2f) { const v = b.readUInt32LE(21); return { size: { w: (v & 0x3fff) + 1, h: ((v >>> 14) & 0x3fff) + 1 }, cut }; }
      if (kind === 'VP8X' && b.length >= 30) return { size: { w: b.readUIntLE(24, 3) + 1, h: b.readUIntLE(27, 3) + 1 }, cut };
      return { why: 'the WebP is cut off or of an unknown kind' };
    }
  } catch { return { why: 'the file is damaged' }; }
  return { why: 'it is not a PNG, JPEG, WebP or GIF' };
}

if (opt.sizes) {
  const files = shotFiles();
  if (!files) { console.log(`No shots/ folder in ${dir}.`); process.exit(0); }
  if (!files.length) console.log('shots/ has no images yet.');
  for (const f of files) {
    const s = imageSize(path.join(SHOTS, f));
    console.log(`shots/${f}  ${s.size ? `${s.size.w} x ${s.size.h}${s.cut ? '  (looks cut off)' : ''}` : `size unknown: ${s.why}`}`);
  }
  process.exit(0);
}

// ---- messages ----
const fails = [], warns = [], infos = [], oks = [];
const fail = (m) => fails.push(m), warning = (m) => warns.push(m), info = (m) => infos.push(m), ok = (m) => oks.push(m);
function report() {
  for (const m of fails) console.log('FAIL  ' + m);
  for (const m of warns) console.log('WARN  ' + m);
  for (const m of infos) console.log('INFO  ' + m);
  for (const m of oks) console.log('OK    ' + m);
  const w = warns.length ? ` with ${warns.length} warning${warns.length === 1 ? '' : 's'}` : '';
  console.log(fails.length ? `\nRESULT: FAIL (${fails.length} problem${fails.length === 1 ? '' : 's'})${w}` : `\nRESULT: PASS${w}`);
  process.exit(fails.length ? 1 : 0);
}

// ---- text helpers ----
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', laquo: '«', raquo: '»', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”' };
const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] !== '#') return ENT[e.toLowerCase()] ?? ' ';
  try { return String.fromCodePoint(/^#x/i.test(e) ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)); } catch { return ' '; }
});
const text = (html) => decode(String(html ?? '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
const norm = (s) => String(s).normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRe = (w) => new RegExp(`(?<![\\p{L}\\p{N}])${escRe(norm(w)).replace(/ /g, '\\s+')}(?![\\p{L}\\p{N}])`, 'iu');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (r) => (Array.isArray(r) ? `[${r.map((v) => (typeof v === 'number' ? String(v) : JSON.stringify(v))).join(', ')}]` : JSON.stringify(r));
const quote = (s, n = 8) => { const w = s.split(/\s+/); return w.slice(0, n).join(' ') + (w.length > n ? '…' : ''); };
const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
const list = (a) => a.length < 3 ? a.join(' and ') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];

// What the helpers return in the checker. Keep the names, the escaping and the chip markup in step with the engine.
const UI_RE = /<span class="ui"[^>]*>([\s\S]*?)<\/span>/g;
const CHIP_RE = /<span class="chip-ref" data-cat="([^"]*)"><\/span>/g;
const helpers = {
  ui: (s) => `<span class="ui">${esc(s)}</span>`,
  code: (s) => `<span class="branch">${esc(s)}</span>`,
  chip: (id) => `<span class="chip-ref" data-cat="${esc(id)}"></span>`,
  note: (label, html) => `<p class="aside"><b>${esc(label)}</b> ${html ?? ''}</p>`,
  warn: (label, html) => `<p class="aside warn"><b>${esc(label)}</b> ${html ?? ''}</p>`
};
const uiNames = (html) => [...String(html ?? '').matchAll(UI_RE)].map((m) => text(m[1])).filter(Boolean);
const chipIds = (html) => [...String(html ?? '').matchAll(CHIP_RE)].map((m) => m[1]);
const noAsides = (html) => String(html ?? '').replace(/<p class="aside[^"]*">[\s\S]*?<\/p>/g, ' ');
const noCode = (html) => String(html ?? '').replace(/<span class="branch"[^>]*>[\s\S]*?<\/span>|<code>[\s\S]*?<\/code>/g, ' ');
// Claims only: control names, code values and the category key list are not statements about the product
const claims = (html) => noCode(String(html ?? '').replace(UI_RE, ' ').replace(/<ul class="key"[\s\S]*?<\/ul>/g, ' '));
const numbersIn = (s) => (s.match(/\d+(?:[ ,.  ]\d+)*/g) || []).map((n) => n.replace(/\D/g, ''));
const digitsOnly = (s) => s.replace(/(\d)[ ,.  '’](?=\d)/g, '$1');

// ---- run a data file the way the engine does, with a time limit ----
function jsError(e, name, file) {
  if (e && e.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') return `${name} did not finish within 5 seconds (an endless loop?). Fix it and run the check again`;
  const m = String((e && e.stack) || '').match(new RegExp(escRe(file) + ':(\\d+)'));
  return `${name} has a JavaScript error${m ? ` on line ${m[1]}` : ''}: ${(e && e.message) || e}. Fix it and run the check again`;
}
function load(file) {
  const name = path.basename(file);
  let src;
  try { src = fs.readFileSync(file, 'utf8'); } catch (e) { return { err: `cannot read ${name}: ${e.code || e.message}` }; }
  let fn;
  const box = { Roomtour: { define: (f) => { fn = f; } } };
  try { vm.runInNewContext(src, box, { filename: file, timeout: 5000 }); } catch (e) { return { err: jsError(e, name, file) }; }
  if (fn === undefined) return { err: `${name} never calls Roomtour.define(...). Start from the starter that new-tour.mjs writes` };
  if (typeof fn !== 'function') return { err: `${name} gives Roomtour.define a ${typeof fn}; give it a function: Roomtour.define(({ ui, chip, note, warn, code }) => ({ … }))` };
  box.__fn = fn; box.__helpers = helpers;
  try { return { cfg: vm.runInContext('__fn(__helpers)', box, { filename: file, timeout: 5000 }) }; }
  catch (e) { return { err: jsError(e, name, file) }; }
}

// The real letter case of a relative path, walked folder by folder
function caseOf(base, rel) {
  let cur = base;
  const out = [];
  let mismatch = false;
  for (const seg of rel.split(/[\\/]+/)) {
    if (!seg || seg === '.') continue;
    if (seg === '..') { cur = path.dirname(cur); out.push('..'); continue; }
    let names;
    try { names = fs.readdirSync(cur); } catch { return { missing: true }; }
    if (names.includes(seg)) { out.push(seg); cur = path.join(cur, seg); continue; }
    const other = names.find((n) => n.toLowerCase() === seg.toLowerCase());
    if (!other) return { missing: true };
    mismatch = true; out.push(other); cur = path.join(cur, other);
  }
  return { mismatch, actual: out.join('/'), abs: cur };
}

try { main(); } catch (e) {
  fail(`the checker itself stopped on this data (${e && e.message}). Report it together with the data file`);
  report();
}

function main() {
  const dataName = pos[1] || 'tour.data.js';
  const dataFile = path.resolve(dir, dataName);
  if (!isFile(dataFile)) {
    const here = (() => { try { return fs.readdirSync(dir).filter((f) => /^tour\.data.*\.js$/.test(f)); } catch { return []; } })();
    console.log(pos[1]
      ? `FAIL  no ${dataName} in ${dir}. Check the name${here.length ? `; the data files here: ${here.join(', ')}` : ''}`
      : `FAIL  no tour.data.js in ${dir}. Create the tour with new-tour.mjs, or name the data file as the second argument`);
    process.exit(1);
  }
  const loaded = load(dataFile);
  if (loaded.err) { console.log(`FAIL  ${loaded.err}`); process.exit(1); }
  const cfg = loaded.cfg;
  const DN = path.basename(dataFile);

  // ---- shape: everything below relies on it ----
  if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) { fail(`${DN} must return an object from Roomtour.define: ({ lang, title, categories, scenes, chapters, steps })`); report(); }
  const shape = { steps: 'list', chapters: 'list', scenes: 'object', categories: 'object' };
  const example = { steps: 'steps: [ … ]', chapters: "chapters: [ { id: 'intro', name: 'Start' } ]", scenes: "scenes: { main: { src: 'shots/main.png', w, h, alt } }", categories: "categories: { look: { label, note, tone, icon, line } }" };
  for (const [k, kind] of Object.entries(shape)) {
    const v = cfg[k];
    if (v === undefined || v === null) { if (k !== 'categories') fail(`${k} is missing: add ${example[k]}`); continue; }
    if (kind === 'list' && !Array.isArray(v)) fail(`${k} must be a list: ${example[k]}`);
    if (kind === 'object' && (typeof v !== 'object' || Array.isArray(v))) fail(`${k} must be an object, not a list: ${example[k]}`);
  }
  if (fails.length) report();
  if (!cfg.steps.length) { fail('the tour has no steps yet: add steps: [ { ch, scene, r, k, t, b }, … ]'); report(); }

  // ---- top level ----
  if (cfg.lang === undefined || cfg.lang === null || cfg.lang === '') warning('lang is not set; the buttons will be in English. Set lang to en, uk or ru');
  else if (!LANGS.includes(cfg.lang)) warning(`lang "${cfg.lang}" has no interface strings, so the buttons will be in English. Set lang to en, uk or ru (the text itself can be in any language)`);
  if (cfg.uiLang !== undefined && !(typeof cfg.uiLang === 'string' && /^[a-z]{2,3}(-[a-z0-9]{1,8})*$/i.test(cfg.uiLang))) warning(`uiLang "${cfg.uiLang}" is not a language code; use one like en or de`);
  if (!cfg.title) fail("title is missing: add title: '…' (the name in the masthead)");
  if (cfg.public !== undefined && typeof cfg.public !== 'boolean') warning('public should be true or false');
  if (cfg.mapMaxArea !== undefined && !(Number.isFinite(cfg.mapMaxArea) && cfg.mapMaxArea > 0)) fail('mapMaxArea must be a number of square pixels, for example 60000');
  const PLACEHOLDER = /\{[a-z_][a-z0-9_]*\}|\bTODO\b|\bTBD\b|\bFIXME\b/;
  const placeholder = (s) => { const m = s.match(PLACEHOLDER) || s.match(/lorem ipsum/i); return m ? m[0] : null; };
  for (const k of ['title', 'subtitle', 'foot']) { const p = placeholder(text(cfg[k])); if (p) fail(`${k}: an unfilled placeholder "${p}" is left in the text`); }

  // ---- categories, declared from safest to strongest ----
  const cats = {};
  for (const [id, c] of Object.entries(cfg.categories || {})) {
    if (!c || typeof c !== 'object') { fail(`category "${id}" must be an object { label, note, tone, icon, line }`); continue; }
    cats[id] = c;
  }
  const catIds = Object.keys(cats);
  const label = (id) => (cats[id] && text(cats[id].label)) || id;
  const safest = catIds[0], strongest = catIds.length > 1 ? catIds[catIds.length - 1] : null;
  const catRank = (id) => catIds.indexOf(id);
  if (!catIds.length) warning('no categories: zones will have no label that says what a click does. Add 2–4, from safest to strongest');
  if (catIds.length > 4) warning(`${catIds.length} categories; at most 4 stay easy to tell apart, and there are only 4 outline styles. Merge the closest ones`);
  if (catIds.some((id) => /^\d+$/.test(id))) warning('a category id is a number, so JavaScript moves it to the front and the safest-to-strongest order breaks. Use a word as the id');
  for (const id of catIds) {
    const c = cats[id];
    if (!c.label) fail(`category "${id}" has no label; add label: 'Safe to look' (3 words or fewer)`);
    const p = placeholder(text(c.label) + ' ' + text(c.note)); if (p) fail(`category "${id}": an unfilled placeholder "${p}" is left in the text`);
    if (c.tone === undefined || c.tone === '') fail(`category "${id}" has no tone; use one of ${TONES.join(', ')}`);
    else if (!TONES.includes(c.tone)) fail(`category "${id}": tone "${c.tone}" is not one of ${TONES.join(', ')}`);
    if (c.icon !== undefined && !ICONS.includes(c.icon)) fail(`category "${id}": icon "${c.icon}" is not one of ${ICONS.join(', ')}`);
    if (c.line !== undefined && !LINES.includes(c.line)) fail(`category "${id}": line "${c.line}" is not one of ${LINES.join(', ')}`);
  }
  for (let a = 0; a < catIds.length; a++) for (let b = a + 1; b < catIds.length; b++) {
    const A = cats[catIds[a]], B = cats[catIds[b]];
    const ia = A.icon || 'dot', ib = B.icon || 'dot', la = A.line || 'solid', lb = B.line || 'solid';
    const pair = `categories "${catIds[a]}" and "${catIds[b]}"`;
    if (A.tone === B.tone && ia === ib && la === lb) fail(`${pair} look the same (${A.tone}/${ia}/${la}); give each its own tone, icon and line`);
    else {
      if (la === lb) fail(`${pair} share the ${la} line${A.line && B.line ? '' : ' (no line means solid)'}; on the stage their outlines would differ by colour alone. Give each its own line: ${LINES.join(', ')}`);
      if (ia === ib) warning(`${pair} share the ${ia} icon; colour-blind readers then tell them apart by the words and the outline alone. Give each its own icon`);
      if (A.tone === B.tone) warning(`${pair} share the ${A.tone} tone; readers then tell them apart by the icon and the outline alone. Give each its own tone`);
    }
  }

  // ---- scenes ----
  const scenes = {}, sizes = {};
  for (const [id, s] of Object.entries(cfg.scenes)) {
    if (!s || typeof s !== 'object') { fail(`scene "${id}" must be an object { src, w, h, alt }`); continue; }
    scenes[id] = s;
    const src = s.src;
    if (typeof src !== 'string' || !src.trim()) { fail(`scene "${id}" has no src; add src: 'shots/${id}.png'`); continue; }
    if (/^[a-z][a-z0-9+.-]*:/i.test(src) || /^[\\/]/.test(src) || path.isAbsolute(src)) { fail(`scene "${id}": src "${src}" must be a path inside the tour folder, like shots/${id}.png, not an absolute path or a web address`); continue; }
    if (src.includes('\\')) warning(`scene "${id}": src "${src}" uses backslashes; use forward slashes, like shots/${id}.png`);
    if (path.relative(dir, path.resolve(dir, src)).startsWith('..')) warning(`scene "${id}": src "${src}" leaves the tour folder; keep screenshots in shots/`);
    const found = caseOf(dir, src);
    if (found.missing || !isFile(found.abs)) { fail(`scene "${id}": screenshot not found: ${src}`); continue; }
    if (found.mismatch) fail(`scene "${id}": the file is named ${found.actual}, but src says ${src}. The letter case must match, or the image breaks on a case-sensitive server`);
    const img = imageSize(found.abs);
    if (!img.size) { warning(`scene "${id}": could not read the image size of ${src}: ${img.why}`); continue; }
    if (img.cut) warning(`scene "${id}": ${src} looks cut off (its end marker is missing). Capture it again`);
    sizes[id] = img.size;
    if (!Number.isFinite(s.w) || !Number.isFinite(s.h)) fail(`scene "${id}": w and h must be the image's size in pixels: w: ${img.size.w}, h: ${img.size.h}`);
    else if (img.size.w !== s.w || img.size.h !== s.h) fail(`scene "${id}": says ${s.w}x${s.h} but ${src} is ${img.size.w}x${img.size.h}`);
    if (!s.alt) warning(`scene "${id}": no alt; add alt: one line on what the screen shows`);
    if (s.redact !== undefined && !Array.isArray(s.redact)) fail(`scene "${id}": redact must be a list of [x, y, w, h] boxes`);
    const boxes = Array.isArray(s.redact) ? s.redact : [];
    for (const r of boxes) {
      if (!Array.isArray(r) || r.length !== 4 || !r.every(Number.isFinite)) { fail(`scene "${id}": redact box ${fmt(r)} must be [x, y, w, h] with four numbers`); continue; }
      if (r[2] <= 0 || r[3] <= 0 || r[0] < 0 || r[1] < 0 || r[0] + r[2] > img.size.w || r[1] + r[3] > img.size.h) fail(`scene "${id}": redact box ${fmt(r)} is outside the ${img.size.w}x${img.size.h} image`);
    }
    if (cfg.public === true && boxes.length) warning(`scene "${id}": the tour is public: true and this scene has ${plural(boxes.length, 'blur box', 'blur boxes')}; the PNG still contains this data under the blur. Blur the image file itself before it goes into git, or keep the tour private`);
    if (s.via !== undefined && typeof s.via !== 'string') fail(`scene "${id}": via must be a short HTML text`);
    if (s.keep !== undefined && typeof s.keep !== 'boolean') warning(`scene "${id}": keep should be true or false`);
    if (typeof s.via === 'string') { const p = placeholder(text(s.via)); if (p) fail(`scene "${id}": an unfilled placeholder "${p}" is left in via`); }
  }
  const validBoxes = (id) => (Array.isArray(scenes[id]?.redact) ? scenes[id].redact : []).filter((r) => Array.isArray(r) && r.length === 4 && r.every(Number.isFinite) && r[2] > 0 && r[3] > 0);

  // ---- chapters ----
  const chIds = [];
  cfg.chapters.forEach((c, i) => {
    if (!c || typeof c !== 'object') { fail(`chapter ${i} must be an object { id, name }`); return; }
    if (typeof c.id !== 'string' || !c.id) { fail(`chapter ${i}${c.name ? ` "${text(c.name)}"` : ''} has no id; add id: 'intro'`); return; }
    if (chIds.includes(c.id)) fail(`chapter id "${c.id}" is used twice; each chapter needs its own id`);
    if (!c.name || !text(c.name)) fail(`chapter "${c.id}" has no name; add name: 'Start' (shown in the chapter strip)`);
    chIds.push(c.id);
  });

  // ---- steps ----
  const S = cfg.steps.map((st, i) => {
    if (!st || typeof st !== 'object' || Array.isArray(st)) { fail(`step ${i} is ${st === null ? 'null' : `a ${Array.isArray(st) ? 'list' : typeof st}`}, not a step { ch, scene, r, k, t, b }; remove the stray value or fill it in`); return null; }
    return st;
  });
  const at = (i) => `step ${i}${S[i] && S[i].t ? ` "${quote(text(S[i].t), 6)}"` : ''}`;
  const validR = (st) => st && !st.map && Array.isArray(st.r) && st.r.length === 4 && st.r.every(Number.isFinite) && st.r[2] > 0 && st.r[3] > 0;
  const used = new Set();
  let lastCh = -1, outOfOrder = false;
  const SENT = /(?<=[.!?…]["'»”’)\]]*)\s+(?=["'«“(\[]?[\p{Lu}\p{N}])/u;
  const BLOCK = /<\/(?:p|li|h[1-6]|ul|ol|div|dd|dt)>|<(?:p|li|h[1-6]|ul|ol|div)\b[^>]*>|<br\s*\/?>/i;
  const longSentences = (html, where) => {
    for (const sentence of String(html ?? '').split(BLOCK).map(text).filter(Boolean).flatMap((bl) => bl.split(SENT))) {
      const words = sentence.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
      if (words > 20) warning(`${where}: a sentence of ${words} words ("${quote(sentence)}"); keep it to 20 or fewer`);
    }
  };
  for (const [id, s] of Object.entries(scenes)) if (typeof s.via === 'string') longSentences(s.via, `scene "${id}" via`);
  const sources = [];           // per step: [{ kind, raw, file, from, to }]
  const KINDS = { screen: 0, dom: 0, docs: 0, code: 0, inferred: 0, unchecked: 0 };
  const HEDGE = /(?<![\p{L}])(probably|likely|seems|may|maybe|might|perhaps|not checked|could not check|мабуть|ймовірно|імовірно|напевно|можливо|схоже|не перевір\p{L}*|вероятно|наверное|возможно|скорее всего|похоже|не провер\p{L}*)(?![\p{L}])/iu;
  const UNIVERSAL = /(?<![\p{L}\p{N}])(every|everyone|everything|always|never|all|кожн\p{L}*|завжди|ніколи|усі|всі|кажд\p{L}*|всегда|никогда|все)(?![\p{L}\p{N}])/giu;
  const unsure = [];

  S.forEach((st, i) => {
    if (!st) return;
    const where = at(i);
    for (const k of ['t', 'b', 'n']) if (st[k] !== undefined && st[k] !== null && typeof st[k] !== 'string') fail(`${where}: ${k} must be text`);
    if (st.ch === undefined) fail(`${where} has no chapter; add ch: '${chIds[0] || 'intro'}'`);
    else if (!chIds.includes(st.ch)) fail(`${where}: chapter "${st.ch}" does not exist${chIds.length ? `; the chapters are ${chIds.join(', ')}` : ''}`);
    const ci = chIds.indexOf(st.ch);
    if (ci >= 0) { if (ci < lastCh) outOfOrder = true; lastCh = Math.max(lastCh, ci); used.add(st.ch); }
    if (st.scene === undefined) fail(`${where} has no scene; add scene: '${Object.keys(scenes)[0] || 'main'}'`);
    else if (!scenes[st.scene]) fail(`${where}: scene "${st.scene}" does not exist`);
    if (!st.t) fail(`${where}: no title; add t: '…' (names the thing, short)`);
    if (!st.b) fail(`${where}: no explanation; add b: '<p>…</p>'`);

    const hasR = st.r !== null && st.r !== undefined;
    if (st.map && hasR) fail(`${where}: a cheat-sheet step (map: true) cannot have a zone; set r: null`);
    if (hasR && !st.map) {
      if (!Array.isArray(st.r) || st.r.length !== 4) fail(`${where}: r must be [x, y, w, h] or null`);
      else if (!st.r.every(Number.isFinite)) fail(`${where}: r ${fmt(st.r)} has a value that is not a number`);
      else {
        const [x, y, w, h] = st.r;
        const sz = sizes[st.scene];
        if (w <= 0 || h <= 0) fail(`${where}: zone ${fmt(st.r)} has no size`);
        else {
          if (sz && (x < -2 || y < -2 || x + w > sz.w + 2 || y + h > sz.h + 2)) fail(`${where}: zone ${fmt(st.r)} is outside the ${sz.w}x${sz.h} screenshot`);
          if (w < 8 || h < 8) warning(`${where}: zone ${fmt(st.r)} is under 8 px on one side; too thin to see. Measure the control again`);
          if (sz && w * h > 0.9 * sz.w * sz.h) warning(`${where}: zone covers ${Math.round((100 * w * h) / (sz.w * sz.h))}% of the screenshot; use r: null for a whole-screen step`);
          if (!st.r.every(Number.isInteger)) warning(`${where}: zone ${fmt(st.r)} has fractional pixels; round them to whole numbers`);
          const share = coveredShare(st.r, validBoxes(st.scene));
          if (share >= 0.5) warning(`${where}: ${Math.round(share * 100)}% of the zone is under blur boxes, so the reader sees little of it. Move the zone or explain it differently`);
        }
        if (i === 0) warning(`${where}: the first step has a zone; it is the intro, so the reader sees a highlight before learning what it means. Set r: null on step 0`);
      }
      if (st.k === undefined || st.k === null || st.k === '') warning(`${where}: a highlighted zone without a category; add k: '${safest || 'look'}'`);
    }
    if (st.k !== undefined && st.k !== null && st.k !== '' && !cats[st.k]) fail(`${where}: category "${st.k}" does not exist${catIds.length ? `; the categories are ${catIds.join(', ')}` : ''}`);
    if (st.mb !== undefined && !['l', 'r', 't'].includes(st.mb)) fail(`${where}: mb must be l, r or t`);
    for (const id of chipIds(st.b)) if (!cats[id]) fail(`${where}: chip('${id}') names no category`);

    const all = text(st.b) + ' ' + text(st.n) + ' ' + text(st.t);
    const p = placeholder(all); if (p) fail(`${where}: an unfilled placeholder "${p}" is left in the text`);
    longSentences(st.b, where);

    // Sources: checked (screen, dom, docs, code) or marked (inferred, unchecked)
    let raw = st.from === undefined || st.from === null ? ['screen'] : st.from;
    if (typeof raw === 'string') raw = [raw];
    const src = [];
    if (!Array.isArray(raw)) fail(`${where}: from must be a source or a list of sources`);
    else for (const f of raw) {
      const s = typeof f === 'string' ? f.trim() : '';
      let m;
      if (['screen', 'dom', 'inferred', 'unchecked'].includes(s)) src.push({ kind: s });
      else if (/^docs:https?:\/\/\S+$/i.test(s)) src.push({ kind: 'docs', url: s.slice(5) });
      else if ((m = s.match(/^code:(.+?):(\d+)(?:-(\d+))?$/))) {
        const a = +m[2], b = m[3] ? +m[3] : a;
        if (a < 1 || b < a) fail(`${where}: from "${s}" has a line range that runs backwards or starts at 0`);
        src.push({ kind: 'code', raw: s, file: m[1], from: a, to: b });
      } else fail(`${where}: from ${JSON.stringify(f)} is not a known source; use screen, dom, inferred, unchecked, docs:https://… or code:<path>:<line>`);
    }
    sources[i] = src;
    for (const s of src) KINDS[s.kind]++;
    const kinds = new Set(src.map((s) => s.kind));
    const marked = ['inferred', 'unchecked'].filter((k) => kinds.has(k));
    if (marked.length) {
      unsure.push(i);
      if (!HEDGE.test(all)) warning(`${where} is marked ${marked.join(' and ')}, but its text does not say so; add "probably" or "not checked"`);
      if (st.k && st.k === safest && catIds.length > 1) warning(`${where} is marked ${marked.join(' and ')} but sits in the safest category "${label(safest)}". Round it up to a stronger category, or check it`);
    }
    if (strongest && st.k === strongest && src.length && src.every((s) => s.kind === 'screen')) warning(`${where} is in the strongest category "${label(strongest)}" but rests on the screen alone; confirm it in the docs or the code (from: 'docs:https://…' or 'code:<path>:<line>')`);
    if (!kinds.has('docs') && !kinds.has('code')) {
      const words = [...new Set([...(text(claims(st.b)) + ' ' + text(st.n)).matchAll(UNIVERSAL)].map((m) => m[1].toLowerCase()))];
      if (words.length) warning(`${where}: ${words.map((w) => `"${w}"`).join(', ')} claim${words.length === 1 ? 's' : ''} something about all cases, and the step has no docs or code source. Back it with from: 'docs:https://…', or narrow the sentence`);
    }
  });

  for (const id of chIds) if (!used.has(id)) warning(`chapter "${id}" has no steps; give it steps or remove it`);
  if (outOfOrder) warning('steps jump back to an earlier chapter; keep each chapter together');
  const titles = S.map((s) => (s ? text(s.t) : ''));
  const dup = [...new Set(titles.filter((t, i) => t && titles.indexOf(t) !== i))];
  if (dup.length) warning(`repeated step titles: ${dup.join('; ')}`);
  for (const id of chipIds(cfg.foot)) if (!cats[id]) fail(`foot: chip('${id}') names no category`);
  for (const [sid, s] of Object.entries(scenes)) for (const id of chipIds(s.via)) if (!cats[id]) fail(`scene "${sid}" via: chip('${id}') names no category`);

  // Two steps, one zone
  for (let a = 0; a < S.length; a++) for (let b = a + 1; b < S.length; b++) {
    if (validR(S[a]) && validR(S[b]) && S[a].scene === S[b].scene && S[a].r.every((v, j) => Math.abs(v - S[b].r[j]) <= 2)) {
      warning(`steps ${a} and ${b} highlight the same zone; merge them, or fit each zone to its own control`);
    }
  }

  // Scene changes need a "how we got here"
  const noVia = {};
  S.forEach((st, i) => {
    if (i && st && S[i - 1] && st.scene !== S[i - 1].scene && scenes[st.scene] && !scenes[st.scene].via) (noVia[st.scene] ||= []).push(i);
  });
  for (const [id, steps] of Object.entries(noVia)) warning(`scene "${id}" has no via, so step${steps.length > 1 ? 's' : ''} ${steps.join(', ')} change${steps.length > 1 ? '' : 's'} the screen without saying how we got there. Add via: one short line, for example 'After a click on Settings'`);

  // ---- cheat sheet ----
  const maps = S.map((st, i) => (st && st.map ? i : -1)).filter((i) => i >= 0);
  if (!maps.length) warning('no cheat sheet: add one with map: true as the last step');
  const zoneSteps = (scene) => S.map((st, i) => ({ st, i })).filter(({ st }) => st && !st.map && st.scene === scene && validR(st) && cats[st.k]);
  for (const i of maps) if (scenes[S[i].scene] && !zoneSteps(S[i].scene).length) warning(`${at(i)}: the cheat sheet maps scene "${S[i].scene}", but no step has a zone on it; map the scene the zones are on`);
  const mapped = new Set(maps.map((i) => S[i].scene));
  const offMap = [...new Set(S.filter((st) => st && !st.map && validR(st) && !mapped.has(st.scene)).map((st) => st.scene))];
  if (maps.length && offMap.length) info(`the cheat sheet maps ${list([...mapped].map((s) => `"${s}"`))} only; zones on ${list(offMap.map((s) => `"${s}"`))} appear on no map`);

  // Controls: a ui() name that the step's title also names
  const controls = new Map();
  S.forEach((st, i) => {
    if (!st || st.map || !cats[st.k]) return;
    for (const name of uiNames(st.b)) {
      if (!wordRe(name).test(norm(text(st.t)))) continue;
      const key = norm(name);
      if (!controls.has(key)) controls.set(key, { name, scene: st.scene, cats: new Map() });
      const c = controls.get(key).cats;
      if (!c.has(st.k)) c.set(st.k, []);
      c.get(st.k).push(i);
    }
  });
  for (const c of controls.values()) if (c.cats.size > 1) {
    warning(`"${c.name}" is in two categories: ${[...c.cats].map(([k, st]) => `"${label(k)}" (step ${st.join(', ')})`).join(' and ')}. Pick one`);
  }
  const shown = new Set(S.filter((st) => st && !st.map).flatMap((st) => uiNames(st.b).map(norm)));
  for (const mi of maps) {
    const parts = String(S[mi].b ?? '').split(/<span class="chip-ref" data-cat="([^"]*)"><\/span>/);
    const sections = new Map();
    for (let j = 1; j < parts.length; j += 2) sections.set(parts[j], (sections.get(parts[j]) || '') + parts[j + 1]);
    if (!sections.size) { info(`${at(mi)}: the cheat sheet has no category headings (chip('id')), so its lists were not compared with the steps`); continue; }
    const sec = [...sections].map(([cat, html]) => ({ cat, ui: new Set(uiNames(html).map(norm)), plain: norm(text(html)) }));
    // A control counts as shown when a step names it in ui() or in its title
    const inTitle = (n) => S.some((st) => st && !st.map && wordRe(n).test(norm(text(st.t))));
    for (const s of sec) for (const n of s.ui) if (!shown.has(n) && !inTitle(n)) {
      warning(`${at(mi)}: the cheat sheet names "${uiNames(sections.get(s.cat)).find((x) => norm(x) === n)}", which no step shows; add a step for it or take it out`);
    }
    for (const [key, c] of controls) {
      if (c.scene !== S[mi].scene) continue;
      const own = [...c.cats.keys()];
      const top = Math.max(...own.map(catRank));
      // A ui() mention always counts; a plain-word mention counts in its own section or a weaker one (the risky direction)
      const listed = sec.filter((s) => s.ui.has(key) || (wordRe(c.name).test(s.plain) && catRank(s.cat) <= top)).map((s) => s.cat);
      const steps = [...c.cats.values()].flat();
      if (listed.some((k) => !c.cats.has(k))) {
        warning(`${at(mi)}: the cheat sheet lists "${c.name}" under ${list(listed.map((k) => `"${label(k)}"`))}, but step${steps.length > 1 ? 's' : ''} ${steps.join(', ')} put${steps.length > 1 ? '' : 's'} it in ${list(own.map((k) => `"${label(k)}"`))}`);
      } else if (!listed.length && own.some((k) => k !== safest)) {
        warning(`${at(mi)}: "${c.name}" (step${steps.length > 1 ? 's' : ''} ${steps.join(', ')}, "${label(own[0])}") is missing from its section of the cheat sheet`);
      }
    }
  }

  // ---- foot: provenance ----
  const foot = text(cfg.foot);
  if (!foot) warning('foot is empty: say what was captured, when, from where, at what width, and what is blurred');
  else {
    if (!/(?<!\d)(19|20)\d\d(?!\d)/.test(foot)) warning('foot has no year; add the capture date');
    const fd = digitsOnly(foot);
    const widths = [...new Set(Object.keys(sizes).map((id) => sizes[id].w))];
    for (const w of widths) if (!new RegExp(`(?<!\\d)${w}(?!\\d)`).test(fd)) warning(`foot does not name the capture width ${w} px; add it`);
  }

  // ---- sources summary, code paths ----
  const summary = Object.entries(KINDS).filter(([, n]) => n).map(([k, n]) => `${n} ${k}`).join(', ');
  ok(`sources: ${summary || 'none'}; ${unsure.length ? `inferred or unchecked: step${unsure.length > 1 ? 's' : ''} ${unsure.join(', ')} (name them in the hand-over)` : 'no step is marked inferred or unchecked'}`);
  const codeSrc = sources.flatMap((list, i) => (list || []).filter((s) => s.kind === 'code').map((s) => ({ ...s, i })));
  if (codeSrc.length && !opt.code) info(`${plural(codeSrc.length, 'code: source')} not opened; pass --code <folder> to check that the files and lines exist`);
  if (opt.code) {
    const repo = path.resolve(opt.code);
    if (!isDir(repo)) fail(`--code: not a folder: ${repo}`);
    else {
      const lines = {};
      for (const s of codeSrc) {
        const abs = path.resolve(repo, s.file);
        const rel = path.relative(repo, abs);
        if (rel.startsWith('..') || path.isAbsolute(rel)) { fail(`${at(s.i)}: ${s.raw} points outside ${repo}; use a path relative to the code folder`); continue; }
        if (!isFile(abs)) { fail(`${at(s.i)}: ${s.raw}: there is no file ${s.file} in ${repo}`); continue; }
        if (!(abs in lines)) { const t = fs.readFileSync(abs, 'utf8'); lines[abs] = t.split(/\r\n|\r|\n/).length - (/(\r\n|\r|\n)$/.test(t) ? 1 : 0); }
        if (s.to > lines[abs]) fail(`${at(s.i)}: ${s.raw}: ${s.file} has only ${lines[abs]} lines`);
      }
      if (codeSrc.length) ok(`--code: ${plural(codeSrc.length, 'code source')} checked against ${repo}`);
    }
  }

  // ---- capture manifests: shots/<scene>.json beside each screenshot ----
  let withManifest = 0;
  for (const [id, s] of Object.entries(scenes)) {
    if (!sizes[id]) continue;
    const beside = path.resolve(dir, s.src.replace(/\.[^./\\]+$/, '') + '.json');
    const mf = [beside, path.join(SHOTS, id + '.json')].find(isFile);
    if (!mf) { info(`scene "${id}": no ${path.relative(dir, beside).split(path.sep).join('/')}, so the capture and its zones were not checked against a measurement`); continue; }
    const mrel = path.relative(dir, mf).split(path.sep).join('/');
    let m;
    try { m = JSON.parse(fs.readFileSync(mf, 'utf8')); } catch (e) { fail(`scene "${id}": ${mrel} is not valid JSON (${e.message}); write it again with the capture snippet`); continue; }
    if (!m || typeof m !== 'object') { fail(`scene "${id}": ${mrel} must hold an object`); continue; }
    withManifest++;
    const pw = sizes[id].w, dpr = Number.isFinite(m.dpr) ? m.dpr : 1;
    if (Number.isFinite(m.vw) && pw !== m.vw && pw !== m.docW) {
      if (dpr !== 1 && Math.abs(pw - m.vw * dpr) <= 2) fail(`scene "${id}": ${s.src} is ${pw} px wide, and the page was ${m.vw} px at device pixel ratio ${dpr}: the capture is in device pixels, so zones measured in page pixels miss. Capture again at 1:1 (scale: css)`);
      else fail(`scene "${id}": ${s.src} is ${pw} px wide, but the page was ${m.vw} px wide: the screenshot was scaled. Capture again at 1:1`);
    }
    const overlays = Array.isArray(m.overlays) ? m.overlays.filter(Boolean) : [];
    if (overlays.length && !s.keep) fail(`scene "${id}": the capture had ${overlays.length > 1 ? 'overlays' : 'an overlay'} open (${overlays.map(String).join(', ')}). Close it and capture again, or set keep: true when the open menu is the subject`);
    if (m.busy && !(Array.isArray(m.busy) && !m.busy.length)) warning(`scene "${id}": the page was still busy when captured (${Array.isArray(m.busy) ? m.busy.join(', ') : String(m.busy)}); capture again once it settles`);
    if (m.before === undefined || m.hash === undefined) warning(`scene "${id}": ${mrel} has no before and hash; run the snippet before and after the screenshot`);
    else if (m.before !== m.hash) fail(`scene "${id}": the page changed between the measurement and the screenshot (before ≠ hash); measure and capture again`);
    const zones = m.zones && typeof m.zones === 'object' ? Object.entries(m.zones).filter(([, z]) => z && Array.isArray(z.r) && z.r.length === 4 && z.r.every(Number.isFinite)) : [];
    S.forEach((st, i) => {
      if (!st || st.scene !== id || !validR(st)) return;
      const hit = zones.find(([, z]) => z.r.every((v, j) => Math.abs(v - st.r[j]) <= 2));
      if (!hit) { warning(`${at(i)}: zone ${fmt(st.r)} matches no measured zone in ${mrel} (within 2 px): placed by eye, or edited by hand. Measure it`); return; }
      const [name, z] = hit;
      if (typeof z.f === 'string' && z.f.includes('o')) warning(`${at(i)}: the measured zone "${name}" was flagged o (partly covered or out of view) when measured; check it on the screenshot`);
      if (Number.isFinite(z.n) && z.n > 1) warning(`${at(i)}: the measurement for "${name}" matched ${z.n} elements; the zone may be the wrong one`);
      const said = norm((Array.isArray(z.texts) ? z.texts : []).map(String).join(' '));
      const body = noAsides(st.b);
      const missing = uiNames(body).filter((n) => !said.includes(norm(n))).map((n) => `"${n}"`);
      const saidDigits = digitsOnly(said);
      for (const n of new Set(numbersIn(text(noCode(body))))) if (!new RegExp(`(?<!\\d)${n}(?!\\d)`).test(saidDigits)) missing.push(n);
      if (missing.length) warning(`${at(i)}: ${missing.join(', ')} ${missing.length > 1 ? 'are' : 'is'} not among the texts measured in zone "${name}"; check ${missing.length > 1 ? 'them' : 'it'} on the screen`);
    });
  }
  if (withManifest) ok(`${withManifest} of ${plural(Object.keys(sizes).length, 'scene')} checked against a capture manifest`);

  // ---- files around the data ----
  const usedSrc = new Set(Object.values(scenes).map((s) => typeof s.src === 'string' && path.resolve(dir, s.src).toLowerCase()).filter(Boolean));
  const others = (() => { try { return fs.readdirSync(dir).filter((f) => /^tour\.data.*\.js$/.test(f) && path.resolve(dir, f) !== dataFile); } catch { return []; } })();
  for (const f of others) {
    const o = load(path.join(dir, f));
    if (o.cfg && o.cfg.scenes && typeof o.cfg.scenes === 'object') for (const s of Object.values(o.cfg.scenes)) if (s && typeof s.src === 'string') usedSrc.add(path.resolve(dir, s.src).toLowerCase());
  }
  for (const f of shotFiles() || []) if (!usedSrc.has(path.join(SHOTS, f).toLowerCase())) warning(`shots/${f} is used by no scene; it may be a leftover private screenshot. Delete it, or use it in a scene`);

  const pages = (() => { try { return fs.readdirSync(dir).filter((f) => /\.html?$/i.test(f)); } catch { return []; } })();
  const read = (f) => { try { return fs.readFileSync(path.join(dir, f), 'utf8'); } catch { return ''; } };
  const scriptsOf = (html) => [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
  const page = pages.find((f) => scriptsOf(read(f)).some((s) => path.basename(s.split(/[?#]/)[0]) === DN));
  if (!page) {
    if (DN === 'tour.data.js') fail(`no page in ${dir} loads tour.data.js. Create index.html with new-tour.mjs`);
    else warning(`no page in this folder loads ${DN}, so readers cannot open it. Add a page like index.html that loads it`);
  } else {
    const html = read(page);
    const left = html.match(/\{\{[A-Z]+\}\}/);
    if (left) fail(`${page} still has the template placeholder ${left[0]}; run new-tour.mjs again to rebuild the page`);
    const scripts = scriptsOf(html);
    const targets = [...scripts, ...[...html.matchAll(/<link\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1])];
    for (const t of targets) {
      if (/^(data:|https?:|\/\/|#)/i.test(t)) continue;
      let rel;
      try { rel = decodeURI(t.split(/[?#]/)[0]); } catch { rel = t; }
      const found = caseOf(dir, rel);
      if (found.missing || !fs.existsSync(found.abs)) fail(`${page} loads ${t}, which is not there.${/_roomtour/.test(t) ? ' Copy the engine with: node new-tour.mjs <tours folder> --engine-only' : ' Fix the path'}`);
      else if (found.mismatch) fail(`${page} loads ${t}, but the file is named ${found.actual}; the letter case must match`);
    }
    const ei = scripts.findIndex((s) => /(^|\/)roomtour\.js([?#]|$)/.test(s)), di = scripts.findIndex((s) => path.basename(s.split(/[?#]/)[0]) === DN);
    if (ei < 0) fail(`${page} does not load the engine roomtour.js; rebuild it with new-tour.mjs`);
    else if (ei > di) fail(`${page} loads ${DN} before roomtour.js; the engine must come first`);
  }

  // ---- privacy ----
  if (isDir(SHOTS) && !isFile(path.join(SHOTS, '.gitignore')) && cfg.public !== true) {
    warning('shots/ has no .gitignore: screenshots may end up in git. Run new-tour.mjs again to add one, or set public: true for a public page captured signed out');
  }

  // ---- the same tour in another language ----
  if (opt.pair) {
    const pf = path.isAbsolute(opt.pair) ? opt.pair : [path.resolve(dir, opt.pair), path.resolve(opt.pair)].find(isFile) || path.resolve(dir, opt.pair);
    const PN = path.basename(pf);
    const o = isFile(pf) ? load(pf) : { err: `no ${opt.pair} in ${dir}` };
    if (o.err) fail(`--pair: ${o.err}`);
    else if (!o.cfg || !Array.isArray(o.cfg.steps)) fail(`--pair: ${PN} has no steps list`);
    else {
      const T = o.cfg.steps;
      if (T.length !== S.length) fail(`--pair: ${PN} has ${T.length} steps and ${DN} has ${S.length}; they must match step by step`);
      const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
      for (let i = 0; i < Math.min(T.length, S.length); i++) {
        const a = S[i], b = T[i] && typeof T[i] === 'object' ? T[i] : null;
        if (!a || !b) continue;
        for (const k of ['scene', 'r', 'k', 'mb', 'map']) {
          const va = k === 'map' ? !!a.map : a[k], vb = k === 'map' ? !!b.map : b[k];
          if (!same(va, vb)) fail(`--pair: step ${i} differs in ${k}: ${fmt(va ?? null)} here, ${fmt(vb ?? null)} in ${PN}`);
        }
        const ua = uiNames(a.b).map(norm).sort(), ub = uiNames(b.b).map(norm).sort();
        if (!same(ua, ub)) warning(`--pair: step ${i} names other controls: ${ua.join(', ') || 'none'} here, ${ub.join(', ') || 'none'} in ${PN}; control names stay as on the screen`);
      }
      const os = o.cfg.scenes && typeof o.cfg.scenes === 'object' ? o.cfg.scenes : {};
      for (const [id, s] of Object.entries(scenes)) {
        const t = os[id];
        if (!t) continue;
        if (t.src !== s.src) warning(`--pair: scene "${id}" uses ${s.src} here and ${t.src} in ${PN}`);
        if (!same(s.redact, t.redact)) fail(`--pair: scene "${id}" has other blur boxes in ${PN}; personal data must be hidden the same way in both`);
      }
      ok(`--pair: compared with ${PN}`);
    }
  }

  // ---- contact sheet: one 1:1 crop per zone ----
  if (opt.sheet) {
    const sheet = path.join(SHOTS, '_zones.html');
    fs.mkdirSync(SHOTS, { recursive: true });
    const cards = [];
    S.forEach((st, i) => {
      if (!validR(st) || !sizes[st.scene]) return;
      const sc = scenes[st.scene], sz = sizes[st.scene];
      const [x, y, w, h] = st.r.map(Math.round), pad = 12;
      const cx = Math.max(0, x - pad), cy = Math.max(0, y - pad);
      const cw = Math.max(1, Math.min(w + 2 * pad, 480, sz.w - cx)), ch = Math.max(1, Math.min(h + 2 * pad, sz.h - cy));
      const url = encodeURI(path.relative(SHOTS, path.resolve(dir, sc.src)).split(path.sep).join('/')).replace(/'/g, '%27');
      const blur = validBoxes(st.scene).map(([bx, by, bw, bh]) => `<i class="blur" style="left:${bx - cx}px;top:${by - cy}px;width:${bw}px;height:${bh}px"></i>`).join('');
      const names = uiNames(st.b), nums = [...new Set(numbersIn(text(noCode(noAsides(st.b)))))];
      cards.push(`<article><div class="crop" style="width:${cw}px;height:${ch}px;background-image:url('${url}');background-position:${-cx}px ${-cy}px">${blur}<i class="zone" style="left:${x - cx}px;top:${y - cy}px;width:${w}px;height:${h}px"></i></div>
<h2><span>${i}</span> ${esc(text(st.t))}</h2>
<p>${esc(cats[st.k] ? label(st.k) : 'no category')} · ${esc(st.scene)} · [${st.r.join(', ')}]${w + 2 * pad > 480 ? ' · wider than the crop: its left part is shown' : ''}</p>
<p><b>Controls:</b> ${names.length ? names.map(esc).join(', ') : '—'}<br><b>Numbers:</b> ${nums.length ? nums.join(', ') : '—'}</p></article>`);
    });
    fs.writeFileSync(sheet, `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Zones · ${esc(text(cfg.title))}</title>
<!-- ROOMTOUR check view, written by check.mjs --sheet. Local only: it shows the screenshots. -->
<style>
:root{color-scheme:light dark;--ink:#1b1b1f;--soft:#5c5c66;--bg:#f4f4f6;--card:#fff;--zone:#d0302f}
@media (prefers-color-scheme:dark){:root{--ink:#ececf1;--soft:#a6a6b2;--bg:#141418;--card:#1f1f25;--zone:#ff6b6b}}
body{font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink);background:var(--bg);margin:0;padding:24px}
h1{font-size:18px;margin:0 0 4px}body>p{color:var(--soft);margin:0 0 20px}
main{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start}
article{background:var(--card);border-radius:8px;padding:12px;max-width:480px}
.crop{position:relative;background-repeat:no-repeat;outline:1px solid var(--soft);overflow:hidden}
.zone{position:absolute;outline:2px solid var(--zone);outline-offset:0}
.blur{position:absolute;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);background:rgba(128,128,128,.35)}
h2{font-size:15px;margin:10px 0 2px}h2 span{display:inline-block;min-width:1.6em;padding:0 4px;border-radius:4px;background:var(--ink);color:var(--card);text-align:center}
article p{margin:2px 0;color:var(--soft)}article p b{color:var(--ink);font-weight:600}
</style>
<h1>Zones of “${esc(text(cfg.title))}”</h1>
<p>${plural(cards.length, 'zone step')}, each cropped 1:1 from its screenshot. Compare every crop with its title, controls and numbers.</p>
<main>${cards.join('\n') || '<p>No step has a zone yet.</p>'}</main>
</html>
`);
    info(`zone sheet written: ${sheet}. Open it through serve.mjs and compare each crop with its text`);
  }

  ok(`${plural(S.filter(Boolean).length, 'step')}, ${plural(chIds.length, 'chapter')}, ${plural(Object.keys(scenes).length, 'scene')}, ${plural(catIds.length, 'category', 'categories')}`);
  report();
}

// Share of a zone under the union of blur boxes
function coveredShare(r, boxes) {
  const [x, y, w, h] = r;
  const parts = boxes.map(([bx, by, bw, bh]) => {
    const x0 = Math.max(x, bx), y0 = Math.max(y, by), x1 = Math.min(x + w, bx + bw), y1 = Math.min(y + h, by + bh);
    return x1 > x0 && y1 > y0 ? [x0, y0, x1, y1] : null;
  }).filter(Boolean);
  if (!parts.length) return 0;
  const xs = [...new Set(parts.flatMap((p) => [p[0], p[2]]))].sort((a, b) => a - b);
  let area = 0;
  for (let k = 0; k + 1 < xs.length; k++) {
    const spans = parts.filter((p) => p[0] <= xs[k] && p[2] >= xs[k + 1]).map((p) => [p[1], p[3]]).sort((a, b) => a[0] - b[0]);
    let covered = 0, s = null, e = null;
    for (const [a, b] of spans) {
      if (s === null || a > e) { if (s !== null) covered += e - s; s = a; e = b; } else e = Math.max(e, b);
    }
    if (s !== null) covered += e - s;
    area += covered * (xs[k + 1] - xs[k]);
  }
  return area / (w * h);
}
