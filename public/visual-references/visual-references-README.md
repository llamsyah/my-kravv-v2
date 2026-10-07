# Visual References — MY KRAVV

> Purpose:  
> Explain how to use the visual reference images inside `public/visual-references/`
> so implementation stays aligned with MY KRAVV's design direction.

These images are:

```text
directional references
```

They are **not**:

```text
pixel-perfect specs
ready-made UI kits
strict layout blueprints
exact content/data requirements
```

---

# Folder Structure

Recommended structure:

```text
public/
└─ visual-references/
   ├─ README.md
   ├─ desktop/
   │  ├─ 01-home.png
   │  ├─ 02-companies.png
   │  ├─ 03-company-workspace.png
   │  ├─ 04-thesis-snapshot.png
   │  └─ 05-settings.png
   │
   └─ mobile/
      ├─ 01-home.png
      ├─ 02-companies.png
      ├─ 03-company-workspace.png
      ├─ 04-thesis-snapshot.png
      └─ 05-settings.png
```

---

# How To Read These References

The references are meant to communicate:

```text
overall mood
visual hierarchy
layout direction
density
surface treatment
typography relationship
section separation
mobile vs desktop behavior
```

They are **not** meant to lock:

```text
fake sample data
exact spacing values
exact component sizes
exact copywriting
exact icon choice
exact implementation details
```

Use the images together with:

```text
docs/07-page-responsibilities.md
docs/08-design-direction.md
```

Those docs define the product and visual rules.
The images only help show the direction.

---

# Global Rules

## 1. Design DNA first

Always preserve:

```text
Hybrid KRAVV
deep ink / navy foundation
muted mineral-green accent
dark atmospheric background
editorial serif + modern sans
continuous workspace feel
low visual noise
restrained card usage
Bahasa Indonesia default
```

---

## 2. Do not turn MY KRAVV into generic AI dashboard UI

Avoid drifting into:

```text
neon fintech
card-grid overload
chatbot-first product
terminal-style market dashboard
AI copilot showcase
heavy glassmorphism
fake analytics dashboard
```

---

## 3. Continuous workspace > too many cards

The product should feel like:

```text
a personal research notebook
```

not:

```text
a dashboard made of boxes
```

Use spacing, typography, dividers, and clear hierarchy first.

---

## 4. Mobile is not desktop stacked vertically

For mobile:

```text
reduce density
show one priority at a time
use progressive disclosure
preserve calm reading flow
```

Do not simply squeeze desktop into one narrow column.

---

## 5. Final implementation may improve the reference

Codex may improve:

```text
spacing
alignment
responsiveness
accessibility
component consistency
interaction details
form ergonomics
```

But it must preserve:

```text
product hierarchy
page purpose
visual tone
density philosophy
MY KRAVV identity
```

---

# Reference Map — Desktop

## `desktop/01-home.png`

Primary purpose:

```text
Master reference for overall MY KRAVV desktop feel.
```

Use it for:

```text
top navigation
atmosphere
hero / intro area
overall typography relationship
mineral-green accent behavior
Home hierarchy
continuous workspace feel
```

Do not copy literally:

```text
sample text
sample data
exact card sizes
```

Home should feel like:

```text
a personal desk
```

It should highlight:

```text
continue from last work
quick thought
recent thinking
open questions
recent thesis activity
```

---

## `desktop/02-companies.png`

Primary purpose:

```text
Reference for the Companies page / archive index.
```

Use it for:

```text
company list treatment
archive-like browsing
status presentation
last-activity feeling
private-research mood
```

Do not interpret it as:

```text
stock screener
watchlist terminal
ranked market board
```

The page should feel like:

```text
a private archive of ongoing company thinking
```

---

## `desktop/03-company-workspace.png`

Primary purpose:

```text
Reference for the Company Workspace page.
```

Use it for:

```text
page hierarchy
company identity placement
current view / active reasoning
relationship between thought, open questions, and thesis
workspace atmosphere
```

Important:

```text
final implementation should be less dense where necessary
```

Do not copy every visible content block one-to-one.

The page should feel like:

```text
a living thought document
```

not:

```text
a dense finance terminal
```

---

## `desktop/04-thesis-snapshot.png`

Primary purpose:

```text
Reference for locked historical thesis presentation.
```

Use it for:

```text
historical seriousness
read-only feel
snapshot framing
clarity of locked thesis state
```

This page should communicate:

```text
this is a preserved belief at a point in time
```

It should feel more permanent than a normal note.

---

## `desktop/05-settings.png`

Primary purpose:

```text
Reference for utility / configuration surfaces.
```

Use it for:

```text
layout simplicity
clean settings grouping
quiet utility feeling
AI settings organization
budget / preference controls
```

This page should be the most utilitarian surface.

