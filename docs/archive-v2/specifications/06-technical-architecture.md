# MY KRAVV — Technical Architecture

> Status: Draft v0.1  
> Depends on:
> - `01-product-foundation.md`
> - `02-core-user-journey.md`
> - `03-ai-behavior-spec.md`
> - `04-domain-model.md`
> - `05-mvp-scope.md`
>
> Purpose:
> Define a practical technical architecture for MY KRAVV that is:
>
> - secure enough for private personal financial reasoning,
> - cheap enough for personal use,
> - simple enough to maintain,
> - flexible enough for AI memory and future growth,
> - and intentionally not overengineered.

---

# 1. Architecture Principles

MY KRAVV should follow these technical principles:

```text
Simple before distributed.
Server-side before exposing secrets.
Relational data before vector search.
Explicit AI actions before autonomous agents.
Private by default.
History before convenience.
Graceful degradation before hard dependency.
Portable enough to migrate later.
```

The architecture should support the product without becoming the product.

---

# 2. High-Level System

Recommended MVP architecture:

```text
┌─────────────────────────────┐
│        User Browser         │
│  Desktop / Tablet / Mobile  │
└──────────────┬──────────────┘
               │ HTTPS
               ▼
┌─────────────────────────────┐
│      Next.js Application    │
│                             │
│  UI + Server Routes/Actions │
└───────┬──────────┬──────────┘
        │          │
        │          └─────────────────────┐
        │                                │
        ▼                                ▼
┌─────────────────┐             ┌─────────────────────┐
│    Supabase     │             │     AI Gateway      │
│                 │             │                     │
│ Auth            │             │ Context Builder     │
│ PostgreSQL      │             │ Prompt Router       │
│ Storage (later) │             │ Output Validator    │
└─────────────────┘             └──────────┬──────────┘
                                          │
                                          ▼
                               ┌─────────────────────┐
                               │    OpenAI API       │
                               │ or configurable LLM │
                               └─────────────────────┘
```

MVP should remain a **single application**, not multiple microservices.

---

# 3. Recommended Stack

## 3.1 Frontend + App Server

Recommended:

```text
Next.js
React
TypeScript
```

Why:

- one codebase for UI and server logic,
- easy server-side routes/actions,
- mature ecosystem,
- easy auth integration,
- straightforward deployment,
- good fit for Codex-assisted development.

Avoid splitting frontend and backend into separate repositories for MVP.

---

## 3.2 Database

Recommended:

```text
PostgreSQL
```

Preferred managed provider for MVP:

```text
Supabase PostgreSQL
```

Why PostgreSQL:

- strong relational model,
- versioned history fits naturally,
- evidence/reasoning relationships are relational,
- query flexibility,
- mature indexing,
- easy future analytics,
- easy migration away from a managed provider if needed.

MY KRAVV should not store core history as one giant JSON blob.

---

## 3.3 Authentication

Recommended:

```text
Supabase Auth
```

Possible methods:

```text
Email + password
Magic link
OAuth later
```

Do not build custom password hashing/session logic unless a real requirement appears.

Core security rule:

```text
Authentication = who are you?
Authorization = are you allowed to access this record?
```

Both are required.

---

## 3.4 Object Storage

Not required for the earliest MVP if there is no file upload.

When file upload is added:

```text
Supabase Storage
```

Use for:

- annual reports,
- screenshots,
- research attachments,
- user-uploaded documents.

Storage should be private by default.

Do not use public bucket URLs for private analysis.

---

# 4. Application Boundaries

The application should be divided conceptually into:

```text
Presentation Layer
Application Layer
Domain Layer
Persistence Layer
AI Layer
Infrastructure Layer
```

Not every layer needs its own package in MVP.

This is a mental boundary first.

---

# 5. Presentation Layer

Responsibilities:

- render pages,
- collect user input,
- show AI suggestions,
- display timeline/history,
- display raw/refined/final distinctions,
- keep the interface simple.

Must not:

- contain OpenAI API keys,
- decide authorization,
- directly mutate private database tables without server validation,
- silently accept AI output.

---

# 6. Application Layer

Responsibilities:

- handle user actions,
- validate requests,
- enforce ownership,
- coordinate domain operations,
- call AI Gateway,
- persist accepted results,
- create timeline events,
- return safe responses.

Examples:

```text
createCompany()
createThought()
requestRefinement()
acceptRefinement()
requestChallenge()
respondToChallenge()
lockThesis()
```

This is the main orchestration layer.

---

# 7. Domain Layer

The domain layer represents product rules.

Examples:

```text
Raw Thought must be preserved.
Locked Thesis cannot be edited.
Challenge response must belong to the same user/company.
AI refinement does not automatically become final user text.
```

The domain layer should not depend on UI layout.

---

# 8. Persistence Layer

Responsibilities:

- PostgreSQL queries,
- transactions,
- version persistence,
- relation integrity,
- ownership filtering,
- audit data.

Recommended:

```text
ORM/query builder optional
```

Possible tools:

```text
Drizzle ORM
Prisma
Supabase client + SQL
```

Preference for MVP:

> Choose one tool that keeps SQL relationships understandable.

Avoid hiding the entire domain behind deeply generated ORM magic.

---

# 9. AI Layer

The AI layer should contain:

```text
AI Gateway
Context Builder
Prompt Registry
Model Router
Output Validator
Cost Tracker
```

This layer is responsible for making AI predictable enough to be useful.

---

# 10. AI Gateway

The browser should never call the LLM provider directly.

Flow:

```text
Browser
↓
MY KRAVV Server
↓
AI Gateway
↓
LLM Provider
```

The AI Gateway:

- holds API credentials server-side,
- chooses model,
- applies prompt version,
- receives structured output,
- validates output,
- records usage,
- returns safe result.

---

# 11. AI Endpoint Strategy

Avoid one generic endpoint:

```text
POST /api/ask-ai
```

Prefer role-specific operations:

```text
POST /api/ai/refine
POST /api/ai/structure
POST /api/ai/challenge
POST /api/ai/guide
POST /api/ai/compare
POST /api/ai/reflect
```

Internally they may share common infrastructure.

This keeps:

- prompts clear,
- context small,
- output schema predictable,
- costs easier to track,
- testing easier.

---

# 12. Context Builder

Context Builder is one of the most important components.

Its job:

> Retrieve only the minimum relevant MY KRAVV memory required for the current AI task.

Example:

## Refine request

Input context:

```text
Current raw thought
Company name
Relevant section
Optional user language preference
```

Do not include:

```text
All historical theses
All company transactions
All other companies
All previous AI conversations
```

---

## Challenge request

Input context:

```text
Target reasoning item
Linked evidence
Linked assumptions
Nearby reasoning
Relevant unresolved gaps
```

---

## Guide request

Input context:

```text
Current company state
What has already been covered
Open gaps
User request for help
```

---

# 13. Memory Architecture

MY KRAVV memory should be application-managed.

Do not treat the LLM as permanent memory.

MVP memory source:

```text
PostgreSQL
```

The application retrieves relevant context on each AI request.

Conceptual flow:

```text
User request
↓
Identify company + task
↓
Query structured memory
↓
Build context
↓
Call LLM
↓
Validate
↓
Save result
```

---

# 14. No Vector Database for MVP

Do not add embeddings/vector search initially.

Reason:

- early dataset is small,
- most context is directly linked by company,
- domain relationships are explicit,
- normal SQL queries are enough.

Add vector retrieval only when:

```text
history becomes large
AND
semantic recall becomes painful with normal relationships
```

Possible later architecture:

```text
PostgreSQL + pgvector
```

This keeps future migration simple.

---

# 15. Database Ownership Model

Every private domain row should belong to a user.

Conceptually:

```text
user_id
```

must be present or inferable.

Example:

```text
companies.user_id
thoughts.user_id
evidence.user_id
thesis_versions.user_id
```

Queries must enforce:

```text
record.user_id == authenticated_user.id
```

Never authorize only by:

```text
thought_id
company_id
```

---

# 16. Row Level Security

If using Supabase:

Enable and use PostgreSQL Row Level Security.

Conceptual rule:

```text
user may only SELECT/INSERT/UPDATE/DELETE rows they own
```

RLS is defense-in-depth.

Server-side authorization is still required for sensitive application actions.

Do not rely on UI hiding data.

---

# 17. Suggested Database Structure

High-level tables:

```text
users / profiles
companies
thoughts
refinements
reasoning_items
evidence
evidence_links
open_gaps
challenges
challenge_responses
thesis_versions
ai_runs
timeline_events
```

Later:

```text
decisions
transactions
reviews
documents
reflection_reports
```

---

# 18. Immutable Data Rules

Some records should be treated differently.

## Append / immutable

```text
raw thought original version
locked thesis snapshot
historical decision
transaction
AI run
timeline event
```

## Mutable

```text
company display metadata
draft thesis
open gap status
user preferences
```

The architecture must reflect this difference.

---

# 19. Thesis Lock Transaction

Locking a thesis should happen atomically.

Conceptual operation:

```text
BEGIN

validate ownership
validate thesis draft
collect current snapshot
create thesis_version
mark version LOCKED
create timeline event

COMMIT
```

If something fails:

```text
ROLLBACK
```

Do not allow half-created historical snapshots.

---

# 20. AI Request Flow — Example

Scenario:

User writes raw research about BBCA.

Flow:

```text
1. Browser sends raw note.
2. Server validates auth.
3. Server verifies company ownership.
4. Raw Thought is saved immediately.
5. User clicks Refine.
6. Server creates AI Run = PENDING.
7. Context Builder retrieves minimal company context.
8. AI Gateway selects prompt + model.
9. LLM returns structured result.
10. Output Validator checks schema.
11. AI Run updated with usage/cost/status.
12. Refinement saved as SUGGESTED.
13. UI shows Raw vs Refined.
14. User Accept/Edit/Reject.
15. Accepted structure becomes domain data.
16. Timeline event created.
```

Important:

> Save raw thought before calling AI.

This prevents data loss if AI fails.

---

# 21. AI Output Validation

Every structured AI result should be validated.

Use runtime schemas such as:

```text
Zod
```

Example:

```text
RefineResult
StructureResult
ChallengeResult
GuideResult
```

Reject output if:

- required field missing,
- invalid enum,
- unknown target ID,
- relation points outside current user/company,
- malformed JSON,
- unreasonable size.

---

# 22. Retry Strategy

Recommended:

```text
Attempt 1
↓
If schema failure
↓
One correction retry
↓
If still invalid
↓
Return safe failure
```

Do not retry indefinitely.

Retries cost money.

---

# 23. Model Routing

Use a configuration-based model router.

Example:

```text
AI_ROLE_REFINE_MODEL=...
AI_ROLE_STRUCTURE_MODEL=...
AI_ROLE_CHALLENGE_MODEL=...
```

Do not hard-code model names throughout the application.

This allows:

- cheaper models for simple tasks,
- stronger models for reasoning-heavy tasks,
- switching providers later,
- testing cost/quality trade-offs.

---

# 24. Provider Abstraction

Do not overbuild a provider abstraction framework.

But keep one boundary:

```text
AIProvider.generateStructured(...)
```

so the rest of the app does not depend directly on one SDK everywhere.

Initial provider:

```text
OpenAI
```

Future provider support should be possible without rewriting domain logic.

---

# 25. Prompt Registry

Prompts should be versioned in code.

Example:

```text
prompts/
  refine-v1.ts
  structure-v1.ts
  challenge-v1.ts
  guide-v1.ts
```

Each AI Run stores:

```text
prompt_version
```

This allows:

- testing,
- regression comparison,
- reproducibility,
- prompt iteration.

---

# 26. Cost Tracking

Every AI call should record:

```text
model
input_tokens
output_tokens
estimated_cost
role
created_at
```

The application should maintain:

```text
daily usage
monthly usage
monthly estimated cost
```

---

# 27. Cost Guard

Recommended configurable limits:

```text
AI_DAILY_CALL_LIMIT
AI_MONTHLY_COST_LIMIT
AI_MAX_CONTEXT_TOKENS_PER_ROLE
```

Behavior when limit reached:

```text
Non-essential AI actions disabled.
Manual product remains usable.
```

Example message:

```text
AI assistance is paused because this month's personal budget limit was reached.
Your notes and history remain fully available.
```

---

# 28. Rate Limiting

Required for AI endpoints.

Purpose:

- prevent accidental loops,
- protect budget,
- reduce abuse,
- protect provider quota.

Rate limit may be:

```text
per user
per endpoint
per time window
```

Example conceptual limit:

```text
20 AI calls / 10 minutes
```

Exact values should be configurable.

---

# 29. Idempotency

Some operations should protect against double-submit.

Examples:

```text
Lock thesis
Accept refinement
Create challenge response
```

Use:

```text
idempotency key
or
server-side duplicate checks
```

This prevents accidental duplicate historical events.

---

# 30. Graceful AI Degradation

AI outage must not break the application.

If AI fails:

```text
save raw thought
preserve all manual operations
show non-blocking error
allow retry later
```

Core app remains:

```text
readable
editable where allowed
historically intact
```

---

# 31. Logging

Logging should help debugging without leaking private content.

Good log:

```text
AI_REFINE_FAILED
user_id_hash=...
thought_id=...
provider_status=500
```

Avoid:

```text
RAW_USER_THOUGHT="I invested..."
```

Do not log full personal analysis unless explicitly needed in local development.

---

# 32. Error Tracking

Use privacy-aware error tracking.

Possible later tool:

```text
Sentry
```

If used:

- scrub request bodies,
- scrub auth tokens,
- scrub private analysis text,
- avoid sending raw financial notes by default.

---

# 33. Secrets

All secrets must remain server-side.

Examples:

```text
OPENAI_API_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
```

Never expose service-role credentials to browser JavaScript.

Frontend may use only public-safe credentials where the provider explicitly supports them.

---

# 34. Security Baseline

Minimum baseline:

```text
HTTPS
Managed authentication
Server-side authorization
RLS
Private storage
Server-side secrets
Rate limiting
Input validation
Output validation
No raw secret logging
Backup strategy
Dependency updates
```

---

# 35. CSRF / Session Security

Use secure framework/provider defaults.

Where cookie-based mutation endpoints are used:

- enforce same-site protection,
- validate origin when appropriate,
- avoid custom insecure session implementations.

Do not reinvent browser security mechanisms without need.

---

# 36. XSS / User Content

Thoughts and AI output are user-controlled content.

Render as text/escaped content by default.

If Markdown rendering is added later:

- sanitize rendered HTML,
- do not allow arbitrary scripts,
- do not trust AI-generated HTML.

---

# 37. SQL Injection

Use parameterized queries / trusted ORM/query tools.

Never construct SQL from raw user text.

---

# 38. File Upload Security — Later

When documents are added:

validate:

```text
file size
file type
ownership
storage path
download authorization
```

Do not trust filename alone.

Do not create public links by default.

---

# 39. Backup Strategy

MY KRAVV's historical value increases over time.

Losing data is a serious product failure.

MVP should have:

```text
managed database backups where available
periodic export option later
```

Recommended future feature:

```text
Export MY KRAVV archive
```

Possible formats:

```text
JSON
Markdown
CSV
```

Backup is more important than fancy analytics.

---

# 40. Recovery Strategy

Plan for:

```text
database restore
user account recovery
accidental app deployment bug
AI provider outage
```

Historical thesis data should be recoverable independently of AI availability.

---

# 41. Hosting

Recommended MVP:

```text
Frontend/App Server:
Vercel or similar Next.js-compatible platform

Database/Auth:
Supabase

AI:
OpenAI API
```

This is not a hard vendor lock.

The architecture should make migration possible.

---

# 42. Vendor Lock-In Boundaries

Acceptable lock-in:

```text
managed auth convenience
managed database hosting
deployment platform
```

Avoid deep lock-in in:

```text
domain model
AI prompts
business rules
historical data format
```

The domain should remain understandable outside the vendor.

---

# 43. Environment Separation

Use at least:

```text
development
production
```

Optional later:

```text
staging
```

Never test destructive migrations directly against production data.

