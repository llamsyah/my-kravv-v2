# MY KRAVV — Design Direction

> Status: Draft v0.1  
> Depends on:
> - `01-product-foundation.md`
> - `02-core-user-journey.md`
> - `03-ai-behavior-spec.md`
> - `04-domain-model.md`
> - `05-mvp-scope.md`
> - `06-technical-architecture.md`
> - `07-page-responsibilities.md`
>
> Purpose:
> Lock the visual DNA, interaction tone, layout principles, and implementation
> constraints of MY KRAVV so the product can be implemented consistently
> without turning into generic AI-finance SaaS UI.

---

# 1. Design Position

MY KRAVV should feel like:

> **a private thinking environment for investment reasoning.**

It is not:

```text
a market terminal
a trading dashboard
a finance social app
a giant AI chatbot
a corporate analytics suite
a generic SaaS dashboard
```

The product should feel calm enough for reflection, structured enough for serious analysis,
and personal enough that the user can think naturally in it.

---

# 2. Visual DNA

Current direction:

```text
HYBRID KRAVV
```

Meaning:

```text
KRAVV-IENT DNA
+
personal / calmer visual treatment
+
mineral green identity
```

The relationship should feel familial, not identical.

---

# 3. Relationship to KRAVV-IENT

KRAVV-IENT:

```text
intelligence
diligence
institutional workflow
precision
machinery
decision infrastructure
```

MY KRAVV:

```text
reflection
personal judgment
growth
memory
reasoning
continuity
```

Shared DNA:

```text
deep dark foundation
serious tone
clean hierarchy
controlled accents
high information trust
```

Different expression:

```text
KRAVV-IENT = terminal / machine-like
MY KRAVV   = calm / reflective / personal
```

---

# 4. Color Direction

Primary foundation:

```text
Deep Ink
Blue-black
Muted navy
```

Primary accent:

```text
Mineral Green
Muted mint
Eucalyptus-like green
Oxidized metal green
```

The green should **not** look like:

```text
stock gain green
neon fintech green
crypto green
wellness pastel green
```

Use green for:

```text
active state
focus
current item
positive progress
selected control
primary action
reasoning thread nodes
```

Do not paint the whole interface green.

---

# 5. Suggested Color Roles

Exact values may be tuned during implementation.

Conceptual roles:

```text
Background / deepest:
near-black blue

Primary surface:
dark ink / navy

Secondary surface:
slightly lifted blue-black

Primary text:
soft off-white

Secondary text:
muted blue-grey

Hairline:
low-contrast blue-grey

Accent:
mineral green

Warning:
muted amber

Risk:
muted rose / red

Inactive:
desaturated slate
```

Avoid strong saturation.

---

# 6. Atmosphere

The visual references use a dark mountain / lake environment.

This is intentional.

The landscape represents:

```text
space
continuity
quiet
perspective
distance from market noise
```

It should function as:

> **an atmospheric layer, not wallpaper decoration.**

Rules:

- low contrast,
- darkened,
- integrated into the background,
- never compete with content,
- do not place decorative imagery behind dense reading areas,
- fade into plain dark surfaces where analysis becomes denser.

The app must still work visually if the image is removed.

---

# 7. Typography

Recommended personality:

```text
Editorial serif
+
neutral modern sans-serif
```

Use serif for:

```text
page title
hero question
major thesis statement
current view
important reflective statements
```

Use sans-serif for:

```text
navigation
metadata
buttons
labels
forms
status
supporting UI
dense reasoning content
```

This contrast is part of the MY KRAVV identity.

Avoid using serif everywhere.

---

# 8. Typography Behavior

Large headings should feel:

```text
quiet
confident
editorial
not oversized for spectacle
```

Body text should prioritize readability over visual drama.

Investment reasoning can become long.

Line length should remain comfortable.

---

# 9. Language

Default application language:

```text
Bahasa Indonesia
```

Reason:

MY KRAVV is primarily a personal reasoning environment.

The user should not need to translate their thinking into professional English
while analyzing.

Expected labels:

