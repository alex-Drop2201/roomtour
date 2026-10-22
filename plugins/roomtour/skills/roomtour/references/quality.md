# Quality pass

Bounded: check once, fix everything in one batch, check once more, stop.

## 1. The checker (always)

`node "${CLAUDE_SKILL_DIR}/scripts/check.mjs" "<tour folder>"`

It fails on: a missing or mis-sized screenshot, a zone outside its image, an unknown chapter, scene or category, two categories that look the same, a placeholder left in the text, a broken data file. It warns on: long sentences, a category without an icon of its own, an empty chapter, chapters out of order, repeated titles, no cheat sheet, private screenshots without a `.gitignore`.

## 2. Look at it (always)

Serve the tours folder (`serve.mjs`) and open the tour. Capture and look at:

- the intro, a small zone, a tall scene, a red-category step, the cheat sheet;
- at about 1440 × 900 and at 390 × 844 (phone);
- in light and in dark (`emulate_media` / `resize_window colorScheme`).

A capture is evidence only when it is valid: taken after the last edit, at the size it claims, showing the step its name says, with no overlay from another tool, after the camera stopped moving. Open each one before judging it.

What to look for:
- The zone outline sits exactly on the control; its number does not cover the control's label (fix with `mb`).
- Text in the screenshot is readable at the zoom the camera picked; on a phone, the zone's important part is not cropped away.
- Blurred regions cover what they should.
- Nothing personal is left visible.

## 3. Impeccable, if installed

If the `impeccable` skill is available:
- Run its detector on the tour page and the engine files (the command is in Impeccable's own instructions, e.g. `<impeccable skill dir>/scripts/impeccable detect --json <files>`); fix what is mechanical.
- For a tour that will be shared with others, spawn Impeccable's finish reviewer with: the request, the tour path, the valid captures, and the contract "the real screen is the lesson; one zone at a time; categories as icon + words + fill + line". Apply its material fixes once.

## 4. Built-in checklist (when Impeccable is not installed)

- [ ] Every category reads without colour: its own icon, words and outline style.
- [ ] Body text contrast is comfortable in light and dark (the engine's tokens are checked; do not override colours in the data).
- [ ] Keyboard: arrow keys move, focus rings are visible on the buttons and the step list.
- [ ] Reduced motion: the camera jumps instead of gliding (the engine does this; do not add animations in the data).
- [ ] The step list shows the current step without scrolling the whole panel.
- [ ] Every chapter that opens a new page says how the reader got there.
- [ ] Every claim about behaviour is backed by the screen, the code or the docs, or says "probably".
- [ ] The foot line says what was captured, when, from where, at what width, and what is blurred.
