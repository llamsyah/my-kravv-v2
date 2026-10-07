# MY KRAVV

> **A private AI-assisted investment reasoning workspace.**  
> Capture messy thoughts, structure them, challenge assumptions, and preserve how your thesis evolves over time.

MY KRAVV is a personal investment reasoning environment built around one principle:

> **Preserve the context behind a decision.**

It is not designed to tell the user what to buy or sell.  
It exists to help the user think more clearly, keep the original reasoning intact, and revisit how their view changed over time.

---

## Status

Current stage:

```text
Product documentation complete
Visual direction defined
Architecture defined
Database schema defined
AI behavior contracts defined
Implementation plan defined

Next:
Milestone 0 — project initialization
```

Current target:

```text
MY KRAVV v0.1 — Personal MVP
```

The MVP is intended for real personal use first, before expanding into broader product features.

---

# Core Product Loop

```text
Company
↓
Raw Thought
↓
AI Refine
↓
AI Structure
↓
Evidence / Open Questions
↓
AI Challenge
↓
Thesis Draft
↓
Locked Thesis Version
↓
Timeline / Review
```

The user remains the final decision-maker at every step.

---

# Product Philosophy

MY KRAVV follows a few non-negotiable ideas.

### Freeform first, structure second

The user should be able to write:

```text
valuasi sekarang keknya udh ga murah tapi manajemennya gue masih suka
```

without filling a form first.

Structure comes afterward.

---

### Raw thinking is preserved

AI must never silently replace what the user originally wrote.

The system distinguishes:

```text
USER RAW
AI REFINED
AI STRUCTURE
USER FINAL
LOCKED THESIS
```

---

### AI assists judgment — it does not replace it

AI may:

```text
Refine
Structure
Guide
Challenge
Compare
Reflect
```

AI may not:

```text
make the final investment decision
invent company facts
silently change historical reasoning
act as an autonomous stock picker
```

---

### Unknown is a valid state

MY KRAVV does not force fake completeness.

Valid states include:

```text
I don't know yet
Still researching
Unresolved
Insufficient evidence
```

---

### History matters

The value of MY KRAVV grows over time.

A good system should make it possible to answer:

```text
What did I believe?
Why did I believe it?
What changed?
What evidence changed my mind?
What did I still not know at the time?
```

---

# What MY KRAVV Is Not

MY KRAVV is not:

```text
a trading terminal
a stock screener
a broker
a social investing app
a market news dashboard
a portfolio automation engine
an institutional diligence platform
an autonomous investment agent
```

Those are outside the MVP.

---

# Relationship to KRAVV-IENT

MY KRAVV and KRAVV-IENT share the same deeper philosophy:

> **Preserve the context behind a decision.**

But they serve different environments.

```text
MY KRAVV
Individual
Personal company research
Reasoning
Thesis
Decision history
Personal review

KRAVV-IENT
Investment organization
Cases
Sources
Diligence
Analysis
Human review
Recommendation
Final decision
```

Visual relationship:

```text
KRAVV-IENT = intelligence / machinery / institutional
MY KRAVV   = reflection / growth / memory / personal
```

---

# Tech Stack

Current recommended MVP stack:

```text
Frontend / App Server
Next.js
React
TypeScript

Database
PostgreSQL
Supabase

Authentication
Supabase Auth

AI
OpenAI API
Server-side AI Gateway

Validation
Zod

Deployment
Vercel + Supabase
```

The architecture intentionally avoids unnecessary complexity.

Not needed for MVP:

```text
microservices
Kafka
dedicated vector database
Kubernetes
multi-agent orchestration
full event sourcing
```

---

# High-Level Architecture

```text
Browser
   │
   ▼
Next.js Application
   │
   ├── Auth / Authorization
   │
   ├── Domain Logic
   │
   ├── PostgreSQL / Supabase
   │
   └── AI Gateway
          │
          ├── Context Builder
          ├── Prompt Registry
          ├── Model Router
          ├── Output Validator
          └── Cost Tracker
                 │
                 ▼
              OpenAI
```

Core rule:

> The browser never owns AI provider secrets.

---

# Repository Structure

Recommended repository layout:

```text
my-kravv/
├─ docs/
│  ├─ 01-product-foundation.md
│  ├─ 02-core-user-journey.md
│  ├─ 03-ai-behavior-spec.md
│  ├─ 04-domain-model.md
│  ├─ 05-mvp-scope.md
│  ├─ 06-technical-architecture.md
│  ├─ 07-page-responsibilities.md
│  ├─ 08-design-direction.md
│  ├─ 09-database-schema.md
│  ├─ 10-ai-prompt-contracts.md
│  └─ 11-implementation-plan.md
│
├─ public/
│  └─ visual-references/
│     ├─ README.md
│     ├─ desktop/
│     │  ├─ 01-home.png
│     │  ├─ 02-companies.png
│     │  ├─ 03-company-workspace.png
│     │  ├─ 04-thesis-snapshot.png
│     │  └─ 05-settings.png
│     │
│     └─ mobile/
│        ├─ 01-home.png
│        ├─ 02-companies.png
│        ├─ 03-company-workspace.png
│        ├─ 04-thesis-snapshot.png
│        └─ 05-settings.png
│
├─ src/
│  ├─ app/
│  ├─ components/
│  ├─ features/
│  ├─ domain/
│  ├─ server/
│  ├─ lib/
│  └─ tests/
│
├─ supabase/
│  ├─ migrations/
│  └─ seed.sql
│
├─ .env.example
├─ README.md
└─ package.json
```

The exact source structure may evolve.

Do not create empty abstraction layers only to match this tree.

---

# Documentation Map

The documentation is intentionally split by responsibility.

## `01-product-foundation.md`

Read when you need to understand:

```text
what MY KRAVV is
who it is for
product philosophy
what it must not become
```

---

## `02-core-user-journey.md`

Read when implementing:

```text
user flow
capture
open gaps
challenge responses
thesis lifecycle
adaptive guidance
```

---

## `03-ai-behavior-spec.md`

Read when working on:

```text
AI behavior
AI boundaries
context
memory
cost
prompt testing
```

---

## `04-domain-model.md`

Read when working on:

```text
domain entities
relationships
historical meaning
thesis vs decision
evidence vs interpretation
```

---

## `05-mvp-scope.md`

Read before adding a feature.

It defines:

```text
what belongs in MVP
what is optional
what is deliberately deferred
```

---

## `06-technical-architecture.md`

Read when working on:

```text
backend
auth
database access
AI Gateway
Context Builder
security
deployment
```

---

## `07-page-responsibilities.md`

Read when implementing UI.

It defines:

```text
what each page should show
what each page must not become
information hierarchy
navigation
```

---

## `08-design-direction.md`

Read before implementing visual UI.

It defines:

```text
Hybrid KRAVV visual DNA
colors
typography
density
spacing
cards
mobile behavior
anti-AI-slop rules
```

Visual references support this document.

They do not replace it.

---

## `09-database-schema.md`

Read before:

```text
writing migrations
adding tables
changing ownership
changing historical data behavior
```

---

## `10-ai-prompt-contracts.md`

Read before working on any AI role:

```text
Refine
Structure
Guide
Challenge
Compare
Reflect
```

Prompt wording may change.

Behavioral contracts should not.

---

## `11-implementation-plan.md`

Read when planning development work.

It defines:

```text
milestones
build order
feature slices
testing checkpoints
Codex task boundaries
deployment sequence
```

---

# Documentation Priority

If documents appear to conflict, use this priority:

```text
1. Product Foundation
2. Core User Journey
3. AI Behavior / Prompt Contracts
4. Domain Model
5. MVP Scope
6. Database Schema
7. Page Responsibilities
8. Design Direction
9. Visual References
10. Developer convenience
```

Do not silently change a product rule to make implementation easier.

If a documented decision must change:

```text
update documentation first
then implementation
```

---

# Visual Direction

MY KRAVV uses the:

```text
Hybrid KRAVV
```

visual direction.

Core traits:

```text
deep ink / navy foundation
muted mineral-green accent
dark atmospheric landscape
editorial serif + modern sans-serif
continuous workspace
low visual noise
restrained cards
progressive disclosure
```

The interface should feel like:

> **a private editorial research notebook with KRAVV precision.**

It should not feel like:

```text
generic SaaS
neon fintech
Bloomberg terminal
AI chatbot
Notion clone
glassmorphism showcase
```

See:

```text
docs/08-design-direction.md
public/visual-references/
```

---

# Product Language

Default application language:

```text
Bahasa Indonesia
```

English may remain where natural:

```text
moat
margin
revenue
pricing power
switching cost
company names
source titles
```

The user should not have to translate their reasoning into professional English just to use the app.

---

# Core Domain Concepts

MVP domain:

```text
User
Company
Thought
Refinement
Reasoning Item
Evidence
Open Gap
Challenge
Challenge Response
Thesis Draft
Thesis Version
AI Run
Timeline Event
```

Deferred:

```text
Decision
Transaction
Portfolio Position
Review
Document
Reflection Report
Market Snapshot
```

---

# AI Roles

MY KRAVV uses dedicated AI roles.

```text
REFINE
Make wording clearer without changing meaning.

STRUCTURE
Extract reasoning components from freeform thinking.

GUIDE
Help the user continue when genuinely stuck.

CHALLENGE
Test reasoning for material weaknesses.

COMPARE
Compare historical thesis states.

REFLECT
Help the user learn from accumulated reasoning history.
```