```text
Home                  → Beranda
Companies             → Perusahaan
Settings              → Pengaturan

Current View          → Pandangan Saat Ini
Thinking              → Pemikiran
Open Gaps             → Pertanyaan Terbuka
Evidence              → Bukti
Challenge             → Tantangan
Latest Thesis         → Tesis Terbaru
Recent History        → Riwayat Ringkas

Refined with KRAVV    → Dirapikan oleh KRAVV
Structure             → Struktur Pemikiran
Assumption            → Asumsi
Uncertainty           → Ketidakpastian
Interpretation        → Interpretasi

Defend                → Pertahankan
Research              → Telusuri
Concede               → Akui
Dismiss               → Abaikan
Skip                  → Lewati
```

English may appear naturally inside company names, source titles,
market terminology, or user-provided content.

---

# 10. Tone of Copy

Copy should feel:

```text
direct
calm
human
non-corporate
non-patronizing
```

Avoid:

```text
"Unlock smarter investment insights."
"Supercharge your investing."
"AI-powered alpha."
"Discover winning stocks."
```

Prefer:

```text
Apa yang sedang kamu pikirkan?

Mulai saja berantakan.
Nanti kita rapikan.

Masih ada 2 pertanyaan yang belum selesai.
```

---

# 11. Layout Philosophy

Default layout should feel like:

> **a continuous workspace, not a grid of cards.**

Separation should often come from:

```text
spacing
typography
hairline dividers
alignment
indentation
background plane
vertical rhythm
```

not:

```text
rounded box around everything
```

---

# 12. Card Rule

Cards are allowed.

Cards are not the default primitive.

Use a bounded container when:

```text
the object is interactive
the object has an independent state
the object needs clear containment
the user can act on it
the object represents a snapshot
```

Examples:

```text
Quick Thought composer
locked Thesis snapshot
active challenge
specific Evidence object
```

Avoid:

```text
card inside card inside card
every statistic in its own rectangle
four equal dashboard tiles
```

---

# 13. Corner Radius

Use restrained radii.

Avoid exaggerated SaaS-style bubbly components.

The product should remain mature and precise.

---

# 14. Borders

Hairline borders are important.

Use them for:

```text
section separation
subtle containment
column boundaries
input states
historical objects
```

Borders should be low contrast.

---

# 15. Shadows

Minimal.

Avoid floating white-card style shadows.

Dark surface depth should come primarily from:

```text
tonal contrast
border contrast
background layering
```

---

# 16. Glassmorphism

Use only lightly.

Do not make MY KRAVV a glassmorphism showcase.

Atmospheric transparency is acceptable around hero / navigation surfaces,
but dense reasoning content should prioritize readability.

---

# 17. Density

MY KRAVV must be less dense than KRAVV-IENT.

Default:

```text
breathable
editorial
progressively disclosed
```

Rich domain ≠ dense interface.

---

# 18. Progressive Disclosure

The system may contain:

```text
raw thought
refinement
structure
evidence
gap
challenge
thesis
history
```

Do not display every object at equal priority.

Default view should show:

```text
what matters now
```

Then allow expansion into:

```text
what happened before
what supports it
what remains unresolved
```

---

# 19. Interaction Feel

Interactions should feel:

```text
quiet
deliberate
predictable
responsive
```

Avoid flashy animations.

Recommended:

```text
soft opacity transitions
small position shifts
subtle underline movement
gentle expansion
focus highlight
```

No:

```text
large bouncing cards
neon glows
particle effects
AI sparkle overload
```

---

# 20. AI Visual Treatment

AI is an assistant layer.

AI should not own the page.

Do not permanently show:

```text
large AI chat sidebar
floating assistant avatar
constant suggestion bubbles
```

AI actions appear contextually:

```text
Rapikan
Strukturkan
Tantang
Panduan
Bandingkan
```

AI-generated content must remain visually distinguishable from original user thinking.

---

# 21. Raw vs AI vs User-Final

This distinction is important.

Suggested treatment:

```text
RAW
original user language

DIRAPIKAN OLEH KRAVV
AI-assisted wording

STRUKTUR PEMIKIRAN
AI-proposed structure

TESIS
user-approved / locked judgment
```

The UI should never visually imply that AI refinement is equivalent to the user's final judgment.

---

# 22. Home — Design Role

Home is:

> **a personal desk.**

Primary question:

```text
Di mana aku terakhir berhenti?
```

Home should show:

```text
Continue / current work
Quick Thought
Recent Thinking
Open Questions
Recent Thesis activity
```

It should not become:

```text
market dashboard
stock ticker
portfolio P/L wall
news feed
```

---

# 23. Home — Composition

Reference direction:

```text
Top navigation
↓
Atmospheric hero
↓
"Where did we leave off?"
↓
Current company / continuation object
↓
Quick Thought
↓
Recent Thinking + Open Loops
↓
Recent Thesis Activity
```

Default visual reference:

`08-ref-home-desktop.png`

This image is a **direction reference**, not a pixel specification.

---

# 24. Quick Thought

Quick Thought is a primary interaction surface.

It should feel like:

```text
a private writing space
```

not:

```text
an AI chat message box
```

Core behavior:

```text
freeform
company optional / selectable
save first
AI later
```

The user should be able to write:

```text
"valuasi sekarang keknya udh ga murah tapi manajemennya gue masih suka"
```

without filling any structured form.

---

# 25. Companies — Design Role

Companies is:

> **a personal research archive index.**

It is not:

```text
a stock screener
a financial ranking table
a market watchlist terminal
```

Show enough context to continue work.

Possible row content:

```text
Ticker
Company name
Current state
Short current thought
Latest thesis
Open questions
Last activity
```

Reference:

`08-ref-companies-desktop.png`

---

# 26. Company Workspace — Design Role

Company Workspace is:

> **a living thought document.**

It is the center of MY KRAVV.

Primary question:

```text
Apa yang saat ini aku pikirkan tentang perusahaan ini?
```

---

# 27. Company Workspace — Default Priority

Recommended priority:

```text
Company identity
↓
Pandangan Saat Ini
↓
Current active thought / reasoning thread
↓
Pertanyaan Terbuka
↓
Tesis Terbaru
↓
Riwayat
```

Not everything needs to be visible above the fold.

The visual reference may show more information than the final implementation.

Codex / implementation may reduce density while preserving hierarchy.

Reference:

`08-ref-company-workspace-desktop.png`

---

# 28. Reasoning Thread

Reasoning Thread may become a signature MY KRAVV pattern.

Concept:

```text
RAW
↓
DIRAPIKAN
↓
STRUKTUR
↓
BUKTI
↓
TANTANGAN
↓
TESIS / REVISI
```

A subtle vertical line / progression indicator may visually connect evolution.

This should communicate:

> **how thinking changed over time.**

Do not gamify it as a progress meter.

---

# 29. Open Questions

Open Questions should feel unresolved, not broken.

Use neutral language.

Avoid:

```text
Incomplete
Missing
Failure
Analysis 64%
```

Prefer:

```text
Pertanyaan Terbuka
Belum terjawab
Masih ingin ditelusuri
```

Uncertainty is a valid state.

---

# 30. Thesis Snapshot — Design Role

Thesis Snapshot is:

> **a frozen historical belief.**

It must visually feel more permanent than a normal note.

Show:

```text
version
locked state
date
thesis statement
key assumptions
risks
supporting evidence
open questions at lock time
formation history
```

Reference:

`08-ref-thesis-snapshot-desktop.png`

---

# 31. Thesis Immutability in UI

Locked thesis:

```text
no Edit button
```

Use:

```text
Buat Revisi
Bandingkan
Lihat Riwayat
```

instead.

The design should reinforce historical integrity.

---

# 32. Settings — Design Role

Settings should be the most utilitarian page.

It may contain:

```text
Account
AI Preferences
Guidance Mode
Challenge Intensity
Language
AI Usage & Budget
Privacy & Data
Appearance
```

Reference:

`08-ref-settings-desktop.png`

