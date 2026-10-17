# MY KRAVV — Domain Model

> Status: Draft v0.1  
> Depends on:
> - `01-product-foundation.md`
> - `02-core-user-journey.md`
> - `03-ai-behavior-spec.md`
>
> Purpose:
> Define the core concepts MY KRAVV stores, how they relate, and which rules must remain true even if the UI changes.

---

## 1. Domain Goal

MY KRAVV looks simple from the outside:

```text
Think
→ organize
→ challenge
→ form thesis
→ decide
→ review
```

But the underlying domain branches because one company may accumulate:

- many raw thoughts,
- many research notes,
- many evidence items,
- unresolved gaps,
- AI challenges,
- multiple thesis versions,
- decisions,
- transactions,
- reviews,
- and historical changes.

The domain model must make that complexity manageable **without exposing all of it to the user at once**.

Core rule:

> **The data model may be rich. The product experience should remain simple.**

---

# 2. Domain Language

Use consistent language across code, database, prompts, and documentation.

Primary concepts:

```text
User
Company
Thought
Refinement
Reasoning Item
Evidence
Open Gap
Challenge
Thesis Version
Decision
Transaction
Review
AI Run
Timeline Event
```

Optional/future concepts:

```text
Document
Market Snapshot
Company Metric
Research Source
Portfolio Position
Reflection Report
```

Avoid inventing multiple names for the same thing.

Example:

Use `Open Gap` consistently.

Do not alternate between:

```text
question
gap
missing item
research task
unknown
```

unless they are intentionally different concepts.

---

# 3. User

Represents the owner of the private MY KRAVV workspace.

MVP assumption:

```text
1 user = 1 private workspace
```

The user owns all private investment reasoning data.

Possible fields:

```text
id
display_name
created_at
preferences
guidance_mode
default_language
default_ai_tone
```

Important:

User preferences should not be mixed with investment data.

---

# 4. Company

The main domain anchor.

A Company is the object the user is thinking about.

Examples:

```text
BBCA
ASII
TLKM
```

Possible fields:

```text
id
user_id
name
ticker
exchange
sector
industry
description
created_at
archived_at
```

The Company itself should contain only relatively stable identity/context.

Do not place the entire evolving analysis inside the Company row.

Relationship:

```text
Company
├── Thoughts
├── Reasoning Items
├── Evidence
├── Open Gaps
├── Challenges
├── Thesis Versions
├── Decisions
├── Transactions
└── Reviews
```

---

# 5. Company Workspace

`Company Workspace` is primarily a **product/UI concept**, not necessarily a database table.

It represents:

> "Everything MY KRAVV knows about this company for this user."

The workspace is assembled from related domain objects.

This is important because we should not create a giant mutable `analysis_json` blob as the source of truth.

---

# 6. Thought

A Thought is the smallest first-class unit of user thinking.

It stores what the user originally wrote.

Examples:

```text
"customer kayaknya susah pindah tapi aku belum yakin ini moat"
```

```text
"management terlalu agresif menurutku"
```

```text
"margin turun tapi mungkin cuma gara-gara ekspansi"
```

Possible fields:

```text
id
user_id
company_id
raw_text
intent_type
status
created_at
updated_at
```

Recommended `intent_type` values:

```text
RAW_THOUGHT
RESEARCH_NOTE
EVIDENCE_UPDATE
THESIS_THOUGHT
DECISION_NOTE
REVIEW_NOTE
INTUITION
MIXED
UNKNOWN
```

Important invariant:

> `raw_text` must never be silently replaced by AI output.

If the user manually edits the raw note after saving, store edit history or treat the edit as a new revision/event.

---

# 7. Refinement

A Refinement is an AI-produced or user-edited cleaned version of a Thought.

Relationship:

```text
Thought
└── Refinement(s)
```

Possible fields:

```text
id
thought_id
source_type
text
status
ai_run_id
created_at
accepted_at
```

Possible `source_type`:

```text
AI
USER_EDITED_AI
USER
```

Possible `status`:

```text
SUGGESTED
ACCEPTED
REJECTED
SUPERSEDED
```

Important:

A Refinement is **not** the raw thought.

It is a derived representation.

---

# 8. Reasoning Item

A Reasoning Item is a structured piece of the user's thinking.

Types:

```text
CLAIM
INTERPRETATION
ASSUMPTION
RISK
CATALYST
UNCERTAINTY
```

Possible fields:

```text
id
user_id
company_id
thought_id
type
text
status
created_at
updated_at
```

Possible status:

```text
ACTIVE
WEAKENED
RETRACTED
RESOLVED
SUPERSEDED
```

Examples:

```text
CLAIM:
Recurring revenue appears to support business stability.
```

```text
ASSUMPTION:
Customer retention may be partly driven by switching friction.
```

```text
UNCERTAINTY:
It is unclear whether margin pressure is temporary.
```

Reasoning Items may be created from:

- user input,
- AI structure suggestions,
- manual edits.

AI-created structure should only become accepted domain data after user approval or explicit auto-accept rules.

---

# 9. Evidence

Evidence represents something used to support or challenge reasoning.

Evidence is different from interpretation.

Example:

```text
Evidence:
Revenue increased 18% YoY.
```

Interpretation:

```text
The company may still have strong demand.
```

These should not be the same record.

Possible fields:

```text
id
user_id
company_id
source_type
source_title
source_url
source_document_id
source_date
excerpt
fact_text
user_note
created_at
```

Possible `source_type`:

```text
USER_RESEARCH
ANNUAL_REPORT
EARNINGS_CALL
COMPANY_FILING
NEWS
MARKET_DATA
MANUAL_ENTRY
OTHER
```

Important:

The evidence record should preserve:

- what the source said,
- where it came from,
- what the user thinks it means.

Those are different layers.

---

# 10. Evidence Links

Evidence should be linkable to Reasoning Items.

Relationship:

```text
Evidence
   ├── supports → Claim
   ├── weakens → Claim
   ├── relates_to → Assumption
   └── informs → Uncertainty
```

Possible relation table:

```text
evidence_links
```

Possible fields:

```text
id
evidence_id
reasoning_item_id
relation_type
created_at
```

Possible `relation_type`:

```text
SUPPORTS
WEAKENS
CONTRADICTS
RELATES_TO
RESOLVES
```

This enables future AI context retrieval without reading everything.

---

# 11. Open Gap

An Open Gap represents something the user does not yet know or wants to investigate.

Examples:

```text
Is margin pressure temporary or structural?
```

```text
Does customer retention come from switching cost or habit?
```

Possible fields:

```text
id
user_id
company_id
question
status
priority
created_at
resolved_at
```

Possible status:

```text
OPEN
RESEARCHING
ANSWERED
UNRESOLVED
DISMISSED
```

Important:

`UNRESOLVED` is not failure.

It means:

> "I looked at this and still do not know."

---

# 12. Open Gap Links

An Open Gap may originate from:

- a Thought,
- a Reasoning Item,
- a Challenge,
- a Review.

Possible relation:

```text
Open Gap
→ linked thought
→ linked reasoning item
→ linked challenge
```

Do not force every gap to have every link.

---

# 13. Challenge

A Challenge represents a specific reasoning objection or question.

A Challenge is an object, not just chat history.

Possible fields:

```text
id
user_id
company_id
target_type
target_id
challenge_type
message
why_it_matters
severity
status
ai_run_id
created_at
resolved_at
```

Possible `challenge_type`:

```text
UNSUPPORTED_ASSUMPTION
WEAK_CAUSAL_LINK
EVIDENCE_MISMATCH
CONTRADICTION
ALTERNATIVE_EXPLANATION
CONFIRMATION_BIAS
EXCESS_CONFIDENCE
OTHER
```

Possible status:

```text
OPEN
RESPONDED
RESOLVED
DISMISSED
SKIPPED
```

---

# 14. Challenge Response

A Challenge may have one or more responses.

Possible response types:

```text
DEFEND
RESEARCH
CONCEDE
DISMISS
SKIP
```

Possible fields:

```text
id
challenge_id
response_type
user_text
linked_evidence_id
linked_open_gap_id
created_at
```

This preserves how the user reacted to criticism.

---

# 15. Thesis Version

A Thesis Version is a historical snapshot of the user's current view.

It is one of the most important immutable domain concepts.

Possible fields:

```text
id
user_id
company_id
version_number
parent_version_id
thesis_text
confidence
status
created_at
locked_at
```

Possible status:

```text
DRAFT
LOCKED
SUPERSEDED
ARCHIVED
```

A locked thesis version must not be silently changed.

---

# 16. Thesis Snapshot Content

When a Thesis Version is locked, it should preserve or reference:

```text
final thesis text
active reasoning items
linked evidence
open gaps
challenge status
confidence
risk notes
catalyst notes
invalidation conditions
timestamp
```

Two implementation approaches are possible:

### Reference-only snapshot

Store IDs of related records.

Risk:

later edits may change what an old thesis appears to contain.

### Immutable snapshot

Store a frozen copy of the relevant structured state.

Preferred for historical integrity.

Recommended:

> Locked thesis versions should store immutable snapshot data.

---

# 17. Decision

A Decision represents what the user chooses to do.

A Decision is separate from Thesis.

Examples:

```text
KEEP_RESEARCHING
WATCH
INTERESTED
INVEST
ADD
REDUCE
EXIT
AVOID
```

Possible fields:

```text
id
user_id
company_id
thesis_version_id
decision_type
rationale
confidence
decision_basis
created_at
```

Important invariant:

> A bullish thesis does not automatically create an investment decision.

---

# 18. Decision Basis

Decision basis should support honest mixed reasoning.

Possible representation:

```text
EVIDENCE_LED
MIXED
INTUITION_LED
REACTIVE
OTHER
```

Optional context:

```text
FOCUSED
TIRED
RUSHED
EMOTIONAL
FOMO
FINANCIAL_PRESSURE
OVERCONFIDENT
```

These are metadata, not diagnoses.

---

# 19. Transaction

A Transaction represents a real portfolio action.

Examples:

```text
BUY
SELL
```

Possible fields:

```text
id
user_id
company_id
decision_id
type
date
price
lots
fees
note
created_at
```

Portfolio position should be derived from transaction history whenever possible.

Do not make manually edited "current lots" the only source of truth.

---

# 20. Portfolio Position

Portfolio Position can be a derived/materialized view.

Possible derived fields:

```text
company_id
total_lots
average_cost
invested_capital
realized_pnl
unrealized_pnl
last_transaction_at
```

It does not need to be part of MVP.

---

# 21. Review

A Review compares previous expectations with later reality.

Possible fields:

```text
id
user_id
company_id
thesis_version_id
review_type
expected
observed
assessment
notes
created_at
```

Possible `assessment`:

```text
INTACT
STRENGTHENED
WEAKENED
PARTIALLY_INVALIDATED
INVALIDATED
UNCLEAR
```

A Review does not automatically create a new Thesis Version.

It may lead to one.

---

# 22. Review Evidence

A Review may reference:

- new evidence,
- market/company events,
- earnings results,
- management changes,
- user observation.

This helps explain why the view changed.

---

# 23. AI Run

An AI Run records an important AI operation.

Possible fields:

```text
id
user_id
company_id
role
model
prompt_version
status
input_reference_ids
output_schema_version
token_usage
estimated_cost
created_at
```

Possible roles:

```text
REFINE
STRUCTURE
GUIDE
CHALLENGE
COMPARE
REFLECT
```

Possible status:

```text
SUCCESS
FAILED
RETRIED
REJECTED_BY_USER
```

