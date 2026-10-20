# MY KRAVV V3 — Design Discovery and Decision Ledger

Status: **Draft — awaiting owner review**

Date: **20 October 2026 (Asia/Jakarta)**

Authority: [V3 index](00-V3-INDEX.md). Basis: the owner's current Product & UX Documentation Consolidation brief, the committed reference guide and visual inspection of all 14 canonical PNGs at `5e85068`. No additional approval is inferred from asset presence, an earlier conversation, or this draft's creation.

## Accepted direction and evidence limits

**Owner-directed direction:** Hybrid C, premium calm modern SaaS, light-first with deliberate dark mode, neutral reading surfaces, restrained green interaction accents, consistent navigation and comfortable long-form writing/reading. Navigation is global Beranda/Perusahaan plus avatar utilities, with a company-specific collapsible sidebar. Left navigation and right context panels collapse independently.

**Observed visual evidence:** the references consistently favor pale surfaces, green primary actions, rounded groups, an identifiable writing canvas and contextual tools. These observations inform [UX/design-system proposals](05-UX-AND-DESIGN-SYSTEM.md); they do not select exact font families, pixel spacing, tokens, framework/editor packages or production behavior. All 14 supplied images depict light desktop concepts, not validated dark/mobile/accessibility states.

**Verified availability:** all 14 canonical PNGs exist locally and are tracked. The [asset inventory](../../design/v3/references/README.md) records dimensions, byte sizes, hashes and canonical links. `01-home.png` is present; the old missing-asset claim and proposed `01-home-approved.png` destination are obsolete. No new image, conversion or compression is part of this consolidation.

## Reference interpretation ledger

All rows are **owner-selected conceptual visual evidence, with corrections**. Exact per-image approval dates and original external generation filenames are not established. An included control does not become an accepted product requirement.

| Reference                                                                                | Direction to carry forward                                                            | Exception or unresolved detail                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [01 — Home](../../design/v3/references/01-home.png)                                      | Quick Capture foregrounded; resume work, inbox and company access secondary           | Decorative mountain/hero photography is unnecessary. Refine-review badges and attachment icon do not add initial features. Penampungan is its own destination.                                      |
| [02 — Company Directory](../../design/v3/references/02-company-directory.png)            | Clear searchable company browsing and workspace entry                                 | Company claims, logos, counts and statuses are illustrative; no enrichment, market verification, mandatory dual list/grid mode or taxonomy is inferred.                                             |
| [03 — Company Overview](../../design/v3/references/03-company-overview.png)              | Contextual left sidebar, orientation, personal summary, resume links, recent research | Company statements are sample text; summary ownership does not imply automatic AI generation. Overview is not Context Snapshot.                                                                     |
| [04 — Guided writing](../../design/v3/references/04-writing-space-guided.png)            | Editable six-area guidance and an uncluttered writing center                          | Coverage is not quality or a recording gate. Illustrated version/compare buttons do not turn draft saves into committed versions. No custom template manager.                                       |
| [05 — Companion writing](../../design/v3/references/05-writing-space-companion.png)      | Freeform editor with optional guidance/context panel                                  | Exact toolbar and template dropdown are not a requirement for uploads, numerous templates or a specific editor. Kosong remains a supported approach without a separate supplied image.              |
| [06 — AI Review](../../design/v3/references/06-writing-space-ai-review.png)              | Deliberate Clarify/Challenge/Gap Check and separated critique                         | Follow-up box is only a possible bounded review interaction, not a separate chatbot. Results must identify reviewed snapshot and staleness.                                                         |
| [07 — Working Tree](../../design/v3/references/07-working-tree.png)                      | Submitted candidates, reopen writing, review/record actions                           | Not unfinished autosaves. Buat Draft Baru goes to Ruang Tulis. Statuses, bulk actions, duplication/archive and tags do not become mandatory workflow.                                               |
| [08 — Thought History](../../design/v3/references/08-thought-history.png)                | Thought identities, committed-version navigation and provenance                       | Editable icons must not edit recorded content in place. Numerical examples are fictional; macroeconomic text is not the definition of personal Context Snapshot.                                    |
| [09 — Detail/Diff](../../design/v3/references/09-thought-detail-diff.png)                | Compare identified committed versions with understandable changes                     | No automatic semantic explanation, exact section counts or comments feature is approved. Resolve competing selected-state decoration.                                                               |
| [10 — Explore notebook](../../design/v3/references/10-explore-notebook.png)              | Editable company notes, list of notes, Bahas nanti and deliberate writing reuse       | This actual canonical image is already a notebook, not the rejected AI-chat concept. Do not claim it needs replacement. Archive behavior remains a product decision.                                |
| [11 — Reference Library](../../design/v3/references/11-references-library.png)           | Source catalog, metadata inspection and external open/copy/use actions                | Remove company Pengaturan from intended navigation. No automatic source verification, internal PDFs, or requirement to reproduce every tab/filter.                                                  |
| [12 — Add Reference](../../design/v3/references/12-reference-create.png)                 | Manual URL-first source metadata with optional detail                                 | Current image is a URL form, not an upload flow. Publisher/type asterisks do not settle required fields. Company Pengaturan in the backdrop remains incorrect.                                      |
| [13 — Tinjau & Rekam context](../../design/v3/references/13-commit-context-snapshot.png) | Optional reflection embedded in recording, explicit skip/record                       | Actual image embeds the snapshot; reject older standalone-page interpretation. Remove incidental global Explore, mandatory AI-review step/panel implication and required 7/10 confidence treatment. |
| [14 — Account Settings](../../design/v3/references/14-account-settings.png)              | Global identity/security, appearance and minimal AI usage                             | No separate security-passphrase challenge, collaboration, notification system, broad preferences, invented budget cap guarantee or real billing claims.                                             |