Settings should not inherit unnecessary editorial drama.

---

# 33. AI Preference Concepts

Possible controls:

```text
Mode Panduan
- Lebih Banyak
- Adaptif
- Minimal

Intensitas Tantangan
- Ringan
- Standar
- Mendalam
```

These settings tune AI behavior.

They do not change investment conclusions.

---

# 34. AI Usage / Budget

Show in human terms:

```text
estimated monthly cost
usage this month
personal limit
```

Avoid forcing the user to think in tokens unless they open advanced details.

If budget limit is reached:

```text
AI assistance pauses
manual workspace continues
```

---

# 35. Desktop Navigation

Recommended top-level:

```text
Beranda
Perusahaan
Pengaturan
```

Keep it minimal.

Do not expose domain entities globally.

---

# 36. Mobile Principle

Mobile is not:

> desktop scaled down.

Mobile should prioritize:

```text
capture
continue
read
review
```

over:

```text
show everything simultaneously
```

---

# 37. Mobile Home

Priority:

```text
Continue
Quick Thought
Open Questions
Recent Thinking
```

Recent Thesis activity may move lower.

Use one continuous column.

Avoid horizontal card carousels unless there is a clear reason.

---

# 38. Mobile Company Workspace

Priority:

```text
Company context
Current View
Active Thought
Open Questions
Latest Thesis
```

Reasoning history should expand progressively.

Avoid shrinking a desktop two-column workspace.

---

# 39. Mobile Navigation

Possible MVP pattern:

```text
top contextual header
+
minimal bottom navigation
```

or another native mobile pattern.

Implementation may choose the most usable solution.

Visual DNA matters more than reproducing desktop navigation exactly.

---

# 40. Responsive Rule

At smaller widths:

```text
columns collapse intentionally
metadata reduces
secondary actions move into overflow
long content remains readable
```

Do not simply wrap every desktop row until it becomes messy.

---

# 41. Empty States

Empty states should feel inviting.

Example:

```text
Belum ada pemikiran tentang perusahaan ini.

Tulis apa pun yang sudah kamu tahu,
curigai, atau belum kamu mengerti.
```

Primary:

```text
Tulis Pemikiran
```

Secondary:

```text
Bantu Aku Mulai
```

---

# 42. Loading States

Use:

```text
quiet skeletons
inline processing states
```

Avoid large spinners dominating the page.

For AI:

```text
Sedang merapikan...
Sedang menyusun struktur...
Sedang mencari titik yang layak ditantang...
```

---

# 43. AI Failure State

Failure should remain calm.

Example:

```text
KRAVV belum bisa memproses ini sekarang.

Catatanmu sudah tersimpan.
Kamu bisa lanjut secara manual atau coba lagi nanti.
```

Never make AI failure look like data loss.

---

# 44. Iconography

Use simple line icons.

Recommended traits:

```text
thin
precise
low-noise
consistent stroke
```

Avoid cartoon icons or excessive filled icon blocks.

---

# 45. Status Chips

Use sparingly.

Good:

```text
Berkembang
Terkunci
Meninjau
```

Bad:

a chip for every piece of metadata.

---

# 46. State Color

Do not encode meaning only by color.

Use:

```text
color + label
```

Example:

```text
● Berkembang
```

Accessibility remains important.

---

# 47. Accessibility

Implementation should preserve:

```text
readable contrast
keyboard navigation
visible focus
semantic headings
accessible controls
non-color-only states
comfortable type size
```

Visual references must not override accessibility.

---

# 48. Content Width

Long-form reasoning should have a controlled reading width.

Wide screens should not stretch paragraphs edge to edge.

Large screens may use empty space intentionally.

---

# 49. What Codex May Improve

Visual references are not pixel-perfect specifications.

Codex may improve:

```text
spacing
responsive behavior
accessibility
alignment
interaction details
component consistency
semantic HTML
animation timing
form ergonomics
```

provided it preserves:

```text
visual hierarchy
Hybrid KRAVV DNA
page responsibilities
density philosophy
language
interaction intent
```

