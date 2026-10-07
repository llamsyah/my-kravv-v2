# MY KRAVV — Page Responsibilities

> Status: Draft v0.1  
> Depends on:
> - `01-product-foundation.md`
> - `02-core-user-journey.md`
> - `03-ai-behavior-spec.md`
> - `04-domain-model.md`
> - `05-mvp-scope.md`
> - `06-technical-architecture.md`
>
> Purpose:
> Define what each MY KRAVV page is responsible for, what should be visible there,
> what should remain hidden, and how the product stays simple even though the
> underlying reasoning model is rich.

---

# 1. Core UX Principle

MY KRAVV should not expose the database structure directly.

The backend may contain:

```text
Thoughts
Refinements
Reasoning Items
Evidence
Open Gaps
Challenges
Thesis Versions
AI Runs
Timeline Events
```

But the user should not feel like they are operating a database.

The product should feel like:

```text
What am I thinking about?
What do I still not know?
What changed?
What do I currently believe?
```

Core rule:

> **Pages should be organized around user intent, not table names.**

---

# 2. MVP Information Architecture

Recommended MVP navigation:

```text
Home
Companies
Settings
```

Inside a company:

```text
Company Workspace
├── Overview / Current View
├── Thinking
├── Open Gaps
├── Challenges
├── Thesis
└── Timeline
```

These do not need to become six separate pages immediately.

For MVP, several can live in one Company Workspace with progressive disclosure.

---

# 3. Global Navigation

Global navigation should be minimal.

Recommended:

```text
MY KRAVV
Home
Companies
Settings
```

Optional later:

```text
Journal
Portfolio
Learn
```

Do not add them before the features actually exist.

Avoid navigation like:

```text
Evidence
Reasoning
AI Runs
Snapshots
Research Queue
```

Those are internal concepts, not top-level destinations.

---

# 4. Home

## Primary Responsibility

Home answers:

> **What should I continue, and what have I been thinking about recently?**

Home should feel like a personal desk, not a financial terminal.

---

## Home Priority Order

Recommended visual priority:

```text
1. Continue where you left off
2. Quick Thought
3. Recent Thinking
4. Open Gaps
5. Recent Thesis / History activity
```

Optional later:

```text
Portfolio Snapshot
Thinking Evolution
```

---

## 4.1 Continue Where You Left Off

Shows the most relevant active company/thought.

Example:

```text
Continue where you left off

BBCA
Moat & Revenue Quality

2 open gaps
1 unresolved challenge

[Continue]
```

The purpose is continuity.

Do not show every active company.

---

## 4.2 Quick Thought

A universal raw-input entry point.

Example:

```text
What's on your mind?
[...................................]

[Save Thought]
```

If company is known from context, link automatically.

If not, user can choose company after or before saving.

The input should not require:

```text
category
framework
confidence
risk
thesis stage
```

before saving.

---

## 4.3 Recent Thinking

Shows recent meaningful activity.

Examples:

```text
BBCA — raw thought added
ASII — challenge conceded
TLKM — open gap resolved
BBCA — Thesis v1 locked
```

This is not an audit log.

It should be readable as a personal activity stream.

---

## 4.4 Open Gaps Summary

Shows a small number of unresolved questions.

Example:

```text
Open Gaps

BBCA
Is retention driven by switching cost or habit?

ASII
Is margin pressure temporary?
```

Do not overwhelm the homepage with every unresolved item.

---

## 4.5 What Home Must Not Become

Home must not become:

```text
live stock ticker
heatmap
watchlist terminal
news feed
portfolio P/L dashboard
AI chat homepage
analytics wall
```

Market data may exist later, but should not dominate the product identity.

---

# 5. Companies Page

## Primary Responsibility

Companies answers:

> **What companies have I explored, and what state is each one in?**

---

## Company List Item

Each company card/row may show:

```text
Company name
Ticker
Current state
Last activity
Latest thesis version
Open gaps count
```

Example:

```text
BBCA
Thesis Formed
Thesis v2
2 open gaps
Last activity: 2 days ago
```