AI Run exists mainly for:

- debugging,
- cost tracking,
- prompt iteration,
- provenance.

Do not expose all of it in normal UI.

---

# 24. Timeline Event

Timeline Event creates a simple human-readable history.

Instead of manually maintaining a separate source of truth, timeline events may be generated from domain events.

Examples:

```text
Thought created
Evidence added
Open Gap resolved
Challenge conceded
Thesis v1 locked
Decision: Watch
Transaction: Buy
Review completed
Thesis v2 locked
```

Possible fields if persisted:

```text
id
user_id
company_id
event_type
entity_type
entity_id
summary
created_at
```

Timeline is primarily a projection of history.

---

# 25. Domain Relationships

High-level relationship:

```text
User
└── Company
    ├── Thought
    │   ├── Refinement
    │   └── Reasoning Item
    │
    ├── Evidence
    │   └── Evidence Link → Reasoning Item
    │
    ├── Open Gap
    │
    ├── Challenge
    │   └── Challenge Response
    │
    ├── Thesis Version
    │
    ├── Decision
    │   └── Transaction
    │
    ├── Review
    │
    ├── AI Run
    │
    └── Timeline Event
```

---

# 26. Important Invariants

These rules should stay true regardless of implementation.

## 26.1 Raw thought integrity

```text
AI never overwrites raw user input.
```

---

## 26.2 Locked thesis integrity

```text
Locked Thesis Version is immutable.
```

Changes create a new version.

---

## 26.3 Thesis != Decision

```text
Thesis and Decision are separate domain objects.
```

---

## 26.4 Evidence != Interpretation

```text
External fact and user meaning are separate.
```

---

## 26.5 AI suggestion != User judgment

```text
AI-generated reasoning must remain attributable.
```

---

## 26.6 Unknown is valid

A record may remain unresolved.

---

## 26.7 History is append-oriented

Important events should be added, not rewritten.

---

# 27. What Should Not Become an Entity Too Early

Avoid over-modeling.

Do not create separate tables/entities for every UI component.

Examples that may remain UI concepts:

```text
Dashboard Card
Continue Analysis
Recent Thinking
Current View Panel
Thinking Evolution Widget
```

These should be derived from domain data.

---

# 28. Do We Need an "Analysis" Entity?

For MVP:

**Probably not.**

Reason:

A company may have many overlapping thoughts and thesis revisions without a clean start/end boundary.

Creating:

```text
Analysis #1
Analysis #2
Analysis #3
```

may force artificial grouping.

Recommended MVP:

```text
Company is the main container.
Thoughts and versions carry timestamps.
```

Future possibility:

If users need separate research tracks such as:

```text
BBCA — Moat Analysis
BBCA — Valuation Review
BBCA — Governance Review
```

we may add:

```text
Research Thread / Focus
```

later.

Do not add it before the need is real.

---

# 29. Current View

`Current View` should probably be a **projection**, not a standalone source of truth.

It may be generated from:

- latest accepted reasoning items,
- latest thesis draft,
- unresolved gaps,
- current confidence.

This avoids another mutable record that can become inconsistent.

---

# 30. Company Status

Possible high-level company analysis status:

```text
EXPLORING
DEVELOPING
THESIS_FORMED
TRACKING
REVIEWING
ARCHIVED
```

This status may be:

- explicitly stored,
- or derived from the latest domain state.

Prefer derivation if reliable.

Avoid complicated workflow enforcement.

---

# 31. Domain Events

Important state changes may emit domain events.

Examples:

```text
ThoughtCreated
RefinementAccepted
EvidenceAdded
OpenGapCreated
OpenGapResolved
ChallengeCreated
ChallengeConceded
ThesisLocked
DecisionRecorded
TransactionRecorded
ReviewCompleted
```

These events can later power:

- timeline,
- analytics,
- notifications,
- reflections.

MVP may implement them implicitly rather than with a full event-sourcing architecture.

