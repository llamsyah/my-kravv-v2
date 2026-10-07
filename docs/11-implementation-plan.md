# MY KRAVV — Implementation Plan

> Status: Draft v0.1  
> Purpose: Turn the MY KRAVV product, domain, schema, AI contracts, and visual direction
> into an incremental build plan that Codex can execute without drifting from product intent.
>
> Depends on:
> - `01-product-foundation.md`
> - `02-core-user-journey.md`
> - `03-ai-behavior-spec.md`
> - `04-domain-model.md`
> - `05-mvp-scope.md`
> - `06-technical-architecture.md`
> - `07-page-responsibilities.md`
> - `08-design-direction.md`
> - `09-database-schema.md`
> - `10-ai-prompt-contracts.md`

---

# 1. Implementation Goal

Build the smallest MY KRAVV that proves this loop:

```text
Company
↓
Raw Thought
↓
AI Refine
↓
AI Structure
↓
Open Gap
↓
Challenge
↓
Thesis Draft
↓
Locked Thesis Version
↓
Timeline / History
```

The implementation should prioritize:

```text
correctness
clarity
privacy
history
AI discipline
cost visibility
usable UX
```

before:

```text
feature breadth
visual polish
automation
market data
portfolio tracking
advanced analytics
```

---

# 2. Build Philosophy

Use vertical slices.

Each slice should become usable before moving to the next.

Avoid:

```text
building all database tables first
building all UI first
building all AI prompts first
building every future feature before testing real workflow
```

Preferred pattern:

```text
small domain slice
+
UI
+
server action/API
+
database
+
tests
```

then validate it.

---

# 3. Core Rule for Codex

Codex should not invent product behavior when documentation already defines it.

Priority:

```text
1. Product Foundation
2. Core User Journey
3. AI Behavior / Prompt Contracts
4. Domain Model
5. MVP Scope
6. Database Schema
7. Page Responsibilities
8. Design Direction
9. Implementation convenience
```

If implementation convenience conflicts with product rules:

```text
product rules win
```

---

# 4. Suggested Repository Shape

Recommended:

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
│     ├─ 08-ref-home-desktop.png
│     ├─ 08-ref-companies-desktop.png
│     ├─ 08-ref-company-workspace-desktop.png
│     ├─ 08-ref-thesis-snapshot-desktop.png
│     └─ 08-ref-settings-desktop.png
│
├─ src/
│  ├─ app/
│  ├─ components/
│  ├─ features/
│  │  ├─ companies/
│  │  ├─ thoughts/
│  │  ├─ reasoning/
│  │  ├─ evidence/
│  │  ├─ gaps/
│  │  ├─ challenges/
│  │  ├─ thesis/
│  │  ├─ timeline/
│  │  └─ settings/
│  │
│  ├─ domain/
│  │  ├─ company/
│  │  ├─ thought/
│  │  ├─ reasoning/
│  │  ├─ challenge/
│  │  └─ thesis/
│  │
│  ├─ server/
│  │  ├─ auth/
│  │  ├─ db/
│  │  ├─ ai/
│  │  │  ├─ gateway/
│  │  │  ├─ context/
│  │  │  ├─ prompts/
│  │  │  ├─ schemas/
│  │  │  ├─ registry/
│  │  │  └─ cost/
│  │  └─ logging/
│  │
│  ├─ lib/
│  └─ tests/
│
├─ supabase/
│  ├─ migrations/
│  └─ seed.sql
│
├─ .env.example
└─ README.md
```

This structure is directional, not mandatory.

Do not create empty abstraction folders only to match a diagram.

---

# 5. Tech Stack

Recommended MVP stack:

```text
Next.js
React
TypeScript
PostgreSQL
Supabase Auth
Supabase Database
OpenAI API
Zod
```

Optional ORM/query layer:

```text
Drizzle ORM
```

or:

```text
Supabase typed client + SQL
```

Pick one consistent approach.

---

# 6. Initial Setup

## Milestone 0 — Project Skeleton

Tasks:

```text
Create Next.js app
Configure TypeScript strict mode
Configure linting
Configure formatting
Add env schema
Create Supabase project
Create local env file
Create docs folder
Copy visual references
Create basic app shell
```

Expected result:

```text
npm run dev
```

works.

No feature code yet.

---

# 7. Environment Variables

Minimum:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
```

