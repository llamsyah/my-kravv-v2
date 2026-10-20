# MY KRAVV V3 — Domain and Provenance

Status: **Draft — awaiting owner review**

Date: **20 October 2026 (Asia/Jakarta)**

Authority: [V3 index](00-V3-INDEX.md). This is a conceptual model for review, not a database schema, migration plan or choice of API/storage representation. [Workflow](02-WORKFLOWS-AND-INFORMATION-ARCHITECTURE.md) owns transitions; [AI behavior](03-AI-BEHAVIOR-AND-OWNERSHIP.md) owns provider boundaries.

## Distinct concepts

| Concept                   | Meaning and ownership                                                    | Change/history meaning                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account                   | Authenticated owner of private research and preferences                  | Identity is verified by the authentication provider, never a client-supplied owner field.                                                          |
| Company                   | Owner's research context                                                 | Many companies per owner; no automatic external fact enrichment.                                                                                   |
| Penampungan item          | Fast-entry mutable capture in a separate inbox                           | Not a Thought, Explore note, draft or candidate. Optional/required company association is P1.                                                      |
| Explore note              | Company-scoped informal personal writing                                 | Many editable autosaved notes; optional Bahas nanti marker, no committed-version semantics.                                                        |
| Writing draft             | Serious analysis in one of three assistance approaches                   | Many unfinished drafts per company. Autosave/recovery revisions remain draft changes.                                                              |
| Writing framework         | Flexible six-area guidance, initially fundamental analysis               | Outline/checklist assistance, not required fields, a score, or automatic Thought boundaries. Custom management is excluded initially.              |
| Candidate                 | Writing intentionally staged/submitted for recording                     | Working Tree membership requires an explicit action. Draft-to-candidate revision linkage is P2.                                                    |
| Thought                   | Owner-defined identity for a line of recorded reasoning within a company | Multiple distinct Thoughts per company, each with one or more committed versions.                                                                  |
| Committed Thought version | Exact content deliberately recorded at a point in time                   | Immutable through ordinary editing; explicit later versions preserve earlier content. AI/draft sessions are not versions.                          |
| Context Snapshot          | Optional personal reflection provided inside Tinjau & Rekam              | Belongs to a specific committed version; skippable and private by default. Not Company Overview.                                                   |
| Reference                 | Company-scoped manual metadata for an external source                    | Title/URL/type/source name as applicable and optional publication date, data period, tags, description and private notes. No source file required. |
| AI Review                 | Identified result for a particular draft snapshot and mode               | Critique provenance and staleness; no implied author approval or new committed version.                                                            |
| AI run/attempt accounting | Technical record of a bounded provider operation and its attempts        | Token usage, estimated costs and uncertainty; separate from Thought history and provider invoices.                                                 |

The domain names express distinct responsibilities, not a mandate for one table per row. Existing V2 `thoughts` are immutable raw captures, not proof that V3 drafts, candidates and multi-version Thought identities already exist.

## Relationships and explicit boundaries

An Account owns Companies and private content. A Company groups its Explore notes, writing drafts, candidates, Thoughts and references. Penampungan remains distinct even when an item names a company. Parent/owner relationships must be consistent in both server authorization and persistence enforcement.

A draft can originate from deliberate reuse of a notebook note or selected reference material, or from fresh writing. Record origin only where actually known. Copy-versus-link semantics remain P1/P7; never erase the origin or imply that later edits to a source automatically rewrote committed reasoning.

Staging identifies writing for owner review. Whether Candidate is a record, state or revision reference is not chosen here. After successful recording, its active-queue membership ends while its origin/receipt remains traceable. One retried operation yields the same committed result; a deliberate new action is distinct. The persistence contract must make commit creation and queue transition coherent rather than recording twice after a partial response.

A new committed version belongs to a specified Thought identity. Choosing identity is an owner action, not a template heading, automatic AI classifier or inference from text similarity. Version order/time and comparison identity must be unambiguous. A diff reports changes between selected recorded contents; it cannot establish why a belief changed or classify a wording change as substantive reasoning on its own.

## Provenance and original meaning

For a recorded version, the proposed provenance minimum is the owning user/company/Thought, exact recorded content, reliable recording order/time, and the originating candidate/draft revision where available. Commit rationale, prior-version relationship, reference links and optional Context Snapshot should retain their actual attribution. Exact mandatory fields and rationale policy remain P3, not screenshot-derived requirements.

Distinguish the following without inventing missing evidence:

- Owner-authored wording versus AI critique or consciously incorporated suggestions.
- Original V2 capture versus a later V3 authored document/version.
- Source metadata as it exists now versus metadata the owner actually saw at commit.
- State while writing or in an earlier Explore note versus optional reflection at recording time.
- Recorded content versus currently selected/read content. Reading an older version does not change its provenance or declare it the newest belief.

Committed content must not change because a draft, source note, reference URL or AI result later changes. Whether to snapshot selected reference metadata or retain only links is technical question T3. Do not claim exact historical source contents when no copy exists; an external URL can expire while saved metadata remains useful.

## Privacy, retention and efficient storage

A committed version must remain inspectable without regenerating AI output. This requires preserving the actual recorded content, but does not require duplicating the full document on every keystroke or keeping an unlimited local draft log. [Architecture](06-TECHNICAL-ARCHITECTURE.md) evaluates draft recovery, version storage and review retention separately.

Context Snapshot is associated with the committed version, but the rules for later correction/deletion of personal context versus immutable recorded wording remain P4/P8. Do not interpret content immutability as an already approved permanent-retention or no-deletion policy. Server logs must not become an uncontrolled second archive of private reasoning.

Draft conflicts, ambiguous commit responses and missing optional provenance must be represented honestly. No fabricated original text, AI run, source snapshot, approval time, rationale or emotional state may be backfilled merely to populate a detail panel. Owner product decisions are tracked in the [foundation](01-PRODUCT-FOUNDATION.md#open-decisions--owner-product-choices); technical representations remain open in [architecture](06-TECHNICAL-ARCHITECTURE.md#open-decisions--technical-questions).