Do not over-dramatize it visually.

---

# Reference Map — Mobile

## `mobile/01-home.png`

Primary purpose:

```text
Reference for mobile Home.
```

Use it for:

```text
single-column flow
brand/header treatment
continue section
quick thought visibility
home information priority
bottom navigation feel if used
```

The mobile Home should feel:

```text
calm
personal
easy to continue from
```

Avoid:

```text
tiny desktop clone
horizontal carousel-heavy design
overpacked widgets
```

---

## `mobile/02-companies.png`

Primary purpose:

```text
Reference for mobile Companies.
```

Use it for:

```text
archive list flow
compact company item rhythm
search/filter placement
one-column browsing behavior
```

The mobile Companies page should feel like:

```text
a clean list of tracked company workspaces
```

not:

```text
a mobile stock market app
```

---

## `mobile/03-company-workspace.png`

Primary purpose:

```text
Reference for mobile Company Workspace.
```

Use it for:

```text
distilled workspace hierarchy
reduced density
section priority
breathing room
mobile reading comfort
```

Important rule:

```text
This page must stay lighter and more focused than desktop.
```

Use it as the approved version for mobile workspace direction.

Do not use discarded older experiments that felt too dense or too AI-generated.

---

## `mobile/04-thesis-snapshot.png`

Primary purpose:

```text
Reference for mobile Thesis Snapshot.
```

Use it for:

```text
readability
historical context
compact but serious presentation
mobile-friendly section rhythm
```

The user should be able to read and review a locked thesis comfortably on mobile.

---

## `mobile/05-settings.png`

Primary purpose:

```text
Reference for mobile Settings.
```

Use it for:

```text
grouped utility controls
simple one-column settings layout
mobile readability
quiet utility tone
```

Again, this is a utility page, not a showcase page.

---

# Reference Priority

When using the images during implementation, use this priority:

```text
1. docs/08-design-direction.md
2. docs/07-page-responsibilities.md
3. this visual reference README
4. the image itself
5. implementation convenience
```

If an image seems to suggest something that conflicts with the documentation:

```text
documentation wins
```

---

# What The Images Should Control

They should influence:

```text
tone
composition direction
surface style
section rhythm
information priority
desktop/mobile difference
```

They should not control:

```text
database structure
domain model
AI behavior
exact page logic
backend architecture
```

---

# Data Inside The Mockups

Mockup content is illustrative.

That means:

```text
company names
sample numbers
sample text
thesis examples
question examples
```

are there to help show the page structure.

They are not product requirements.

Codex may replace mockup content with better representative placeholders during implementation.

---

# Approved Reference Set

Current approved set:

```text
Desktop
- 01-home.png
- 02-companies.png
- 03-company-workspace.png
- 04-thesis-snapshot.png
- 05-settings.png

Mobile
- 01-home.png
- 02-companies.png
- 03-company-workspace.png
- 04-thesis-snapshot.png
- 05-settings.png
```

These are the primary visual references.

---

# Rejected / Not Primary References

Do not keep every exploration image in the main reference folder.

Especially avoid using discarded experiments that were:

```text
too dense
too text-heavy
too AI-looking
too much like generic finance SaaS
too close to desktop stacked vertically
```

Keep only curated, approved references in `public/visual-references/`.

If needed, old explorations may be stored elsewhere, but they should not become primary guidance.

---

# Suggested Usage Workflow For Codex

When implementing a screen:

## Example — Company Workspace

Read:

```text
docs/07-page-responsibilities.md
docs/08-design-direction.md
public/visual-references/README.md
```

Then inspect:

```text
public/visual-references/desktop/03-company-workspace.png
public/visual-references/mobile/03-company-workspace.png
```

Then build:

```text
same product intent
same page responsibility
same visual tone
better implementation quality
```

This should be the standard workflow for every page.

---

# One-Line Summary Per Surface

## Desktop

```text
01-home.png
= master desktop visual DNA

02-companies.png
= private research archive index

03-company-workspace.png
= living company thought workspace

04-thesis-snapshot.png
= locked historical thesis view

05-settings.png
= clean utility / preference surface
```

## Mobile

```text
01-home.png
= calm mobile entry / continue screen

02-companies.png
= compact company archive list

03-company-workspace.png
= distilled mobile workspace

04-thesis-snapshot.png
= mobile locked-thesis reading view

05-settings.png
= mobile utility settings
```

---

# Final Reminder

These visual references exist to answer:

```text
"What should MY KRAVV feel like?"
```

They do not exist to answer:

```text
"What exact pixel should this component use?"
```

Implementation should stay faithful to the product and visual DNA while still making sensible improvements.

---

## Short Rule

> Build from the docs, use the images as direction, and keep MY KRAVV feeling personal, calm, and structurally clear.