Optional:

```text
APP_ENV
AI_MONTHLY_DEFAULT_BUDGET_IDR
AI_RATE_LIMIT_WINDOW
AI_RATE_LIMIT_MAX
```

Do not expose:

```text
OPENAI_API_KEY
SUPABASE_SERVICE_ROLE_KEY
```

to the browser.

---

# 8. Phase 1 — Authentication + Private Shell

Goal:

> User can sign in and reach a private MY KRAVV shell.

Tasks:

```text
Supabase Auth integration
Protected routes
User session helper
User settings bootstrap
Logout
Private app shell
Basic top navigation
```

Acceptance criteria:

```text
Unauthenticated user cannot access private pages
Authenticated user reaches Home
User settings row is created once
Session survives refresh
Logout works
```

Tests:

```text
protected route test
session test
user settings ownership test
```

---

# 9. Phase 2 — Company Slice

Goal:

> User can create and reopen a Company workspace.

Database:

```text
companies
```

UI:

```text
Companies page
Create Company
Company Workspace empty state
Archive Company
```

Server/domain:

```text
createCompany
updateCompany
archiveCompany
getCompanies
getCompanyById
```

Acceptance criteria:

```text
User creates company
Company appears in Companies
User opens company
User cannot access another user's company
Archived company is visually reduced / hidden by default
```

---

# 10. Phase 3 — Raw Thought Slice

Goal:

> User can write a messy thought and trust that it is preserved.

Database:

```text
thoughts
timeline_events
```

UI:

```text
Quick Thought
Company thought composer
Recent Thinking
Thought display
```

Server:

```text
createThought
getRecentThoughts
getCompanyThoughts
```

Rules:

```text
save raw first
raw content immutable
timeline event after successful save
```

Acceptance criteria:

```text
User writes thought
Thought saves without AI
Raw wording remains exactly preserved
Refresh does not lose it
Timeline shows meaningful event
```

This is the first truly useful slice.

---

# 11. Phase 4 — AI Infrastructure

Goal:

> Add AI safely before adding AI features.

Build:

```text
AI Gateway
AI Role Registry
Prompt Registry
Output Schema Registry
AI Run persistence
Cost estimator
Context Builder foundation
One retry max
```

Database:

```text
ai_runs
```

No user-visible AI feature required until infrastructure passes tests.

Acceptance criteria:

```text
AI keys remain server-side
Every AI call creates ai_run
Prompt version recorded
Model recorded
Token usage recorded
Estimated cost recorded
Invalid schema fails safely
One repair retry maximum
```

---

# 12. Phase 5 — Refine Slice

Goal:

> User can ask KRAVV to clean writing without losing meaning.

Database:

```text
refinements
```

UI:

```text
Rapikan
Raw vs Dirapikan
Accept
Edit
Reject
Keep Raw Only
```

AI:

```text
refine-v1
RefineResultSchema
```

Flow:

```text
Raw Thought saved
↓
User clicks Rapikan
↓
AI Run
↓
Suggested refinement
↓
User accepts / edits / rejects
```

Acceptance criteria:

```text
Raw remains unchanged
AI output stored separately
Accepted refinement identifiable
Rejected refinement preserved or marked rejected
AI failure does not affect raw note
```

---

# 13. Phase 6 — Structure Slice

Goal:

> User can turn freeform thought into structured reasoning.

Database:

```text
reasoning_items
```

AI:

```text
structure-v1
StructureResultSchema
```

UI:

```text
Strukturkan
Suggested reasoning items
Accept/edit/reject per group or item
```

Possible types:

```text
Claim
Interpretation
Assumption
Risk
Catalyst
Uncertainty
```

Acceptance criteria:

```text
AI does not invent missing facts
User can reject structure
Accepted items become domain data
Source thought/refinement remains traceable
```

---

# 14. Phase 7 — Open Gap Slice

Goal:

> Uncertainty becomes trackable without becoming a failure state.

Database:

```text
open_gaps
```

UI:

```text
Pertanyaan Terbuka
Tambah Pertanyaan
Telusuri
Tandai Terjawab
Tetap Belum Tahu
Abaikan
```

Server:

```text
createOpenGap
updateGapStatus
resolveOpenGap
```

Acceptance criteria:

```text
Open gaps visible in company
Open gaps visible in Home summary
No fake completeness score
Unresolved state remains valid
```

---

# 15. Phase 8 — Evidence Slice

Goal:

> User can attach factual evidence to reasoning without mixing fact and interpretation.

Database:

```text
evidence
evidence_links
```

UI:

```text
Tambah Bukti
Source title
Source URL optional
Fact text
User note
Link to reasoning
```

Acceptance criteria:

```text
fact and interpretation stored separately
evidence can support/weaken/contradict reasoning
manual entry works without document ingestion
```

No PDF ingestion yet.

---

# 16. Phase 9 — Challenge Slice

Goal:

> User can challenge a reasoning item and respond meaningfully.

Database:

```text
challenges
challenge_responses
```

AI:

```text
challenge-v1
ChallengeResultSchema
```

UI:

```text
Tantang
Challenge card
Pertahankan
Telusuri
Akui
Abaikan
Lewati
```

Acceptance criteria:

```text
AI may return no material issue
Challenge targets actual reasoning
No invented opposing facts
Response history preserved
RESEARCH can create Open Gap
CONCEDE does not silently rewrite old reasoning
```

---

# 17. Phase 10 — Thesis Draft

Goal:

> User can synthesize current reasoning into a thesis draft.

Database:

```text
thesis_drafts
```

UI:

```text
Tesis Draft
Thesis text
Biggest uncertainty
Biggest risk
What changes my mind
Optional confidence label
```

Rules:

```text
draft mutable
fields optional
no forced completeness
```

Acceptance criteria:

```text
Draft persists
Draft may be incomplete
User can edit freely
No historical lock yet
```

---

# 18. Phase 11 — Thesis Lock / Snapshot

Goal:

> User can freeze what they believed at a specific moment.

Database:

```text
thesis_versions
```

Server:

```text
lockThesisTransaction
```

Snapshot:

```text
thesis text
reasoning items
evidence
open gaps
challenge states
timestamp
version number
```

UI:

```text
Kunci Tesis
Tesis v1
Read-only Snapshot
Buat Revisi
```

Acceptance criteria:

```text
Lock is atomic
Version number unique per company
Locked version cannot be edited
Later live data changes do not alter old snapshot
Timeline shows thesis lock
```

This is a core MVP milestone.

---

# 19. Phase 12 — Timeline / History

Goal:

> User can understand how their reasoning evolved.

Database already:

```text
timeline_events
```

UI:

```text
Riwayat
chronological meaningful events
```

Include:

```text
thought created
refinement accepted
reasoning created
gap created/resolved
challenge created/responded
thesis locked
```

Exclude:

```text
technical AI events
schema validation
API retries
```

Acceptance criteria:

```text
Readable history
Recent-first or chronological toggle optional
Older events load progressively
```

---

# 20. Phase 13 — Home Completion

Goal:

> Home becomes a useful personal desk.

Build:

```text
Continue where you left off
Quick Thought
Recent Thinking
Open Questions summary
Recent Thesis Activity
```

Reference:

```text
08-ref-home-desktop.png
```

Use:

```text
editorial layout
continuous workspace
mineral green accents
```

Do not build:

```text
market ticker
portfolio P/L
news feed
```

---

# 21. Phase 14 — Companies Completion

Refine Companies page to match:

```text
private research archive
```

Reference:

```text
08-ref-companies-desktop.png
```

Include:

```text
search
state
last activity
latest thesis
open question count
```

Avoid:

```text
screener behavior
market ranking
financial table overload
```

---

# 22. Phase 15 — Company Workspace Completion

Refine workspace hierarchy.

Reference:

```text
08-ref-company-workspace-desktop.png
```

Important:

> Final implementation should be less dense than the visual reference by default.

Priority:

```text
Company identity
Pandangan Saat Ini
Active Thought / reasoning
Open Questions
Latest Thesis
History
```