---

## Supported Company States

Recommended display states:

```text
Exploring
Developing
Thesis Formed
Tracking
Reviewing
Archived
```

These are descriptive, not workflow gates.

---

## Companies Page Actions

Primary actions:

```text
Open Company
Create Company
Archive Company
```

Optional:

```text
Search
Filter by state
Sort by recent activity
```

Do not add complex market filters in MVP.

---

## What Companies Must Not Become

Do not turn Companies into:

```text
stock screener
market ranking table
performance leaderboard
valuation comparison engine
```

It is a personal archive index.

---

# 6. Company Workspace

## Primary Responsibility

Company Workspace answers:

> **What do I currently think about this company, what is still unresolved,
> and how did I get here?**

This is the center of MY KRAVV.

---

# 7. Company Header

Keep company header calm.

Possible content:

```text
BBCA
Bank Central Asia

State: Developing
Latest Thesis: v1
Last activity: Today
```

Primary actions:

```text
Add Thought
Add Evidence
Challenge
Create / Update Thesis
```

Do not overload header with:

```text
price chart
20 financial ratios
news ticker
buy/sell buttons
```

---

# 8. Company Overview / Current View

## Primary Responsibility

Show the user's latest understanding without forcing them to read the full history.

Possible sections:

```text
Current View
Key Uncertainties
Open Gaps
Latest Thesis
Recent Activity
```

---

## Current View

This should be a projection of current accepted reasoning.

Example:

```text
Current View

I currently think the company has strong recurring revenue,
but I am not yet convinced that retention is driven by a durable moat.
```

This may be generated from:

- accepted reasoning items,
- latest draft,
- latest locked thesis,
- unresolved uncertainty.

Do not make Current View a second independent source of truth.

---

# 9. Thinking Area

## Primary Responsibility

Show the user's actual thinking process.

This is where:

```text
Raw
Refined
Structured
```

can be explored.

---

## Recommended Thought Presentation

Each thought should clearly preserve layers:

```text
RAW
"customer kayaknya susah pindah..."

REFINED
"There may be customer stickiness..."

STRUCTURE
Assumption: switching friction may exist
Uncertainty: moat durability unknown
```

The user should be able to tell:

> what they originally wrote vs what AI helped produce.

---

## Thought Actions

Possible actions:

```text
Refine
Structure
Edit
Accept
Reject
Link Evidence
Challenge
```

Do not show every action all at once if it creates clutter.

Use contextual controls.

---

# 10. Evidence Surface

Evidence should be available inside the company workspace.

It does **not** require a full separate page in MVP.

Possible evidence item:

```text
Revenue increased 18% YoY

Source:
Q3 report

User interpretation:
Growth remains strong, but margin quality is unclear.
```

Evidence should visually separate:

```text
Source fact
User interpretation
```

---

# 11. Open Gaps Surface

## Primary Responsibility

Open Gaps answers:

> **What do I still not know?**

Example:

```text
Is margin pressure temporary or structural?

Status: Open
Created from: Challenge #3
```

Possible actions:

```text
Explore
Mark Answered
Keep Unresolved
Dismiss
```

---

## Open Gap Interaction

When user selects `Explore`:

do not open a complex form.

Open a raw input:

```text
What did you find?
```

The result can later be structured by AI.

---

# 12. Challenge Surface

## Primary Responsibility

Challenge answers:

> **What part of my reasoning has been questioned, and what did I do about it?**

---

## Challenge Card

Example:

```text
Challenge

You are using recurring revenue as evidence of switching cost.
Recurring revenue alone does not prove switching friction.

Why it matters:
This assumption is central to your moat thesis.
```

Actions:

```text
Defend
Research
Concede
Dismiss
Skip
```

---

## Resolved Challenge

Resolved challenges should remain visible in history.

Example:

```text
Resolved — Conceded

"I was treating recurring revenue as stronger moat evidence than it really was."
```

This is valuable reflection data.

Do not delete resolved challenges.

---