---

# 44. Local Development

Local setup should support:

```text
npm install
npm run dev
```

Use:

```text
.env.local
```

for local secrets.

Do not commit secrets.

---

# 45. Database Migrations

All schema changes should be migration-based.

Do not manually edit production database structure without migration history.

Possible tooling:

```text
Supabase migrations
Drizzle migrations
Prisma migrations
```

Pick one consistent workflow.

---

# 46. Seed Data

Use fictional seed companies for development/testing.

Do not use real private user notes as fixtures.

Example:

```text
Aster Foods
Nexa Bank
Orbit Systems
```

This reduces accidental privacy exposure.

---

# 47. Test Layers

Recommended:

```text
Unit tests
Domain rule tests
API integration tests
AI behavior regression tests
Critical browser flow tests
```

Most important tests:

```text
Raw thought preservation
User isolation
Thesis lock immutability
AI output validation
Cost tracking
AI failure fallback
```

---

# 48. AI Regression Tests

AI behavior is probabilistic.

Use a fixed test suite from `03-ai-behavior-spec.md`.

Track:

```text
faithfulness
no invented facts
challenge relevance
question necessity
uncertainty preservation
```

Do not require exact wording equality.

Evaluate semantic behavior.

---

# 49. Observability

At minimum track:

```text
API errors
AI failures
AI latency
AI token usage
AI estimated cost
database errors
auth failures
```

Do not track sensitive content by default.

---

# 50. Performance

MVP performance targets should stay simple.

Pages should not fetch all historical data at once.

Use:

```text
pagination
recent-first queries
lazy loading for old timeline events
```

AI calls may take longer than normal page requests.

UI should show explicit processing state.

---

# 51. Background Jobs

Do not add a job queue in initial MVP unless needed.

Current AI actions are user-triggered and can be synchronous with reasonable timeout.

Add background jobs later for:

```text
document processing
scheduled reflection
large ingestion
market synchronization
```

---

# 52. n8n Boundary

n8n is not part of core MVP architecture.

Future use:

```text
scheduled automation
external data sync
report ingestion
notifications
```

Core product logic should remain inside MY KRAVV application.

Do not make critical domain rules depend on n8n workflows.

---

# 53. External Market Data — Later

If market data is added later:

create an integration layer.

Do not let external provider schemas leak into core domain tables.

Example:

```text
MarketDataProvider
↓
normalize
↓
MY KRAVV internal representation
```

---

# 54. Future Document Ingestion

Possible future flow:

```text
Upload document
↓
Private storage
↓
Extract text
↓
Chunk
↓
Store document metadata
↓
Optional embeddings
↓
Retrieve relevant evidence
```

This is explicitly not required for MVP.

---

# 55. Future Semantic Retrieval

When needed:

```text
PostgreSQL
+ pgvector
```

Potential retrieval hierarchy:

```text
1. Direct relational links
2. Recent company history
3. Semantic retrieval
4. Manual fallback
```

Semantic search should supplement explicit domain links, not replace them.

---

# 56. Future Reflection Pipeline

Later architecture:

```text
Historical structured data
↓
Deterministic aggregation
↓
Select representative examples
↓
AI Reflect
↓
User-visible reflection report
```

Do not send the full raw database directly to the model.

---

# 57. Privacy Philosophy

MY KRAVV stores personal judgment.

Treat it as sensitive private data even if it is not legally classified as highly regulated financial data.

Default:

```text
private
least exposure
minimal logging
minimal external transmission
```

Only send to the AI provider:

```text
context needed for the requested AI action
```

---

# 58. Data Sent to AI

Do not automatically send:

```text
full portfolio
all historical companies
all raw notes
all private metadata
```

Send only task-relevant context.

This improves:

- privacy,
- cost,
- latency,
- answer quality.

---

# 59. AI Data Boundary

For each AI request, server should construct an explicit context package.

Example:

```json
{
  "task": "challenge",
  "company": {
    "id": "cmp_123",
    "name": "Example Company"
  },
  "target": {
    "type": "claim",
    "text": "Recurring revenue proves switching cost."
  },
  "linked_evidence": [],
  "open_gaps": []
}
```