Use progressive disclosure.

---

# 23. Phase 16 — Settings

Build:

```text
Account
Language
Guidance Mode
Challenge Intensity
AI Usage
AI Budget
Appearance
```

Reference:

```text
08-ref-settings-desktop.png
```

Keep this page utilitarian.

---

# 24. Phase 17 — Mobile Pass

Do not simply shrink desktop.

Prioritize:

```text
capture
continue
read
review
```

Mobile Home:

```text
Continue
Quick Thought
Open Questions
Recent Thinking
```

Mobile Company Workspace:

```text
Company
Current View
Active Thought
Open Questions
Latest Thesis
```

Secondary information:

```text
expand progressively
```

---

# 25. Phase 18 — Hardening

Before calling MVP complete:

```text
RLS review
server authorization review
AI cost guard
rate limiting
idempotency
error handling
loading states
AI failure states
backup review
privacy logging review
accessibility pass
```

---

# 26. Phase 19 — Deployment

Recommended:

```text
Next.js → Vercel
Supabase → Auth + PostgreSQL
OpenAI → AI provider
```

Deployment checklist:

```text
production env variables
production Supabase project
RLS enabled
migrations applied
seed not applied to production
service-role key server-only
HTTPS
AI monthly budget configured
error tracking scrubbed
backup enabled
```

---

# 27. Definition of MVP Complete

MVP is complete when the user can:

```text
1. Sign in.
2. Create a company.
3. Write raw thought.
4. Save it without AI.
5. Refine with AI.
6. Structure reasoning.
7. Add evidence.
8. Create open question.
9. Challenge reasoning.
10. Respond to challenge.
11. Build thesis draft.
12. Lock Thesis v1.
13. Reopen company later.
14. See timeline of how thinking evolved.
15. Continue manually if AI fails.
16. See AI usage/cost.
```

---

# 28. MVP Non-Goals

Do not implement before MVP validation:

```text
portfolio automation
transactions
broker integration
live stock prices
market dashboard
autonomous web research
document ingestion
vector database
advanced reflection
social publishing
community
team collaboration
institutional permissions
n8n core workflows
multi-agent orchestration
```

---

# 29. Feature Slice Checklist

Every slice should include:

```text
domain rule
database migration
server action/API
authorization
UI
error state
loading state
tests
timeline effect if meaningful
```

Do not merge feature code without the relevant ownership checks.

---

# 30. Testing Strategy

Minimum layers:

```text
Unit
Integration
AI behavior regression
Browser / E2E
RLS / ownership tests
```

---

# 31. Unit Tests

Focus on:

```text
domain rules
state transitions
snapshot builders
cost calculations
AI schema validation
```

Examples:

```text
locked thesis cannot mutate
challenge status transition valid
open gap states valid
```

---

# 32. Integration Tests

Focus on:

```text
server + database
ownership
transactions
AI run persistence
timeline creation
```

Examples:

```text
create thought creates timeline
lock thesis writes snapshot atomically
accept refinement updates status
```

---

# 33. RLS Tests

Mandatory.

Test:

```text
User A cannot SELECT User B company
User A cannot INSERT child row into User B company
User A cannot UPDATE User B gap
User A cannot read User B thesis version
```

---

# 34. AI Regression Tests

Use fixtures from:

```text
10-ai-prompt-contracts.md
```

Run for every material prompt change.

Evaluate:

```text
faithfulness
non-invention
uncertainty preservation
challenge quality
schema compliance
cost
```

---

# 35. Browser / E2E Tests

Critical flows:

```text
Sign in
Create company
Write thought
Refine
Structure
Create gap
Challenge
Lock thesis
Reopen thesis
```

Do not test every pixel.

Test behavior.

---

# 36. Visual QA

Use visual references for:

```text
hierarchy
density
tone
accent
typography
continuous workspace
```

Do not require pixel matching.

Codex may improve:

```text
spacing
responsiveness
accessibility
component consistency
```

but must preserve design direction.

---

# 37. Accessibility Checkpoint

Before MVP:

```text
keyboard navigation
focus states
contrast
semantic headings
form labels
button names
non-color-only status
```

