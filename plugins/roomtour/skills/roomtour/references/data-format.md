# tour.data.js format

`tour.data.js` calls `Roomtour.define` with a function that receives four helpers and returns the tour:

```js
Roomtour.define(({ ui, chip, note, code }) => ({
  lang: 'uk',                       // interface language of the tour: uk | en | ru (others fall back to English)
  public: false,                    // true only for public pages captured signed out (the checker then allows shots in git)
  title: 'Сторінка оплати',         // the page title in the masthead
  subtitle: 'тур зонами',           // optional, after a dot
  foot: 'Знято 22.10.2026 з …',     // provenance: what, when, from where, at what width; what is blurred
  mapMaxArea: 60000,                // optional: zones bigger than this (w × h) are left off the cheat-sheet map

  categories: {
    look:  { label: 'Можна дивитися', note: 'нічого не змінює',      tone: 'green', icon: 'eye',   line: 'solid' },
    edit:  { label: 'Змінює дані',    note: 'бачить уся команда',     tone: 'amber', icon: 'users', line: 'dashed' },
    final: { label: 'Не скасувати',   note: 'видаляє або надсилає',   tone: 'red',   icon: 'alert', line: 'dashed', solid: true }
  },

  scenes: {
    list:   { src: 'shots/list.png',   w: 1280, h: 800,  alt: 'Список рахунків',
              redact: [[920, 210, 180, 24]] },   // blur boxes over personal data, [x, y, w, h]
    detail: { src: 'shots/detail.png', w: 1280, h: 1640, alt: 'Картка рахунку' }
  },

  chapters: [
    { id: 'intro', name: 'Початок' },
    { id: 'list',  name: 'Список' },
    { id: 'end',   name: 'Шпаргалка' }
  ],

  steps: [
    { ch: 'intro', scene: 'list', r: null, t: 'Що це за сторінка', b: `<p>…</p>` },
    { ch: 'list', scene: 'list', r: [24, 120, 300, 40], k: 'look', t: 'Пошук',
      b: `<p>${ui('Search')} шукає рахунок за номером.</p>` },
    { ch: 'list', scene: 'list', r: [1080, 120, 120, 36], k: 'final', mb: 'l', n: 'надсилає лист клієнту', t: 'Send',
      b: `<p>…</p>${note('Знахідка.', 'Кнопка не питає підтвердження.')}` },
    { ch: 'end', scene: 'list', r: null, map: true, t: 'Шпаргалка', b: `<h3>${chip('look')}</h3><p>…</p>` }
  ]
}));
```

## Fields

**Category:** `label` (≤ 3 words), `note` (one line, shown beside the chip), `tone` (`green`, `amber`, `red`, `blue`, `violet`, `grey`), `icon` (`eye`, `users`, `alert`, `info`, `chart`, `flag`, `lock`, `star`, `check`, `mail`, `pointer`, `dot`), `line` (`solid`, `dashed`, `dotted`, `double` — the outline on the stage), `solid` (true = a filled chip, for the strongest category). Two categories must differ in tone, icon and line.

**Scene:** `src` (relative to the tour folder), `w` and `h` (the PNG's real size; the checker compares), `alt`, `redact` (optional blur boxes).

**Step:**
- `ch` — chapter id; keep each chapter's steps together.
- `scene` — scene id.
- `r` — the zone `[x, y, w, h]` in screenshot pixels, or `null` for a step without a zone (intro, cheat sheet).
- `k` — category id (needed when `r` is set).
- `t` — title: names the thing, short.
- `b` — the explanation as HTML: `<p>`, `<ul class="plain"><li>`, `<ul class="key">` (legend lists: `<li>${chip('id')}<span>…</span></li>`), `<h3>` (cheat sheet), `<p class="aside">` via `note()`.
- `n` — optional: replaces the category's note for this step.
- `map: true` — the cheat sheet: outlines every zone of this scene (up to `mapMaxArea`).
- `mb` — where this zone's number sits on the cheat sheet: `l` (left), `r` (right), `t` (top); default top-left corner.

**Helpers:** `ui('Save')` — a control's name; `code('main')` — a code-like value (branch, id, path); `chip('look')` — the category's chip; `note('Label.', 'html')` — a grey aside with a bold label.

## Interface languages

The engine has its buttons and labels in `uk`, `en` and `ru`. For another language, write the content in it and set `lang: 'en'`; ask the user whether English buttons are acceptable.
