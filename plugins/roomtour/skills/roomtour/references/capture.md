# Capture: screenshots and zone rectangles

The rule for every capture: **1:1 pixels**. One screenshot pixel equals one CSS pixel of the page at the viewport you chose, so the zone rectangles you measure in the page match the image exactly.

## Choose the browser (from the settings)

**Playwright (preferred).**
- `browser_resize` to the capture size, `browser_navigate`, wait for the page to settle, then `browser_take_screenshot` with `scale: "css"` and `filename: "<tour>/shots/<scene>.png"` (paths are relative to the session's working directory; check where the file landed).
- Width: 1280 for desktop products and most sites; 800 for very dense pages if you want larger text; the product's own target width if it has one.
- Height: the viewport height you need. For a long page use `fullPage: true`, or a tall viewport.
- A Playwright browser starts signed out. For a signed-in site, open the page, ask the user to sign in in that window, wait for them to say done, then continue.

**Claude's built-in browser (desktop app).**
- Its screenshot is scaled to fit about 800 px wide. Set the viewport to 800 px wide (`resize_window`) and use `computer` → `zoom` with the full region at `scale: 1` to get a 1:1 PNG. The tool result names the saved file; copy it into `shots/`.
- Long pages: capture tiles of one viewport height each, hiding sticky headers first (below), then stitch with ffmpeg if installed (`[0][1][2]vstack=inputs=3`), or keep each tile as its own scene.
- The pane may be hidden; then CSS transitions do not run between screenshots. Take a throwaway screenshot, wait one second, then take the real one.
- It cannot open a local file together with its screenshots; view tours through `serve.mjs`.

**Claude in Chrome (the user's Chrome).** Use it to read pages the user is signed in to. If it cannot save screenshots to files, ask the user to save them (or switch to Playwright for the capture).

**Screenshots sent by the user.** Put them into `shots/`, read their size with the checker, and measure zones by eye from the image; say in the hand-over that the zones were placed by eye.

## Before each capture

- Hide what does not belong to the interface, with injected CSS, not with clicks: sticky headers when tiling, promo popovers, cookie banners (if a banner must be answered, choose the most privacy-preserving option and tell the user).
- Close any menu you opened (Escape) before the next capture.
- Hover states (a button that appears on hover, a tooltip): hover, then capture.
- Inner scrolling: if the content scrolls inside a panel, find the panel and its height, then capture with a viewport tall enough for all of it:

```js
() => [...document.querySelectorAll('*')].filter(e => {
  const cs = getComputedStyle(e);
  return (cs.overflowY === 'auto' || cs.overflowY === 'scroll') && e.scrollHeight > e.clientHeight + 20;
}).map(e => { const r = e.getBoundingClientRect(); return { top: Math.round(r.top), scrollHeight: e.scrollHeight }; })
```

## Measure the zones (same viewport as the screenshot)

Run in the page (`browser_evaluate` or `javascript_tool`). It returns `[x, y, w, h]` in page pixels, scroll included:

```js
() => {
  const R = (e) => { if (!e) return null; const b = e.getBoundingClientRect();
    return [Math.round(b.x), Math.round(b.y + scrollY), Math.round(b.width), Math.round(b.height)]; };
  // find a visible element by its text or aria-label
  const t = (sel, re) => [...document.querySelectorAll(sel)].find(e =>
    re.test((e.innerText || e.getAttribute('aria-label') || '').trim()) && e.getBoundingClientRect().width > 0);
  // the box around several elements
  const U = (...els) => { const rs = els.filter(Boolean).map(R).filter(Boolean); if (!rs.length) return null;
    const x = Math.min(...rs.map(r => r[0])), y = Math.min(...rs.map(r => r[1]));
    return [x, y, Math.max(...rs.map(r => r[0] + r[2])) - x, Math.max(...rs.map(r => r[1] + r[3])) - y]; };
  return {
    header: R(document.querySelector('header')),
    primaryButton: R(t('button, a', /^Save$/)),
    toolbar: U(t('button', /^Undo$/), t('button', /^Redo$/))
  };
}
```

Tips:
- Measure after the page settled, at the capture size. A resize or a newly opened banner moves everything.
- Icon buttons often have no text: read `aria-label`, `title`, or the text of the element named by `aria-labelledby`.
- When a union of elements comes out too big, a wrapper was matched: narrow the selector and check against the screenshot.
- Rectangles may extend a few pixels past the image edge; the checker allows 2 px.

## Privacy while capturing

- Never capture password fields with content, payment details or one-time codes.
- Note every region with personal data while you capture; it becomes a `redact` box on the scene. For a tour that may be shared, also blur the PNG itself (ffmpeg: `crop=w:h:x:y,boxblur=12:3` overlaid at `x:y`).
