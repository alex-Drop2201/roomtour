---
name: ROOMTOUR
description: The tour page engine. A dark lightbox stage with a moving camera, and a reading panel that says what each zone does before the reader clicks it.
colors:
  accent: "oklch(26% 0.015 262)"
  on-accent: "oklch(99% 0 0)"
  bg: "oklch(98% 0.004 95)"
  surface: "oklch(100% 0 95)"
  surface-2: "oklch(96.4% 0.006 95)"
  line: "oklch(88% 0.008 95)"
  ink: "oklch(22% 0.010 95)"
  ink-2: "oklch(40% 0.010 95)"
  ink-3: "oklch(46% 0.010 95)"
  stage: "oklch(16.5% 0.012 262)"
  stage-line: "oklch(30% 0.012 262)"
  stage-ink: "oklch(88% 0.008 262)"
  stage-dim: "oklch(9% 0.01 262 / 0.7)"
  halo: "oklch(12% 0.01 262 / 0.9)"
  halo-in: "oklch(12% 0.01 262 / 0.55)"
  green: "oklch(44% 0.120 155)"
  green-stage: "oklch(76% 0.170 150)"
  amber: "oklch(47% 0.120 62)"
  amber-stage: "oklch(83% 0.150 82)"
  red: "oklch(48% 0.190 27)"
  red-stage: "oklch(69% 0.205 27)"
  blue: "oklch(46% 0.150 255)"
  blue-stage: "oklch(74% 0.140 250)"
  violet: "oklch(46% 0.170 330)"
  violet-stage: "oklch(74% 0.150 330)"
  grey: "oklch(45% 0.012 250)"
  grey-stage: "oklch(82% 0.010 250)"
  on-solid: "oklch(99% 0 0)"
typography:
  headline:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 680
    lineHeight: 1.22
    letterSpacing: "-0.015em"
  title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 650
    lineHeight: 1.35
    letterSpacing: "-0.005em"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
  body-small:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.4
  badge-number:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tnum"
  mono:
    fontFamily: "ui-monospace, SF Mono, Menlo, Consolas, monospace"
    fontSize: "0.9em"
rounded:
  kbd: "4px"
  code: "5px"
  row: "6px"
  r: "8px"
  r-lg: "14px"
  pill: "999px"
spacing:
  s1: "4px"
  s2: "8px"
  s3: "14px"
  s4: "20px"
  s5: "32px"
  s6: "52px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.r}"
    padding: "0 16px"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r}"
    padding: "0 16px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-2}"
  category-chip:
    textColor: "{colors.green}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "2px 10px 2px 7px"
  category-chip-solid:
    backgroundColor: "{colors.red}"
    textColor: "{colors.on-solid}"
    rounded: "{rounded.pill}"
  risk-block:
    rounded: "{rounded.r}"
    padding: "8px 14px"
  aside-note:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-2}"
    typography: "{typography.body-small}"
    rounded: "{rounded.r}"
    padding: "14px"
  aside-warn:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-small}"
    rounded: "{rounded.r}"
    padding: "14px"
  step-row:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.row}"
    padding: "5px 7px"
  step-row-current:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
  stage:
    backgroundColor: "{colors.stage}"
    rounded: "{rounded.r-lg}"
  zone-badge:
    backgroundColor: "{colors.green-stage}"
    textColor: "{colors.stage}"
    typography: "{typography.badge-number}"
    rounded: "{rounded.pill}"
    height: "26px"
---

# Design System: ROOMTOUR

## Overview

**Creative North Star: "The Lit Room"**

A tour page is a dark room with one lamp. The screenshot sits on a near-black stage, the camera glides to one zone, everything else drops into shadow, and the lit zone carries an outline in the colour, line style and icon of its category. Beside the room, a calm paper-white reading panel says what the zone is and what a click on it does, in plain words. The page around the stage is quiet so the toured interface is the only loud thing on screen.

