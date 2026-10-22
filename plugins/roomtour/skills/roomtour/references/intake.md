# Intake: the questions before each tour

Ask once, in one round, in the user's language. Skip any question the user's message already answered. Use AskUserQuestion for the four main questions, then one short follow-up in chat for the details.

## The four main questions

1. **What do we tour?**
   - A link to a site (public, or one you sign in to, like GitHub or mail)
   - An app running on this computer (a local address such as `http://localhost:3000`)
   - Screenshots I will send
   - My product, plus its code folder so you can check what each button does
2. **Which part?** The whole page · specific screens or a flow (they describe it) · "you decide, the main screens".
3. **How should I explain it this time?** As to a child · as to a newcomer · as to a colleague. Preselect the default from the settings.
4. **Categories for this tour.** Propose 2–4 categories that fit this product and task (see below), as options; the last option is "I'll name my own". Show each proposal as `label — what it means`.

## The follow-up, in one message

- Does it need a sign-in? If yes: "Sign in yourself in the browser window I open; I never type passwords."
- Is there anything personal on these screens to blur (names, e-mails, faces, amounts, addresses)? Propose what you expect for this kind of product.
- For a product with code: the folder path, if not given yet.
- Anything that must not be touched or shown.

## Categories: the user decides, you propose

A category is what a zone is for the reader, chosen for this task. Different tasks need different categories, so never reuse a fixed set blindly. Examples to adapt:

| Task | Categories (label — meaning) |
|---|---|
| GitHub as a project member | Safe to look — changes nothing · Others will see it — comments, reviews, labels · Don't touch alone — merge, close, delete |
| A public site, signed out | Safe to look · Needs an account · Others will see it |
| A product or admin panel | Only shows · Changes data — the whole team sees it · Can't undo or leaves the app — deletes, sends, submits |
| Personal mail | Reading · Organising — labels, archive, filters · Sends or deletes |
| An analytics dashboard | Metric — a number to read · Filter — changes what you see, not the data · Action — exports, alerts, edits |
| A design tool | Viewing · Editing your copy · Shared with the team |

Rules for every category set:

- 2–4 categories. More is hard to tell apart.
- Labels of three words or fewer; a one-line note for each.
- Each category gets a different **tone**, **icon** and **line** style, so it reads without colour (see `data-format.md`). The checker fails two categories that look the same.
- Keep red (`tone: 'red'`, often `solid: true`, `line: 'dashed'`) for "can't undo / leaves the product / affects others for real". Use green for read-only, amber for "visible to others or changes shared data", blue for "needs something first" (an account, a permission), violet or grey for neutral kinds (a metric, a filter).

When the user renames or adds a category, keep their words exactly.

## After the answers

Write a three-line plan in chat: the scenes you will capture, the chapters, the categories. Then capture. Ask again only if a sign-in or a missing permission blocks you.
