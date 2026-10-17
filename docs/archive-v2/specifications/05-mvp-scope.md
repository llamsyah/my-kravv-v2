# MY KRAVV — MVP Scope

> Status: Draft v0.1  
> Depends on:
> - `01-product-foundation.md`
> - `02-core-user-journey.md`
> - `03-ai-behavior-spec.md`
> - `04-domain-model.md`
>
> Purpose:
> Define the smallest version of MY KRAVV that is genuinely useful,
> proves the core product idea, and avoids unnecessary scope.

---

## 1. MVP Goal

The MVP must prove one thing:

> **A user can capture messy investment thinking, make it clearer with AI,
> challenge it, preserve the reasoning, and lock a historical thesis snapshot.**

If this loop feels useful enough that the user wants to repeat it for another company,
the MVP works.

The MVP does not need to prove:

- portfolio automation,
- social features,
- market-data depth,
- full investment education,
- advanced reflection,
- institutional workflows.

---

## 2. Core MVP Loop

The MVP journey:

```text
Create / Select Company
↓
Write Raw Thought
↓
AI Refine + Structure
↓
User Approve / Edit
↓
Optional AI Challenge
↓
Defend / Research / Concede / Dismiss / Skip
↓
Optional Open Gap
↓
Create Thesis Draft
↓
Lock Thesis v1
↓
View Company History / Timeline
```

This is the product core.

---

## 3. MVP User Outcome

After one complete use, the user should be able to say:

```text
"I wrote what I was thinking,
MY KRAVV helped me clean and structure it,
it pointed out a real weakness,
I decided how to respond,
and now I have a timestamped thesis I can revisit later."
```

That is enough for v1.

---

# 4. In Scope

## 4.1 Authentication

Required:

- private workspace,
- secure sign-in,
- user-specific data separation.

MVP assumption:

```text
1 user = 1 private workspace
```

No team membership.

No public profile.

---

## 4.2 Company Management

Required:

- create company,
- edit basic company identity,
- archive company,
- reopen company.

Minimum company fields:

```text
name
ticker (optional)
exchange (optional)
sector (optional)
short note (optional)
```

The system should not require full company metadata.

---

## 4.3 Raw Thought Capture

Required:

- freeform text input,
- raw text preserved,
- timestamp,
- linked company,
- intent type optional/AI-suggested.

The user must be able to save a raw thought even if AI is unavailable.

---

## 4.4 AI Refine

Required:

- explicit user-triggered action,
- improve clarity,
- preserve uncertainty,
- do not invent facts,
- do not increase confidence.

User options:

```text
Accept
Edit
Reject
Keep Raw Only
```

Raw input remains unchanged.

---

## 4.5 AI Structure

Required:

AI may extract:

```text
Claim
Interpretation
Assumption
Risk
Catalyst
Uncertainty
Open Question
```

Rules:

- not every category must appear,
- AI output is suggested structure,
- user can edit or reject,
- uncertainty must not be upgraded into fact.

---

## 4.6 Open Gaps

Required:

The user can create or accept lightweight unresolved questions.

Example:

```text
Is margin pressure temporary or structural?
```

Minimum states:

```text
OPEN
ANSWERED
UNRESOLVED
DISMISSED
```

No priority system required for MVP.

---

## 4.7 AI Challenge

Required:

- explicit user-triggered action,
- challenge one or more meaningful reasoning items,
- no fake criticism,
- may return "no material issue".

Minimum challenge categories:

```text
Unsupported assumption
Weak causal link
Evidence mismatch
Alternative explanation
Contradiction
Excess confidence
Other
```

User responses:

```text
Defend
Research
Concede
Dismiss
Skip
```

---

## 4.8 Thesis Draft

Required:

The user can write or assemble a thesis draft.

Possible content:

```text
thesis text
confidence (optional)
biggest uncertainty (optional)
biggest risk (optional)
what could change my mind (optional)
```

The draft remains editable until locked.

---

## 4.9 Thesis Version Lock

Required:

The user can create:

```text
Thesis v1
```

A locked version must preserve:

- thesis text,
- timestamp,
- relevant reasoning snapshot,
- relevant evidence references,
- current open gaps,
- current challenge state,
- optional confidence.

Locked thesis must be immutable.

Future edits create a new version.

---

## 4.10 Company Timeline

Required:

Show important events in chronological order.

Minimum event types:

```text
Thought created
Refinement accepted
Open Gap created
Challenge created
Challenge resolved
Thesis locked
```

Timeline should be readable without exposing raw database complexity.

---

## 4.11 AI Run Tracking

Required internally:

```text
role
model
prompt_version
status
token_usage
estimated_cost
created_at
```

Not all fields need to appear in normal UI.

Purpose:

- debugging,
- cost monitoring,
- prompt iteration.

---

## 4.12 Cost Guard

Required:

- AI call rate limit,
- monthly usage tracking,
- optional hard cost ceiling,
- no AI calls on every keystroke,
- no AI calls on page open unless needed.

MVP target:

> Personal-use AI cost should remain comfortably within a small monthly budget.

Exact budget should remain configurable.

---

## 4.13 Graceful AI Failure

Required:

If AI fails:

- raw note still saves,
- company still loads,
- thesis history remains accessible,
- user can continue manually.

AI must not be a single point of failure.

---

# 5. Optional in MVP if Cheap to Implement

These may be included if they do not delay the core loop.

## 5.1 Guidance Mode

A simple:

```text
Guide me
```

button that helps when the user is stuck.

Not required to build a full adaptive mentor system yet.

---

## 5.2 Basic Reasoning Filters

Example:

```text
Show:
- Claims
- Uncertainties
- Risks
- Open Gaps
```

Useful if simple.

Do not build advanced analytics.

---

## 5.3 Thesis v2

Versioning logic should support multiple versions.

The MVP demo may include v2 if easy.

But the product only needs to prove v1 locking first.

---

# 6. Explicitly Out of Scope

These features are intentionally delayed.

## 6.1 Portfolio Automation

Not in MVP:

- broker integration,
- automatic positions,
- portfolio sync,
- P/L automation,
- lot tracking,
- average cost automation.

Manual decision tracking can come later.

---

## 6.2 Social / Publishing

Not in MVP:

- public profiles,
- shared thesis,
- likes,
- comments,
- feeds,
- public analysis pages,
- follow system.

Current product is private.

---

## 6.3 Realtime Market Data

Not in MVP:

- live prices,
- charts,
- market ticker,
- heatmaps,
- realtime valuation updates.

Market data may be manually entered later if needed.

---

## 6.4 Automatic Research

Not in MVP:

- autonomous web browsing,
- external news search,
- automatic annual report ingestion,
- automatic contradiction discovery,
- autonomous monitoring.

The user brings research into the system.

---

## 6.5 RAG / Vector Database

Not required for MVP.

Reason:

Early data volume is small enough for normal relational retrieval.

Add semantic retrieval later if history becomes large.

---

## 6.6 n8n

Not required for MVP core.

Possible future use:

- scheduled review reminders,
- report ingestion,
- market-data sync,
- automation.

Do not add n8n only because it is familiar.

---

## 6.7 Advanced Reflection

Not in first MVP:

```text
6-month thinking evolution
cross-company bias analysis
decision-pattern analytics
```

These require historical data first.

---

## 6.8 Full Learning Curriculum

Not in MVP:

- finance course,
- learning path,
- quizzes,
- certification,
- investment curriculum.

Contextual explanation may come later.

---

## 6.9 Institutional Features

Not in MVP:

- roles,
- analyst/partner permissions,
- committee workflows,
- firm-level cases,
- collaborative diligence.

Those belong closer to KRAVV-IENT.

---

# 7. MVP Pages

The visual design is not defined yet, but the minimum product surfaces likely are:

```text
Home
Companies
Company Workspace
Thought / Analysis Workspace
Thesis History
Settings
```

Possible simplification:

`Thought / Analysis Workspace` may live inside `Company Workspace`.

Do not create pages only because the database has entities.

