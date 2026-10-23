---
name: roomtour
description: Build a ROOMTOUR — a step-by-step guided tour over real screenshots of any interface (a public site, a signed-in web app such as GitHub or mail, the user's own product running locally, optionally checked against its code). A camera moves to one zone at a time, dims the rest, and a panel explains the zone in plain words. Each zone is marked with a category the user chooses for this task. Also opens finished tours again and changes ROOMTOUR's settings. Use when the user types /roomtour, says "roomtour", "make a tour", "walk me through this page / app / product", "explain this interface step by step", "open the tour …", "list my tours", "roomtour settings", "зроби тур", "roomtour: налаштування", "екскурсія інтерфейсом", "розбери інтерфейс", "проведи продуктом", "відкрий тур", "сделай тур", "объясни интерфейс по шагам", "открой тур", or wants to learn an unfamiliar interface safely.
---

# ROOMTOUR

ROOMTOUR turns any interface into a guided tour, like a walk through a house room by room. The reader opens a local web page. On the left is the real screenshot: a camera moves to one zone at a time and dims the rest. On the right, a panel says what the zone is, what a click does, and its category. A cheat sheet at the end outlines every zone of one screen.

A tour is three things: the shared engine (`_roomtour/`), a tiny page (`index.html`) and the tour's own data (`tour.data.js` and `shots/`). You write the data; the engine draws it.

Words used below: a **scene** is one screenshot. A **step** is one zone on a scene, explained in the panel. A **chapter** groups steps. A **stage** is a part of your own work.

## Always, on every tour

- **Talk to the user in their language.** Write the tour in the language the settings or this tour's answers name.
- **Read-only on the toured product.** Never click anything that saves, sends, posts, buys, deletes, approves, merges, subscribes or changes a setting. To learn what a menu holds, open it, read it and close it with Escape. Hide banners and promos with injected CSS. Never press their "Dismiss": that is a setting.
- **Never type passwords, codes or card numbers.** The user signs in, in the browser you show them.
- **Personal data stays on this computer.** Private screens keep `shots/` out of git; `new-tour.mjs` sets that up. Blur faces, names, e-mail addresses and anything personal. Never upload, publish or send a tour unless the user asks for that exact tour.
- **Checked, or marked.** What a control does comes from the screen, the product's docs or its code. An inferred claim says "probably". An unchecked claim says it could not be checked.
- **Never infer a person's gender from their name.** Refer to people by name or role. In Ukrainian and Russian, avoid gendered second-person forms ("поки кнопку не натиснуто", not "поки не натиснув").

## Stage 0 — settings

Settings live in `${CLAUDE_PLUGIN_DATA}/config.json`. If that path still reads literally `${CLAUDE_PLUGIN_DATA}`, the skill runs without the plugin. Then use `~/.roomtour/config.json`.

- **No settings file:** this is the first run. Follow `${CLAUDE_SKILL_DIR}/references/onboarding.md`. It asks nothing up front; the tour language joins the Stage 1 round.
- **Settings exist:** greet in one line with the tour language and the tours folder. Go to Stage 1.
- **"roomtour settings":** show the current settings and the file's real path. Ask only what to change, save, and stop.
- **"open the tour …" or "list my tours":** skip every question. Run `node "<tours>/_roomtour/serve.mjs" "<tours>"` in the background. Open the printed address where the user can see it: the built-in browser pane in the desktop app, otherwise print the link. Add `<slug>/` to open one tour.

Detect tools when you need them, every time: Node, browser tools, Impeccable, ffmpeg. They change, so the settings never store them.

## Stage 1 — open first, then ask

1. **What to tour.** Take it from the user's message. If it names nothing, ask only that first (`${CLAUDE_SKILL_DIR}/references/intake.md` → What to tour).
2. **Create the tour folder before any capture**, so `shots/` is git-ignored from the first screenshot:
   `node "${CLAUDE_SKILL_DIR}/scripts/new-tour.mjs" "<tours>" <slug> --lang <en|uk|ru> --title "<title>"`
   Add `--public` only for a public page captured signed out. When unsure, leave it out.
3. **Open the address.** Choose the browser for this tour and handle the sign-in (`${CLAUDE_SKILL_DIR}/references/capture.md`).
4. **Read the real navigation:** section names, tabs, how many screens there are. The questions use these names.
5. **Ask one round** with AskUserQuestion, at most four questions (`intake.md`): the tour language (first run only), which part, the explanation level, the categories. On the first run, then save and show the settings (`onboarding.md` → 5).
6. **Follow-ups only when needed:** the code folder, when that option was picked; the account and role, when permissions decide what a click does.

## Stage 2 — plan

Write one short plan in chat. It names the scenes and the chapters, and the step count within the picked size. It lists the categories from safest to strongest, and what you will blur by default. Do not wait for approval unless the user asked to review the plan.

## Stage 3 — capture and measure, scene by scene

For each scene, in one batch (`capture.md`):

1. Navigate. Inject the tour's hide-CSS again from `shots/hide.css`: every navigation drops it.
2. Move the pointer to an empty corner, blur the focused element, press Escape once. Skip this when a hover state or an open menu is the subject.
3. Run the zone snippet. Take the screenshot at 1:1. Run the snippet again.
4. Save `shots/<scene>.json`: the second result, plus `before` set to the first result's `hash`.

Give the scene `keep: true` when an open menu or dialog is the subject. For each new scene, write its `via` ("From the list we opened one invoice") and note its blur boxes.

## Stage 4 — check the facts

Before you write "probably", climb this ladder. Stop at the first rung that answers. Every rung is read-only.

1. **The label and helper text** on screen.
2. **The tooltip.** Hover, then read `title`, `aria-describedby` and `aria-keyshortcuts`.
3. **The element's attributes.** Run this probe on the control:
   `(e) => ({ href: e.getAttribute('href'), type: e.type, form: e.form && e.form.method, download: e.hasAttribute('download'), disabled: e.disabled || e.getAttribute('aria-disabled'), popup: e.getAttribute('aria-haspopup'), title: e.title, describedby: document.getElementById(e.getAttribute('aria-describedby') || '')?.innerText })`
   An `href` leads to another page. `type=submit` or a POST form sends data. `download` saves a file. `aria-haspopup` opens a menu first. A tool without an element argument runs it on `document.querySelector('<selector>')`.
4. **The menu it opens.** Open it, read it, press Escape. Never pick an item.
5. **The product's own docs**, on its official domain. Read the raw page, not a summary. Keep the exact sentence as a `#:~:text=` fragment in `from`.
6. **The code**, when the user gave a folder. Give a subagent one question per control: what it does, whether it asks to confirm, whether it sends anything outside. It returns the answer, `file:line` and the quoted line. Open every cited line yourself for strongest-category steps, and one in three of the rest. A line that does not say it makes the step `inferred`.

Record each step's sources in `from` (`data-format.md`). When the docs and the screen disagree, the screen wins, and the step says so. When permissions decide the outcome, say for whom.

## Stage 5 — write

Follow `${CLAUDE_SKILL_DIR}/references/writing.md`: the level, the sentence rules, how each zone gets its category, and the structure of a tour.

## Stage 6 — build

1. If the title or the language changed since Stage 1, run `new-tour.mjs` again with the final values. It refreshes the page and the engine, and keeps `tour.data.js`.
2. Write `<tours>/<slug>/tour.data.js` in the format of `${CLAUDE_SKILL_DIR}/references/data-format.md`.

## Stage 7 — check

Follow `${CLAUDE_SKILL_DIR}/references/quality.md`: the checker with its zone sheet, then a look at the finished tour in Playwright with `?zones`.

## Stage 8 — hand over

Open the tour where the user can see it: the built-in browser pane in the desktop app, otherwise print the link. Then write, in the user's language:

1. The link and the folder, `<tours>/<slug>/`.
2. How to open it later: say "open the tour <slug>", or run `node "<tours>/_roomtour/serve.mjs" "<tours>"`. The link stops working when this session ends.
3. The number of steps as the page counts them (without the intro), and of chapters. Use correct plurals. Ukrainian: 1 крок, 2–4 кроки, 5–20 кроків, then by the last digit (21 крок, 42 кроки). Russian: 1 шаг, 2–4 шага, 5–20 шагов, then the same way.
4. Each category and what it means, safest first.
5. What you could not check: the checker's summary of inferred and unchecked steps. Say whether any zones were placed by eye.
6. The capture width, if narrower than usual, and whether that narrow layout differs from desktop.
7. What is blurred. The blur covers the page only: the PNG files still hold the data, unless you blurred them too.
8. When Playwright would have helped, say so, with the install command from `onboarding.md`.

Offer one next step, such as another part of the product or a second tour. Not a list.
