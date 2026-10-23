/* ROOMTOUR engine 0.2.0
   A tour is three files:  <tours>/_roomtour/{roomtour.css, roomtour.js}  (this engine, shared)
                           <tours>/<topic>/index.html                       (a tiny shell)
                           <topic>/tour.data.js + <topic>/shots/*.png        (the tour itself)
   tour.data.js calls:
     Roomtour.define(({ ui, chip, note, warn, code }) => ({
       lang: 'en' | 'uk' | 'ru', uiLang?,
       title, subtitle, foot,
       categories: { id: { label, note, tone, icon, line, solid } },          (safest first)
       scenes:   { id: { src, w, h, alt, via?, keep?, redact: [[x, y, w, h], ...] } },
       chapters: [ { id, name } ],
       steps:    [ { ch, scene, r: [x, y, w, h] | null, k: categoryId, n?, t, b, from?, map?, mb? } ],
       mapMaxArea?
     }));
   Plain text: title, subtitle, t, n, chapter name, category label and note, alt.
   HTML: b, foot, via. ui(), code() and the labels of note() and warn() are escaped.
   r is in screenshot pixels. tone: green | amber | red | blue | violet | grey. line: solid | dashed | dotted | double.
   icon: eye | users | alert | info | chart | flag | lock | star | check | mail | pointer | dot.
   from: 'screen' | 'dom' | 'docs:<url>' | 'code:<path>:<line>' | 'inferred' | 'unchecked', or an array of them.
   URL flag ?zones outlines every zone of the current scene on every step (author's check view). */
