# Capture: browser, sign-in, screenshots and zones

The rule for every capture is **1:1 pixels**. One screenshot pixel equals one CSS pixel at the viewport you chose. Then the zones you measure match the image exactly.

## Choose the browser for this tour

Choose per tour, once you know the address:

- **No sign-in needed** (a public page, a local app): Playwright if it is here, otherwise the built-in browser.
- **Behind a sign-in:** the built-in browser in the desktop app. Otherwise the user's Chrome (Claude in Chrome). Otherwise screenshots the user sends.
- Headless Playwright has no window, so nobody can sign in there. A headed Playwright can take a sign-in.

Not sure whether the address needs a sign-in? Open it without one and run this probe:

```js
() => ({ url: location.href, signIn: !!document.querySelector('input[type="password"]') || /log-?in|sign-?in|auth|sso/i.test(location.host + location.pathname) })
```

`signIn: true` means a sign-in page. So does a `url` on another host than the one you opened. Then switch to a browser that can take a sign-in.

Say the choice and its reason in one line, for example: "I'm using the built-in browser, because this site needs your sign-in."

## Sign-in

You never type passwords, codes or card numbers. Ask the user to sign in, in words that match the browser:

- **Built-in browser:** "I opened <site> in the browser pane. Sign in there, then write "done"." First check that the pane is shown (`tabs_context` says so). If it is hidden, ask the user to open it.
- **The user's Chrome:** "I opened <site> in a new tab in your Chrome. Sign in there, then write "done"."
- **Headed Playwright:** "I opened <site> in a separate browser window. It is not your usual browser, so sign in there once. Then write "done"."

Make the sign-in request your last message, and wait. After "done", run the sign-in probe again: the sign-in form must be gone. If it is still there, say what you see and ask again.

## Playwright

- `browser_resize` to the capture size, `browser_navigate`, then the Stage 3 batch. Take the screenshot with `browser_take_screenshot`, `scale: "css"` and `filename: "<tour>/shots/<scene>.png"`. Paths are relative to the session's working directory; check where the file landed.
- Width: 1280 for most desktop products and sites. 800 for dense pages, when larger text helps. The product's own target width, if it has one.
- Height: as tall as you need. For a long page, make the viewport as tall as the page (`docH` in the manifest), or use `fullPage: true`.
- A Playwright browser starts signed out.

## Claude's built-in browser (desktop app)

- The user signs in right in its pane.
- Its screenshot is scaled to fit about 800 px wide. The `zoom` region is in that scaled frame too, so zooming into a wider viewport is not 1:1 either. Set the viewport to 800 px wide (`resize_window`). Then use `computer` → `zoom` with the full region at `scale: 1` for a 1:1 PNG. The result names the saved file; copy it into `shots/`.
- Tall viewports stay 1:1: a viewport of 800 × 1720 captured fine. Make it as tall as the page or the scrolling panel.
- At 800 px many apps switch to a narrow layout, such as a collapsed sidebar or a menu button. Take one scaled look at 1280 to compare. If the layouts differ, say so in the plan and in the hand-over.
- When the pane is hidden, CSS transitions do not run between screenshots. Take a throwaway screenshot, wait one second, then take the real one.
- Its `javascript_tool` returns the last expression. Run an async snippet as `await (<snippet>)()`.
- It cannot open a local file together with its screenshots. View tours through `serve.mjs`.

## Claude in Chrome (the user's Chrome)

Use it for pages the user is signed in to. If it cannot save screenshots to files, ask the user to save them at the size you name.

## Screenshots sent by the user

Put them into `shots/` and read their sizes with `check.mjs --sizes`. Place zones by eye from the image, and say so in the hand-over. These scenes have no manifest.

## Hide what is not the interface

Keep the tour's hide selectors in `shots/hide.css`, as one selector list. List promos, cookie banners, welcome tips, chat bubbles and their backdrops. When tiling, add sticky headers. Run this after every navigation, because a new page drops it, with `sel` set to that list:

```js
(sel) => { let s = document.getElementById('roomtour-hide'); if (!s) { s = document.createElement('style'); s.id = 'roomtour-hide'; document.head.append(s); } s.textContent = sel + ' { display: none !important; }'; }
```

A tool that takes no arguments gets the list written in: `() => { const sel = '.promo, .cookie-banner'; … }`.