The system is built for reading, not for persuading. There is one accent (a near-black graphite for movement through the tour: the Next button, the chapter progress, links), one family of six category tones that exist only to sort zones by consequence, and warm, barely tinted neutrals (hue 95) on the page against a cool blue-black stage (hue 262). Density is moderate: a 17px body at 1.55 line height, a 62ch measure, and the panel capped at 27rem or 40% of the width.

Everything is local and dependency-free: system font stacks, inline SVG icons drawn at a 2px stroke, no web fonts, no images other than the captured screens.

**Key Characteristics:**
- Dark lightbox stage in both page themes; the page itself follows light or dark.
- One zone at a time: camera glide, spotlight with a dark halo, a numbered badge.
- Categories carry four redundant signals: icon, words, line style, tint.
- One global step number across chapters, the same on the badge, the step list and the counter.
- One accent for navigation; category tones never double as interface colour.

## Colors

Warm paper neutrals on the page, a cool blue-black stage, one graphite accent, and six category tones that each come in a page shade, a stage shade and a soft tint.

### Primary
- **Tour Ink** (accent): the way forward. The Next button fill, the chapter progress fill, the focus ring, source links and the inline code token's text. A neutral graphite (`oklch(26% 0.015 262)`, white text at 15:1), so it never reads as a category: the blue category tone sits ΔE 24 away. Turns near-white (`oklch(93% 0.006 250)`, dark text at 15:1) in dark theme.

### Neutral
- **Paper** (bg): the page behind the stage.
- **Sheet** (surface): masthead, panel, nav bar, chip backing inside the risk block.
- **Shade** (surface-2): hover and current-row fill, the note aside, kbd keys.
- **Rule** (line): every hairline border and the empty chapter bar.
- **Ink, Ink 2, Ink 3** (ink, ink-2, ink-3): body text; secondary text (note asides, `via` line, rows at rest); quiet labels (legend label, list headings, counter, source line, foot).

### Stage
- **Lightbox** (stage): the stage background, the same near-black in both themes (one step darker in dark theme so it still reads as a recess).
- **Stage Rule, Stage Ink** (stage-line, stage-ink): the stage's inner hairline; text of the stage's empty and error notices and the badge hover ring.
- **Dimmer** (stage-dim): the 70% blue-black wash over everything outside the lit zone.
- **Halo** (halo, halo-in): the dark rings outside and inside every outline, so a bright outline holds on a white screenshot too.

### Category tones
Six tones: green, amber, red, blue, violet, grey. Each has a page shade (`--c`: chip text, solid fill), a stage shade (`--c-stage`: the outline and badge on the dark stage) and a soft tint (`--c-soft`, 13% of the tone into the surface: chip, mark and risk-block backgrounds). Violet sits at hue 330, away from blue, so the two stay apart for colour-blind readers.

### Named Rules
**The One Job Rule.** Colour sorts zones by what a click does. Nothing else on the page is coloured except the navigation accent.

**The Never Colour Alone Rule.** A category always shows icon + words + line style + tint together, on the stage outline, the chip, the step-row mark and the risk block. Line styles are solid, dashed, dotted and double, and a category keeps the same one everywhere.

**The Red Line Rule.** Red is reserved for "can't undo, reaches real users, or data leaves". It goes with the alert icon, the double line and the solid chip. Never use red for an ordinary or merely important zone.

## Typography

**Body Font:** the platform's system sans (ui-sans-serif, system-ui, then -apple-system, Segoe UI, Roboto).
**Label/Mono Font:** the platform's system mono (ui-monospace, SF Mono, Menlo, Consolas) for file names, branches and code paths.

**Character:** native and legible. The text reads like the operating system the reader already knows, so attention goes to the screenshot.