All sample source URLs, dates, financial statements, market figures, prices, usage amounts and identities are fabricated illustrations for this task's purposes; they are not production fixtures or verified facts. Local PNG inspection does not validate their subject matter.

## Superseded directions and corrections

The latest owner brief rules out horizontal Company navigation, Explore as AI chat, References as required PDF upload/storage, Context Snapshot as a separate company page, company-scoped Account Settings, incidental global Kalender/Explore, and competing blue active underline beneath an already selected green pill. These are superseded **interpretations/alternatives**. They do not imply every defect is still present in the canonical files: images 03, 10, 12 and 13 already embody important corrections.

The V2 visual family remains historical material in [design/archive-v2](../../design/archive-v2/README.md). V2 Refine screens and earlier milestone approvals are evidence, not requirements to carry their navigation or workflow into V3.

## Recommendations, not accepted design specifications

- Prefer a content-first Home with useful capture/resume content before decoration.
- Use one green selected-state family for tabs; reserve visible keyboard focus for a distinct purpose rather than adding a competing active underline.
- On narrow screens, expose one supporting tool surface at a time and return focus to its opener without discarding draft state. Exact sheet/drawer treatment needs review.
- Use one underlying writing model across Terpandu, Pendamping and Kosong, preserving author text when modes change. Avoid separate duplicated editors or a complex template ecosystem.
- Keep candidate/history presentation simple and disclose metadata where needed rather than reproducing every screenshot control.

## Remaining design questions

Owner product questions P1–P8 are centralized in the [foundation](01-PRODUCT-FOUNDATION.md#open-decisions--owner-product-choices), including candidate revision linkage, Thought identity/rationale, approach switching and optional confidence treatment. Design review still needs dark-mode surfaces and states, narrow-screen panel behavior, empty/failed/conflicted saves, staleness feedback and accessible committed-version diff presentation. No exact font/token system is accepted from the images alone.

These questions feed the [UX draft](05-UX-AND-DESIGN-SYSTEM.md), [technical questions](06-TECHNICAL-ARCHITECTURE.md#open-decisions--technical-questions) and [validation cases](07-VALIDATION-AND-RECOVERY.md). The discovery ledger's existence does not accept those drafts or authorize implementation.
