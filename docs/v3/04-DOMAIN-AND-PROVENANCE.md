# MY KRAVV V3 — Domain and Provenance

Status: **Draft — awaiting owner review**

Date: **21 October 2026 (Asia/Jakarta)**

Authority: [V3 index](00-V3-INDEX.md). This is a conceptual model for review, not a database schema, migration plan or choice of API/storage representation. [Workflow](02-WORKFLOWS-AND-INFORMATION-ARCHITECTURE.md) owns transitions; [AI behavior](03-AI-BEHAVIOR-AND-OWNERSHIP.md) owns provider boundaries.

Revision 2 applies settled P1–P8: minimal recoverable state before commit, deliberate immutable records afterward. No permanent history of each capture move, note change, candidate edit or draft autosave is required.

## Distinct concepts

| Concept                   | Meaning and ownership                                                             | Change/history meaning                                                                                                                                                                                                      |
| ------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account                   | Authenticated owner of private research and preferences                           | Identity is verified by the authentication provider, never a client-supplied owner field.                                                                                                                                   |
| Company                   | Owner's research context                                                          | Many companies per owner; no automatic external fact enrichment.                                                                                                                                                            |
| Penampungan item          | Temporary mutable capture with optional company association                       | An explicit move saves content to Explore/writing before removing the capture. Failed moves retain it; retries deduplicate. Confirmed permanent deletion is allowed; no inbox archive/trash.                                |
| Explore note              | Company-scoped informal personal writing                                          | Many editable autosaved notes; optional Bahas nanti marker, no committed-version semantics.                                                                                                                                 |
| Writing draft             | Serious analysis using one document/editor model with three assistance approaches | Multiple recoverable drafts; saves update the current draft, not a permanent history or Thought versions. Switching guidance preserves text/format/identity.                                                                |
| Writing framework         | Flexible six-area guidance, initially fundamental analysis                        | Outline/checklist assistance, not required fields, a score, or automatic Thought boundaries. Custom management is excluded initially.                                                                                       |
| Candidate                 | Explicit staged membership associated with a writing draft                        | At most one active candidate per draft, reflecting its latest saved content. Withdrawal preserves the draft for restaging; draft deletion safely removes membership. No second editor/frozen submission history.            |
| Thought                   | Owner-defined identity for a line of recorded reasoning within a company          | Multiple distinct Thoughts per company, each with one or more committed versions.                                                                                                                                           |
| Committed Thought version | Exact content deliberately recorded within an explicitly chosen Thought           | Content and any recorded Context Snapshot are immutable; no selective version deletion or in-place editing. Deliberate whole-Thought deletion removes all versions. AI/draft sessions are not versions.                     |
| Context Snapshot          | Optional subjective self-report inside Tinjau & Rekam                             | Every field/skipping is optional; confidence is Rendah/Sedang/Tinggi/Not provided. Immutable with its committed version, deleted with the whole Thought. No retrospective correction subsystem or objective-validity claim. |
| Reference                 | Company-scoped manual metadata for an external source                             | Title and URL only are required. Other metadata/private notes are optional. Writing reuse inserts title/URL and selected notes while retaining the catalog record; no retrieved source binary/content.                      |
| AI Review                 | Identified result for a particular draft snapshot and mode                        | Critique provenance and staleness; no implied author approval or new committed version.                                                                                                                                     |
| AI run/attempt accounting | Technical record of a bounded provider operation and its attempts                 | Token usage, estimated costs and uncertainty; separate from Thought history and provider invoices.                                                                                                                          |

The domain names express distinct responsibilities, not a mandate for one table per row. Existing V2 `thoughts` are immutable raw captures, not proof that V3 drafts, candidates and multi-version Thought identities already exist.

## Relationships and explicit boundaries

An Account owns Companies and private content. A Company groups its Explore notes, writing drafts, candidates, Thoughts and references. Penampungan remains distinct even when an item names a company. Parent/owner relationships must be consistent in both server authorization and persistence enforcement.

A draft can start fresh, receive a moved capture or deliberately reuse notebook/Reference material. Penampungan move removes the capture only after successful destination save; Reference reuse retains its catalog record and inserts title/URL plus explicitly selected notes. These simple actions require safe operation identity/recovery, not permanent pre-commit lineage, linked-copy synchronization or mandatory provenance forms. Source changes cannot silently rewrite committed reasoning.

