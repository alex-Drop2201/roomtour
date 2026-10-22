/* ROOMTOUR engine.
   A tour is three files:  <tours>/_roomtour/{roomtour.css, roomtour.js}  (this engine, shared)
                           <tours>/<topic>/index.html                       (a tiny shell)
                           <topic>/tour.data.js + <topic>/shots/*.png        (the tour itself)
   tour.data.js calls:
     Roomtour.define(({ ui, chip, note, code }) => ({
       lang: 'en' | 'uk' | 'ru',
       title, subtitle, foot,
       categories: { id: { label, note, tone, icon, line, solid } },
       scenes:   { id: { src, w, h, alt, redact: [[x, y, w, h], ...] } },
       chapters: [ { id, name } ],
       steps:    [ { ch, scene, r: [x, y, w, h] | null, k: categoryId, n?, t, b, map?, mb? } ],
       mapMaxArea?
     }));
   r is in screenshot pixels. tone: green | amber | red | blue | violet | grey. line: solid | dashed | dotted | double.
   icon: eye | users | alert | info | chart | flag | lock | star | check | mail | pointer | dot. */
(() => {
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

  const I18N = {
    en: { back: 'Back', next: 'Next', restart: 'Start over', of: 'of', or: 'or', steps: 'Steps', chapters: 'Tour chapters',
          panel: 'Step explanation', legend: 'What the colours mean', toc: 'All steps in {ch}', lit: 'Highlighted: ',
          emptyTitle: 'The screenshots did not load',
          emptyText: 'They live in the <code>shots/</code> folder next to this page. Open the tour through the local server (see the README), or ask Claude to capture them again.' },
    uk: { back: 'Назад', next: 'Далі', restart: 'На початок', of: 'з', or: 'або', steps: 'Кроки', chapters: 'Розділи туру',
          panel: 'Пояснення кроку', legend: 'Що означають кольори', toc: 'Усі кроки розділу «{ch}»', lit: 'Підсвічено: ',
          emptyTitle: 'Скриншоти не завантажилися',
          emptyText: 'Вони лежать у теці <code>shots/</code> поруч із цією сторінкою. Відкрий тур через локальний сервер (див. README) або попроси Claude зняти їх знову.' },
    ru: { back: 'Назад', next: 'Дальше', restart: 'В начало', of: 'из', or: 'или', steps: 'Шаги', chapters: 'Главы тура',
          panel: 'Объяснение шага', legend: 'Что значат цвета', toc: 'Все шаги главы «{ch}»', lit: 'Подсвечено: ',
          emptyTitle: 'Скриншоты не загрузились',
          emptyText: 'Они лежат в папке <code>shots/</code> рядом с этой страницей. Открой тур через локальный сервер (см. README) или попроси Claude переснять их.' }
  };

  const helpers = {
    ui: (s) => `<span class="ui">${s}</span>`,
    code: (s) => `<span class="branch">${s}</span>`,
    // Resolved at render time, once the categories are known
    chip: (id) => `<span class="chip-ref" data-cat="${id}"></span>`,
    note: (label, html) => `<p class="aside"><b>${label}</b> ${html}</p>`
  };

  let factory = null;
  function define(fn) {
    factory = fn;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
    else run();
  }

  function run() {
    const cfg = factory(helpers);
    const L = I18N[cfg.lang] || I18N.en;
    const CATS = cfg.categories || {};
    const { scenes: SCENES, chapters: CHAPTERS, steps: STEPS } = cfg;
    const mapMaxArea = cfg.mapMaxArea || 60000;
    document.documentElement.lang = cfg.lang || 'en';

    const catClass = (id) => {
      const c = CATS[id] || {};
      return `tone-${c.tone || 'grey'} line-${c.line || 'solid'}${c.solid ? ' solid' : ''}`;
    };
    const chipHtml = (id) => {
      const c = CATS[id] || { label: id };
      return `<span class="chip ${catClass(id)}">${ICON[c.icon] || ICON.dot}${c.label}</span>`;
    };
    const resolve = (html) => html.replace(/<span class="chip-ref" data-cat="([^"]+)"><\/span>/g, (m, id) => chipHtml(id));

    document.body.innerHTML = `
<div class="app">
  <header class="mast">
    <h1>${cfg.icon || ''}${cfg.title}${cfg.subtitle ? ` <span>· ${cfg.subtitle}</span>` : ''}</h1>
    <ul class="legend" aria-label="${L.legend}">${Object.keys(CATS).map((id) => `<li>${chipHtml(id)}</li>`).join('')}</ul>
  </header>
  <div class="stage-wrap">
    <nav aria-label="${L.chapters}"><ul class="chapters" id="chapters"></ul></nav>
    <div class="stage" id="stage" role="img" aria-label="${cfg.title}">
      <div class="stage-empty"><strong>${(cfg.empty && cfg.empty.title) || L.emptyTitle}</strong><span>${(cfg.empty && cfg.empty.text) || L.emptyText}</span></div>
    </div>
  </div>
  <aside class="panel" aria-label="${L.panel}">
    <section class="step" aria-live="polite">
      <h2 id="title"></h2>
      <p class="risk" id="risk"></p>
      <div class="body" id="body"></div>
    </section>
    <div class="toc"><h3 id="toc-title"></h3><ol id="toc"></ol></div>
    ${cfg.foot ? `<p class="foot">${cfg.foot}</p>` : ''}
    <nav class="nav" aria-label="${L.steps}">
      <button class="btn" id="prev" type="button">${ARROW_L}${L.back}</button>
      <div class="pos"><span id="pos"></span><span class="hint">${L.or} <kbd>←</kbd> <kbd>→</kbd></span></div>
      <button class="btn primary" id="next" type="button"><span id="next-label">${L.next}</span>${ARROW_R}</button>
    </nav>
  </aside>
</div>`;

    const $ = (id) => document.getElementById(id);
    const stage = $('stage');
    const cams = {};
    let missing = 0;
    for (const [key, s] of Object.entries(SCENES)) {
      const cam = document.createElement('div');
      cam.className = 'cam';
      cam.dataset.scene = key;
      const img = new Image(s.w, s.h);
      img.src = s.src; img.alt = s.alt || ''; img.decoding = 'async'; img.draggable = false;
      img.addEventListener('error', () => { missing++; if (missing === Object.keys(SCENES).length) stage.classList.add('missing'); });
      cam.append(img);
      for (const [x, y, w, h] of s.redact || []) {
        const r = document.createElement('div');
        r.className = 'redact';
        Object.assign(r.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
        cam.append(r);
      }
      stage.append(cam);
      cams[key] = cam;
    }
    const spot = document.createElement('div');
    spot.className = 'spot none';
    spot.innerHTML = '<span class="spot-num"></span>';

    const chapNav = $('chapters');
    CHAPTERS.forEach((c) => {
      const first = STEPS.findIndex((s) => s.ch === c.id);
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.ch = c.id;
      b.innerHTML = `<span>${c.name}<span class="count"></span></span><span class="bar" aria-hidden="true"><span class="fill"></span></span>`;
      b.addEventListener('click', () => go(first));
      li.append(b); chapNav.append(li);
    });

    let cur = -1, curScene = null, tocCh = null;

    // Fades on the strip's edges tell a phone reader there are more chapters to scroll to
    function fadeChapters() {
      chapNav.classList.toggle('more', chapNav.scrollLeft + chapNav.clientWidth < chapNav.scrollWidth - 4);
      chapNav.classList.toggle('less', chapNav.scrollLeft > 4);
    }
    chapNav.addEventListener('scroll', fadeChapters, { passive: true });

    function camera(step) {
      const s = SCENES[step.scene];
      const W = stage.clientWidth, H = stage.clientHeight;
      let scale, tx, ty;
      if (step.r) {
        const [x, y, w, h] = step.r;
        const boxW = Math.max(w + 64, 400), boxH = Math.max(h + 64, 280);
        scale = Math.min(W / boxW, H / boxH, 1.25);
        scale = Math.max(scale, Math.min(W / s.w, 1) * 0.5);
        // Phones: never shrink the screenshot's text below legibility; pin the zone's start and let the rest crop
        const phone = W < 600;
        if (phone) scale = Math.max(scale, 0.8);
        tx = W / 2 - (x + w / 2) * scale;
        ty = H / 2 - (y + h / 2) * scale;
        if (phone) {
          if (w * scale > W - 40) tx = 20 - x * scale;
          if (h * scale > H - 40) ty = 20 - y * scale;
        }
      } else if (step.map) {
        // A small margin so outlines on the image's edge are not cut by the stage
        scale = Math.min((W - 32) / s.w, (H - 32) / s.h, 1.15);
        tx = 0; ty = 0;
      } else {
        scale = Math.min(W / s.w, 1.15);
        tx = 0; ty = 0;
      }
      const iw = s.w * scale, ih = s.h * scale;
      tx = iw <= W ? (W - iw) / 2 : Math.min(0, Math.max(W - iw, tx));
      ty = ih <= H ? (H - ih) / 2 : Math.min(0, Math.max(H - ih, ty));
      const cam = cams[step.scene];
      cam.style.setProperty('--inv', (1 / scale).toFixed(4));
      cam.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${scale.toFixed(4)})`;
    }

    function placeSpot(step, idx) {
      spot.className = 'spot ' + (step.r ? catClass(step.k) : 'none');
      if (step.r) {
        const [x, y, w, h] = step.r, p = 6;
        Object.assign(spot.style, { left: (x - p) + 'px', top: (y - p) + 'px', width: (w + 2 * p) + 'px', height: (h + 2 * p) + 'px' });
        spot.firstChild.textContent = idx;
      }
    }

    // Cheat sheet: outline every zone of the scene at once, with its step number
    const maplayer = document.createElement('div');
    maplayer.className = 'maplayer';
    function placeMap(step) {
      maplayer.innerHTML = '';
      if (!step.map) { maplayer.remove(); return; }
      STEPS.forEach((s, k) => {
        if (s.scene !== step.scene || !s.r || !s.k || s.r[2] * s.r[3] > mapMaxArea) return;
        const [x, y, w, h] = s.r, p = 3;
        const el = document.createElement('div');
        el.className = `spot pin ${catClass(s.k)}`;
        Object.assign(el.style, { left: (x - p) + 'px', top: (y - p) + 'px', width: (w + 2 * p) + 'px', height: (h + 2 * p) + 'px' });
        el.innerHTML = `<span class="spot-num${s.mb ? ' at-' + s.mb : ''}">${k}</span>`;
        maplayer.append(el);
      });
      cams[step.scene].append(maplayer);
    }

    function keepVisible(container, row) {
      if (!row || container.scrollHeight <= container.clientHeight) return;
      const top = row.offsetTop, bottom = top + row.offsetHeight;
      const head = container.querySelector('h3')?.offsetHeight || 0;
      if (top < container.scrollTop + head + 8) container.scrollTop = Math.max(0, top - head - 8);
      else if (bottom > container.scrollTop + container.clientHeight - 8) container.scrollTop = bottom - container.clientHeight + 8;
    }

    function render(i, animate = true) {
      const step = STEPS[i];
      const cam = cams[step.scene];
      if (step.scene !== curScene) {
        Object.values(cams).forEach((c) => c.classList.remove('on'));
        cam.classList.add('cut'); spot.classList.add('cut');
        cam.append(spot);
        camera(step); placeSpot(step, i); placeMap(step);
        void cam.offsetWidth;
        cam.classList.remove('cut'); spot.classList.remove('cut');
        cam.classList.add('on');
        curScene = step.scene;
      } else {
        if (!animate) { cam.classList.add('cut'); spot.classList.add('cut'); }
        camera(step); placeSpot(step, i); placeMap(step);
        if (!animate) { void cam.offsetWidth; cam.classList.remove('cut'); spot.classList.remove('cut'); }
      }
      stage.setAttribute('aria-label', (SCENES[step.scene].alt || cfg.title) + (step.r ? '. ' + L.lit + step.t : ''));

      $('title').textContent = step.t;
      const c = CATS[step.k];
      $('risk').innerHTML = c ? `${chipHtml(step.k)}<span class="risk-note">${step.n || c.note || ''}</span>` : '';
      $('risk').hidden = !c;
      $('body').innerHTML = resolve(step.b || '');
      $('pos').textContent = i ? `${i} ${L.of} ${STEPS.length - 1}` : '';
      $('prev').disabled = i === 0;
      $('next-label').textContent = i === STEPS.length - 1 ? L.restart : L.next;

      const curCh = CHAPTERS.findIndex((ch) => ch.id === step.ch);
      chapNav.querySelectorAll('button').forEach((b, ci) => {
        b.setAttribute('aria-current', String(ci === curCh));
        const inCh = STEPS.map((s, k) => k).filter((k) => STEPS[k].ch === b.dataset.ch);
        const done = ci < curCh ? 1 : ci > curCh ? 0 : (inCh.indexOf(i) + 1) / inCh.length;
        b.querySelector('.fill').style.width = (done * 100).toFixed(1) + '%';
        // Only the current chapter shows a number, and it reads as progress ("3 / 8"), not as the screenshot's own counts
        b.querySelector('.count').textContent = ci === curCh && inCh.length > 1 ? `${inCh.indexOf(i) + 1} / ${inCh.length}` : '';
        if (ci === curCh) {
          const li = b.parentElement;
          if (li.offsetLeft < chapNav.scrollLeft) chapNav.scrollLeft = li.offsetLeft - 8;
          else if (li.offsetLeft + li.offsetWidth > chapNav.scrollLeft + chapNav.clientWidth) chapNav.scrollLeft = li.offsetLeft + li.offsetWidth - chapNav.clientWidth + 8;
        }
      });
      fadeChapters();
      if (tocCh !== step.ch) buildToc(step.ch);
      let curRow = null;
      $('toc').querySelectorAll('button').forEach((b) => {
        if (+b.dataset.i === i) { b.setAttribute('aria-current', 'step'); curRow = b; } else b.removeAttribute('aria-current');
      });
      keepVisible(document.querySelector('.toc'), curRow);
    }

    function buildToc(ch) {
      tocCh = ch;
      const chap = CHAPTERS.find((c) => c.id === ch);
      const items = STEPS.map((s, i) => ({ s, i })).filter((o) => o.s.ch === ch);
      $('toc-title').textContent = items.length > 1 ? L.toc.replace('{ch}', chap.name) : '';
      const ol = $('toc'); ol.innerHTML = '';
      document.querySelector('.toc').classList.toggle('none', items.length < 2);
      document.querySelector('.toc').scrollTop = 0;
      if (items.length < 2) return;
      for (const { s, i } of items) {
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button'; b.dataset.i = i;
        const c = CATS[s.k];
        b.innerHTML = `<span class="n">${i}</span><span>${s.t}</span>` + (c ? `<span class="mark ${catClass(s.k)}" title="${c.label}">${ICON[c.icon] || ICON.dot}<span class="vh">${c.label}</span></span>` : '<span></span>');
        b.addEventListener('click', () => go(i));
        li.append(b); ol.append(li);
      }
    }

    function go(i, animate = true) {
      i = Math.max(0, Math.min(STEPS.length - 1, i));
      if (i === cur) return;
      cur = i;
      render(i, animate);
      if (location.hash !== '#' + i) history.replaceState(null, '', '#' + i);
    }

    $('prev').addEventListener('click', () => go(cur - 1));
    $('next').addEventListener('click', () => go(cur === STEPS.length - 1 ? 0 : cur + 1));
    document.addEventListener('keydown', (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(cur + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(cur - 1); }
      else if (e.key === 'Home') { e.preventDefault(); go(0); }
      else if (e.key === 'End') { e.preventDefault(); go(STEPS.length - 1); }
    });
    window.addEventListener('hashchange', () => { const n = parseInt(location.hash.slice(1), 10); if (!Number.isNaN(n)) go(n); });
    new ResizeObserver(() => { if (cur >= 0) render(cur, false); }).observe(stage);

    const startAt = parseInt(location.hash.slice(1), 10);
    go(Number.isNaN(startAt) ? 0 : startAt, false);
  }

  window.Roomtour = { define, icons: Object.keys(ICON), languages: Object.keys(I18N) };
})();