(() => {
  const VERSION = '0.2.0';
  const P = (d) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICON = {
    eye:     P('<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>'),
    users:   P('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
    alert:   P('<path d="M15.31 2a2 2 0 0 1 1.42.59l4.68 4.68A2 2 0 0 1 22 8.69v6.62a2 2 0 0 1-.59 1.42l-4.68 4.68a2 2 0 0 1-1.42.59H8.69a2 2 0 0 1-1.42-.59l-4.68-4.68A2 2 0 0 1 2 15.31V8.69a2 2 0 0 1 .59-1.42l4.68-4.68A2 2 0 0 1 8.69 2z"/><path d="M12 8v4"/><path d="M12 16h.01"/>'),
    info:    P('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'),
    chart:   P('<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>'),
    flag:    P('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>'),
    lock:    P('<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
    star:    P('<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>'),
    check:   P('<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>'),
    mail:    P('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>'),
    pointer: P('<path d="M9 9l5 12 1.8-5.2L21 14 9 9z"/><path d="M7.2 2.2 8 5.1"/><path d="m5.1 8-2.9-.8"/><path d="M14 4.1 12 6"/><path d="m6 12-1.9 2"/>'),
    dot:     P('<circle cx="12" cy="12" r="4"/>')
  };
  const ARROW_L = P('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>');
  const ARROW_R = P('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>');
  const RESTART = P('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>');
  const TONES = ['green', 'amber', 'red', 'blue', 'violet', 'grey'];
  const LINES = ['solid', 'dashed', 'dotted', 'double'];

  const I18N = {
    en: { back: 'Back', next: 'Next', restart: 'Start over', of: 'of', or: 'or', steps: 'Steps', chapters: 'Tour chapters',
          panel: 'Step explanation', stage: 'Screenshot', legend: 'Categories', toc: 'Steps in “{ch}”', lit: 'Highlighted: ',
          total: { one: '{n} step', other: '{n} steps' },
          status: 'Step {i} of {n}: {t}.',
          emptyTitle: 'The screenshots did not load',
          emptyText: 'They should be in the <code>shots/</code> folder next to this page. Open the page in Chrome or Edge, or ask Claude to open the tour. If that folder is empty, ask Claude to capture the screens again.',
          sceneMissing: '{src} did not load',
          noStepsTitle: 'This tour has no steps yet', noStepsText: 'Ask Claude to finish this tour.',
          zones: 'Zones on this screen', zonesMore: 'Zones of other screens are in their chapters.',
          from: 'Source:', docs: 'documentation', dom: 'the page’s markup', inferred: 'inferred from the label, not checked', unchecked: 'not checked' },
    uk: { back: 'Назад', next: 'Далі', restart: 'На початок', of: 'з', or: 'або', steps: 'Кроки', chapters: 'Розділи туру',
          panel: 'Пояснення кроку', stage: 'Знімок екрана', legend: 'Категорії', toc: 'Кроки розділу «{ch}»', lit: 'Підсвічено: ',
          total: { one: '{n} крок', few: '{n} кроки', many: '{n} кроків', other: '{n} кроку' },
          status: 'Крок {i} з {n}: {t}.',
          emptyTitle: 'Скриншоти не завантажилися',
          emptyText: 'Вони мають лежати в теці <code>shots/</code> поруч із цією сторінкою. Відкрий сторінку в Chrome чи Edge або попроси Claude відкрити тур. Якщо тека порожня, попроси Claude зняти екрани знову.',
          sceneMissing: 'Не вдалося завантажити {src}',
          noStepsTitle: 'У цьому турі ще немає кроків', noStepsText: 'Попроси Claude завершити цей тур.',
          zones: 'Зони на цьому екрані', zonesMore: 'Зони інших екранів — у їхніх розділах.',
          from: 'Джерело:', docs: 'документація', dom: 'розмітка сторінки', inferred: 'висновок із підпису, не перевірено', unchecked: 'не перевірено' },
    ru: { back: 'Назад', next: 'Далее', restart: 'В начало', of: 'из', or: 'или', steps: 'Шаги', chapters: 'Главы тура',
          panel: 'Объяснение шага', stage: 'Снимок экрана', legend: 'Категории', toc: 'Шаги главы «{ch}»', lit: 'Подсвечено: ',
          total: { one: '{n} шаг', few: '{n} шага', many: '{n} шагов', other: '{n} шага' },
          status: 'Шаг {i} из {n}: {t}.',
          emptyTitle: 'Скриншоты не загрузились',
          emptyText: 'Они должны лежать в папке <code>shots/</code> рядом с этой страницей. Открой страницу в Chrome или Edge либо попроси Claude открыть тур. Если папка пуста, попроси Claude переснять экраны.',
          sceneMissing: 'Не удалось загрузить {src}',
          noStepsTitle: 'В этом туре пока нет шагов', noStepsText: 'Попроси Claude закончить этот тур.',
          zones: 'Зоны на этом экране', zonesMore: 'Зоны других экранов — в их главах.',
          from: 'Источник:', docs: 'документация', dom: 'разметка страницы', inferred: 'вывод из подписи, не проверено', unchecked: 'не проверено' }
  };

  const ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ENT[ch]);
  // Text for attributes (aria-label): tags dropped, entities decoded
  const plain = (html) => {
    const d = document.createElement('div');
    d.innerHTML = String(html ?? '');
    return d.textContent.replace(/\s+/g, ' ').trim();
  };
  const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const own = (o, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
  const fill = (tpl, map) => tpl.replace(/\{(\w+)\}/g, (m, k) => (k in map ? map[k] : m));
  const CHIP_RE = /<span class="chip-ref" data-cat="([^"]*)"><\/span>/g;

  const helpers = {
    ui: (s) => `<span class="ui">${esc(s)}</span>`,
    code: (s) => `<span class="branch">${esc(s)}</span>`,
    // Resolved at render time, once the categories are known
    chip: (id) => `<span class="chip-ref" data-cat="${esc(id)}"></span>`,
    note: (label, html) => `<p class="aside"><b>${esc(label)}</b> ${html ?? ''}</p>`,
    warn: (label, html) => `<p class="aside warn">${ICON.alert}<b>${esc(label)}</b> ${html ?? ''}</p>`
  };

  let factory = null, started = false;
  function define(fn) {
    factory = fn;
    if (started) return;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
  }
  function start() { if (!started) { started = true; run(); } }

  function run() {
    /* ---------- Data: read defensively, so a broken data file still gives a page ---------- */
    let cfg = null;
    try { cfg = typeof factory === 'function' ? factory(helpers) : factory; }
    catch (e) { console.error('ROOMTOUR: tour.data.js threw an error while building the tour.', e); }
    if (!isObj(cfg)) {
      if (cfg != null) console.warn('ROOMTOUR: Roomtour.define(...) must return an object.');
      cfg = {};
    }
    const known = own(I18N, cfg.lang);
    const lang = typeof cfg.lang === 'string' && cfg.lang ? cfg.lang : 'en';
    const L = I18N[known ? cfg.lang : 'en'];
    // Unknown tour language: English chrome says so with lang="en"; content inside it keeps the tour's language
    const CL = known || lang === 'en' ? '' : ' lang="en"';
    const XL = CL ? ` lang="${esc(lang)}"` : '';
    let plural = null;
    try { plural = new Intl.PluralRules(known ? cfg.lang : 'en'); } catch (e) { /* old browser */ }
    const total = (n) => { const f = L.total; return (f[plural ? plural.select(n) : 'other'] || f.other).replace('{n}', n); };
    const uiLang = typeof cfg.uiLang === 'string' && /^[A-Za-z]{2,3}(-[A-Za-z0-9]{1,8})*$/.test(cfg.uiLang) ? cfg.uiLang : '';
    const ZONES = new URLSearchParams(location.search).has('zones');
    const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.lang = lang;

    const CATS = {};
    if (isObj(cfg.categories)) {
      for (const [id, c] of Object.entries(cfg.categories)) {
        if (isObj(c)) CATS[id] = c; else console.warn(`ROOMTOUR: category "${id}" is not an object; skipped.`);
      }
    }
    const SCENES = {};
    if (isObj(cfg.scenes)) {
      for (const [id, s] of Object.entries(cfg.scenes)) {
        if (!isObj(s) || typeof s.src !== 'string' || !s.src) { console.warn(`ROOMTOUR: scene "${id}" has no src; skipped.`); continue; }
        SCENES[id] = { ...s, w: +s.w > 0 ? +s.w : 0, h: +s.h > 0 ? +s.h : 0, redact: Array.isArray(s.redact) ? s.redact : [] };
      }
    }
    const CHAPTERS = (Array.isArray(cfg.chapters) ? cfg.chapters : []).filter((c) => isObj(c) && c.id != null);
    const STEPS = [];
    (Array.isArray(cfg.steps) ? cfg.steps : []).forEach((s, n) => {
      if (!isObj(s)) { console.warn(`ROOMTOUR: step ${n} is not an object; skipped.`); return; }
      if (!own(SCENES, s.scene)) { console.warn(`ROOMTOUR: step ${n} uses scene "${s.scene}", which is not in scenes; skipped.`); return; }
      let r = s.r ?? null;
      if (r !== null && !(Array.isArray(r) && r.length === 4 && r.every((v) => Number.isFinite(v)) && r[2] > 0 && r[3] > 0)) {
        console.warn(`ROOMTOUR: step ${n} has a zone r that is not [x, y, w, h]; shown without a zone.`);
        r = null;
      }
      STEPS.push({ ...s, r, t: s.t == null ? '' : String(s.t) });
    });
    const mapMaxArea = +cfg.mapMaxArea > 0 ? +cfg.mapMaxArea : 60000;
    const titleText = cfg.title == null ? '' : String(cfg.title);
    const chapName = (id) => { const c = CHAPTERS.find((x) => x.id === id); return String(c?.name ?? id ?? ''); };

    /* ---------- Categories ---------- */
    const catOf = (id) => (own(CATS, id) ? CATS[id] : null);
    const catClass = (id) => {
      const c = catOf(id) || {};
      const tone = TONES.includes(c.tone) ? c.tone : 'grey';
      const line = LINES.includes(c.line) ? c.line : 'solid';
      return `tone-${tone} line-${line}${c.solid ? ' solid' : ''}`;
    };
    const iconOf = (c) => (c && own(ICON, c.icon) ? ICON[c.icon] : ICON.dot);
    const chipHtml = (id, withTitle) => {
      const c = catOf(id);
      const label = c ? c.label ?? id : id;
      const tip = withTitle && c && c.note ? ` title="${esc(c.note)}"` : '';
      return `<span class="chip ${catClass(id)}"${tip}>${iconOf(c)}${esc(label)}</span>`;
    };
    const markHtml = (id) => {
      const c = catOf(id);
      return c ? `<span class="mark ${catClass(id)}" title="${esc(c.label)}">${iconOf(c)}<span class="vh">${esc(c.label)}</span></span>` : '<span></span>';
    };
    const uiTag = uiLang ? `<span class="ui" lang="${uiLang}">` : '<span class="ui">';
    const resolve = (html) => String(html ?? '')
      .replace(CHIP_RE, (m, id) => chipHtml(plain(id)))
      .replace(/<span class="ui">/g, uiTag);
    // Plain text that may hold chip() refs: escape the text, keep the chips
    const textWithChips = (s) => String(s ?? '').split(CHIP_RE).map((part, k) => (k % 2 ? chipHtml(plain(part)) : esc(part))).join('');

    /* ---------- Shell ---------- */
    const icon = own(ICON, cfg.icon) ? ICON[cfg.icon] : typeof cfg.icon === 'string' && /^<svg[\s>]/.test(cfg.icon) ? cfg.icon : '';
    const catIds = Object.keys(CATS);
    const legend = catIds.length ? `
    <div class="legend-wrap">
      <span class="legend-label" id="rt-legend"${CL}>${esc(L.legend)}</span>
      <ul class="legend" aria-labelledby="rt-legend">${catIds.map((id) => `<li>${chipHtml(id, true)}</li>`).join('')}</ul>
    </div>` : '';
    document.body.innerHTML = `
<div class="app">
  <header class="mast">
    <h1>${icon}${esc(titleText)}${cfg.subtitle ? ` <span>· ${esc(cfg.subtitle)}</span>` : ''}</h1>${legend}
  </header>
  <section class="stage-wrap" aria-label="${esc(L.stage)}">
    <nav aria-label="${esc(L.chapters)}"${CL}><ul class="chapters" id="chapters"></ul></nav>
    <div class="stage" id="stage" role="img" aria-label="${esc(titleText || L.stage)}">
      <div class="stage-empty"><strong id="notice-title"></strong><span id="notice-text"></span></div>
    </div>
  </section>
  <main class="panel" id="panel" aria-label="${esc(L.panel)}">
    <p class="vh" id="status" aria-live="polite"${CL}></p>
    <div class="step" id="step">
      <h2 id="title" tabindex="-1"></h2>
      <p class="risk" id="risk" hidden></p>
      <div class="body" id="body"></div>
      <p class="from" id="from" hidden${CL}></p>
    </div>
    <div class="toc" id="toc-wrap"><h3 id="toc-title"${CL}></h3><ol id="toc"></ol></div>
    ${cfg.foot ? `<p class="foot" id="foot">${resolve(cfg.foot)}</p>` : ''}
    <nav class="nav" id="nav" aria-label="${esc(L.steps)}"${CL}>
      <button class="btn" id="prev" type="button">${ARROW_L}<span>${esc(L.back)}</span></button>
      <div class="pos"><span id="pos"></span><span class="hint" id="hint">${esc(L.or)} <kbd>←</kbd> <kbd>→</kbd></span></div>
      <button class="btn primary" id="next" type="button"></button>
    </nav>
  </main>
</div>`;

    const $ = (id) => document.getElementById(id);
    const stage = $('stage'), panel = $('panel'), bodyEl = $('body'), tocWrap = $('toc-wrap'), nav = $('nav');
    const prevBtn = $('prev'), nextBtn = $('next');
    let cur = -1, shown = null, tocCh = null, swapToken = 0, noticeText = '';

    function showNotice(title, html) {
      $('notice-title').textContent = title;
      $('notice-text').innerHTML = html;
      noticeText = `${title}. ${plain(html)}`;
      stage.classList.add('notice');
      labelStage();
    }
    function clearNotice() {
      if (!noticeText) return;
      noticeText = '';
      stage.classList.remove('notice');
      labelStage();
    }
    function labelStage() {
      if (noticeText || cur < 0) {
        stage.setAttribute('role', 'img');
        if (noticeText) stage.setAttribute('aria-label', noticeText);
        return;
      }
      const step = STEPS[cur];
      stage.setAttribute('role', step.map ? 'group' : 'img');
      const base = String(SCENES[step.scene].alt || titleText || L.stage);
      stage.setAttribute('aria-label', base + (step.r && step.t ? '. ' + L.lit + step.t : ''));
    }

    if (!STEPS.length) {
      showNotice(L.noStepsTitle, esc(L.noStepsText));
      $('step').hidden = true;
      tocWrap.classList.add('none');
      $('hint').hidden = true;
      nextBtn.innerHTML = `<span>${esc(L.next)}</span>${ARROW_R}`;
      prevBtn.disabled = true; nextBtn.disabled = true;
      return;
    }

    /* ---------- Scenes: one camera per used screenshot ---------- */
    const used = new Set(STEPS.map((s) => s.scene));
    const cams = {}, imgs = {}, camState = {};
    const broken = new Set(), loading = new Set();
    for (const key of used) {
      const s = SCENES[key];
      const cam = document.createElement('div');
      cam.className = 'cam';
      cam.dataset.scene = key;
      const img = new Image();
      if (s.w) img.width = s.w;
      if (s.h) img.height = s.h;
      img.alt = s.alt == null ? '' : String(s.alt);
      img.decoding = 'async';
      img.draggable = false;
      img.addEventListener('load', () => {
        if (s.w && s.h) return;
        s.w = img.naturalWidth; s.h = img.naturalHeight; img.width = s.w; img.height = s.h;
        if (shown === key) reframe();
      });
      img.addEventListener('error', () => { broken.add(key); cam.classList.add('broken'); updateNotice(); });
      cam.append(img);
      for (const box of s.redact) {
        if (!Array.isArray(box) || box.length !== 4 || !box.every((v) => Number.isFinite(v))) continue;
        const [x, y, w, h] = box;
        const r = document.createElement('div');
        r.className = 'redact';
        Object.assign(r.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
        cam.append(r);
      }
      cam.addEventListener('animationend', (e) => { if (e.target === cam) cam.classList.remove('enter'); });
      stage.append(cam);
      cams[key] = cam; imgs[key] = img;
    }

    function updateNotice() {
      if (cur < 0) return;
      if (broken.size && broken.size === used.size) {
        const em = isObj(cfg.empty) ? cfg.empty : {};
        showNotice(em.title ? String(em.title) : L.emptyTitle, em.text ? String(em.text) : L.emptyText);
        return;
      }
      const key = STEPS[cur].scene;
      if (broken.has(key)) showNotice(L.sceneMissing.replace('{src}', SCENES[key].src), L.emptyText);
      else clearNotice();
    }

    // The current scene loads first and fast, the next one soon after, the rest when the browser is idle
    const idle = window.requestIdleCallback ? (f) => requestIdleCallback(f, { timeout: 3000 }) : (f) => setTimeout(f, 1200);
    let restQueued = false;
    function load(key, prio) {
      if (loading.has(key)) return;
      loading.add(key);
      const img = imgs[key];
      if (prio && 'fetchPriority' in img) img.fetchPriority = prio;
      img.src = SCENES[key].src;
    }
    function prefetch(i) {
      const here = STEPS[i].scene;
      const nx = STEPS.find((s, k) => k > i && s.scene !== here);
      if (nx && !loading.has(nx.scene)) setTimeout(() => load(nx.scene, 'auto'), 250);
      if (!restQueued) {
        restQueued = true;
        idle(() => { for (const key of used) load(key, 'low'); });
      }
    }
    function ready(key) {
      load(key, 'high');
      const img = imgs[key];
      if (broken.has(key)) return Promise.resolve();
      const done = img.decode
        ? img.decode().catch(() => {})
        : new Promise((res) => {
          if (img.complete) res();
          else { img.addEventListener('load', res, { once: true }); img.addEventListener('error', res, { once: true }); }
        });
      return Promise.race([done, new Promise((res) => setTimeout(res, 400))]);
    }

    const spot = document.createElement('div');
    spot.className = 'spot none';
    spot.innerHTML = '<span class="spot-num"></span>';
    const maplayer = document.createElement('div');
    maplayer.className = 'maplayer';

    /* ---------- Chapters: a strip over the stage, one segment per chapter, widths by step count ---------- */
    const chapNav = $('chapters');
    const CHAPS = CHAPTERS
      .map((c) => ({ id: c.id, name: String(c.name ?? c.id), steps: STEPS.reduce((a, s, k) => (s.ch === c.id && a.push(k), a), []) }))
      .filter((c) => c.steps.length);
    const chapBtns = CHAPS.map((c) => {
      const li = document.createElement('li');
      li.style.setProperty('--n', c.steps.length);
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = `<span class="name"${XL}>${esc(c.name)}</span><span class="bar" aria-hidden="true"><span class="fill"></span></span>`;
      b.addEventListener('click', () => go(c.steps[0]));
      li.append(b); chapNav.append(li);
      return b;
    });
    // Fades on the strip's edges tell a phone reader there are more chapters to scroll to
    function fadeChapters() {
      chapNav.classList.toggle('more', chapNav.scrollLeft + chapNav.clientWidth < chapNav.scrollWidth - 4);
      chapNav.classList.toggle('less', chapNav.scrollLeft > 4);
    }
    chapNav.addEventListener('scroll', fadeChapters, { passive: true });
    // A vertical wheel scrolls the strip sideways, but only while it overflows
    let wheelOn = false;
    function onWheel(e) {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = chapNav.scrollWidth - chapNav.clientWidth;
      const to = Math.max(0, Math.min(max, chapNav.scrollLeft + e.deltaY * (e.deltaMode === 1 ? 16 : 1)));
      if (to === chapNav.scrollLeft) return;
      e.preventDefault();
      chapNav.scrollLeft = to;
    }
    function updateWheel() {
      const over = chapNav.scrollWidth > chapNav.clientWidth + 1;
      if (over === wheelOn) return;
      wheelOn = over;
      if (over) chapNav.addEventListener('wheel', onWheel, { passive: false });
      else chapNav.removeEventListener('wheel', onWheel);
    }

    /* ---------- Camera ---------- */
    function target(step) {
      const s = SCENES[step.scene];
      const W = stage.clientWidth, H = stage.clientHeight;
      if (!W || !H || !s.w || !s.h) return null;
      // Small stages: never shrink the screenshot's text below legibility; pin the zone's start and let the rest crop
      const tight = W < 600 || H < 320;
      let scale, tx, ty;
      if (step.r) {
        const [x, y, w, h] = step.r;
        const boxW = Math.max(w + 64, 400), boxH = Math.max(h + 64, 280);
        scale = Math.min(W / boxW, H / boxH, 1.25);
        scale = Math.max(scale, Math.min(W / s.w, 1) * 0.5);
        if (tight) scale = Math.max(scale, 0.8);
        tx = W / 2 - (x + w / 2) * scale;
        ty = H / 2 - (y + h / 2) * scale;
        if (tight) {
          if (w * scale > W - 40) tx = 20 - x * scale;
          if (h * scale > H - 40) ty = 20 - y * scale;
        }
      } else if (step.map) {
        // A margin so outlines and numbers on the image's edge are not cut by the stage
        scale = Math.min((W - 64) / s.w, (H - 64) / s.h, 1.15);
        tx = 0; ty = 0;
      } else {
        scale = Math.min(W / s.w, 1.15);
        tx = 0; ty = 0;
      }
      if (!(scale > 0)) scale = Math.min(W / s.w, H / s.h);
      const iw = s.w * scale, ih = s.h * scale;
      // Leave room for the zone's number when the zone touches the screenshot's edge
      const pad = step.r ? 28 : 0;
      tx = iw <= W ? (W - iw) / 2 : Math.min(pad, Math.max(W - iw - pad, tx));
      ty = ih <= H ? (H - ih) / 2 : Math.min(pad, Math.max(H - ih - pad, ty));
      return { tx, ty, scale, W, H };
    }
    function apply(cam, t) {
      cam.style.setProperty('--inv', (1 / t.scale).toFixed(4));
      cam.style.transform = `translate(${t.tx.toFixed(1)}px, ${t.ty.toFixed(1)}px) scale(${t.scale.toFixed(4)})`;
    }
    // Frame a step on its (already shown) scene: camera, spot, map. cut = no travel.
    function frame(step, idx, cut) {
      const key = step.scene, cam = cams[key];
      stage.classList.toggle('narrow', stage.clientWidth < 600);
      const t = target(step);
      if (!t) return;
      const prev = camState[key];
      cut = cut || !prev;
      if (!cut) {
        // Short hops are quick, long ones slower: the duration follows the distance
        const d = Math.hypot((t.tx - prev.tx) / t.W, (t.ty - prev.ty) / t.H) + Math.abs(Math.log(t.scale / prev.scale));
        cam.style.setProperty('--k', Math.min(0.9, Math.max(0.5, 0.45 + d * 0.8)).toFixed(3));
      }
      const layer = step.map || ZONES;
      if (cut) {
        cam.classList.add('cut');
        apply(cam, t);
        if (layer) placeMap(step, key); else maplayer.remove();
      } else if (layer) {
        // Measure the numbers where the camera will land, then travel there from where it is now
        const from = getComputedStyle(cam).transform;
        cam.classList.add('cut');
        apply(cam, t);
        placeMap(step, key);
        cam.style.transform = from;
        void cam.offsetWidth;
        cam.classList.remove('cut');
        apply(cam, t);
      } else {
        apply(cam, t);
        maplayer.remove();
      }
      placeSpot(step, idx, cut);
      camState[key] = t;
      if (cut) { void cam.offsetWidth; cam.classList.remove('cut'); spot.classList.remove('cut'); }
    }
    function reframe() {
      if (cur >= 0 && shown && STEPS[cur].scene === shown) frame(STEPS[cur], cur, true);
    }

    let flip = false;
    function placeSpot(step, idx, cut) {
      flip = !flip;
      // fa/fb restart a short outline fade under reduced motion: feedback without travel
      spot.className = 'spot ' + (step.r ? catClass(step.k) + (cut ? '' : flip ? ' fa' : ' fb') : 'none') + (cut ? ' cut' : '');
      if (step.r) {
        const [x, y, w, h] = step.r, p = 6;
        Object.assign(spot.style, { left: (x - p) + 'px', top: (y - p) + 'px', width: (w + 2 * p) + 'px', height: (h + 2 * p) + 'px' });
        spot.firstChild.textContent = idx;
      }
    }

    // Cheat sheet (and ?zones): every zone of the scene outlined at once, with its step number
    const POS = ['', 'r', 'l', 't', 'b', 'in'];
    function placeMap(step, key) {
      const live = !!step.map;
      maplayer.innerHTML = '';
      cams[key].append(maplayer); // after the spot, so the outlines sit above the dim
      const pins = [];
      STEPS.forEach((s, k) => {
        if (s.scene !== key || !s.r || (!live && k === cur)) return; // ?zones: the current zone already has the spot
        const [x, y, w, h] = s.r, p = 3;
        const big = w * h > mapMaxArea;
        const el = document.createElement('div');
        el.className = `spot pin ${catClass(s.k)}${big ? ' big' : ''}`;
        Object.assign(el.style, { left: (x - p) + 'px', top: (y - p) + 'px', width: (w + 2 * p) + 'px', height: (h + 2 * p) + 'px' });
        const num = document.createElement(live ? 'button' : 'span');
        num.className = 'spot-num';
        num.textContent = k;
        if (live) {
          num.type = 'button';
          num.setAttribute('aria-label', `${k}. ${s.t}`);
          num.addEventListener('click', () => go(k));
        }
        el.append(num);
        maplayer.append(el);
        pins.push({ num, pref: big ? 'in' : (POS.includes(s.mb) ? s.mb : '') });
      });
      untangle(pins);
    }
    // Numbers never overlap and never sit on the stage's edge: try each side in turn, keep the cheapest
    function untangle(pins) {
      const sr = stage.getBoundingClientRect(), m = 2, gap = 2;
      const placed = [];
      const area = (a, b) => Math.max(0, Math.min(a.right, b.right) + gap - Math.max(a.left, b.left)) *
                             Math.max(0, Math.min(a.bottom, b.bottom) + gap - Math.max(a.top, b.top));
      const outside = (a) => a.left < sr.left + m || a.top < sr.top + m || a.right > sr.right - m || a.bottom > sr.bottom - m;
      const setPos = (el, p) => { el.className = 'spot-num' + (p ? ' at-' + p : ''); };
      for (const { num, pref } of pins) {
        let best = null;
        for (const p of [pref, ...POS.filter((q) => q !== pref)]) {
          setPos(num, p);
          const r = num.getBoundingClientRect();
          const cost = placed.reduce((sum, q) => sum + area(r, q), 0) + (outside(r) ? 1e6 : 0);
          if (!best || cost < best.cost) best = { p, r, cost };
          if (cost === 0) break;
        }
        setPos(num, best.p);
        placed.push(best.r);
      }
    }

    /* ---------- Panel ---------- */
    const rowInner = (s, k) => `<span class="n">${k}</span><span class="tt">${esc(s.t)}</span>${markHtml(s.k)}`;
    function sources(step) {
      const list = (Array.isArray(step.from) ? step.from : step.from == null ? [] : [step.from]).filter((x) => typeof x === 'string');
      const out = [], docs = [];
      // Several docs pages: each link is named by its page, so they are not three identical "documentation" links
      const pageName = (u) => {
        try {
          const x = new URL(u);
          const seg = decodeURIComponent(x.pathname.split('/').filter(Boolean).pop() || '');
          return seg.replace(/\.[a-z0-9]{1,5}$/i, '').replace(/[-_+]+/g, ' ').trim() || x.hostname;
        } catch (e) { return u; }
      };
      for (const f of list) {
        const at = f.indexOf(':');
        const kind = at < 0 ? f : f.slice(0, at), rest = at < 0 ? '' : f.slice(at + 1);
        if (kind === 'screen') continue;
        if (kind === 'docs') {
          if (!docs.length) out.push(null); // keeps the docs' place in the line
          docs.push(rest);
        }
        else if (kind === 'code') out.push(`<code>${esc(rest)}</code>`);
        else if (kind === 'dom' || kind === 'inferred' || kind === 'unchecked') out.push(esc(L[kind]));
        else console.warn(`ROOMTOUR: unknown source "${f}" in step "${step.t}".`);
      }
      const link = (u, label) => (/^https?:\/\//i.test(u)
        ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>` : esc(label));
      const docsHtml = docs.length === 1 ? link(docs[0], L.docs)
        : `${esc(L.docs)}: ${docs.map((u) => link(u, pageName(u))).join(', ')}`;
      return out.map((x) => (x === null ? docsHtml : x));
    }

    function renderPanel(i) {
      const step = STEPS[i], n = STEPS.length - 1;
      const ae = document.activeElement;
      // Focus inside content that is about to be replaced moves to the new title, never to the page
      const lost = ae && ae !== document.body && (bodyEl.contains(ae) || maplayer.contains(ae));

      $('title').textContent = step.t;
      const c = catOf(step.k);
      const risk = $('risk');
      if (c) {
        risk.className = 'risk ' + catClass(step.k);
        risk.innerHTML = `${chipHtml(step.k)}<span class="risk-note">${textWithChips(step.n ?? c.note ?? '')}</span>`;
      }
      risk.hidden = !c;

      let html = '';
      const via = SCENES[step.scene].via;
      if (via && i > 0 && STEPS[i - 1].scene !== step.scene) html += `<p class="via">${resolve(via)}</p>`;
      html += resolve(step.b);
      if (step.map) {
        const rows = STEPS.map((s, k) => ({ s, k })).filter(({ s }) => s.scene === step.scene && s.r);
        if (rows.length) {
          html += `<h3 class="zones-title"${CL}>${esc(L.zones)}</h3><ol class="zones">` +
            rows.map(({ s, k }) => `<li><button class="row" type="button" data-go="${k}">${rowInner(s, k)}</button></li>`).join('') + '</ol>';
        }
        if (STEPS.some((s) => s.r && s.scene !== step.scene)) html += `<p class="zones-more"${CL}>${esc(L.zonesMore)}</p>`;
      }
      bodyEl.innerHTML = html;

      const src = sources(step);
      const fromEl = $('from');
      fromEl.innerHTML = src.length ? `${esc(L.from)} ${src.join(' · ')}` : '';
      fromEl.hidden = !src.length;

      const foot = $('foot');
      if (foot) foot.hidden = !(i === 0 || step.map);

      $('status').innerHTML = i
        ? fill(esc(L.status), { i, n, t: `<span${XL}>${esc(step.t)}</span>` }) + (c ? ` <span${XL}>${esc(c.label)}.</span>` : '')
        : `<span${XL}>${esc(step.t)}.</span> ${esc(total(n))}.`;
      $('pos').textContent = i ? `${i} ${L.of} ${n}` : (n > 0 ? total(n) : '');

      prevBtn.setAttribute('aria-disabled', String(i === 0));
      const last = i === n;
      nextBtn.classList.toggle('primary', !last);
      nextBtn.innerHTML = last ? `${RESTART}<span>${esc(L.restart)}</span>` : `<span>${esc(L.next)}</span>${ARROW_R}`;

      const ci = CHAPS.findIndex((ch) => ch.id === step.ch);
      chapBtns.forEach((b, k) => {
        b.setAttribute('aria-current', String(k === ci));
        const inCh = CHAPS[k].steps;
        const done = k < ci ? 1 : k > ci || ci < 0 ? 0 : (inCh.indexOf(i) + 1) / inCh.length;
        b.querySelector('.fill').style.width = (done * 100).toFixed(1) + '%';
        if (k === ci) {
          const li = b.parentElement;
          if (li.offsetLeft < chapNav.scrollLeft) chapNav.scrollLeft = li.offsetLeft - 8;
          else if (li.offsetLeft + li.offsetWidth > chapNav.scrollLeft + chapNav.clientWidth) chapNav.scrollLeft = li.offsetLeft + li.offsetWidth - chapNav.clientWidth + 8;
        }
      });
      fadeChapters();

      const tocFocus = tocWrap.contains(document.activeElement);
      if (tocCh !== step.ch) buildToc(step.ch);
      let curRow = null;
      $('toc').querySelectorAll('button').forEach((b) => {
        if (+b.dataset.go === i) { b.setAttribute('aria-current', 'step'); curRow = b; } else b.removeAttribute('aria-current');
      });
      keepVisible(tocWrap, curRow);
      if (tocFocus && !tocWrap.contains(document.activeElement)) (curRow || $('title')).focus({ preventScroll: true });
      if (lost) $('title').focus({ preventScroll: true });
    }

    function keepVisible(container, row) {
      if (!row || container.scrollHeight <= container.clientHeight) return;
      const top = row.offsetTop, bottom = top + row.offsetHeight;
      const head = container.querySelector('h3')?.offsetHeight || 0;
      if (top < container.scrollTop + head + 8) container.scrollTop = Math.max(0, top - head - 8);
      else if (bottom > container.scrollTop + container.clientHeight - 8) container.scrollTop = bottom - container.clientHeight + 8;
    }

    function buildToc(ch) {
      tocCh = ch;
      const items = STEPS.map((s, i) => ({ s, i })).filter((o) => o.s.ch === ch);
      $('toc-title').innerHTML = items.length > 1 ? fill(esc(L.toc), { ch: `<span${XL}>${esc(chapName(ch))}</span>` }) : '';
      const ol = $('toc');
      ol.innerHTML = '';
      tocWrap.classList.toggle('none', items.length < 2);
      tocWrap.scrollTop = 0;
      if (items.length < 2) return;
      for (const { s, i } of items) {
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'row';
        b.dataset.go = i;
        b.innerHTML = rowInner(s, i);
        li.append(b); ol.append(li);
      }
    }

    /* ---------- Moving between steps ---------- */
    function showScene(key, animate) {
      const cam = cams[key];
      for (const [k, c] of Object.entries(cams)) if (k !== key) c.classList.remove('on', 'enter');
      cam.append(spot);
      shown = key;
      frame(STEPS[cur], cur, true);
      cam.classList.add('on');
      cam.classList.remove('enter');
      if (animate) { void cam.offsetWidth; cam.classList.add('enter'); }
      updateNotice();
      labelStage();
    }

    function render(i, animate) {
      const step = STEPS[i];
      renderPanel(i);
      prefetch(i);
      if (step.scene !== shown) {
        // A new screen: decode it first, then cut to it and fade it in over the dark stage
        const token = ++swapToken;
        ready(step.scene).then(() => { if (token === swapToken) showScene(step.scene, animate); });
        updateNotice();
        labelStage();
      } else {
        swapToken++;
        frame(step, i, !animate);
        updateNotice();
        labelStage();
      }
    }

    // On phones the stage stays on top: after a step change, bring the new title into view under it
    function reveal() {
      const wrap = stage.parentElement, title = $('title');
      if (getComputedStyle(wrap).position === 'sticky') {
        const top = wrap.getBoundingClientRect().bottom;
        const bottom = Math.min(innerHeight, nav.getBoundingClientRect().top);
        const r = title.getBoundingClientRect();
        if (r.top < top || r.top > bottom - 24) window.scrollTo({ top: scrollY + r.top - top - 8, behavior: reduced() ? 'auto' : 'smooth' });
      } else if (panel.scrollHeight > panel.clientHeight + 1 && title.getBoundingClientRect().top < panel.getBoundingClientRect().top) {
        panel.scrollTop = 0;
      }
    }

    function go(i, animate = true) {
      i = Math.max(0, Math.min(STEPS.length - 1, Math.trunc(i) || 0));
      if (i === cur) return;
      cur = i;
      render(i, animate);
      if (location.hash !== '#' + i) history.replaceState(null, '', '#' + i);
      if (animate) reveal();
    }

    prevBtn.addEventListener('click', () => { if (cur > 0) go(cur - 1); });
    nextBtn.addEventListener('click', () => go(cur === STEPS.length - 1 ? 0 : cur + 1));
    panel.addEventListener('click', (e) => {
      const b = e.target.closest('[data-go]');
      if (b && panel.contains(b)) go(+b.dataset.go);
    });
    if (STEPS.length === 1) nav.hidden = true;

    document.addEventListener('keydown', (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.defaultPrevented) return;
      const ae = document.activeElement;
      if (ae && (/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) || ae.isContentEditable)) return;
      // Page keys belong to the page whenever it scrolls; arrows always move between steps
      const still = document.documentElement.scrollHeight <= innerHeight + 1;
      let to = null;
      if (e.key === 'ArrowRight') to = cur + 1;
      else if (e.key === 'ArrowLeft') to = cur - 1;
      else if (still && e.key === 'PageDown') to = cur + 1;
      else if (still && e.key === 'PageUp') to = cur - 1;
      else if (still && e.key === 'Home') to = 0;
      else if (still && e.key === 'End') to = STEPS.length - 1;
      if (to === null) return;
      e.preventDefault();
      go(to);
    });
    window.addEventListener('hashchange', () => { const n = parseInt(location.hash.slice(1), 10); if (!Number.isNaN(n)) go(n, false); });

    // Swipe on the stage (touch): left = next, right = back. Vertical moves stay page scrolls.
    let swipe = null;
    stage.addEventListener('pointerdown', (e) => { swipe = e.pointerType === 'touch' ? { x: e.clientX, y: e.clientY, id: e.pointerId } : null; });
    stage.addEventListener('pointerup', (e) => {
      if (!swipe || e.pointerId !== swipe.id) return;
      const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
      swipe = null;
      if (Math.abs(dx) > 48 && Math.abs(dy) < 40) go(cur + (dx < 0 ? 1 : -1));
    });
    stage.addEventListener('pointercancel', () => { swipe = null; });

    // Sticky stage and nav must not hide what gets focus
    function pads() {
      const root = document.documentElement.style;
      const sticky = getComputedStyle(stage.parentElement).position === 'sticky';
      root.scrollPaddingTop = sticky ? stage.parentElement.offsetHeight + 'px' : '';
      root.scrollPaddingBottom = sticky && !nav.hidden ? nav.offsetHeight + 'px' : '';
      panel.style.scrollPaddingBottom = nav.hidden ? '' : nav.offsetHeight + 'px';
    }

    // Resizing only re-frames the picture; the panel text stays as it is
    let lastSize = '', raf = 0;
    new ResizeObserver(() => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const size = stage.clientWidth + 'x' + stage.clientHeight;
        if (size === lastSize) return;
        lastSize = size;
        reframe();
        fadeChapters(); updateWheel(); pads();
      });
    }).observe(stage);
    const printing = () => { lastSize = ''; reframe(); };
    window.addEventListener('beforeprint', printing);
    window.addEventListener('afterprint', printing);
    matchMedia('print').addEventListener?.('change', printing);

    const startAt = parseInt(location.hash.slice(1), 10);
    go(Number.isNaN(startAt) ? 0 : startAt, false);
    fadeChapters(); updateWheel(); pads();
  }

  window.Roomtour = { define, version: VERSION, icons: Object.keys(ICON), languages: Object.keys(I18N) };
})();