---

# 38. AI Cost Checkpoint

Before enabling stronger models:

Measure:

```text
average cost per Refine
average cost per Structure
average cost per Challenge
average cost per session
monthly projection
```

Do not assume.

---

# 39. AI Model Rollout Strategy

Start with:

```text
cheap model for Refine
cheap model for Structure
stronger model only for Challenge if needed
```

Benchmark before adding stronger models elsewhere.

---

# 40. Prompt Rollout Strategy

For each prompt:

```text
local test
fixture test
manual test
limited production use
observe AI runs
iterate
```

Avoid changing all prompts simultaneously.

---

# 41. Codex Task Size

Preferred task size:

```text
one feature slice
or
one clearly bounded infrastructure component
```

Good Codex task:

```text
Implement Raw Thought persistence:
- add migration
- add server action
- add RLS
- add composer UI
- add tests
- follow docs 02, 04, 09
```

Bad Codex task:

```text
Build MY KRAVV.
```

---

# 42. Codex Task Template

Use this format:

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
- [...]

MUST NOT:
- [...]
- [...]
- [...]

FILES LIKELY TO TOUCH:
- [...]

ACCEPTANCE CRITERIA:
- [...]
- [...]

TESTS:
- [...]
```

This reduces drift.

---

# 43. Codex Documentation Rule

Before implementing a feature, Codex should read only the relevant docs.

Example:

For Challenge:

```text
03-ai-behavior-spec.md
04-domain-model.md
09-database-schema.md
10-ai-prompt-contracts.md
```

For Home design:

```text
07-page-responsibilities.md
08-design-direction.md
```

Do not flood context unnecessarily.

---

# 44. Codex Change Discipline

Codex should:

```text
explain schema changes
use migrations
avoid unrelated refactors
avoid renaming domain concepts casually
avoid introducing new dependencies without reason
```

If a documented product rule must change:

```text
update documentation first
then implementation
```

---

# 45. Codex Review Questions

After each task:

```text
Did this preserve raw/user history?
Did this respect ownership?
Did this introduce hidden AI behavior?
Did this add unnecessary abstraction?
Did this violate MVP scope?
Did this create card-grid UI drift?
Did this create silent cost?
```

---

# 46. Milestone Map

## Milestone A — Private Foundation

Includes:

```text
Auth
User Settings
Companies
Raw Thoughts
```

Exit criterion:

```text
MY KRAVV is useful as a private manual research journal.
```

---

## Milestone B — AI Assist

Includes:

```text
AI Gateway
AI Runs
Refine
Structure
```

Exit criterion:

```text
AI can assist writing/reasoning without becoming source of truth.
```

---

## Milestone C — Reasoning Loop

Includes:

```text
Evidence
Open Gaps
Challenges
Challenge Responses
```

Exit criterion:

```text
User can actively test and revise reasoning.
```

---

## Milestone D — Historical Thesis

Includes:

```text
Thesis Draft
Thesis Version Lock
Timeline
```

Exit criterion:

```text
User can preserve what they believed at a point in time.
```

---

## Milestone E — Product Surface

Includes:

```text
Home
Companies
Company Workspace
Thesis Snapshot
Settings
Mobile pass
```

Exit criterion:

```text
Product feels coherent and usable.
```

---

## Milestone F — Hardening

Includes:

```text
Security
Cost guard
Rate limit
Error handling
Accessibility
Backup
Deployment
```

Exit criterion:

```text
Safe enough for real personal use.
```

---

# 47. Recommended Commit Discipline

Keep commits scoped.

Examples:

```text
feat(companies): add company creation and ownership checks
feat(thoughts): persist immutable raw thoughts
feat(ai): add role registry and ai_runs
feat(refine): add refine-v1 flow
feat(thesis): add atomic thesis locking
```

Avoid:

```text
misc changes
big update
final fixes
```

---

# 48. Migration Discipline

Each schema change:

```text
migration
types update
server update
tests
```

Do not edit production schema manually.

---

# 49. Versioning

Recommended initial app version:

```text
0.1.0
```

Meaning:

```text
personal MVP
not public product maturity
```

Prompt versions remain independent:

```text
refine-v1
challenge-v1
```

Database migrations remain independent.

---

# 50. First Real-Use Validation

Before adding deferred features:

Use MY KRAVV on:

```text
3–5 real companies
over several weeks
```

Observe:

```text
Do I return to old reasoning?
Does Challenge help?
Do Open Gaps feel useful?
Does thesis locking feel natural?
Does UI feel calm or annoying?
Does AI cost stay reasonable?
```

This matters more than feature count.

---

# 51. MVP Exit Questions

Before expanding scope, answer:

```text
Is raw capture frictionless?
Does AI preserve my meaning?
Do I trust thesis history?
Does Challenge create useful tension?
Can I understand how my thinking changed?
Do I actually want to use it again?
```

If not:

```text
fix core loop
```

Do not add more features.

---

# 52. Deferred Phase 2 Candidates

Only after MVP validation:

```text
Decision tracking
Transactions
Portfolio position
Compare thesis versions
Reflection reports
Document ingestion
External research
Market data
Semantic retrieval
```

---

# 53. Decision Tracking Candidate

Likely first Phase 2 domain after MVP.

Reason:

MY KRAVV's deeper philosophy is:

```text
preserve the context behind a decision
```

Possible flow:

```text
Thesis
↓
Decision
↓
Later Review
```

Do not implement until thesis workflow proves useful.

---

# 54. External Research Candidate

When added:

```text
search/retrieval
↓
source normalization
↓
evidence
↓
user interpretation
```

Do not let external research bypass Evidence provenance.

---

# 55. Document Ingestion Candidate

Future:

```text
Upload annual report
↓
Extract text
↓
Preserve page/source
↓
Retrieve relevant passages
↓
User chooses what becomes Evidence
```

Do not auto-turn every extracted statement into domain truth.

---

# 56. Reflection Candidate

Requires sufficient historical data.

Do not build an impressive empty reflection dashboard.

Reflection becomes valuable only after:

```text
multiple thesis versions
multiple challenges
real revisions
```

---

# 57. Product Quality Bar

MY KRAVV should feel:

```text
fast to capture
calm to read
safe to trust
easy to revisit
serious without feeling institutional
```

If the interface starts feeling like work software:

```text
reduce visible complexity
```

---

# 58. Anti-Overengineering Rule

Before adding infrastructure, ask:

```text
What current problem does this solve?
```

Do not add:

```text
Redis
queues
microservices
Kafka
dedicated vector DB
agents
workflow engine
```

without a demonstrated need.

---

# 59. Anti-Design-Drift Rule

Before creating a new UI pattern, ask:

```text
Can this be expressed with:
spacing
typography
divider
progressive disclosure
existing component
```

before inventing another card type.

---

# 60. Anti-AI-Drift Rule

Before adding another AI action, ask:

```text
Is this genuinely reasoning work?
Can deterministic code do it?
Does user explicitly benefit from AI here?
```

If deterministic code is enough:

```text
do not call AI
```

---

# 61. Final Build Order

Recommended final sequence:

```text
00 Project setup
01 Auth
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
22 Mobile
23 Security hardening
24 Cost guard
25 Accessibility
26 Deployment
27 Real-use validation
```

---

# 62. Locked Implementation Decisions

Current implementation direction:

```text
Vertical-slice development
Single Next.js application
Supabase Auth + PostgreSQL
Role-specific AI endpoints/actions
Zod validation
Explicit AI triggers
Relational memory first
RLS from early implementation
Raw-first persistence
Thesis snapshot transaction
Design references as direction, not pixel spec
Bahasa Indonesia default
Desktop first, then intentional mobile pass
Codex tasks kept small and bounded
Documentation overrides implementation convenience
MVP validated through real use before expansion
```

---

# 63. Implementation One-Liner

> **Build MY KRAVV from the reasoning loop outward, not from the feature list inward.**

---

# 64. Core Documentation Complete

The implementation-ready documentation set is now:

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

At this point, the next step is not another strategy document.

The next step is:

```text
create the repository
copy docs + visual references
initialize the stack
begin Milestone 0
```