### Hierarchy
- **Headline** (680, 24px, 1.22, -0.015em; 21px under 860px): the step title, balanced wrap. One per step.
- **Title** (650, 17px, 1.35): the masthead tour title; the subtitle follows in Ink 3 at 450 after a middle dot.
- **Body** (400, 17px, 1.55, max 62ch): the step explanation. On-screen control names are set in 650 weight, exactly as on screen.
- **Body small** (400, 15px, 1.45): the risk note, asides, the `via` line, buttons (600).
- **Label** (600, 13px, sentence case): chips, the legend label, the "Zones on this screen" and "Steps in …" list headings, the source line (400). Row text is 14px.
- **Badge number** (700, 13px, tabular figures; 11px on a narrow stage): the zone number on the stage.

### Named Rules
**The Sentence Case Rule.** Every label, chip and list heading is sentence case at normal tracking. No uppercase, no letter-spaced small caps.

**The Tabular Count Rule.** Step numbers, the badge and the "6 of 18" counter use tabular figures so they do not jitter as the reader moves.

## Layout

Two columns on a full-height grid: the stage takes the flexible column, the panel a fixed `min(27rem, 40vw)` on the right. The masthead spans both. The chapter strip sits above the stage, one segment per chapter, each as wide as its share of steps, with a 3px bar that fills in Tour Ink as the reader moves; it scrolls sideways with edge fades when it overflows.

Spacing steps are 4, 8, 14, 20, 32 and 52px (`--s1` to `--s6`). Panel blocks use 20px sides; lists and rows use 1px gaps between rows.

Under 1100px the legend wraps to its own line. Under 860px the page becomes one column: the stage sticks to the top at 40% of the viewport height (at least 16rem) and the text scrolls under it; the keyboard hint is hidden. On short screens under 860px wide and 560px tall the stage stops sticking and takes 70% of the height. Coarse pointers get 44px targets on buttons, rows and chapter tabs.

The panel holds, top to bottom: step title, risk block, body, source line, the chapter's step list, the foot (first step and cheat sheet only), and a sticky nav bar.

## Elevation & Depth

Flat page, deep stage. The page is layered by tone (Paper, Sheet, Shade) and hairlines, never by shadow. Depth belongs to the stage alone: it is a recess with an inner 1px Stage Rule ring and one soft drop shadow beneath, and inside it the dimmer and halo make the lit zone come forward.

### Shadow Vocabulary
- **Stage recess** (`inset 0 0 0 1px stage-line, 0 10px 30px -18px oklch(10% 0.02 262 / 0.6)`): the stage only.
- **Spotlight** (inner halo-in ring, outer 4px halo ring, then a 9000px stage-dim spread): the lit zone. Its colour outline is drawn as an `outline` in the category's stage shade and line style, 3px (4px for double).
- **Badge lift** (`0 0 0 1.5px halo, 0 2px 6px oklch(5% 0.01 262 / 0.6)`): the zone number on the stage.

### Named Rules
**The Dark Lightbox Rule.** The stage is near-black in both page themes, so any screenshot reads the same and every outline keeps its contrast. Never make the stage follow the page theme.

**The Constant Mark Rule.** Outlines, rings and badges are scaled by the inverse of the camera zoom, so they keep one on-screen size at any zoom.

## Shapes

Gentle rounding that tightens with size: 4px kbd keys, 5px inline code, 6px rows and chapter tabs, 8px buttons, risk blocks, asides and the spotlight, 14px for the stage. Chips, marks and badges are full pills or circles. Borders are 1px hairlines in Rule; category borders are 1.5px (3px for double) in the tone at 55% strength, in the category's line style.

## Components

### Buttons
- **Shape:** gently rounded (8px), 40px tall (44px on touch), 16px sides, 15px text at 600, icon and word together.
- **Primary (Next, Start over):** Tour Ink fill, on-accent text; hover lightens the graphite (`--accent-hover`: 36%, or 84% in dark theme); text stays above 10:1.
- **Secondary (Back):** Sheet fill, Rule border, Ink text; hover to Shade. Disabled at 45% opacity.
- **Transitions:** background and border colour, 120ms ease-out.

