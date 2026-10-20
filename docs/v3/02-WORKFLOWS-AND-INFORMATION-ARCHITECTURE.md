# MY KRAVV V3 — Workflows and Information Architecture

Status: **Draft — awaiting owner review**

Date: **20 October 2026 (Asia/Jakarta)**

Authority: [V3 index](00-V3-INDEX.md) and [Product Foundation](01-PRODUCT-FOUNDATION.md). This document owns navigation, entry paths and content transitions; it proposes no routes, database tables or implementation.

## Navigation and page responsibility

Global primary destinations are **Beranda** and **Perusahaan**. Search, theme and avatar utilities can be separate; global search scope is not settled by the illustrated search field. Account Settings opens from the navbar avatar, outside any company context. Do not add Kalender or a global Explore destination.

Company work uses a contextual, collapsible left sidebar in this order: **Overview, Ruang Tulis, Pemikiran, Explore, Referensi**. A company switcher must remain practical with many companies rather than permanently listing every company. The right context panel opens/closes independently of the sidebar; collapsing either must not change the selected company, document or reading identity. Detailed responsive treatment is covered by the [UX draft](05-UX-AND-DESIGN-SYSTEM.md).

| Surface     | Responsibility                                                                                                       | Does not mean                                                                   |
| ----------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Beranda     | Primary Quick Capture, resume unfinished writing, recent Penampungan, company access and relevant activity           | An automatic stream of committed Thoughts or compulsory dashboard metrics.      |
| Perusahaan  | Find and enter owned company workspaces                                                                              | Stock screener, live financial directory, or mandatory permanent company rail.  |
| Overview    | Company orientation, personal research summary, unfinished-work links, relevant recent committed Thoughts/references | Context Snapshot, generated financial truth, or a second writing editor.        |
| Ruang Tulis | Create, select and resume multiple editable analysis drafts within one company                                       | The candidate queue or committed-history screen.                                |
| Pemikiran   | Working Tree and committed Thought History, with detail/comparison                                                   | Every autosave represented as a Thought or required screenshot status taxonomy. |
| Explore     | Multiple company-scoped informal personal notes                                                                      | Penampungan, AI chat, or compulsory analysis steps.                             |
| Referensi   | External-source catalog and manual metadata                                                                          | Internal source-file storage or a source-verification service.                  |

**Proposed navigation detail:** use Working Tree and Riwayat Pemikiran as the two local views under Pemikiran, consistent with references 07–09. Their exact tab treatment/copy is a draft UX proposal. They do not add Company sidebar destinations. Template Saya is outside the initial custom-template scope.

## Fast capture and informal exploration

1. From Beranda, the owner writes a Quick Capture and explicitly saves it to Penampungan. Show whether it is saving, confirmed or failed; retain input after failure.
2. Penampungan remains its own mutable inbox. No automatic Explore note, writing draft, candidate, Thought version or provider request follows a save. Company association and explicit onward actions remain [Open Decision P1](01-PRODUCT-FOUNDATION.md#open-decisions--owner-product-choices).
3. Within a company, Explore supports multiple freeform editable notes with autosave and an optional Bahas nanti marker. The marker conveys an owner's reminder, not a scheduled notification or AI trigger.
4. The owner may explicitly reuse an Explore note as writing material. Show what is selected and the destination draft. Copy-versus-link behavior must be specified before implementation; it must not silently commit or destroy the notebook original. Private/emotional notes are not automatically forwarded to AI.

Informal work may remain informal indefinitely. There is no requirement to process every capture into a conclusion or run the six-area framework on every note.

## One writing system, three approaches

| Approach   | Intended experience                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Terpandu   | An optional editable six-area fundamental-analysis structure. Sections can be skipped, adapted or left unknown/not applicable. |
| Pendamping | A freeform document with optional guidance/checklists in the context panel.                                                    |
| Kosong     | Unrestricted freeform writing without an active template.                                                                      |

The initial six areas are: **company identity and business model; economics and market; competitive advantages; management and capital allocation; risks and alternative explanations; prospects and synthesis**. These are flexible thinking aids, not six separate Thoughts, mandatory database fields, or an objective completion/quality score.

Multiple unfinished drafts per company must remain recoverable and selectable. Autosave updates that draft only. The optional right panel makes guidance, chosen materials, references and AI Review discoverable without crowding the editor. Changing approach must preserve authored text; conversion behavior is Open Decision P5. The screenshot's full formatting toolbar does not select an editor library or require uploads/code blocks.

AI Review is invoked from writing by an explicit owner action. Opening the panel, typing, autosaving or resuming work must not spend tokens. Review results identify the snapshot reviewed and become stale after material changes, under the [AI contract](03-AI-BEHAVIOR-AND-OWNERSHIP.md).

## Formal Thought-recording path

**Ruang Tulis → explicit stage/submit → Working Tree → Tinjau & Rekam → committed Thought History.** This path governs formal recording, not the informal notebook/inbox.

1. The owner deliberately submits writing as a candidate. Saving an incomplete draft is insufficient. Candidate content/revision handling remains Open Decision P2.
2. Working Tree lists intentionally submitted candidates. A candidate can reopen in the same writing editor. **Buat Draft Baru** navigates to Ruang Tulis and creates/selects a writing draft, without silently staging it.
3. Tinjau & Rekam presents the exact content to record and its intended Thought identity/version relationship. Selection of a new Thought or an existing Thought and rationale requirements remain P3. Neither framework coverage nor AI review is a recording gate.
4. Optional Context Snapshot is inside this step. The owner can describe emotional/situational state, influences, confidence and reflection, or skip the entire block without preventing commit. This records context at commit, not a retrospective claim about the state while first writing or an import of private Explore notes.
5. An explicit **Rekam** operation records one immutable version. Successful recording removes/marks that candidate as committed so it is no longer in the active candidate queue. Preserve its origin and commit receipt; do not erase the historical association or leave it looking ready for a duplicate commit. Storage representation is a technical question.
6. Repeated submission/recovery of the same operation must resolve to the same result, while a deliberately new owner action remains distinct. An ambiguous response must not prompt automatic duplicate recording. See [recovery](07-VALIDATION-AND-RECOVERY.md).

History groups committed versions under owner-defined Thoughts. Opening an older version is reading, not promoting it to the latest belief. Reopening recorded content for later work must leave that recorded version unchanged. Detail/diff compares identified committed versions; draft revisions, template edits and AI sessions are not substitute version histories.

## References and global account journeys

Referensi supports add, inspect/edit metadata, open the external source, copy its URL and explicitly use/reference selected material in writing. Prefer stable direct PDF URLs when available; accept a source landing page when direct links are unavailable or temporary. Saving a URL neither fetches its contents nor verifies it. An externally missing source does not delete useful local metadata. Required fields and writing reuse are P7.

Account Settings shows the existing account, light/dark preference and minimal usage/budget information. Password change, forgot-password recovery and verified email change should use supported authentication-provider flows. Logging out and signing in as another user suffices; no account-switcher feature is required. Never show the prior user's drafts or context after an account change. Provider/session design and callback handling are evaluated in [architecture](06-TECHNICAL-ARCHITECTURE.md).