# 13. Thesis Area

## Primary Responsibility

Thesis answers:

> **What do I currently believe, and what did I believe before?**

---

## Thesis Draft

Editable.

Possible fields:

```text
Thesis text
Confidence
Biggest uncertainty
Biggest risk
What would change my mind
```

These should not all be mandatory.

---

## Locked Thesis

Example:

```text
Thesis v1
Locked: 7 Oct 2026

[View Snapshot]
```

Locked thesis should be clearly visually different from a draft.

No edit button.

Instead:

```text
Create Revision
```

---

## Thesis History

Display:

```text
v1
v2
v3
```

with:

```text
date
main change
confidence change
reason for revision
```

Deep comparison can come later.

---

# 14. Timeline

## Primary Responsibility

Timeline answers:

> **How did my thinking evolve?**

This may become one of the most valuable views over time.

---

## Timeline Example

```text
OCT 07
Raw thought added

OCT 08
AI refinement accepted

OCT 09
Challenge created

OCT 10
Open gap added

OCT 13
New evidence added

OCT 15
Thesis v1 locked
```

Timeline should prioritize meaningful events.

Do not show noisy technical events such as:

```text
AI request sent
schema validated
database row updated
```

---

# 15. Thought Detail / Focus Mode

A separate Thought page is optional.

If implemented, its responsibility is:

> **Focus on one thought without company-level noise.**

Possible content:

```text
Raw
Refined
Structure
Evidence links
Challenge
History
```

For MVP, this may be a side panel/modal instead of a page.

---

# 16. Thesis Snapshot View

A locked Thesis Version deserves a read-only view.

It should show what was known at the time:

```text
Thesis
Confidence
Supporting reasoning
Evidence snapshot
Open gaps
Challenge state
Timestamp
```

This view is historical.

Avoid mixing it with current live data unless clearly labeled.

---

# 17. Settings

## Primary Responsibility

Settings controls personal behavior and system preferences.

MVP sections:

```text
Account
AI Preferences
Guidance Mode
AI Usage / Budget
Data / Export (later)
```

---

## AI Preferences

Possible options:

```text
Guidance Mode:
More Guidance
Adaptive
Minimal Guidance
```

Optional later:

```text
Preferred writing language
Refine tone
Default challenge intensity
```

---

## AI Usage / Budget

Show:

```text
AI calls this month
Estimated cost
Configured monthly limit
```

Do not require the user to understand tokens deeply.

Advanced details may be expandable.

---

# 18. Empty States

Empty states matter because MY KRAVV is beginner-friendly.

Bad:

```text
No data.
```

Better:

```text
No thoughts yet.

Start with anything:
something you noticed,
something you don't understand,
or even a messy first impression.
```

---

# 19. First Company Experience

When a user opens a company with no data:

show:

```text
What do you currently know or think about this company?
```

Primary action:

```text
Write a raw thought
```

Secondary:

```text
Guide me
```

Do not show an empty enterprise dashboard.

---

# 20. AI Placement

AI should appear contextually.

Examples:

Inside thought:

```text
Refine
Structure
```

Inside reasoning:

```text
Challenge
```

When stuck:

```text
Guide me
```

Inside thesis history later:

```text
Compare
```

Do not place a giant permanent AI chat panel on every page.

---

# 21. AI Feedback Pattern

AI output should usually appear as:

```text
suggestion
draft
challenge
gap
comparison
```

not as authoritative system truth.

Use language and UI that preserves user control.

---

# 22. Page-to-Page Flow

Recommended basic navigation:

```text
Home
↓
Company
↓
Thought / Reasoning
↓
Thesis
↓
Timeline
```

But users may also:

```text
Home
↓
Quick Thought
↓
Select Company
↓
Save
```

or:

```text
Companies
↓
Company
↓
Open Gap
↓
Add Research
```

No single forced path.

---

# 23. Search

MVP search can remain simple.

Search:

```text
company name
ticker
thought text
thesis text
```

Advanced semantic search is later.

---

# 24. Responsive Behavior