Staging associates active candidate membership with the **live draft's latest saved state**; there is no frozen candidate revision requiring resubmission. How membership is represented remains T3, not its product meaning. Batalkan Pengajuan removes membership only; later restaging reuses the draft. Successful recording ends pending membership. Preserve only sufficient technical associations/receipts to recover one result per operation; a deliberate new action remains distinct. Commit creation and queue transition must agree after a partial response.

A recorded version belongs to the Thought explicitly chosen at Tinjau & Rekam: **Thought Baru** creates an identity/first version; **Versi Lanjutan** selects an existing owned Thought/next version. Never infer identity from a company, heading, classifier or similar text. Rationale is an optional short owner explanation, not a gate. Recording binds the exact confirmed draft revision and optional Context Snapshot; if the draft changes, revalidate/reconfirm before commit. Version order/time and comparison identity remain unambiguous. A diff alone cannot establish why a belief changed or classify wording as substantive reasoning.

## Provenance and original meaning

For a committed version, preserve owner/company/Thought identity, exact recorded content, reliable order/time and any optional rationale/Context Snapshot actually recorded. A minimal technical link to the confirmed draft revision/operation can support safe recording; it need not keep the deleted draft or its edit history forever. Show existing source/original/provider details only where actually available, without mandatory metadata forms or invented provenance. An empty rationale is valid under P3.

Distinguish the following without inventing missing evidence:

- Owner-authored wording versus AI critique or consciously incorporated suggestions.
- Original V2 capture versus later V3 authored content, only where that origin is actually known; no new lineage-tracking workflow.
- Source metadata as it exists now versus metadata the owner actually saw at commit.
- State while writing or in an earlier Explore note versus optional reflection at recording time.
- Recorded content versus currently selected/read content. Reading an older version does not change its provenance or declare it the newest belief.

Committed content must not change because a draft, source note, reference URL or AI result later changes. P7's inserted title/URL/selected-note text is preserved as authored content; no additional source-snapshot or permanent reference-lineage feature is required. T3 concerns the smallest safe representation of actual associations/recorded content. Never claim exact source-document contents when no copy exists; an external URL can expire while saved metadata remains useful.

## Privacy, retention and efficient storage

A committed version must remain inspectable without regenerating AI output. This requires preserving the actual recorded content, but does not require duplicating the full document on every keystroke or keeping an unlimited local draft log. [Architecture](06-TECHNICAL-ARCHITECTURE.md) evaluates draft recovery, version storage and review retention separately.

Context Snapshot becomes immutable with its committed version. It preserves the owner's self-reported subjective perspective at recording time, including uncertainty or incomplete self-understanding, without claiming objective truth. No retrospective edit/normalization, standalone correction system, emotional-validity score or silently generated metadata-only Thought version is included. A later deliberate Thought version may record a later perspective. Every field remains optional, including qualitative confidence and free-text explanation/reflection.

## Deletion and related-record integrity

P4 permits confirmed permanent deletion of captures, Explore notes, drafts, Reference metadata and **whole Thoughts**. Individual committed versions or their Context Snapshots cannot be separately deleted/edited. A whole-Thought deletion removes all its versions and snapshots with secure owner authorization and coherent cleanup. This does not weaken immutability while records exist.

Deleting a draft cannot delete its committed Thoughts; remove an affected active candidate safely so no orphan remains actionable. Cancelling submission never deletes the draft. Deleting Reference metadata does not alter external documents or recorded text; inserted title/URL/selected-note text is already part of the draft/committed content, not a live synchronization requirement. Do not create archive/trash histories for these temporary/content types. Keep only bounded technical receipts needed for reliable saves/moves/retries; logs must not become another private-research archive.

Company destruction is separately subject to [C1](01-PRODUCT-FOUNDATION.md#narrow-open-owner-policy--company-management). Existing V2 Company cascades do not decide V3 child-record deletion. Do not use a Company delete to bypass the whole-Thought confirmation/policy review.

Draft conflicts, ambiguous commit responses and missing optional provenance must be represented honestly. No original text, AI run, source contents, approval time, rationale or emotional state may be fabricated to populate a panel. Settled P1–P8 are recorded in the [foundation](01-PRODUCT-FOUNDATION.md#settled-owner-decisions); technical representations remain open in [architecture](06-TECHNICAL-ARCHITECTURE.md#open-decisions--technical-questions).
