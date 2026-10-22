# Writing the steps

A step answers three questions, in this order: **what is this**, **what happens when you click it**, **is that safe** (the category says it in one chip; the text says why).

## Levels

| Level | How it sounds | Example for a "Merge" button |
|---|---|---|
| As to a child (ELI5) | Everyday analogies, no jargon, every term explained the first time | "It pours all these changes into the main version. Taking them back out is hard, so this one waits for your lead." |
| As to a newcomer | Plain words plus the real term once, so they learn the word | "Merge adds this branch's commits to the target branch. Undoing it needs a revert, a new change that removes them." |
| As to a colleague | Precise terms, short, the non-obvious parts only | "Creates a merge commit on `main`; squash would fold the branch into one commit instead." |

Analogies that work for designers: a branch is a copy of a design file to try an idea; a commit is a saved version in the file's history; a review is a comment round; a deploy is publishing the file to the client. Use the reader's world, never cute filler.

## Rules for every sentence

- 20 words or fewer. One idea per sentence. Active voice.
- Button and field names exactly as they appear on screen, wrapped in `ui('…')`; quote them in the screen's language even when the tour is in another.
- One word, one meaning: once a thing has a name in the tour, keep it.
- Say less: two to four short paragraphs or a short list per step. A step that needs more is two steps.
- Numbers from the screen are fine ("216 branches"); numbers you computed carry their source.
- Never infer a person's gender from their name; refer to people by name or role. In gendered languages avoid gendered second-person past tense.
- When something is only inferred: "probably". When unchecked: say so.

## Structure of a tour

1. **Intro step** (`r: null`): what this interface is, in one analogy; the legend of categories as a list of chips with one line each; "use the buttons or the arrow keys".
2. **Chapters by area**, in the order a person meets them. A chapter that opens a new page or state starts by saying how the reader got there.
3. **Big zones first, then their parts**: "the sidebar" before "the settings gear in the sidebar".
4. **Split a zone** when its parts need separate explanations, or when it is wider than a phone can show legibly (left half, right half).
5. **Notes** (`note(label, html)`) for things that are not on the screen: a line from the product's docs, a finding worth fixing, a warning about the environment ("in this test copy the button does nothing"). One per step at most.
6. **Cheat sheet step** (`map: true`, `r: null`): every zone of one representative scene outlined with its step number; in the text, the categories as headings with the controls that belong to each.

## Before you call it written

- Read the tour aloud in your head as the reader at the chosen level: is every term explained the first time it appears?
- Does every step say what a click does, not only what the thing is?
- Does every red-category step say why it is dangerous and what to do instead?