### Category chip and mark
- **Chip:** pill, soft tint fill, tone text, 1.5px border in the tone and the category's line style, icon before the words. In the legend, the risk block, cheat-sheet body and inline in text.
- **Solid chip:** tone fill with on-solid text, for the highest-consequence category only (see The Red Line Rule).
- **Mark:** a 22px circle with the icon alone, same tint, border and line style; closes each step row. The row's words carry the meaning.

### Risk block
What a click does, directly under the step title: the category chip and one note sentence on the soft tint, with a 1px border in the tone at 50% and the category's line style, 8px radius.

### Asides
- **Note** (`note(label, text)`): Shade fill, Ink 2 text, a bold label first.
- **Warn** (`warn(label, text)`): Sheet fill, a Rule border, the alert icon in Ink 2, Ink text. A caution adds no new colour.

### Stage, camera and spotlight
The camera glides to frame each zone (680ms base on an expo-out curve, scaled between 0.5 and 0.9 by the distance travelled, so short hops are quick). A new screenshot cuts in and fades up over 180ms. The spotlight dims everything outside the zone and draws the category outline; the numbered badge sits beside the zone (right, left, top, bottom or inside) and keeps 26px on screen (18px on a narrow stage). Personal data is covered by blur boxes (9px blur, grey wash; solid grey in print). When a screenshot is missing the stage shows a centred notice in Stage Ink: a bold title and one sentence on what to do.

### Cheat-sheet map
One step outlines every zone of the scene at once without dimming, each with its number as a clickable badge (hover ring and focus ring in Stage Ink). The panel lists the same zones under "Zones on this screen" as step rows, and notes that other screens' zones live in their chapters.

### Step rows and list
One row style serves the chapter's step list and the cheat sheet's zones: number in tabular Ink 3, title, then the category mark. Hover and current rows take Shade; the current row is Ink at 600 and carries `aria-current`. The list heading is sticky at the top of its scroll area.

### Source line, via line, foot
- **Source line:** 13px Ink 3 under the body, "Source:" then screen, markup, documentation links in Tour Ink, code paths in mono, or "inferred … not checked".
- **Via line:** how the reader reached a new screen, shown once on arrival, 15px Ink 2 with a hairline under it.
- **Foot:** capture date, width and redaction note, 13px Ink 3.

### Navigation bar
Sticky at the panel's bottom: Back, a centred counter ("6 of 18" with a small "or ← →" kbd hint beneath), Next. Arrow keys move steps; every step has its own hash link.

### Masthead
Sheet bar with a hairline under it: optional icon and title on the left, the legend ("Categories" plus every chip, safest first) on the right.

### Motion and reduced motion
Under reduced motion the camera cuts (`--cam: 0ms`), the chapter fill stops animating, and only a 150ms fade of the outline and badge remains, so the change is still felt.

### Forced colours and print
In forced-colours mode the stage keeps its own colours; the chapter bar, its fill and current rows switch to system Canvas, Highlight and outlines. Print lays the page out in one column, hides navigation, gives the stage a 16:10 frame and prints blur boxes as solid grey.

## Do's and Don'ts

### Do:
- **Do** give every category an icon, a label, a line style and a tone, and keep the line style identical on outline, chip, mark and risk block.
- **Do** order categories safest first, and reserve red with the double line and solid chip for "can't undo, reaches real users, or data leaves".
- **Do** keep the stage near-black in both themes, with the halo beside every outline.
- **Do** number steps once across the whole tour and show that number on the badge, the row and the counter.
- **Do** keep feedback under reduced motion: cut the travel, keep the 150ms outline fade.
- **Do** keep chips, labels and headings in sentence case.

### Don't:
- **Don't** show a category by colour alone, or reuse a category tone as interface colour.
- **Don't** add a colour for cautions; `warn()` stays neutral with the alert icon.
- **Don't** let the stage follow the page theme or lose its dimmer and halo.
- **Don't** scale outlines and badges with the camera zoom; keep them at one on-screen size.
- **Don't** put shadows on page surfaces; depth belongs to the stage.
