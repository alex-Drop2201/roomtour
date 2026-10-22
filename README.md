# ROOMTOUR

**Step-by-step guided tours over real screenshots of any interface.** You tell Claude what to explain — GitHub, your mail, a client's product running on your computer — and get a local page where a camera glides to one zone at a time, dims the rest, and explains it in plain words. Every zone is coloured by categories you choose for that task, so you always know what a click does before you make it.

[Українською → README.uk.md](README.uk.md)

## Quick start

Needs Claude Code and [Node.js 18+](https://nodejs.org). In a terminal:

```bash
claude plugin marketplace add alex-Drop2201/roomtour
claude plugin install roomtour@roomtour
```

Restart Claude Code, then type `/roomtour` in any project. A short onboarding sets it up for you and leads to your first tour.

![A tour step: the Notifications, Fork and Star buttons highlighted, with the explanation on the right](docs/preview-step.png)

![The cheat sheet: every zone of the page outlined at once, with its step number](docs/preview-cheat-sheet.png)

## What you get

- **A real screen, one zone at a time.** No diagrams: the actual interface, zoomed to each zone, with the rest dimmed.
- **Plain words at your level.** As to a child, as to a newcomer, or as to a colleague; you choose at the start of every tour.
- **Your own categories.** For GitHub they may be "safe to look / others will see it / don't touch alone"; for mail "reading / organising / sends or deletes". Claude proposes, you decide. Each category has its own colour, icon and outline style, so it reads without colour too.
- **Facts, not guesses.** For your own product, give Claude the code folder and it checks what every button does in the code.
- **Private by default.** Screenshots stay on your computer, personal data can be blurred, and Claude never clicks anything that changes data.
- **Ukrainian and English** out of the box (Russian too), on Mac and Windows.

## Try the demo first

The demo is a tour of a public GitHub repository page, in English and Ukrainian. Clone this repository and serve it:

```bash
git clone https://github.com/alex-Drop2201/roomtour.git
cd roomtour
node plugins/roomtour/skills/roomtour/scripts/serve.mjs .
```

Then open the address it prints (usually `http://127.0.0.1:8770/`) plus `examples/github-repo/` for English or `examples/github-repo/index.uk.html` for Ukrainian. Chrome and Edge can also open `examples/github-repo/index.html` directly.

## Requirements

- **Claude Code** — the Code tab of the Claude desktop app, or `claude` in a terminal.
- **Node.js 18 or newer** — for the scripts that create, check and show tours. Download the LTS version from nodejs.org.
- **Recommended: Playwright** for sharp screenshots of any size. Once, in a terminal:

  ```bash
  claude mcp add --scope user playwright -- npx @playwright/mcp@latest
  ```

  Without it, ROOMTOUR uses the desktop app's built-in browser (sharp up to about 800 px wide) or screenshots you send.
- **Optional:** the [Impeccable](https://github.com/pbakaus/impeccable) skill for a design review of each tour, and ffmpeg for stitching and blurring images. ROOMTOUR works without both.

## Install

In a terminal (Mac or Windows), once:

```bash
claude plugin marketplace add alex-Drop2201/roomtour
claude plugin install roomtour@roomtour
```

Restart Claude Code afterwards. A plugin installed from the terminal also appears in the desktop app's Code tab.

In the desktop app, the **+** button next to the prompt → **Add plugins** shows installed plugins.

## First run: onboarding

Type `/roomtour` (or `/roomtour:roomtour`), or just write "make a tour of …". The first time, ROOMTOUR asks four questions — tour language, how to explain, where to keep tours, which browser to use — saves your answers, and goes straight to your first tour. To change the settings later, say "roomtour settings".

## Making a tour

1. Say what to tour: a link, a local address such as `http://localhost:3000`, screenshots, or your product plus its code folder.
2. Answer one round of questions: which part, the explanation level, and the categories for this task (Claude proposes 2–4; rename, add or drop them).
3. If the site needs a sign-in, sign in yourself in the browser window Claude opens. Claude never types passwords.
4. Claude captures the screens, writes the steps, checks the tour and opens it for you.

Tours are saved in your tours folder, one folder per tour. To open one later, ask Claude "open the tour …", or run the serve script on your tours folder and open the address it prints.

## Privacy

- Claude only looks: it never clicks anything that saves, sends, deletes, approves or changes a setting on the site you tour.
- Screenshots of private or signed-in screens stay on your computer; each tour's `shots/` folder is kept out of git.
- Names, e-mails, faces and other personal data can be blurred on the screenshots.
- Nothing is uploaded or published unless you ask for that exact tour.

## Update and remove

```bash
claude plugin marketplace update roomtour
claude plugin update roomtour@roomtour
```

Restart Claude Code to apply an update. Your settings and tours stay. To remove: `claude plugin uninstall roomtour@roomtour`.

## Troubleshooting

- **"The screenshots did not load"** — the page was opened as a file in a browser that blocks neighbouring files (Claude's built-in browser does). Open the tour through the serve script, or in Chrome or Edge.
- **Blurry screenshots** — the built-in browser was wider than about 800 px. Install Playwright, or ask Claude to capture at 800 px.
- **The Playwright window is not signed in** — it is a separate browser. Sign in there once when Claude asks.
- **`node` is not found** — install Node.js LTS and reopen Claude Code.

## What is inside

```
.claude-plugin/marketplace.json          this repository as a plugin marketplace
plugins/roomtour/
  .claude-plugin/plugin.json             the plugin
  skills/roomtour/SKILL.md               how Claude makes a tour, step by step
  skills/roomtour/references/            onboarding, intake, capture, writing, data format, quality
  skills/roomtour/assets/engine/         the tour engine (roomtour.css, roomtour.js)
  skills/roomtour/assets/template/       the page shell for a new tour
  skills/roomtour/scripts/               new-tour.mjs, check.mjs, serve.mjs (Node, no dependencies)
examples/github-repo/                    the demo tour, English and Ukrainian
```

## Licence

MIT — see [LICENSE](LICENSE). Made by Alex Panin. Version 0.1.0.