Do not replace these with one generic mega-chat prompt.

---

# Data Integrity Rules

Non-negotiable:

```text
Raw thought must remain preserved.

AI suggestion is not user judgment.

Evidence is not interpretation.

Locked thesis cannot be edited.

Unknown is a valid state.

History should be append-oriented.

Every private record belongs to a user.
```

---

# Security Baseline

MY KRAVV stores private reasoning.

Minimum security:

```text
HTTPS
Supabase Auth
server-side authorization
Row Level Security
private-by-default data
server-side AI keys
input validation
structured output validation
rate limiting
privacy-aware logging
backup strategy
```

Hiding something in the UI is not authorization.

---

# AI Cost Philosophy

AI is intentionally explicit.

AI should run when the user requests actions such as:

```text
Rapikan
Strukturkan
Tantang
Panduan
```

Do not run AI:

```text
on every keystroke
on every page load
for deterministic sorting
for simple counts
for normal database formatting
```

Track:

```text
model
prompt version
input tokens
output tokens
estimated cost
status
```

The manual workspace must continue to work if AI is unavailable or the personal budget limit is reached.

---

# Local Development

## Requirements

Recommended:

```text
Node.js 20+
npm / pnpm
Supabase project
OpenAI API key
```

---

## Install

```bash
npm install
```

---

## Environment

Create:

```text
.env.local
```

Minimum variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

OPENAI_API_KEY=
```

Never commit real secrets.

An `.env.example` should contain variable names only.

---

## Run

```bash
npm run dev
```

Then open the local Next.js development URL shown in the terminal.

---

# Database Migrations

All schema changes must use migrations.

Expected location:

```text
supabase/migrations/
```

Do not manually patch production schema.

Suggested migration order is documented in:

```text
docs/09-database-schema.md
```

---

# Testing

Minimum test categories:

```text
Unit tests
Integration tests
RLS / ownership tests
AI regression tests
Critical browser / E2E tests
```

Especially important:

```text
raw thought preservation
cross-user isolation
thesis immutability
AI output validation
AI failure fallback
cost tracking
```

---

# Working With Codex

Do not ask Codex:

```text
Build MY KRAVV.
```

Use bounded tasks.

Recommended format:

```text
TASK:
Implement [feature].

READ FIRST:
- docs/[relevant docs]

GOAL:
[one clear outcome]

MUST:
- [...]
- [...]

MUST NOT:
- [...]
- [...]

ACCEPTANCE CRITERIA:
- [...]
- [...]

TESTS:
- [...]
```

See:

```text
docs/11-implementation-plan.md
```

for the full task strategy.

---

# Recommended Build Order

```text
00 Project setup
01 Authentication
02 Companies
03 Raw Thoughts
04 Timeline base
05 AI Gateway
06 AI Runs + Cost
07 Refine
08 Structure
09 Reasoning Items
10 Open Gaps
11 Evidence
12 Challenge
13 Challenge Responses
14 Thesis Draft
15 Thesis Lock
16 Thesis Snapshot
17 Timeline refinement
18 Home
19 Companies polish
20 Company Workspace polish
21 Settings
22 Mobile pass
23 Security hardening
24 Cost guard
25 Accessibility
26 Deployment
27 Real-use validation
```

---

# MVP Validation

Before expanding scope, use MY KRAVV on:

```text
3–5 real companies
over several weeks
```

Ask:

```text
Do I return to old reasoning?
Does Challenge actually help?
Are Open Questions useful?
Does thesis locking feel natural?
Can I understand why my view changed?
Does the UI stay calm?
Is AI cost reasonable?
Do I want to keep using it?
```

If the core loop is weak:

```text
fix the core loop
```

Do not add more features.

---

# Deferred Features

Do not add yet:

```text
portfolio automation
broker integration
live market feeds
social publishing
team collaboration
autonomous research agents
document ingestion
semantic retrieval
advanced reflection
institutional workflow
```

These may be revisited after the personal MVP proves itself.

---

# Current Documentation Set

```text
01 Product Foundation
02 Core User Journey
03 AI Behavior Spec
04 Domain Model
05 MVP Scope
06 Technical Architecture
07 Page Responsibilities
08 Design Direction
09 Database Schema
10 AI Prompt Contracts
11 Implementation Plan
```

The project is now documented deeply enough to begin implementation.

---

# Next Step

```text
Create repository
↓
Copy docs
↓
Copy visual references
↓
Initialize Next.js + Supabase
↓
Begin Milestone 0
```

---

## MY KRAVV

> **Think freely. Preserve the reasoning. Revisit the decision.**
