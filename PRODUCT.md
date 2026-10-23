# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary: a designer about to work inside an unfamiliar interface.** A product or UX designer who joins a client's product, a new tool (GitHub, an analytics app, a mail client) or a codebase's running app, and needs to understand it before touching it. They make the tour for themselves, right before the work starts. They want to know what every zone is, what a click does, and which clicks are unsafe, in plain words at the level they choose.
- **Secondary: people the designer shows a tour to** (a teammate, a newcomer), when the designer decides to share one. Tours of private screens are not shared by default.

## Product Purpose

ROOMTOUR is a Claude Code plugin. The designer names an interface; Claude captures real screenshots, measures each zone, checks what each control does (on screen, in the product's code or its official docs) and builds a local web page: a camera moves to one zone at a time, dims the rest, and a panel explains the zone. Each zone carries a category the designer chose for this task, so the reader knows before clicking whether it only shows something, changes what they see, changes shared data, or reaches real users.

Success: an accurate tour, fast. From install to the first finished tour in about fifteen minutes, with no invented fact in it and no unsafe click made while capturing.

## Positioning

The lesson is the real screen, one zone at a time, sorted by what a click does, and every claim is checked against the screen, the code or the docs, or marked "probably". Generic onboarding tools annotate a product from the inside for its users; ROOMTOUR is made by the visitor, from the outside, read-only, for their own understanding.

## Operating Context

- Runs inside Claude Code: the desktop app's Code tab or the terminal. Installed from a GitHub marketplace with two commands; invoked as `/roomtour` or by asking for a tour.
- First use asks nothing up front. Claude detects the tools silently and picks the tours folder; the tour language joins the first question round. Settings hold only the tour language, the default explanation level and the tours folder.
- Each tour opens the address first, then asks one round of at most four questions: the language (first run only), which part (with honest step counts), the level, the categories. Then plan, capture and measure scene by scene, check facts, write, build, check, hand over.
- Capture browsers are chosen per tour, not stored. No sign-in: Playwright (any width at 1:1, usually headless). Behind a sign-in: Claude's built-in browser (the user signs in in the pane; 1:1 up to about 800 px wide, tall viewports fine), else the user's Chrome, else screenshots the user sends.
- The result is a folder per tour: `index.html`, `tour.data.js`, `shots/` (screenshots plus a capture manifest per scene), plus a shared folder `_roomtour/` with the engine and `serve.mjs`. A tour is opened through that local server, again at any later time, or directly in Chrome or Edge.

## Capabilities and Constraints

- Tour features: chapters, scenes (one screenshot each), steps (one zone each), per-task categories (tone, icon, outline style, optional solid chip), notes, a cheat-sheet map of one scene, blur boxes for personal data, keyboard navigation, hash links to every step, light and dark, phone layout, reduced motion.
- Interface languages of the tour page: Ukrainian, English, Russian. Content can be written in any language.
- Scripts in Node 18+, no dependencies: `new-tour.mjs` (create a tour, copy the engine), `check.mjs` (sizes, zones, categories, placeholders, sentence length, privacy), `serve.mjs` (local server on 127.0.0.1).
- Works on macOS and Windows. Optional helpers: Playwright MCP, the Impeccable skill (quality pass), ffmpeg (stitch and blur images).
- Fixed rules: read-only on the toured product (nothing that saves, sends, deletes, approves, merges or changes a setting is clicked; menus are opened and closed, banners hidden with CSS); the user signs in, never Claude; screenshots stay on the user's computer and personal data is blurred; no invented facts; no gender inferred from names.
- Undecided: tours in more interface languages; sharing tours beyond the local machine.

## Brand Commitments

- Name: ROOMTOUR, written in capitals. The metaphor is a walk through a house, room by room.
- Voice: plain words at the reader's level; one idea per sentence, 20 words or fewer; button names exactly as on screen.
- Licence: MIT. Author: Alex Panin.

## Evidence on Hand

- The demo tour of a public GitHub repository page, in English and Ukrainian (`examples/github-repo/`), captured signed out, contributor photos blurred.
- Preview images of that demo (`docs/preview-step.png`, `docs/preview-cheat-sheet.png`).
- No user studies, adoption numbers or testimonials exist; none may be invented.

## Product Principles

1. The real screen is the lesson: one zone at a time, never a diagram instead.
2. Say what a click does before the reader makes it; danger is shown by icon, words and outline, not by colour alone.
3. Checked or marked: every claim comes from the screen, the code or the docs, or says "probably".
4. Look, never touch: the toured product is never changed, and private screens never leave the computer.
5. First tour fast: ask only what changes the work, detect the rest.

## Accessibility & Inclusion

- WCAG 2.2 AA for the tour page in light and dark; categories readable without colour.
- Keyboard navigation with visible focus; reduced motion replaces the camera glide with a cut.
- Readers choose the explanation level: as to a child, as to a newcomer, as to a colleague.
