# Writing the steps

A step answers three questions, in this order: **what is this**, **what a click does**, **is that safe**. The category chip answers the third in a few words; the text says why.

## Levels

| Level | How it sounds | Example for a "Merge" button |
|---|---|---|
| As to a child (ELI5) | Everyday analogies, no jargon, every term explained the first time | "It pours all these changes into the main version. Taking them back out is hard, so this one waits for your lead." |
| As to a newcomer | Plain words plus the real term once, so they learn the word | "Merge adds this branch's commits to the target branch. Undoing it needs a revert, a new change that removes them." |
| As to a colleague | Precise terms, short, the non-obvious parts only | "Creates a merge commit on `main`; squash would fold the branch into one commit instead." |

Analogies that work for designers: a branch is a copy of a design file to try an idea; a commit is a saved version in the file's history; a review is a comment round; a deploy is publishing the file to the client. Use the reader's world, never cute filler.

## Sentences

- 20 words or fewer. One idea per sentence. Active voice.
- Control names exactly as on screen, in `ui('…')`. Keep the screen's language, even when the tour is in another.
- Copy control names and numbers from the manifest's zone `texts`, never from the image.
- One word, one meaning: once a thing has a name in the tour, keep it.
- Two to four short paragraphs, or a short list, per step. A step that needs more is two steps.
- Numbers from the screen are fine ("216 branches"). Numbers you computed carry their source.
- Simplify the words, never the facts. "Anyone can read it" does not mean "it is safe".
- Scope every general claim to what you saw: "on the pages we opened", "for a signed-out visitor". Write "every page" or "always" only when the docs say so.
- Hedge what the source ladder left open (SKILL.md → Stage 4). Inferred: "probably". Unchecked: "we could not check this".

## Choosing each zone's category

- Categories are declared safest first. A control that fits two takes the stronger one.
- Judge the completed action, not the first click. An Export button that opens a dialog is still an export: "opens a dialog first; nothing leaves until you press Export there."
- A zone that mixes categories takes the strongest. Its `n` names the control that earns it ("Delete removes the project").
- Inferred behaviour takes the stronger plausible category, and the text says "probably".
- When permissions decide the outcome, say for whom: "for an admin it deletes; a viewer does not see it".

## Structure of a tour

1. **Intro step** (`r: null`): what this interface is, in one analogy. Then the legend, a `key` list of chips, safest first. Then "use the buttons or the arrow keys".
2. **Chapters by area**, in the order a person meets them: top to bottom, then into deeper pages. Chapter names carry no numbers; the engine shows progress.
3. **A new page or state** gets a `via` on its scene: "From the list we opened one invoice." The engine shows it on that scene's first step, so the body does not repeat it.
4. **Big zones first, then their parts:** "the sidebar" before "the settings gear in the sidebar".
5. **Split a zone** when its parts need separate explanations. On a phone the engine never shrinks a screenshot below 0.8×. So split a zone wider than a phone shows legibly: left half, right half.
6. **One aside per step at most:**
   - `note(label, html)` — context that is not on the screen: a line from the docs, or a finding worth fixing (`note('Finding.', …)`) when the reader designs the product.
   - `warn(label, html)` — a caution: "in this test copy the button does nothing", "this tip comes back on every page".
7. **Cheat sheet** (`map: true`, `r: null`), last. The engine outlines every zone of its scene and lists them as buttons under the text. The text names the categories as headings, each with its controls. Name only controls on this scene, each in the category its own step gives it.

## Before you call it written

- Read the tour as the reader at the chosen level. Is every term explained the first time it appears?
- Does every step say what a click does, not only what the thing is?
- Does every strongest-category step say why it is risky, and what to do instead?
