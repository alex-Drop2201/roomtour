# Onboarding (first use, or "set up ROOMTOUR again")

Goal: in two or three minutes the designer has working settings and is already answering the questions for the first tour. Ask only what changes the work. Detect the rest yourself.

## 1. Greet in two sentences

Write in the language the user wrote in (Ukrainian or English when unsure, ask once). Say what ROOMTOUR makes and that the first tour starts right after a few questions. Example in Ukrainian:

> Привіт! ROOMTOUR робить покрокові тури інтерфейсами: справжні скриншоти, на яких по черзі підсвічується кожна зона з поясненням простими словами. Кілька питань — і одразу зробимо перший тур.

## 2. Detect the environment, silently

Run these and remember the results; do not show raw output unless something is missing.

- Node: `node --version`. ROOMTOUR's scripts need Node 18 or newer.
- Browser tools available in this session:
  - Playwright MCP: tools named `mcp__playwright__*` (best: captures any width at 1:1, full pages, tall viewports).
  - Claude's built-in browser (desktop app): tools named `mcp__Claude_Browser__*` (good for reading pages; captures up to about 800 px wide at 1:1).
  - Claude in Chrome: tools named `mcp__claude-in-chrome__*` (the user's own signed-in Chrome; fine for reading, weaker for saving screenshots to files).
- Impeccable: is a skill named `impeccable` in the skill list? If yes, the quality pass uses it.
- ffmpeg: `ffmpeg -version` (optional: stitching tiles and blurring regions inside PNG files).

## 3. Ask one round of questions

Use the structured question tool (AskUserQuestion) with these four questions, in the user's language. Mark one option "(recommended)" per question.

1. **Tour language** — Українська · English · Other (content in that language; the tour's buttons stay in English unless it is uk, en or ru).
2. **How to explain by default** — as to a child (ELI5) · as to a newcomer · as to a colleague. Say that you will still ask at the start of every tour, with this as the default.
3. **Where to keep tours** — offer a concrete path: `~/Documents/roomtour` on Mac, `%USERPROFILE%\Documents\roomtour` on Windows, or the current project folder's `tours/` if they work inside a project. Plus Other.
4. **Which browser to capture with** — list only what is installed, and recommend Playwright when it is there. If it is not installed, offer "Install Playwright (recommended)" as an option.

## 4. Fix what is missing

- **Playwright chosen but not installed:** give the user this command to run in a terminal, then restart Claude Code (or open `/mcp`):
  `claude mcp add --scope user playwright -- npx @playwright/mcp@latest`
  Until then, continue with the built-in browser if it is there.
- **No Node:** ask the user to install the LTS version from nodejs.org, then reopen Claude Code. Without Node you can still write a tour, but you cannot check or serve it; Chrome or Edge can open `index.html` directly.
- **No browser tool at all:** offer to work from screenshots the user sends (they drop PNGs into the tour's `shots/` folder), and explain that measuring zones is then done by eye.

## 5. Save the settings

Write `${CLAUDE_PLUGIN_DATA}/config.json` (or `~/.roomtour/config.json` without the plugin):

```json
{
  "version": 1,
  "language": "uk",
  "level": "child",
  "toursDir": "/Users/name/Documents/roomtour",
  "browser": "playwright",
  "impeccable": true,
  "ffmpeg": false,
  "updated": "2026-10-22"
}
```

`level` is `child`, `newcomer` or `colleague`. `browser` is `playwright`, `builtin` or `chrome`.

Then create the tours folder and its engine:

`node "${CLAUDE_SKILL_DIR}/scripts/new-tour.mjs" "<toursDir>" --engine-only`

## 6. Close and start the first tour

Three lines: the language, the tours folder, the browser. One line on how to change them later ("скажи «roomtour: налаштування»" / "say 'roomtour settings'"). Then go straight to the intake (`intake.md`) with the question "What do we tour first?". If the user already named something in their first message, use it and do not ask again.