- A hidden dialog can leave the page locked against scrolling. Then restore it: `() => { document.documentElement.style.overflow = document.body.style.overflow = 'visible'; }`.
- Answer a cookie banner only when hiding it fails. Choose the most privacy-preserving option, and tell the user.
- Welcome windows and tips that come back on every page: hide them every time. A `warn()` in the tour says they keep coming back.

## Hover states and open menus

- A hover state is the subject (a button that appears on hover, a tooltip): hover, then capture. Skip the pointer-to-corner move for that scene.
- An open menu or dialog is the subject: open it, capture it, give the scene `keep: true`, then press Escape. Never pick an item.

## Inner scrollers

When content scrolls inside a panel, a full-page screenshot does not see it. Find the panel, then make the viewport as tall as its top plus its `scrollHeight`:

```js
() => [...document.querySelectorAll('*')].filter(e => {
  const cs = getComputedStyle(e);
  return (cs.overflowY === 'auto' || cs.overflowY === 'scroll') && e.scrollHeight > e.clientHeight + 20;
}).map(e => { const r = e.getBoundingClientRect(); return { top: Math.round(r.top), scrollHeight: e.scrollHeight }; })
```

After the resize, run it again. It must return `[]`; otherwise grow the viewport again. Elements sized to the viewport height stretch with it, such as a full-height sidebar or a centred empty state. Look at the screenshot for odd empty space.

## Tall pages in tiles

When a tall viewport does not fit, capture tiles of one viewport height each. Hide sticky headers first, or they repeat in every tile. Set `TILE = true` in the zone snippet for each tile. Keep each tile as its own scene, with its own manifest. To stitch tiles into one scene instead, use ffmpeg (`[0][1][2]vstack=inputs=3`), and add each tile's `sy` to its zones' `y`.

## Measure the zones: the snippet and the manifest

Run the snippet at the capture size, right before and right after the screenshot. Use `browser_evaluate` in Playwright, `javascript_tool` in the built-in browser. Edit only block 3: one entry per zone, named like its step. `T(selector, /text/)` finds visible elements by their text or `aria-label`. List several of them for a zone that spans them.