---

# 32. Do Not Build Full Event Sourcing

MY KRAVV benefits from historical integrity, but that does not mean we need a complex event-sourcing framework.

For MVP:

Use normal relational tables plus:

- immutable rows where needed,
- version records,
- timestamps,
- optional audit events.

Do not overengineer.

---

# 33. Suggested MVP Entities

Minimum useful domain model:

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
Thesis Version
AI Run
Timeline Event
```

Can be deferred:

```text
Decision
Transaction
Portfolio Position
Review
Reflection Report
Document ingestion
Market data
```

If the MVP includes decision tracking early, `Decision` can be moved into the first set.

---

# 34. Suggested MVP Data Flow

```text
User writes Thought
↓
Thought saved
↓
AI Run: Structure / Refine
↓
Refinement + suggested Reasoning Items
↓
User accepts/edits
↓
Reasoning Items saved
↓
Optional Challenge
↓
Challenge + Response
↓
Optional Open Gap
↓
User creates Thesis Draft
↓
Thesis Version locked
↓
Timeline updated
```

---

# 35. Query Patterns We Should Support

The domain should make these queries easy:

```text
Show all thoughts for BBCA.
```

```text
Show unresolved gaps for BBCA.
```

```text
Show all evidence supporting Claim X.
```

```text
Show all challenges that were conceded.
```

```text
Show Thesis v1 and Thesis v2 side by side.
```

```text
Show what changed after Evidence Y was added.
```

```text
Show all raw thoughts created before Thesis v1.
```

```text
Show all AI refinements the user rejected.
```

These queries are part of why relational data is useful.

---

# 36. Privacy Boundary

Every domain object should belong to a user.

Conceptually:

```text
WHERE user_id = authenticated_user_id
```

should apply to private data access.

Never rely only on:

```text
entity_id
```

to authorize access.

The UI hiding an item is not authorization.

---

# 37. Deletion Strategy

Because history is important, deletion behavior should be deliberate.

Possible approach:

### Draft content

May be hard-deleted if never used.

### Historical content

Prefer:

```text
archived
retracted
superseded
```

instead of destructive deletion.

### User privacy

The user must still have the ability to permanently delete their private data.

Historical integrity should never override the user's right to remove their own data.

---

# 38. Domain Simplicity Rule

Before adding a new entity, ask:

```text
Does this represent a real business/domain concept,
or is it only a screen component?
```

If it is only presentation:

do not add it to the domain.

---

# 39. Mental Model for Developers and AI

The easiest mental model:

```text
Company = folder

Thought = what the user said

Refinement = cleaner wording

Reasoning Item = what the thought means structurally

Evidence = what supports or challenges reasoning

Open Gap = what is still unknown

Challenge = objection to reasoning

Thesis Version = frozen current belief

Decision = what the user chose to do

Transaction = what the user actually did

Review = what reality later showed

AI Run = what AI did

Timeline = readable history
```

---

# 40. Locked Domain Decisions

Current agreed direction:

```text
Company is the main anchor.
Company Workspace is a UI/product concept, not necessarily a table.
Raw Thought is first-class data.
Refinement is separate from raw.
Structured reasoning is separate from evidence.
Evidence and interpretation must remain distinct.
Open Gap is a first-class unresolved question.
Challenge is a first-class object, not just chat text.
Thesis is versioned and immutable once locked.
Thesis and Decision are separate.
Transaction history should be append-based.
Review compares expectation with reality.
AI Run records provenance/cost/debug metadata.
Timeline is a projection of domain history.
Do not add an Analysis entity unless a real need appears.
Do not implement full event sourcing for MVP.
Keep the backend model richer than the visible UI.
```

---

## Next Document

`05-mvp-scope.md`

That document should decide exactly:

- what is in the first usable version,
- what is intentionally delayed,
- what dependencies are required,
- what acceptance criteria define "MVP works",
- and what we must avoid building too early.
