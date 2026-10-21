# MY KRAVV V3 — Proposed Implementation Plan

Status: **Draft — awaiting owner review**

Date: **21 October 2026 (Asia/Jakarta)**

Authority: [V3 index](00-V3-INDEX.md). **Revision 3 — planning only.** This sequence operationalizes settled P1–P8, C1 and primary T1–T7 directions through proposed bounded slices. It accepts none of these Draft specifications and authorizes no application, database, authentication, tooling installation or provider work. It replaces no historical V2 plan in the archive. No delivery dates or actual migrations are created.

## Dependency and review rules

Review the revised [foundation](01-PRODUCT-FOUNDATION.md), [domain outlines](04-DOMAIN-AND-PROVENANCE.md#proposed-persistence-model) and [architecture proposal](06-TECHNICAL-ARCHITECTURE.md) before implementation planning is accepted. **P1–P8, C1 and primary T1–T7 are settled requirements.** Concrete SQL/dependencies/parameters remain engineering recommendations to validate in the relevant slice; they do not reopen product choices. C1 requires empty-only Company deletion and excludes Company archive; screenshot defaults and V2 cascades cannot override it.

Formal recording depends on recoverable authoring, live draft-candidate membership, explicit Thought identity and exact-revision confirmation. AI Review/follow-ups need snapshot identity, context disclosure and accounting, but manual writing/recording does not depend on AI approval/availability. Reference reuse inserts title/URL/selected notes without source hosting or permanent lineage. Preserve secure authentication/session/owner boundaries before private work; **completion of the whole Account Settings UI is not a core-writing dependency**. Recovery/email-change callbacks still need their own reviewed handling when implemented.

## Proposed sequence and acceptance evidence

Each slice is **a proposal for later explicit implementation authorization**. Review delivered evidence before expanding the authorized scope; if the owner authorizes several slices together, ordinary passing checks do not manufacture a new approval gate between them. A material contract, destructive migration, deployment or paid-provider change returns for its required review. Use the [critical verification matrix](07-VALIDATION-AND-RECOVERY.md#revision-3-critical-verification-plan) rather than a screenshot checklist. The [environment/migration proposal](06-TECHNICAL-ARCHITECTURE.md#isolated-environment-and-migration-proposal) is the source for migration ordering and target safeguards.

### Slice 0 — Isolated environment and secure foundation

- **Scope/dependencies:** owner review of Revision 3 and explicit authorization of this first preparation/coding slice; verify local runtime/CLI feasibility, distinct V3 environment/configuration, synthetic users and existing Supabase session patterns. Product privacy foundation and T6; no additional product choice required.
- **Proposed data changes:** reviewed fresh local V3 baseline with owned settings/Company basics and RLS, separate migration manifest and no legacy user-data import. Do not alter historical V2 migrations or link to V2. Target guards precede any local reset/test.
- **Security/recovery:** request-scoped JWT, action-level `getUser`, cookie refresh/private no-store, foreign/anonymous denial, environment-scoped browser recovery and safe login/logout. Audit all callable legacy RPCs/grants if any legacy objects are present.
- **Tests/evidence:** isolated target identity (no secret values), reproducible synthetic baseline, two-user RLS tests, Auth regression tests and wrong-target guards. Validate local key-prefix compatibility and document runtime limits.
- **Exclusions/review:** no paid AI, deployment, V2 database operations, historical import or complete Account Settings UI. Owner reviews isolation/security evidence before private-feature scope expands beyond the authorization.

### Slice 1 — Company basics and V3 shell

- **Scope/dependencies:** slice 0 security; owned create/list/name-or-ticker find/edit/switch, empty/failure states, global navigation/contextual sidebar and independent panels. C1/T7/Hybrid C. Preserve login/logout and recoverable navigation.
- **Proposed data changes:** minimal Company metadata and light/dark preference only. No archive state/taxonomy requirement. Install empty-only deletion RPC, restrictive permissions and a catalog test contract for every future Company child before exposing destructive action.
- **Security/recovery:** server-owned identity, no external enrichment; preserve input on failure. C1 confirmation + authoritative empty check/parent lock; every later child relation must extend that enforcement before being writable.
- **Tests/evidence:** foreign IDs, metadata save failure, duplicate action recovery, directory/switcher identity, empty-only deletion/bypass checks and initial keyboard/light/dark states. With synthetic children later, rerun the full C1 race matrix.
- **Exclusions/review:** no Company archive/cascade, market directory, extra global navigation or completed account forms. Review shell/Company behavior and deletion safeguards before dependent children are introduced.

### Slice 2A — Server drafts and one Markdown editor

- **Scope/dependencies:** slice 1 owned workspace, T1/T2/T3/T4 and P4/P5. Create/select multiple drafts, exact Markdown native editor, guidance-only approaches, current-row autosave and optional safe preview. Stage fields may exist now; no recording UI yet.
- **Proposed data changes:** writing drafts with content/staging counters, owned revision-CAS RPCs, operation tickets/receipts and restrictive Company FK. No draft-history table or Candidate entity. A renderer dependency is proposed only after version/security/license review within authorized scope.
- **Security/recovery:** matching acknowledgements, single in-flight save per tab/draft, explicit preserved-copy conflicts, bounded per-user/environment/tab buffers, reload/session expiry/logout and permanently deleted-draft handling. Local buffer is temporary; server is primary.
- **Tests/evidence:** exact Unicode/whitespace/line-ending round-trip; delayed/duplicate acknowledgements, two-tab conflicts, quota failure, IME/undo/paste/large text and mode switches. C1 must refuse deletion with a single unstaged draft.
- **Exclusions/review:** no offline sync, rich-text conversion, automatic AI, Thought version from autosave or custom templates. Owner reviews recoverable writing before dependent stage/commit or provider scope.

### Slice 2B — Penampungan, Explore and reliable moves

- **Scope/dependencies:** slices 1/2A persistence/recovery; P1/P4/P5. Company-optional Quick Capture, recent/full inbox within Beranda, company Explore notes/Bahas nanti and explicit capture move to Explore or one new draft. Inbox/new-draft behavior is a labeled UX recommendation in workflows.
- **Proposed data changes:** captures with nullable Company, Explore current-note records, mutation revisions, atomic move RPC/receipt and indexed restrictive Company FKs. Add all new child checks to C1 before exposure.
- **Security/recovery:** explicit authorized destination, Company-first locks, stable retry payload, source preserved on rollback and no destination duplicates after lost response. Confirm permanent note/capture removal; source reuse is no permanent sync/lineage.
- **Tests/evidence:** optional-company capture, duplicate creates/moves, concurrent different moves, changed source revision, unavailable destination and Company-delete races for both new child types. Preserve unsaved input through full-inbox navigation.
- **Exclusions/review:** no archive/trash, bulk processing, automatic detach/reassignment, notification system or existing-draft append/replace. Review the small recommended inbox/move interaction while accepting evidence, without reopening P1.

### Slice 3 — Manual References and explicit insertion

- **Scope/dependencies:** owned Company and draft save protocol; P7/P4, T1/T2. Title/URL-only required create, optional metadata/notes, external open/copy/edit/delete and chosen insertion into writing.
- **Proposed data changes:** source reference records/revision, safe URL schema and Company RESTRICT FK; no source files, document bodies, object storage or permanent reference-lineage relations.
- **Security/recovery:** require explicit selected note fields; source remains on reuse. Insertion is a deliberate editor change saved by CAS; do not replay it twice after navigation/uncertain acknowledgement. Metadata deletion leaves external/inserted text unchanged.
- **Tests/evidence:** minimal valid form, unsafe URL rejection without fetching, foreign company/notes denial, selected versus unselected text, save conflict, duplicate insertion prevention and C1 refusal with only a Reference.
- **Exclusions/review:** no scraping, previews that fetch external URLs, PDF upload/hosting, mandatory taxonomy or AI ingestion. Can progress alongside later manual-history work after shared draft boundaries pass; no AI dependency.

### Slice 4A — Live staging and deliberate immutable recording

- **Scope/dependencies:** slice 2A recoverable editor and Company security; P2/P3/P4/P8 with T1/T3/T4. Stage/withdraw/live Working Tree, exact Tinjau & Rekam preview, explicit Thought Baru/Versi Lanjutan, optional short rationale and skippable qualitative Context Snapshot. References are useful but not a hard prerequisite for recording.
- **Proposed data changes:** Thought identities/counter/title, full immutable versions/inline optional context, unique version/commit keys and atomic commit/unstage receipt. No Candidate table and no draft→version cascade. Lightweight new-Thought title behavior is a labeled recommendation, not a required metadata form.
- **Security/recovery:** expected content/staging/latest target-version checks, explicit same-company target and no inferred identity. Handle lost response as the same operation; success ends staging and keeps draft. Normal version UPDATE/selective DELETE denied.
- **Tests/evidence:** concurrent saves/withdrawals/commits, repeated operation and changed payload, rollback between version write/unstage, empty optional fields, exact source and context immutability. C1 refuses Company with any Thought/version/draft; ordinary-JWT bypass tests mandatory.
- **Exclusions/review:** no AI review gate, metadata-only automatic versions, context correction subsystem or per-autosave history. Owner reviews exact commit behavior/security evidence before expanding history/destructive UI scope.

### Slice 4B — History, responsive diff and whole-Thought deletion

- **Scope/dependencies:** slice 4A immutable records; P3/P4/P8 and T7. Read identified histories/details, desktop side-by-side and narrow unified text diff, deliberate whole-Thought deletion and coherent draft/review cleanup boundaries.
- **Proposed data changes:** owned read indexes/projections, narrow whole-delete RPC and minimal deletion receipts; no canonical diff storage or selective version-delete API. Review a focused deterministic diff dependency if justified.
- **Security/recovery:** fixed old/new direction, no historical mutation, version-count/latest-number reconfirmation after concurrent append, atomic whole deletion of all versions/contexts. Draft deletion never deletes Thought; Company deletion never calls whole-delete internally.
- **Tests/evidence:** exact diff inputs and whitespace/Unicode/final-newline cases, long-rewrite fallback, both themes/keyboard/reflow, direct immutable-write denial, delete/append races and ambiguous deletion recovery. Show manual writing/recording working with AI disabled.
- **Exclusions/review:** no semantic AI explanation, comments/collaboration, archive/trash or bulk history surgery. Review useful manual end-to-end flow before optional AI integration.

### Slice 5A — Persistent AI Review contract and budget infrastructure, with fake transport

- **Scope/dependencies:** stable saved drafts/selection/recovery, P6/T4/T5/T6; optional source context relies on relevant slice 2B/3 records. Define Clarify/Challenge/Gap Check and bounded persistent sessions/manual follow-ups, explicit old-context continuation/current refresh, one configured server model and owner monthly budget.
- **Proposed data changes:** bounded review snapshots/messages, session counters/claims, adapted AI run/attempt ledger with authoritative budget locks, period/rate snapshots and cleanup. Extend draft-deletion cleanup and C1 associations. No provider credentials need be changed to test fakes.
- **Security/recovery:** freeze disclosed owned values; no hidden Company notes/Context Snapshot or URL contents; never send on reopen. Capacity checks and named idle-session replacement, one claim per explicit action, unknown holds retained, late-result deletion protection and sanitized logs.
- **Tests/evidence:** injected fake provider for every context/staleness/concurrency/retention/budget/crash/period/rate failure case in validation. Ordinary clients cannot reserve/settle; settings edits cannot bypass outstanding holds. Every mode uses one active server configuration.
- **Exclusions/review:** no real provider calls, automatic format repair, generic chatbot or model picker. Owner reviews behavior contracts, bounds, selected provider/model capability/pricing evidence and a separately bounded request/cost proposal before any paid evaluation. This review does not block useful manual workflows.

### Slice 5B — Separately authorized provider evaluation

- **Scope/dependencies:** slice 5A passes, and explicit provider-call authorization with chosen model, verified compatible structured outputs/token bounds, current rates/FX and a bounded call/cost plan. Use synthetic research only.
- **Proposed data changes:** configuration and provider provenance only as approved; no new research domain or model-selection UI.
- **Security/recovery:** enforce pre-transmission budget, no retries beyond explicit approved actions, inspect unknown accounting without automatic refund/resend, redact diagnostics.
- **Tests/evidence:** authorized review-mode/follow-up semantic evaluation, honest measured tokens/estimated cost, actual failure handling; no claim that schema validity proves reasoning quality or invoice cap.
- **Exclusions/review:** no unbounded smoke suite, historical provider allowance, private V2 data or deployment. Stop on the agreed limits/failure conditions and report evidence to owner.

### Independent slice — Global account UI

- **Scope/dependencies:** slice 0 session isolation; provider-supported password change, recovery, verified email change and basic theme/account presentation. Usage/budget display depends on actual slice 5A accounting, not fabricated amounts. Complete agreed account scope for overall MVP signoff, but no dependency from core writing on every form.
- **Proposed data changes:** only reviewed preferences; use Auth provider identity/security mechanisms, not a password store. Recovery/callback route/config adaptations are included when introduced.
- **Security/recovery:** narrowly allowlisted same-origin PKCE/verification callback, expired/replayed links, provider-required reauthentication/email confirmations, no open redirects or cross-account recovery.
- **Tests/evidence:** mocked contract checks plus later authorized isolated email/Auth integration, logout/account isolation and cookie/cache behavior. Basic appearance stays keyboard/contrast checked.
- **Exclusions/review:** no extra passphrase, collaboration/notification settings, account-switching system or model picker. Review independently alongside authorized manual slices.

### Slice 6 — Integrated MVP acceptance

- **Scope/dependencies:** agreed useful manual slices, independent account scope and optional AI scope as explicitly approved. No automatic promotion of all drafts to Accepted.
- **Proposed data changes:** no new domain; only reviewed fixes within authorized scope. Any eventual deployment target/migration requires separate explicit approval and backup/restore plan.
- **Security/recovery:** rerun C1 child/race/bypass matrix, immutable history, ownership/recovery, cleanup and AI-disabled manual flow on the identified isolated target.
- **Tests/evidence:** actual product/security/recovery matrix, accessible responsive light/dark states, measured long-document/diff behavior, honest cost/usage wording, documented limits and owner review of the implementation. Provider evidence remains separate from deterministic/database results.
- **Exclusions/review:** no V2 import, public roadmap or unrelated MVP expansion. Review risks and eventual deployment plan; a passing local acceptance run does not itself publish or migrate anything.

Manual writing/recording can be useful after slices 2A/4; source catalog and AI integration are not artificial prerequisites. Minor engineering parameters are validated with their slice rather than repeatedly asking for product choices already settled. Each approved scope may span several slices, with material deviations reported before dependent changes.

## Scope and regression discipline

Each later approved slice should state the accepted contracts it implements, the existing V2 behaviors it preserves or deliberately changes, the evidence required, and any separate environment/provider authorization. Reuse owner/session boundaries, RLS checks, operation identities, draft-receipt logic and conservative accounting where they fit; redesign the V3 authoring/domain/navigation contracts described in [architecture](06-TECHNICAL-ARCHITECTURE.md).

Do not insert a custom template manager, hosted source documents, collaboration, notification system, general chatbot, market terminal, automatic trading or unrelated preferences into these stages. A source icon, inactive template control, sample status, review chat box or settings subsection is not scope approval. Basic usability does not require implementing every mockup asterisk/tab/action.

Use the [validation matrix](07-VALIDATION-AND-RECOVERY.md) to define meaningful checks rather than copying layout snapshots as tests. Database and provider work need their own reviewed operations and evidence. Validate the proposed rollback plan and isolated target before executing approved persistence changes; this document creates/applies no migrations and authorizes no V2 data import.

The 14 reference PNGs remain canonical and untouched. Image compression/conversion, if desired, is a separate explicitly reviewed operation after documentation consolidation. This task ends with locally reviewable documentation, not a commit, push, release or implementation start.