```js
async () => {
  const TILE = false;                    // true when this capture is one tile of a scrolled page
  // 1. Settle: wait for finite CSS transitions and animations, refuse a scrolled page
  await Promise.all(document.getAnimations()
    .filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {})));
  if (!TILE && (scrollX || scrollY)) return { error: 'scroll to 0,0 first, or set TILE = true for a tile' };
  const shown = (e) => { const b = e.getBoundingClientRect();
    return b.width > 0 && b.height > 0 && (e.checkVisibility ? e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) : true); };
  // 2. The visible part of an element; flags: c = clipped by a scrolling or hidden-overflow parent, o = something covers it
  const R = (e) => { if (!e) return null; const b = e.getBoundingClientRect();
    let x0 = b.left, y0 = b.top, x1 = b.right, y1 = b.bottom;
    for (let p = e.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (s.overflowX === 'visible' && s.overflowY === 'visible') continue;
      const q = p.getBoundingClientRect();
      x0 = Math.max(x0, q.left); y0 = Math.max(y0, q.top); x1 = Math.min(x1, q.right); y1 = Math.min(y1, q.bottom);
    }
    const hit = document.elementFromPoint((x0 + x1) / 2, (y0 + y1) / 2);
    const f = (x1 - x0 < b.width - 1 || y1 - y0 < b.height - 1 ? 'c' : '') + (hit && !e.contains(hit) && !hit.contains(e) ? 'o' : '');
    return [Math.round(x0), Math.round(y0), Math.round(x1 - x0), Math.round(y1 - y0), f]; };
  // Every visible match, so an ambiguous selector is visible as n > 1
  const T = (sel, re) => { const m = [...document.querySelectorAll(sel)]
    .filter((e) => shown(e) && re.test((e.getAttribute('aria-label') || e.innerText || '').trim()));
    return m.length ? { el: m[0], n: m.length } : null; };
  const U = (...rs) => { rs = rs.filter(Boolean); if (!rs.length) return null;
    const x = Math.min(...rs.map((r) => r[0])), y = Math.min(...rs.map((r) => r[1]));
    return [x, y, Math.max(...rs.map((r) => r[0] + r[2])) - x, Math.max(...rs.map((r) => r[1] + r[3])) - y, rs.map((r) => r[4]).join('')]; };
  // 3. The zones of this scene: edit only this block
  const Z = {
    primaryButton: [T('button, a', /^Save$/)],
    toolbar: [T('button', /^Undo$/), T('button', /^Redo$/)]
  };
  // 4. What each zone shows, so the checker can compare the tour's text with the screen
  const label = (e) => (e.getAttribute('aria-label') || [...e.childNodes].filter((n) => n.nodeType === 3)
    .map((n) => n.textContent).join(' ')).replace(/\s+/g, ' ').trim();
  const all = [...document.body.querySelectorAll('*')].filter((e) => { const t = label(e); return t && t.length <= 40 && shown(e); });
  const inside = (r) => [...new Set(all.filter((e) => { const b = e.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    return cx >= r[0] && cx <= r[0] + r[2] && cy >= r[1] && cy <= r[1] + r[3]; }).map(label))].slice(0, 30);
  const zones = {};
  for (const [k, hits] of Object.entries(Z)) {
    const r = U(...hits.map((h) => h && R(h.el)));
    if (r) zones[k] = { r: r.slice(0, 4), f: r[4], n: Math.max(...hits.map((h) => (h ? h.n : 0))), texts: inside(r) };
  }
  // 5. Leftovers that must not be in a capture
  let open = [];
  try { open = [...document.querySelectorAll('dialog[open],[role=dialog],[role=alertdialog],[aria-modal=true],[role=tooltip],[role=menu],[role=listbox],:popover-open')]; } catch { /* old browser */ }
  const overlays = open.filter(shown).map((e) => `${e.getAttribute('role') || e.tagName.toLowerCase()}: ${(e.getAttribute('aria-label') || e.innerText || '').trim().slice(0, 40)}`);
  for (const e of document.body.querySelectorAll('*')) { const s = getComputedStyle(e), b = e.getBoundingClientRect();
    if (s.position === 'fixed' && +s.zIndex >= 10 && b.width * b.height > 0.25 * innerWidth * innerHeight && shown(e)) overlays.push(`fixed layer: ${String(e.className).slice(0, 40)}`); }
  const json = JSON.stringify(zones); let hash = 5381; for (let i = 0; i < json.length; i++) hash = ((hash * 33) ^ json.charCodeAt(i)) >>> 0;
  return { vw: innerWidth, vh: innerHeight, dpr: devicePixelRatio, docW: document.documentElement.scrollWidth, docH: document.documentElement.scrollHeight,
    tile: TILE, sy: Math.round(scrollY), at: new Date().toISOString(), busy: document.querySelectorAll('[aria-busy="true"],[role=progressbar]').length,
    overlays, hash, zones };
}
```

It refuses a scrolled page: scroll to the top first, or set `TILE = true` for a tile. It returns the manifest of this capture:

`{ vw, vh, dpr, docW, docH, tile, sy, at, busy, overlays: [string], hash, zones: { <name>: { r: [x, y, w, h], f, n, texts: [string] } } }`

- `r` — the zone's visible part, in screenshot pixels. Copy it into the step.
- `f` — `c` when a scrolling parent clips the zone, `o` when something covers it. Fix either before you capture.
- `n` — how many visible elements matched. Above 1, the selector is ambiguous: narrow it.
- `texts` — the short texts inside the zone. Copy control names and numbers from here, never from the image.
- `overlays` — open dialogs, menus, tooltips and large fixed layers. It must be empty, unless the scene has `keep: true`.
- `busy` — loading indicators on the page. Wait, then measure again.
- `hash` — a fingerprint of the zones. The run after the screenshot must give the same one.

Save the second result as `shots/<scene>.json` with your file tools, and add `before`: the first run's `hash`. Two different hashes mean the page moved during the capture: capture again. The checker reads the manifest (`quality.md`).

Tips:

- Icon buttons often have no text. Match their `aria-label`, `title`, or the text of the element named by `aria-labelledby`.
- When a union comes out too big, a wrapper matched. Narrow the selector and check against the screenshot.
- A rectangle may pass the image edge by up to 2 px; the checker allows that.

## Privacy while capturing

- Never capture password fields with content, payment details or one-time codes.
- Note every region with personal data while you capture: it becomes a `redact` box on the scene.
- The `redact` boxes blur the page only. The PNG files still hold the data. For a tour that may be shared, blur the PNG itself too:
  `ffmpeg -i in.png -filter_complex "[0]crop=W:H:X:Y,boxblur=12:3[b];[0][b]overlay=X:Y" out.png`