The product should support desktop first but remain usable on tablet/mobile.

Priority:

```text
Desktop = full workspace
Tablet = compact workspace
Mobile = capture + review first
```

Mobile should especially make these easy:

```text
Quick Thought
Open Company
Read Thesis
Add Note
```

Do not try to reproduce dense desktop layouts on mobile.

---

# 25. Visual Density Principle

MY KRAVV should feel calmer than KRAVV-IENT.

Use:

```text
progressive disclosure
few high-priority actions
clear spacing
small amount of visible metadata
```

Avoid:

```text
dense tables
nested tabs everywhere
constant status chips
enterprise form layouts
```

---

# 26. Page Complexity Budget

Each page should answer one main question.

```text
Home:
What should I continue?

Companies:
What companies have I explored?

Company Workspace:
What do I currently think?

Open Gaps:
What don't I know yet?

Thesis:
What do I currently believe?

Timeline:
How did my thinking change?

Settings:
How should MY KRAVV behave for me?
```

If a page cannot be summarized with one question, it may be doing too much.

---

# 27. Progressive Disclosure

Example:

Company Workspace initially shows:

```text
Current View
Open Gaps
Recent Thinking
Latest Thesis
```

Then user expands:

```text
all evidence
all challenges
all reasoning items
full history
```

This keeps the default surface simple.

---

# 28. Avoid Entity-Driven UI

Do not create one page per database table.

Bad:

```text
Thoughts Page
Refinements Page
Reasoning Items Page
Evidence Links Page
AI Runs Page
```

Good:

```text
Company Workspace
```

that naturally presents the relevant pieces together.

---

# 29. MVP Route Concept

Possible route shape:

```text
/
  Home

/companies
  Company list

/companies/[companyId]
  Company Workspace

/companies/[companyId]/thesis/[versionId]
  Read-only Thesis Snapshot

/settings
  Settings
```

Optional:

```text
/thoughts/[thoughtId]
```

only if a dedicated focus view becomes useful.

---

# 30. Page Responsibilities Summary

## Home

```text
Continue
Capture
Recent activity
Open gaps summary
```

## Companies

```text
Browse
Create
Search
Open
Archive
```

## Company Workspace

```text
Current view
Thinking
Evidence
Open gaps
Challenges
Thesis
Timeline
```

## Thesis Snapshot

```text
Historical frozen view
```

## Settings

```text
Account
AI behavior
Budget
Preferences
```

---

# 31. What Is Deliberately Missing

Not part of MVP pages:

```text
Market
News
Portfolio
Social
Community
Learning curriculum
Analytics dashboard
Admin dashboard
```

These can be reconsidered later.

---

# 32. Design Constraints Derived From Product

Future visual design should preserve:

```text
Personal, not institutional
Calm, not terminal-like
Thinking-first, not market-first
AI-assisted, not AI-dominated
Historical, but not audit-log-looking
Structured, but not form-heavy
```

---

# 33. First Visual Design Target

When visual design begins, start with only:

```text
Home
Company Workspace
```

Reason:

These two surfaces define most of MY KRAVV's identity.

Do not design every future page at once.

---

# 34. Locked Page Decisions

Current direction:

```text
Minimal global navigation
Home is a personal desk
Quick Thought is globally important
Companies is an archive index, not screener
Company Workspace is the product center
Thought layers must preserve Raw / Refined / Structured
Open Gaps remain lightweight
Challenges stay visible after resolution
Locked thesis gets a read-only snapshot
Timeline shows meaningful history
Settings includes AI guidance + cost controls
AI appears contextually, not as a giant chatbot
Backend complexity must stay hidden by default
Progressive disclosure is preferred
No market terminal UI in MVP
```

---

## Next Document

`08-design-direction.md`

That document should define:

- visual personality,
- layout principles,
- color direction,
- typography,
- card/surface behavior,
- spacing,
- interaction feel,
- Home composition,
- Company Workspace composition,
- and what visual patterns to avoid.

After that, visual mockups can begin.