---

# 50. What Codex Must Not Change Without Reason

Do not transform MY KRAVV into:

```text
generic SaaS dashboard
card grid
Bloomberg-like terminal
neon fintech interface
chatbot-first app
Notion clone
portfolio tracker
social investing product
```

Do not replace the visual language merely because a framework template is easier.

---

# 51. Reference Priority

When implementation details conflict, use this priority:

```text
1. Product Foundation
2. Page Responsibilities
3. AI Behavior Spec
4. Design Direction
5. Visual References
6. Developer convenience
```

Visual references support the documentation.

They do not override product rules.

---

# 52. Visual Reference Set

Current desktop references:

```text
08-ref-home-desktop.png
08-ref-companies-desktop.png
08-ref-company-workspace-desktop.png
08-ref-thesis-snapshot-desktop.png
08-ref-settings-desktop.png
```

These are intended to communicate:

```text
visual DNA
density
hierarchy
surface treatment
color mood
typography relationship
```

They are not intended to specify every pixel.

---

# 53. Reference Notes

## Home

Use as the strongest reference for:

```text
overall atmosphere
top navigation
hero treatment
mineral green accent
editorial typography
continuous workspace
```

## Companies

Use as reference for:

```text
archive/list treatment
status presentation
non-screener company browsing
```

## Company Workspace

Use as reference for:

```text
information hierarchy
thinking + open question relationship
reasoning evolution
```

But final implementation should be **less dense by default**.

## Thesis Snapshot

Use as reference for:

```text
historical permanence
locked state
thesis composition
```

Avoid excessive card segmentation in final implementation.

## Settings

Use as reference for:

```text
utility controls
AI preference organization
budget controls
```

Final implementation may simplify layout substantially.

---

# 54. Anti-AI-Slop Rules

Avoid common generated interface patterns:

```text
huge gradient blob
purple-blue neon gradient
four statistic cards
glass card everywhere
random sparkle icons
"AI Insight" panel
over-rounded controls
floating chatbot orb
marketing copy inside product workspace
meaningless dashboard charts
fake completion percentages
```

Every visual element must have a product reason.

---

# 55. Creative Signature

MY KRAVV should have identity beyond color.

Potential signature elements:

```text
editorial serif statements
continuous workspace
reasoning thread
atmospheric landscape
subtle mineral-green node system
historical thought evolution
```

Use them consistently but quietly.

---

# 56. Design Success Test

A successful MY KRAVV screen should make the user feel:

```text
"I know where I am."
"I know what I was thinking."
"I know what is still unresolved."
"I can continue without being overwhelmed."
```

It should not make the user think:

```text
"Where do I click?"
"Why are there 12 cards?"
"Why does this look like every AI dashboard?"
```

---

# 57. Locked Design Decisions

Current visual direction:

```text
Hybrid KRAVV visual DNA
Deep ink/navy foundation
Muted mineral-green accent
Dark atmospheric landscape
Editorial serif + modern sans
Bahasa Indonesia default
Continuous workspace over card grid
Low visual noise
Restrained radii
Hairline dividers
Progressive disclosure
Contextual AI actions
No chatbot-first interface
No market-terminal identity
Home = personal desk
Companies = private archive
Company Workspace = living thought document
Thesis Snapshot = frozen historical belief
Settings = clean utility surface
Desktop and mobile designed intentionally
Visual references are direction, not pixel specs
Codex may improve implementation while preserving product/design rules
```

---

# 58. Implementation One-Liner

> **Build MY KRAVV like a private editorial research notebook with KRAVV precision — not like a generated fintech dashboard.**

---

## Documentation Status

The core documentation set now covers:

```text
01 Product Foundation
02 Core User Journey
03 AI Behavior Spec
04 Domain Model
05 MVP Scope
06 Technical Architecture
07 Page Responsibilities
08 Design Direction
```

The next useful implementation documents would be:

```text
09-database-schema.md
10-ai-prompt-contracts.md
11-implementation-plan.md
```

These should be created only when implementation is ready to begin.