This is preferable to sending arbitrary database dumps.

---

# 60. Suggested Project Structure

Possible folder structure:

```text
src/
  app/
  components/
  features/
    companies/
    thoughts/
    reasoning/
    challenges/
    thesis/
    timeline/
  server/
    auth/
    db/
    ai/
      gateway/
      context/
      prompts/
      schemas/
      router/
      cost/
  domain/
    company/
    thought/
    thesis/
    challenge/
  lib/
  tests/
```

Keep feature boundaries understandable.

Do not create dozens of layers before they are useful.

---

# 61. API Boundary Examples

Possible operations:

```text
POST /api/companies
POST /api/thoughts
POST /api/ai/refine
POST /api/ai/structure
POST /api/ai/challenge
POST /api/challenges/:id/respond
POST /api/thesis/lock
GET  /api/companies/:id/timeline
```

Exact routing may change with Next.js server actions.

The important part is responsibility separation.

---

# 62. Data Transaction Examples

## Accept AI Refinement

```text
validate user
validate thought ownership
validate refinement ownership
mark refinement ACCEPTED
create timeline event
```

---

## Concede Challenge

```text
validate user
validate challenge ownership
create response CONCEDE
update challenge status
optionally weaken reasoning item
create timeline event
```

---

## Lock Thesis

```text
validate user
collect current state
freeze snapshot
create immutable thesis version
create timeline event
```

---

# 63. What Not to Build

Do not add in MVP:

```text
Microservices
Kafka
Multi-agent orchestration
Dedicated vector database
Kubernetes
Redis unless truly needed
Custom auth system
Complex workflow engine
Full event sourcing
Long-running agent loops
Autonomous portfolio decisions
```

The system is not too small for good architecture.

It is too small for unnecessary infrastructure.

---

# 64. Architecture Success Criteria

Architecture is successful if:

```text
The app is easy to run locally.
A new developer/AI assistant can understand the system.
Private data is isolated per user.
Raw history is preserved.
AI can fail without breaking the app.
Prompts can evolve without breaking domain logic.
AI cost is observable and controllable.
Database relationships remain understandable.
The system can grow without immediate rewrite.
```

---

# 65. Initial Deployment Shape

Recommended first production shape:

```text
Vercel / Next.js
        │
        ├── Supabase Auth
        ├── Supabase PostgreSQL
        └── OpenAI API
```

Optional later:

```text
Supabase Storage
```

That is enough.

---

# 66. Build Priority

Recommended technical build order:

```text
1. Next.js project skeleton
2. Supabase project
3. Auth
4. PostgreSQL schema + migrations
5. Company CRUD
6. Raw Thought persistence
7. Ownership/RLS tests
8. AI Gateway
9. Refine structured output
10. AI Run + cost tracking
11. Structure role
12. Reasoning Items
13. Open Gaps
14. Challenge role
15. Challenge responses
16. Thesis snapshot transaction
17. Timeline
18. Failure handling
19. Security review
20. UI polish
```

---

# 67. Locked Technical Decisions

Current agreed direction:

```text
Next.js + React + TypeScript
Single application for MVP
PostgreSQL as primary database
Supabase preferred for managed Postgres/Auth
Private workspace
Server-side AI Gateway
OpenAI as initial AI provider
Context Builder selects minimal relevant memory
No vector DB in MVP
No n8n in core MVP
No microservices
No full event sourcing
Role-specific AI actions
Structured AI output validation
Prompt versioning
AI usage/cost tracking
Monthly cost guard
Graceful AI failure
Server-side authorization
RLS as defense-in-depth
Private storage when documents are added
Migration-based schema changes
Privacy-aware logging
```

---

# 68. Architecture One-Liner

> **MY KRAVV is a private Next.js application backed by relational memory, with a server-side AI layer that receives only task-relevant context and never owns the user's judgment.**

---

## Next Document

`07-page-responsibilities.md`

That document should define:

- what each page is responsible for,
- what each page must not become,
- how users move between pages,
- what information is visible at each level,
- and how we keep MY KRAVV simple despite the rich domain underneath.
