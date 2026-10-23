# Intake: what to tour, then one round of questions

Ask only what changes the work. You open the address before the round (Stage 1), so the options use the product's real section names.

## What to tour (only when the message names nothing)

Ask this one question alone, before you open anything. Write the options in the user's voice:

- A site: a public link, or one I sign in to (GitHub, mail)
- An app running on my computer (for example http://localhost:3000)
- Screenshots I will send
- My product and its code folder, so you can check each button

The user can type the link straight into "Other". Otherwise ask for the link, address or folder in chat.

## The round: one AskUserQuestion call, at most four questions

Write in the user's language. Skip any question the user's message already answered.

1. **Tour language** — first run only. English · Українська · Русский, with the language of the user's message first. "Other" is any other language: the content is written in it, and the tour's buttons stay in English.
2. **Which part?** Three sizes, each with an honest step count and the real section names:
   - A quick look: <the main screen>, about 12 steps
   - The main screens: <sections A, B and C>, about 25 steps
   - Everything: <all sections>, 40 or more steps

   "Other" lets the user describe a flow. The plan keeps to the picked size.
3. **How should I explain it?** As to a child · as to a newcomer · as to a colleague. AskUserQuestion cannot preselect, so put the saved default first and add "(default)" to its label. On the first run, put "As to a newcomer" first, marked "(recommended)".
4. **Categories for this tour** — `multiSelect: true`. Up to four options, one category each, written `label — meaning`, safest first. The user ticks the ones to keep, and "Other" adds their own. If only one is left, add the opposite end yourself and say so in the plan.

## Follow-ups, only when needed

- **Code folder:** only when "My product and its code folder" was picked and no path was given.
- **Account and role:** "Which account and role do you sign in with?" Ask only when permissions decide what a click does. For example, an admin sees Delete and a viewer does not.

Blurring is not a question. The plan states the default: names, e-mail addresses, faces, amounts and postal addresses on screen.

## Categories: the user decides, you propose

A category says what a click on the zone does, for this reader and this task. Propose a set that fits the product; never reuse one blindly. Examples to adapt, each listed safest first:

| Task | Categories (label — meaning) |
|---|---|
| GitHub as a project member | Safe to look — changes nothing · Others will see it — comments, reviews, labels · Ask first — merge, close, delete |
| A public site, signed out | Safe to look — changes nothing · Needs an account — asks you to sign in · Others will see it — a public trace under your name |
| A product or admin panel | Only shows — changes nothing · Changes data — the whole team sees it · Can't undo — deletes, sends, submits, leaves the app |
| Personal mail | Reading — changes nothing · Organising — labels, archive, filters · Sends or deletes — cannot be taken back |
| An analytics dashboard | Metric — a number to read · Filter — changes what you see, not the data · Action — exports, alerts, edits |
| A design tool | Viewing — changes nothing · Editing your copy — only you see it · Shared with the team — others see the change |

Rules for every set:

- 2–4 categories, declared from safest to strongest. The checker reads that order.
- Labels of three words or fewer, with one line of meaning each.
- Each category has its own tone, its own icon AND its own line, so it reads without colour (`data-format.md`). The checker fails two categories that share a line.
- Red is for "can't undo, leaves the product, or reaches real people": `tone: 'red'`, `line: 'double'`, `solid: true`. Green is for read-only. Amber is for "others see it" or shared data. Blue is for "needs something first", such as an account or a permission. Violet or grey suit neutral kinds, such as a metric or a filter.
- When the user renames or adds a category, keep their words exactly.
