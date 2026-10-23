# Check the tour (Stage 7)

Bounded: check once, fix everything in one batch, check once more, stop.

## 1. The checker

```
node "${CLAUDE_SKILL_DIR}/scripts/check.mjs" "<tour folder>" [data file] [--pair <other data file>] [--code <folder>] [--sizes] [--sheet]
```

Run it with `--sheet`. Fix every FAIL. Read every WARN, and fix what is real.

- `--sheet` — writes `shots/_zones.html`: one card per zone step, with a 1:1 crop, the number, title, category, `ui()` names and numbers. Open it and compare every crop with its caption.
- `--sizes` — lists every image in `shots/` with its size, then stops. Use it for screenshots the user sent.
- `--pair <file>` — checks a language variant, such as `tour.data.uk.js`, against this data file.
- `--code <folder>` — checks every `code:<path>:<line>` source against that folder.

What it reports:

- **Always, FAIL:** a missing or mis-sized screenshot, a zone outside its image, an unknown chapter, scene or category. Also two categories that share a line, a leftover placeholder, a data file that does not run.
- **Always, WARN:** long sentences, empty chapters, repeated titles, no cheat sheet, private screenshots without a `.gitignore`.
- **With a manifest** (`shots/<scene>.json`): a PNG not 1:1 with `vw` fails, and so do overlays without `keep` and a `before` that differs from `hash`. It warns on `busy`, on clipped or covered zones, and on ambiguous matches. It also warns when a step's zone is more than 2 px from a measured one ("placed by eye"). And when `ui()` names or numbers are not among the zone's texts. Without a manifest it prints one INFO line per scene.
- **Sources** (`from`): an unknown kind fails. It warns on `inferred` or `unchecked` without "probably" or its Ukrainian or Russian word. It also warns on an unchecked step in the safest category, and on a strongest-category step resting only on `screen`. It ends with a summary of sources and the numbers of unchecked steps. That summary goes into the hand-over.

## 2. Look at the finished tour in Playwright

Look in Playwright even when you captured in the built-in browser: the tour is a local page and needs no sign-in. Without Playwright, use the built-in browser at its width.

1. Serve the tours folder in the background: `node "<tours>/_roomtour/serve.mjs" "<tours>"`. Open `http://127.0.0.1:<port>/<slug>/?zones`.
2. Before each screenshot, let the camera settle:
   `async () => { await Promise.all(document.getAnimations().map(a => a.finished.catch(() => {}))); }`
3. Look at the intro, a small zone, a tall scene, a strongest-category step and the cheat sheet. Do one round at desktop size (about 1440 × 900) and one at phone size (390 × 844).
4. Check dark mode (`browser_emulate_media`, `colorScheme: 'dark'`) only for tours that will be shared.

A screenshot is evidence only when it is valid. It was taken after the last edit, at the size it claims, after the camera stopped. It shows the step its name says. Open each one before you judge it.

What to look for:

- With `?zones`, every outline sits exactly on its control. No number covers a label; fix one with `mb`.
- Text in the screenshot is readable at the zoom the camera picked. On a phone, the zone's key part is not cropped away.
- Blur boxes cover what they should. Nothing personal is left visible.

## 3. Impeccable, for tours that will be shared

If the `impeccable` skill is here and the tour will be shared, spawn its finish reviewer. Give it the request, the tour's path, the valid screenshots, and this contract: "the real screen is the lesson; one zone at a time; categories as icon + words + fill + line". Apply its material fixes once.

The engine itself is reviewed at each plugin release, not per tour. Do not override its colours, motion or keyboard handling in the data.

## 4. Built-in checklist (when Impeccable is not installed)

- [ ] Every category reads without colour: its own icon, words and line.
- [ ] Every new scene has a `via`.
- [ ] Every claim about behaviour has a source in `from`, or says "probably" or that it could not be checked.
- [ ] General claims are scoped to what you saw.
- [ ] Every strongest-category step says why it is risky, and what to do instead.
- [ ] The cheat sheet names only controls on its scene, each in the category of its own step.
- [ ] The foot says what was captured, when, from where, signed in or out, at what width, and what is blurred.
- [ ] Blur boxes cover every personal detail.
