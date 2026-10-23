# tour.data.js format

`tour.data.js` calls `Roomtour.define` with a function. The function receives five helpers and returns the tour. Fields marked optional can be left out.

```js
Roomtour.define(({ ui, chip, note, warn, code }) => ({
  lang: 'en',                       // the tour page's own language: en | uk | ru (others fall back to English)
  uiLang: 'en',                     // optional: the language of control names on the screenshots
  public: false,                    // true only for public pages captured signed out (shots may then live in git)
  title: 'Invoices',                // the page title in the masthead
  subtitle: 'a tour by zones',      // optional, after a dot
  foot: 'Captured on 23 October 2026 from app.example.com, signed in as a viewer, 1280 px wide. Client names are blurred.',
  mapMaxArea: 60000,                // optional: on the cheat sheet, zones bigger than this (w × h) become number-only pins

  // Safest first, strongest last.
  categories: {
    look:  { label: 'Only shows',   note: 'changes nothing',        tone: 'green', icon: 'eye',   line: 'solid' },
    edit:  { label: 'Changes data', note: 'the whole team sees it', tone: 'amber', icon: 'users', line: 'dashed' },
    final: { label: "Can't undo",   note: 'deletes or sends',       tone: 'red',   icon: 'alert', line: 'double', solid: true }
  },

  scenes: {
    list:   { src: 'shots/list.png',   w: 1280, h: 800,  alt: 'The list of invoices',
              redact: [[920, 210, 180, 24]] },                        // blur boxes over personal data, [x, y, w, h]
    detail: { src: 'shots/detail.png', w: 1280, h: 1640, alt: 'One invoice, open',
              via: `From the list we opened invoice ${code('INV-2041')}.` }
  },

  chapters: [
    { id: 'intro',  name: 'Start' },
    { id: 'list',   name: 'The list' },
    { id: 'detail', name: 'One invoice' },
    { id: 'end',    name: 'Cheat sheet' }
  ],

  steps: [
    { ch: 'intro', scene: 'list', r: null, t: 'What this page is', b: `<p>…</p>` },
    { ch: 'list', scene: 'list', r: [24, 120, 300, 40], k: 'look', t: 'Search',
      b: `<p>${ui('Search')} finds an invoice by its number.</p>` },
    { ch: 'detail', scene: 'detail', r: [1080, 120, 120, 36], k: 'final', mb: 'l', n: 'sends an e-mail to the client', t: 'Send',
      from: ['dom', 'code:app/invoices/views.py:42'],
      b: `<p>…</p>${note('Finding.', 'The button does not ask to confirm.')}` },
    { ch: 'end', scene: 'list', r: null, map: true, t: 'Cheat sheet', b: `<h3>${chip('look')}</h3><p>…</p>` }
  ]
}));
```

## Fields

**Top level**

- `lang` — the language of the tour page's own buttons and labels: `en`, `uk` or `ru`.
- `uiLang` — optional: the language of control names on the screenshots, such as `'en'`. Every `ui()` name then carries it as `lang`, so screen readers pronounce it right.
- `public` — `true` only for public pages captured signed out.
- `title`, `subtitle` (optional), `foot` — the masthead and the provenance line. The foot says what was captured, when, from where, signed in or out, at what width, and what is blurred.
- `mapMaxArea` — optional, default 60000: on the cheat sheet, zones bigger than this area become number-only pins.

**Category**

- `label` — three words or fewer.
- `note` — one line, shown beside the chip.
- `tone` — `green`, `amber`, `red`, `blue`, `violet` or `grey`.
- `icon` — `eye`, `users`, `alert`, `info`, `chart`, `flag`, `lock`, `star`, `check`, `mail`, `pointer` or `dot`.
- `line` — `solid`, `dashed`, `dotted` or `double`: the zone's outline on the stage. Chips and the step list show it too.
- `solid` — `true` gives a filled chip, for the strongest category.

Declare categories safest first, at most four. Give each category its own tone, icon and line. The checker fails two categories that share a line, or that match in all three. It warns when two share an icon.

**Scene** — one screenshot

- `src` — relative to the tour folder.
- `w`, `h` — the PNG's real size; the checker compares.
- `alt` — what the screenshot shows.
- `redact` — optional blur boxes `[x, y, w, h]` over personal data. They blur the page, not the PNG file.
- `via` — optional HTML: how the reader got here ("From the list we opened one invoice"). The engine shows it above the body on this scene's first step, when the previous step was on another scene.
- `keep` — optional `true`: an open menu or dialog is the subject of this capture. The checker then allows overlays in its manifest.

Beside each `shots/<scene>.png` lies its capture manifest, `shots/<scene>.json` (`capture.md`).

**Step** — one zone on a scene

- `ch` — chapter id. Keep each chapter's steps together.
- `scene` — scene id.
- `r` — the zone `[x, y, w, h]` in screenshot pixels, copied from the manifest. `null` for a step without a zone (intro, cheat sheet).
- `k` — category id; needed when `r` is set.
- `t` — the title: names the thing, short.
- `b` — the explanation as HTML: `<p>`, `<ul class="plain"><li>`, `<ul class="key">` for legends (`<li>${chip('id')}<span>…</span></li>`), `<h3>` on the cheat sheet, and the helpers below.
- `n` — optional: replaces the category's note for this step. `''` shows no note.
- `from` — optional: where this step's claims come from. A string or an array of:
  - `screen` — on the screenshot (the default when `from` is left out);
  - `dom` — tooltips, element attributes, a menu opened and closed;
  - `docs:<url>` — the product's own docs; the URL may end in a `#:~:text=` fragment with the exact sentence;
  - `code:<path>:<line>` — a line in the product's code;
  - `inferred` — the text says "probably";
  - `unchecked` — the text says it could not be checked.
- `map: true` — the cheat sheet (below).
- `mb` — where this zone's number sits on the cheat sheet: `l` (left), `r` (right) or `t` (top). The default is the top-left corner. Use it when the number covers a label.

**Helpers**

- `ui('Save')` — a control's name, exactly as on screen. Pass plain text.
- `code('main')` — a code-like value: a branch, an id, a path. Pass plain text.
- `chip('look')` — the category's chip.
- `note('Label.', html)` — an aside: context that is not on the screen.
- `warn('Label.', html)` — a caution, styled apart from notes.

## The cheat sheet (`map: true`)

On a step with `map: true` and `r: null`, the engine:

- outlines every zone of the step's scene, each with its step number;
- turns zones bigger than `mapMaxArea` into number-only pins, so big panels do not hide small controls;
- makes each number a button that opens its step;
- lists the zones under the body as buttons, titled "Zones on this screen": number, title and category mark.

So the body names the categories and their controls, and need not explain the numbers. A tour with several scenes maps one of them: say which in the title or the first line.

## The author's check view

Add `?zones` to the tour's address. Every step then outlines all zones of its scene. Stage 7 uses it to compare zones with the screen.

## Engine version

`Roomtour.version` holds the engine's version, such as `'0.2.0'`. `new-tour.mjs` refreshes the engine in `_roomtour/` on every run.

## Interface languages

The engine has its buttons and labels in `en`, `uk` and `ru`. For another language, write the content in it and set `lang: 'en'`. Ask the user whether English buttons are acceptable.
