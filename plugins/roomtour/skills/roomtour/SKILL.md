---
name: roomtour
description: Build a ROOMTOUR — a step-by-step guided tour over real screenshots of any interface (a public site, a signed-in web app such as GitHub or mail, the user's own product running locally, optionally checked against its code). A camera moves to one zone at a time, dims the rest, and a panel explains the zone in plain words, coloured by categories the user chooses for this task. Runs a short onboarding on first use. Use when the user types /roomtour, says "roomtour", "make a tour", "walk me through this page / app / product", "explain this interface step by step", "зроби тур", "екскурсія інтерфейсом", "розбери інтерфейс", "проведи продуктом", "сделай тур", "объясни интерфейс по шагам", or wants to learn an unfamiliar interface safely.
---

# ROOMTOUR

ROOMTOUR turns any interface into a guided tour, like a walk through a house room by room. The reader opens a local web page: on the left, the real screenshot with a camera that glides to one zone at a time and dims the rest; on the right, what the zone is, what a click does, and its category. Arrow keys move through the steps. A cheat sheet at the end outlines every zone of one screen at once.

Every tour is three things: the shared engine (`_roomtour/`), a tiny page (`index.html`) and the tour's own data (`tour.data.js` + `shots/*.png`). You write the data; the engine draws it.

## Always, on every tour

- **Talk to the user in their language** (Ukrainian or English by default, or whatever they write in). Write the tour in the language the settings name.
- **Read-only on the toured product.** Never click anything that changes data, sends, posts, buys, deletes, approves, merges, subscribes or changes a setting. To learn what a menu holds, open it and close it with Escape, or read the DOM. Dismiss promos and banners by hiding them with injected CSS for the capture, not by clicking "Dismiss": that is a setting.
- **Never type passwords, codes or card numbers.** When a site needs a sign-in, ask the user to sign in themselves in the capture browser, then continue.
- **Personal data stays on this computer.** Tours of signed-in or private screens keep `shots/` out of git (`new-tour.mjs` adds the `.gitignore`). Blur faces, names, e-mail addresses and anything personal with the scene's `redact` boxes, and blur the PNG itself when the tour may be shared. Never publish, upload or send a tour unless the user asks for that exact tour.
- **No invented facts.** What a control does comes from the screen, the product's code or its official docs. When you only infer it, say "probably". When you cannot tell, say you could not check.
- **Never infer a person's gender from their name.** Refer to people by name or role. In gendered languages (Ukrainian, Russian) avoid gendered second-person past tense ("поки кнопку не натиснуто", not "поки не натиснув").

## Step 0 — settings, and onboarding on first use

Settings live in `${CLAUDE_PLUGIN_DATA}/config.json`. (If that path still shows the literal text `${CLAUDE_PLUGIN_DATA}`, the skill runs without the plugin: use `~/.roomtour/config.json` instead.)

- No settings file yet, or the user asks to set up or change settings → run the onboarding in `${CLAUDE_SKILL_DIR}/references/onboarding.md`. It takes two or three minutes and ends by asking for the first tour.
- Settings exist → greet in one line with the language and the tours folder, then go to Step 1.

## Step 1 — intake for this tour

Follow `${CLAUDE_SKILL_DIR}/references/intake.md`. One round of questions: what to tour, which part, the explanation level for this tour, and **the categories for this task**. The user sets the categories; you propose 2–4 that fit this product and let the user rename, add or drop them. Then sign-in, private data to blur, and an optional code folder.

## Step 2 — plan the scenes

A scene is one screenshot; a step is one zone on a scene. Before capturing, write a short plan in chat: the scenes (pages and states) and the chapters, about 6–15 steps per chapter. Order follows how a person meets the screen: top to bottom, then into deeper pages. Each chapter that opens a new page starts by saying how the reader got there ("we clicked the row … and the page opened"). Do not wait for approval unless the user asked to review the plan.

## Step 3 — capture

Follow `${CLAUDE_SKILL_DIR}/references/capture.md`: which browser, the capture width, 1:1 pixels, tall pages and inner scrollers, sticky headers, hover states, sign-in. Save every screenshot into `<tour>/shots/`.

## Step 4 — map the zones

For each step, measure its rectangle `[x, y, w, h]` in screenshot pixels on the **same viewport** the screenshot used (the snippet is in `capture.md`). Prefer real elements (`getBoundingClientRect`) over eyeballing; check odd numbers against the screenshot.

## Step 5 — check the facts

- With the product's code (the user gave a folder): delegate a read-only code read to a subagent, one question per control ("what does this button do, does it ask to confirm, does it send anything outside"), with `file:line` for every answer. Mark product defects you find on the way as findings (`note('Finding.', …)`) when the reader is a designer.
- Without code: use what the screen says, official docs and help pages. Open menus to read them, never to act. Say "probably" for anything inferred.

## Step 6 — write the steps

Follow `${CLAUDE_SKILL_DIR}/references/writing.md`: the level (as to a child, as to a newcomer, as to a colleague), sentences of 20 words or fewer, one idea per sentence, button names as they appear, each step answering what it is → what a click does → whether it is safe.

## Step 7 — build the files

1. Create the folder and refresh the engine:
   `node "${CLAUDE_SKILL_DIR}/scripts/new-tour.mjs" "<tours folder>" <slug> --lang <uk|en|ru> --title "<title>"` (add `--public` only for public pages captured signed out).
2. Write `<tours>/<slug>/tour.data.js` in the format of `${CLAUDE_SKILL_DIR}/references/data-format.md`: categories, scenes (with `redact` boxes), chapters, steps, an intro step first and a cheat-sheet step (`map: true`) last.

## Step 8 — check and look

1. `node "${CLAUDE_SKILL_DIR}/scripts/check.mjs" "<tours>/<slug>"` — fix every FAIL; read every WARN and fix what is real.
2. Serve and open: `node "${CLAUDE_SKILL_DIR}/scripts/serve.mjs" "<tours folder>"` in the background, then open `http://127.0.0.1:<port>/<slug>/` in the browser you capture with. (Claude's built-in browser cannot open a local file with its screenshots; always use the server there. Chrome or Edge can also open `index.html` directly.)
3. Look at: the intro, one small zone, one tall scene, a red-category step, the cheat sheet; at about 1440 px wide and at 390 px (phone); in light and dark. Validate each capture before judging it (see `quality.md`).

## Step 9 — quality pass

Follow `${CLAUDE_SKILL_DIR}/references/quality.md`. If the Impeccable skill is installed, run its detector and, for a tour that will be shared, its finish review; otherwise run the built-in checklist there. Fix what it finds, check once more, stop.

## Step 10 — hand over

Tell the user, in their language: the address of the tour, how many steps and chapters, the categories and what they mean, what you could not check, and that the screenshots stay on this computer. Offer one next step (another part of the product, or a second tour), not a list.

## Lessons from real tours

- Claude's built-in browser captures at most about 800 px wide at 1:1; wider windows come out scaled down and blurry. Use an 800 px viewport there, or use Playwright, which captures any width at 1:1.
- When the built-in browser pane is hidden, CSS transitions do not advance between screenshots: take a throwaway screenshot first, wait a second, then the real one.
- A page whose content scrolls inside a panel needs a viewport as tall as that panel's `scrollHeight` (plus its top offset) to capture it whole; a full-page screenshot does not see inner scrolling.
- Tall pages captured in tiles: hide the sticky header with injected CSS first, or it repeats in every tile.
- Zones on a phone: the engine never shrinks a screenshot below 0.8×; split a wide zone into two steps (left half, right half) when its parts matter.
- Map badges sit at the zone's top-left by default; when they cover a label, give the step `mb: 'l' | 'r' | 't'`.
- The numbers next to chapter names show progress within the chapter, never counts that the screenshot itself shows.
- Readers ask "how did we get here?" whenever a new page appears without a sentence about it.
