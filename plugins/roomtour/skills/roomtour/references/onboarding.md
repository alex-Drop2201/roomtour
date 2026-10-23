# Onboarding (first run)

Goal: the first tour starts at once. Onboarding asks nothing of its own. Detect the environment, pick the tours folder, then go to Stage 1. The one first-run question, the tour language, joins the Stage 1 round.

## 1. Greet in two sentences

Write in the user's language. Say what ROOMTOUR makes, and that you open the page first, then ask a few questions.

- en: > Hi! ROOMTOUR makes step-by-step tours of interfaces: real screenshots, one zone at a time, explained in plain words. I'll open the page first, then ask up to four quick questions.
- uk: > Привіт! ROOMTOUR робить покрокові тури інтерфейсами: справжні скриншоти, де зони підсвічуються по черзі й пояснюються простими словами. Спершу я відкрию сторінку, потім поставлю до чотирьох коротких питань.
- ru: > Привет! ROOMTOUR делает пошаговые туры по интерфейсам: настоящие скриншоты, где зоны подсвечиваются по очереди и объясняются простыми словами. Сначала я открою страницу, потом задам до четырёх коротких вопросов.

If the message names nothing to tour, replace the second sentence with the question "What to tour" (`intake.md`).

## 2. Detect, silently

Run these and show nothing unless something is missing. Do not save the results: they go stale.

- **Node:** `node --version`. The scripts need Node 18 or newer.
- **Browser tools in this session:**
  - Playwright MCP (`mcp__playwright__*`): any width at 1:1, full pages, tall viewports. Check once whether it runs headless: `browser_evaluate` with `() => navigator.userAgent`. `HeadlessChrome` means there is no window, so nobody can sign in there.
  - Claude's built-in browser (`mcp__Claude_Browser__*`, desktop app): the user can sign in in its pane. It captures 1:1 up to about 800 px wide.
  - Claude in Chrome (`mcp__claude-in-chrome__*`): the user's own signed-in Chrome. It is weaker at saving screenshots to files.
- **Impeccable:** a skill named `impeccable` in the skill list. Stage 7 uses it for tours that will be shared.
- **ffmpeg:** `ffmpeg -version`, only when a tour needs tiles stitched or PNGs blurred.

## 3. No install stops the first run

Use the browsers that are here now. When Playwright would have helped, say so in the hand-over, with the command:

`claude mcp add --scope user playwright -- npx @playwright/mcp@latest`

- **No Node:** the scripts do not run, and Playwright cannot be added. Copy the engine and the page shell with your file tools:
  - `${CLAUDE_SKILL_DIR}/assets/engine/*` → `<tours>/_roomtour/`;
  - `${CLAUDE_SKILL_DIR}/assets/template/index.html` → `<tours>/<slug>/index.html`, with every `{{…}}` placeholder filled in;
  - for a private tour, write `<tours>/<slug>/shots/.gitignore` with the lines `*` and `!.gitignore`.

  Check the data against `data-format.md` by reading it. Chrome or Edge open `index.html` directly. Suggest Node LTS from nodejs.org after this tour.
- **No browser tool at all:** work from screenshots the user sends into the tour's `shots/` folder. Zones are then placed by eye; say so in the hand-over.

## 4. The tours folder

Default: `~/Documents/roomtour` on Mac and Linux, `%USERPROFILE%\Documents\roomtour` on Windows. Create it with the engine:

`node "${CLAUDE_SKILL_DIR}/scripts/new-tour.mjs" "<tours>" --engine-only`

If the folder cannot be written, for example in a sandboxed session, the command fails. Then use `<current project>/tours/` and say so in one line. Ask only if neither works.

## 5. Save and show the settings

Save the settings right after the Stage 1 round:

```json
{
  "version": 2,
  "language": "en",
  "level": "newcomer",
  "toursDir": "/Users/name/Documents/roomtour",
  "updated": "2026-10-23"
}
```

- `language` — the tour language: `en`, `uk` or `ru`. Another language code also works: the content is written in it, and the tour's buttons stay in English.
- `level` — the default explanation level: `child`, `newcomer` or `colleague`. The first run saves its pick. Later tours do not change it; "roomtour settings" does.
- `toursDir` — the tours folder, as a full path.
- A file from version 0.1 may also hold `browser`, `impeccable` or `ffmpeg`. Ignore them, and drop them at the next save.

Then show the settings in one line, with the file's real path, for example:

> Settings: tours in English, explained as to a newcomer, kept in ~/Documents/roomtour. Saved in <the real path>. Say "roomtour settings" to change them.

## 6. Go on

Continue with Stage 1. If the first message already named something to tour, use it and do not ask again.
