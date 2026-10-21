# MY KRAVV V3 — Workflows and Information Architecture

Status: **Draft — awaiting owner review**

Date: **21 October 2026 (Asia/Jakarta)**

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

## Minimal Company-management journeys

These are minimal **Draft V3 approaches** for owner review, grounded in [V2 Company evidence](06-TECHNICAL-ARCHITECTURE.md#company-management-evidence-and-policy-boundary); they do not inherit every V2 status, archive tab or destructive action.

| Journey         | Minimal proposed behavior                                                                                                                                                                                                                        | Failure/empty-state boundary                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create          | **Tambah Perusahaan** from the directory or an empty company selector opens a short form. Require an understandable company name; ticker, exchange, sector and a short personal note may remain optional. On confirmed save enter its workspace. | No ticker lookup, scraping or market enrichment. Retain input on failure and do not display an unsaved workspace as created.                                            |
| Directory       | List only the owner's existing companies with recognizable names and optional entered identifiers; open the selected Company's Overview.                                                                                                         | With no companies, explain how to create the first. No fabricated companies, metrics or mandatory research-state taxonomy.                                              |
| Search/select   | Find owned companies by name or entered ticker and choose a result; use this in the directory and contextual switcher.                                                                                                                           | No matches is distinct from no companies and from load failure; allow clearing search. A foreign/missing company is safely unavailable. No live financial directory.    |
| Edit basics     | Deliberately edit basic metadata in context, save and show the confirmed result. Editing identity labels does not rewrite research or change record ownership.                                                                                   | Retain input on failure; never repurpose a normal metadata save as archive/deletion. Existing V2 optional fields/limits are reuse evidence, not a complex new taxonomy. |
| Return/switch   | Return to Perusahaan or pick another existing company from a scalable selector. Preserve recoverable writing and show the newly selected company clearly.                                                                                        | Do not lose unsaved edits or leave another company's material displayed under the new identity. Switching requires no new workspace.                                    |
| Empty workspace | Offer the relevant create-note, start-writing or add-reference action when its section is empty.                                                                                                                                                 | No compulsory setup sequence or artificial progress dashboard.                                                                                                          |

**Company archive/deletion is C1, a separate owner policy**, not a consequence of P4 content deletion. Until approved, this draft requires no V3 Company archive/delete control. Existing V2 cascade behavior must not silently delete V3 committed Thoughts, notes, drafts or references. See [C1](01-PRODUCT-FOUNDATION.md#narrow-open-owner-policy--company-management) before any such action; core nondestructive journeys do not depend on resolving it.

## Fast capture and informal exploration

1. From Beranda, save Quick Capture to temporary Penampungan **with or without a company**. Show saving/confirmed/failed states and retain input after failure. An ordinary retry of the same save recovers the same capture rather than duplicating it. Saving creates no Explore note, writing draft, candidate, Thought version or AI call.
2. Explicitly **move** a capture to Explore or Ruang Tulis. If it has no company, request the destination company; check authorization for the target. Transfer the content and remove the inbox entry only after destination creation/save succeeds. Failed destination saves preserve the capture. Ordinary retries recover the same result without duplicate captures/destinations or accidental loss. No synchronized copies, permanent transfer history or pre-commit provenance product is required.
3. Within a company, Explore supports multiple freeform editable notes with autosave and an optional Bahas nanti marker. The marker conveys an owner's reminder, not a scheduled notification or AI trigger.
4. The owner may explicitly reuse selected Explore material in a writing draft. Show the selection and destination; do not silently commit, destroy the note or create ongoing synchronization/history. Explore notes are not automatically forwarded to AI, but personal text the owner incorporates into a draft is part of that draft if it is then selected for review.

Unneeded captures or Explore notes may be permanently deleted with clear confirmation under P4. Penampungan is not a permanent thinking archive; archive/trash features for these items are not initial MVP requirements.

Informal work may remain informal indefinitely. There is no requirement to process every capture into a conclusion or run the six-area framework on every note.

## One writing system, three approaches

| Approach   | Intended experience                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Terpandu   | An optional editable six-area fundamental-analysis structure. Sections can be skipped, adapted or left unknown/not applicable. |
| Pendamping | A freeform document with optional guidance/checklists in the context panel.                                                    |
| Kosong     | Unrestricted freeform writing without an active template.                                                                      |

The initial six areas are: **company identity and business model; economics and market; competitive advantages; management and capital allocation; risks and alternative explanations; prospects and synthesis**. These are flexible thinking aids, not six separate Thoughts, mandatory database fields, or an objective completion/quality score.

Multiple unfinished drafts per company remain recoverable and selectable. Autosave updates that draft only, without a committed-version history of each edit. All three approaches use **one underlying document/editor model**: switching changes displayed assistance, not document format, draft identity or authored content. No text is deleted, reordered or rewritten; inserted headings remain when leaving Terpandu. Switching requires neither a new draft nor a commit. The optional right panel exposes guidance, selected material, references and AI Review without crowding writing. No template-conversion machinery, separate persistence systems or screenshot-implied uploads/code blocks are required.

AI Review and each contextual follow-up require a deliberate send/run action. The draft is primary context, including personal text incorporated into it; selected Explore/Reference additions must be understandable before sending. Opening, typing, saving or recording spends no tokens. Results identify their reviewed snapshot and become stale when the draft changes; continuation against an older snapshot versus explicit refresh must be clear under the [AI contract](03-AI-BEHAVIOR-AND-OWNERSHIP.md).

## Formal Thought-recording path

**Ruang Tulis → explicit stage/submit → Working Tree → Tinjau & Rekam → committed Thought History.** This path governs formal recording, not the informal notebook/inbox.

1. **Kirim ke Pemikiran** explicitly stages a saved Writing Space draft. Only staged drafts appear in Working Tree, with at most one active candidate per draft. The candidate reflects its associated draft's **latest saved state**, not a frozen submission requiring repeated resubmission.
2. Editing a candidate reopens that same draft in Ruang Tulis; further saves update its candidate view without committed versions. **Batalkan Pengajuan** removes only active candidate membership and preserves the draft for later restaging. **Buat Draft Baru** goes to Ruang Tulis without automatic staging.
3. Before Tinjau & Rekam, successfully save pending intended edits and show the exact latest content to record. Choose **Thought Baru** or **Versi Lanjutan**; the latter requires selecting an existing owned Thought in the company. Never infer identity from similarity, headings or AI. Offer an optional short rationale; a blank rationale and incomplete guidance do not block commit. Do not add unrelated mandatory metadata forms.
4. Context Snapshot stays inside this step. Emotional/situational state, influences, optional reflection and confidence (**Rendah, Sedang, Tinggi, Not provided**) are optional. The owner may skip every field or the entire block without blocking Rekam. It records subjective experience at recording time, not objective truth or an automatic import of earlier Explore feelings; uncertainty is valid and pressure/diagnosis/scoring is excluded.
5. Explicit **Rekam** confirms the reviewed content/revision, chosen Thought and optional context together. If the draft changes while recording is prepared, revalidate and request reconfirmation; never silently record another revision. Successful commit creates one immutable version, including any supplied Context Snapshot, and ends pending candidate membership. Keep only the technical receipt/associations needed for coherent recording and retry recovery; no permanent candidate-edit history is required. A future deliberate commit may record a later interpretation; recorded text/context cannot be retrospectively edited.
6. Repeated submission/recovery of the same operation must resolve to the same result, while a deliberately new owner action remains distinct. An ambiguous response must not prompt automatic duplicate recording. See [recovery](07-VALIDATION-AND-RECOVERY.md).

History groups committed versions under owner-defined Thoughts. Opening an older version is reading, not promoting it to the latest belief. Reopening recorded content for later work must leave that recorded version unchanged. Detail/diff compares identified committed versions; draft revisions, template edits and AI sessions are not substitute version histories.

## Content deletion and safe cleanup

Permanently deleting a capture, Explore note, draft or Reference record requires an explicit action and appropriate confirmation. For a staged draft, the confirmation explains that its candidate will also leave Working Tree; complete deletion coherently or preserve the current draft/candidate on failure. No orphaned actionable candidate may remain, and no already committed Thought is deleted through draft cleanup. Cancelling submission is a different, nondestructive action that retains the draft.

Delete a committed **whole Thought**, including all its versions and associated Context Snapshots, only after clear confirmation. Individual versions and committed Context Snapshots have no edit or selective-delete action. Correct a mistaken conclusion or record a different perspective through a deliberate later version; do not silently create versions to revise metadata. No trash/archive or separate retrospective-context correction system is included. Reference deletion removes catalog metadata, not the external document or already committed text. Company destruction remains C1, not this content contract.

## References and global account journeys

Referensi supports add, inspect/edit metadata, external open, copy URL and **Gunakan di Ruang Tulis**. Only **Title** and **URL** are required; type, publisher/organization, publication date, data period, tags, description and personal notes are optional. Apply safe URL handling without a mandatory taxonomy or excessive metadata gates. Prefer stable direct PDF URLs where available; landing pages are acceptable when direct links are temporary/unavailable.

**Gunakan di Ruang Tulis** inserts the Reference's title and URL and, optionally, only specific personal notes selected by the owner. The catalog record remains for reuse; this is not a Penampungan move. Source files/web contents are not stored, downloaded, summarized or verified automatically, and reuse is not automatic AI ingestion. A dead external URL does not erase useful local metadata.

Account Settings shows the existing account, light/dark preference and minimal usage/budget information. Password change, forgot-password recovery and verified email change should use supported authentication-provider flows. Logging out and signing in as another user suffices; no account-switcher feature is required. Never show the prior user's drafts or context after an account change. Provider/session design and callback handling are evaluated in [architecture](06-TECHNICAL-ARCHITECTURE.md).