---

# 8. MVP Home Responsibilities

Home should support:

- continue recent company/thought,
- quick raw capture,
- recent thinking,
- open gaps summary,
- recent thesis activity.

Home should not become:

- stock terminal,
- market dashboard,
- news page.

---

# 9. MVP Company Workspace Responsibilities

Company Workspace should show:

```text
Current view
Recent thoughts
Structured reasoning
Open gaps
Challenges
Thesis history
Timeline
```

It should not expose every internal entity as a separate tab unless necessary.

---

# 10. MVP AI Actions

Minimum AI actions:

```text
Refine
Structure
Challenge
```

Optional:

```text
Guide
```

Deferred:

```text
Compare
Reflect
```

Compare may be added once multiple thesis versions exist.

Reflect belongs later.

---

# 11. MVP Model Strategy

Use configurable model routing.

Possible approach:

### Cheap / fast model

For:

```text
Refine
Structure
Intent classification
```

### Stronger model

For:

```text
Challenge
Optional Guide
```

The exact model should not be hard-coded into product rules.

---

# 12. MVP Data Model

Required first-pass entities:

```text
User
Company
Thought
Refinement
Reasoning Item
Open Gap
Challenge
Challenge Response
Thesis Version
AI Run
Timeline Event
```

Evidence can be included in MVP if the workflow feels incomplete without it.

Recommended:

**Include basic Evidence support.**

Reason:

Without evidence, challenge quality becomes weaker.

Minimum Evidence:

```text
fact text
source title/url optional
user note optional
```

---

# 13. Minimal Evidence MVP

Evidence should allow:

```text
Add Evidence
↓
Link to Reasoning Item
```

No document parser required.

No automatic verification required.

No full source management system required.

---

# 14. MVP Technical Dependencies

Required:

```text
Frontend
Backend/API
Authentication
Relational database
AI API
Basic logging
```

Optional:

```text
Object storage
```

Only needed if file upload is included.

---

# 15. MVP Security Baseline

Required from day one:

- server-side auth checks,
- server-side authorization,
- API keys never exposed to frontend,
- HTTPS in hosted environment,
- per-user data isolation,
- rate limiting,
- safe error logging,
- backup strategy,
- no public access to private analysis data.

Do not postpone basic security because the app is "personal".

---

# 16. MVP Cost Baseline

The MVP should track:

```text
AI calls
input tokens
output tokens
estimated AI cost
```

Optional monthly hard stop:

```text
if monthly_ai_cost >= configured_limit:
    disable non-essential AI actions
```

The app should remain usable manually.

---

# 17. Definition of Done

The MVP is complete when the following flow works reliably:

```text
1. User logs in.
2. User creates a company.
3. User writes a messy raw thought.
4. Raw thought saves immediately.
5. AI Refine produces a faithful cleaner version.
6. AI Structure extracts useful reasoning without inventing facts.
7. User can accept/edit/reject AI output.
8. User can trigger a meaningful challenge.
9. User can respond to the challenge.
10. User can create an Open Gap.
11. User can write/finalize a thesis.
12. User can lock Thesis v1.
13. Thesis v1 remains unchanged afterward.
14. Timeline shows the history.
15. Reloading the app preserves everything.
16. AI failure does not destroy or block user data.
17. AI usage and cost are observable.
```

---

# 18. MVP Quality Bar

The MVP should not be considered done just because features technically exist.

It should also feel:

- simple enough to understand,
- fast enough for normal use,
- visually calm,
- non-terminal-like,
- freeform-first,
- private,
- not AI-dominant.

The user should never feel like they are filling enterprise software.

---

# 19. MVP Acceptance Test Scenarios

## Scenario A — Messy beginner thought

Input:

```text
kayaknya revenue nya bagus tapi margin bikin ragu
```

Expected:

- raw saved,
- refine preserves uncertainty,
- structure does not invent reason for margin decline.

---

## Scenario B — Research dump

Input:

```text
Revenue +18%, margin turun.
Management bilang ekspansi.
Belum yakin temporary.
```

Expected:

- evidence-like items separated,
- interpretation separated,
- uncertainty preserved,
- optional Open Gap suggested.

---

## Scenario C — Challenge

Input claim:

```text
Brand terkenal berarti moat kuat.
```

Expected:

- meaningful challenge,
- no fake conclusion,
- possible evidence directions.

---

## Scenario D — Strong reasoning

Input already includes:

- claim,
- evidence,
- uncertainty,
- alternative explanation.

Expected:

- AI does not force unnecessary criticism.

---

## Scenario E — Thesis lock

User locks Thesis v1.

Expected:

- immutable snapshot,
- timestamp,
- historical visibility.

---

## Scenario F — AI outage

AI endpoint fails.

Expected:

- user can still save raw thought,
- no data loss,
- clear fallback message.

---

# 20. MVP Success Metrics

For personal use, success can be measured simply.

Useful signals:

```text
How often user returns to continue analysis
How often raw thoughts become accepted refinements
How often challenges lead to research or revision
How many thesis versions are revisited
How much AI cost per useful session
```

Do not optimize for vanity metrics.

---

# 21. MVP Risks

## Risk: Too many concepts visible

Mitigation:

Hide domain complexity behind simple workspace views.

---

## Risk: AI asks too many questions

Mitigation:

Clarification only when necessary.

---

## Risk: AI over-writes user meaning

Mitigation:

Preserve raw, require approval, enforce role-specific prompts.

---

## Risk: User gets stuck in perfectionism

Mitigation:

Allow incomplete notes and "I don't know yet".

---

## Risk: Product becomes a stock terminal

Mitigation:

Keep market data out of MVP.

---

## Risk: Product becomes a chatbot

Mitigation:

Use contextual AI actions instead of one giant chat interface.

---

## Risk: AI cost grows silently

Mitigation:

Track usage, rate limit, configurable monthly ceiling.

---

# 22. Build Order

Recommended implementation order:

```text
1. Auth
2. Company
3. Raw Thought
4. Thought history
5. AI Refine
6. AI Structure
7. Reasoning Items
8. Open Gaps
9. AI Challenge
10. Challenge Responses
11. Thesis Draft
12. Thesis Lock / Snapshot
13. Timeline
14. Cost tracking
15. Polish
```

Do not start with:

```text
portfolio
social
market data
reflection analytics
```

---

# 23. MVP Non-Negotiables

Even under time pressure, do not remove:

```text
Raw thought preservation
User approval of AI output
Thesis immutability after lock
AI failure fallback
Server-side authorization
Cost tracking
```

These are foundational, not polish.

---

# 24. What Can Be Fake / Manual in MVP

Acceptable manual or simplified behavior:

```text
Company metadata manual
Evidence entry manual
No automatic market prices
No broker sync
No document extraction
No external research
No semantic memory
No advanced reflection
```

The MVP should prove reasoning workflow first.

---

# 25. MVP Product Statement

The first usable MY KRAVV should be describable as:

> **A private AI-assisted investment reasoning journal where I can dump raw thoughts,
> clean and structure them, challenge my own assumptions,
> and preserve a timestamped thesis history.**

If the MVP does this well, it is enough.

---

# 26. Locked MVP Decisions

Current scope:

```text
Private workspace
Company-based organization
Freeform raw input
AI Refine
AI Structure
Basic Evidence
Open Gaps
AI Challenge
Challenge Responses
Thesis Draft
Locked Thesis Version
Timeline
AI cost tracking
Graceful AI failure
```

Deferred:

```text
Portfolio automation
Transactions
Advanced Reviews
Advanced Reflection
Realtime market data
Automatic research
RAG
n8n
Social / Publishing
Institutional workflow
```

---

## Next Document

`06-technical-architecture.md`

That document should define:

- frontend/backend shape,
- hosting approach,
- auth,
- PostgreSQL/database design direction,
- AI Gateway,
- Context Builder,
- storage,
- security boundaries,
- cost controls,
- logging,
- deployment,
- backup/recovery,
- and how the system stays simple enough for a personal project.
