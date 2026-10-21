# MY KRAVV V3 — Documentation Authority

Status: **Draft — awaiting owner review**

Date: **21 October 2026 (Asia/Jakarta)**. Initial scaffold: 17 October 2026.

Scope: product/UX documentation consolidation and reference metadata only; no application implementation authorized here.

## Purpose and starting point

V3 is a deliberate redesign of a personal investment reasoning workspace. V2 supplies technical evidence and product history; its screens, workflow sequence, milestones, and visual identity do not become V3 requirements by inheritance.

The local `v3` branch starts at verified V2 commit `ee7be8ae8c481baebb5e159b57334333eb9994c9`; `main` remains at that checkpoint. **Revision 2** starts at `fd04ff5`, after the first consolidation and asset commit `5e85068`; three existing local design README edits are preserved and synchronized here. The [transition audit](00-V2-TRANSITION-AUDIT.md) remains dated V2 implementation/reuse evidence. The owner's 21 October Documentation Revision 2 brief explicitly settles P1–P8 within the drafts, without accepting the documents or authorizing implementation.

Start review at the [settled owner decisions](01-PRODUCT-FOUNDATION.md#settled-owner-decisions), then [workflows](02-WORKFLOWS-AND-INFORMATION-ARCHITECTURE.md) and [Design Discovery](DESIGN-DISCOVERY.md). The nine existing specifications remain **Draft — awaiting owner review**. P1–P8 are settled product requirements, not unanswered alternatives; T1–T7 remain technical evaluation and C1 is a separate narrow Company destructive-policy question.

## Source-of-truth precedence

For **what V3 should become**, apply this order:

1. **The owner's latest explicit V3 instructions and approved decisions**, including the transition brief summarized below. A later explicit decision supersedes an earlier one within its stated scope.
2. **Accepted V3 Product Foundation and product contracts**, plus accepted decision records that explicitly amend them. Drafts now exist; none are accepted through this consolidation.
3. **Accepted V3 specifications** for workflows, AI behavior, domain/provenance, UX, architecture, and validation, consistent with the foundation and owner decisions.
4. **Accepted V3 implementation plans**, which operationalize the specifications and cannot silently introduce product decisions.
5. **This transition audit and V2 material**, as evidence and recommendations only. A reuse candidate is not an approved architectural choice; a V2 document marked “locked” or “approved” remains V2 authority only.

For **what is currently implemented**, inspect the source and migrations at an identified commit, supported by tests and dated implementation reports. Product prose does not prove a feature exists. Checked-in migrations do not prove the state of a remote database; mock tests do not prove real-provider semantic fidelity.

When sources conflict, distinguish intended behavior from observed behavior and record the discrepancy. Do not silently promote drafts, infer acceptance from implementation, or use code to override a product contract. Unresolved choices must return to owner review before dependent implementation.

The [documentation gateway](../README.md) now directs contributors here. The [V2 archive](../archive-v2/README.md) preserves the former overview, foundation, developer guide and implementation plan as historical material. Their “next step” instructions do not authorize V3 work. Repository operating instructions in `AGENTS.md` continue to apply to engineering work; this index defines product-document authority.

## Direction established by the transition brief

- A personal, flexible investment reasoning workspace with the clarity, precision, interaction quality, and visual maturity of a polished modern SaaS product.
- Modern, calm, clean, minimal, coherent, and professional while remaining personal.
- **Light-first, with a fully designed dark mode**; neutral, readable text and surfaces.
- Restrained green accents for actions, selections, and meaningful states. Avoid green body text and heavy green-tinted reading surfaces.
- Excellent writing, reading, navigation, and feedback experiences; avoid unnecessary cards, excessive labels, decorative dashboards, and UI complexity.
- No requirement to imitate a particular SaaS application and no inherited KRAVV-IENT visual dependency. V3 requires an experience redesign, beyond recoloring V2.
- Preserve originals, separate AI proposals from user-approved wording, keep review independent of display selection, retain provenance and user ownership, and maintain security, recovery, idempotency, explicit AI invocation, validation, and cost controls. See the audit for the implemented scope and limits.
- Do not impose the entire V2 lifecycle as a mandatory linear workflow. Settled P1–P8 constrain these drafts; technical evaluation and owner review of the specifications remain pending.

**Flexible before commit; deliberate and historically consistent after commit.** Prioritize the owner's own use without speculative public-user features. Autosave/recovery/authorization stay reliable, but temporary notes and moves do not require a permanent provenance or edit-history product. Recorded versions and their supplied Context Snapshots remain immutable while present; confirmed whole-Thought deletion is explicitly permitted.

The latest owner brief prioritizes explicit **Clarify, Challenge and Gap Check** in Writing Space, plus a lightweight manual external-source catalog. Their intended behavior is now documented in draft specifications; unresolved details remain explicitly open. This direction does not activate V2 roles or authorize provider calls.

These are owner-directed constraints, not a completed product or design specification.

## Document status conventions

Every V3 document should state its status, date, scope, and, when accepted, the owner decision/date that accepted it.

| Status     | Meaning                                                                                                                                 |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Planned    | Listed here only; the document does not exist and has no authority.                                                                     |
| Draft      | Proposed content awaiting review; it cannot authorize implementation or overrule accepted decisions. “Ready for review” is still Draft. |
| Accepted   | Explicitly approved by the owner for a stated scope; record that approval rather than self-declaring acceptance.                        |
| Superseded | Retained for history, with a link to the replacement and the scope superseded.                                                          |

Within documents, distinguish **owner-directed constraint**, **implemented in V2**, **historical validation**, **recommendation**, **conceptually prioritized — pending specification**, and **open decision**. “Implemented” is an evidence label, not document acceptance. Conceptual priority records an important direction without settling its specification, release placement, or implementation authorization; it is distinct from genuinely undecided or lower-priority work. “Defer” is a capability disposition, not a deletion instruction or permanent rejection.

Material decisions should record the question, choice, rationale, consequences, and what they supersede. References to old material must identify whether they describe implementation or aspiration. Never include secrets, environment-file contents, private research, or live user records in documentation.

## Documentation map

All linked documents below now exist. New specifications remain **Draft — awaiting owner review**. Read each document for its responsibility instead of treating repeated screenshot details as separate requirements. The dependency remains **Design Discovery and product decisions → owner review → accepted specifications → separately approved implementation**; a proposed plan does not bypass it.

The accepted direction is **Hybrid C**. The [discovery ledger](DESIGN-DISCOVERY.md) records visual evidence, known exceptions and unresolved design questions without reopening that direction. Exact tokens/fonts, technical representations and unapproved extras remain unsettled; no image is proof of implemented behavior.

| Document                                                                                     | Status  | Intended responsibility                                                                                                    |
| -------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| [00-V3-INDEX.md](00-V3-INDEX.md)                                                             | Draft   | Authority, conventions, current direction, and documentation map.                                                          |
| [00-V2-TRANSITION-AUDIT.md](00-V2-TRANSITION-AUDIT.md)                                       | Draft   | Evidence-based V2 boundary, dispositions, risks, and review questions.                                                     |
| [01-PRODUCT-FOUNDATION.md](01-PRODUCT-FOUNDATION.md)                                         | Draft   | Purpose, philosophy, settled P1–P8 contracts, MVP boundary and separate Company-policy question C1.                        |
| [02-WORKFLOWS-AND-INFORMATION-ARCHITECTURE.md](02-WORKFLOWS-AND-INFORMATION-ARCHITECTURE.md) | Draft   | Navigation, informal entry paths, three writing approaches and explicit stage/review/record workflow.                      |
| [03-AI-BEHAVIOR-AND-OWNERSHIP.md](03-AI-BEHAVIOR-AND-OWNERSHIP.md)                           | Draft   | Review modes, snapshots/staleness, consent/context, ownership, failure and cost boundaries.                                |
| [04-DOMAIN-AND-PROVENANCE.md](04-DOMAIN-AND-PROVENANCE.md)                                   | Draft   | Distinct content concepts, relationships, immutable versions and honest provenance; no schema.                             |
| [DESIGN-DISCOVERY.md](DESIGN-DISCOVERY.md)                                                   | Draft   | Accepted visual direction, inspection of 14 images, superseded interpretations, recommendations and open design questions. |
| [05-UX-AND-DESIGN-SYSTEM.md](05-UX-AND-DESIGN-SYSTEM.md)                                     | Draft   | Coherent layout/actions/states, long-form writing, accessibility, responsive and light/dark proposals.                     |
| [06-TECHNICAL-ARCHITECTURE.md](06-TECHNICAL-ARCHITECTURE.md)                                 | Draft   | Evidence-based V2 reuse, auth/persistence/privacy/storage/accounting boundaries and technical questions T1–T7.             |
| [07-VALIDATION-AND-RECOVERY.md](07-VALIDATION-AND-RECOVERY.md)                               | Draft   | Proposed contract/security/recovery cases and required acceptance evidence, not tests already run.                         |
| [08-IMPLEMENTATION-PLAN.md](08-IMPLEMENTATION-PLAN.md)                                       | Draft   | Proposed dependency-based staged sequence and acceptance criteria; planning only.                                          |
| `decisions/`                                                                                 | Planned | Small records of explicit owner decisions when needed; no records created yet.                                             |

## Later owner-approved visual direction — 17 October 2026

This dated heading is retained for historical incoming links. The initial reorganization established **Hybrid C**, a contextual sidebar, mutable Home capture and an externally discussed Home reference. The 20 October consolidation and 21 October Revision 2 supersede incomplete navigation and missing-asset statements from that scaffold. No precise image-approval date or wholesale screenshot acceptance is inferred.

## Current consolidated direction — 21 October 2026

- Global Beranda/Perusahaan navigation; global Account Settings via avatar. Company sidebar: Overview, Ruang Tulis, Pemikiran, Explore, Referensi. Supporting panels collapse independently.
- Quick Capture can omit company, then explicitly move from temporary Penampungan to Explore/writing with reliable save/remove/retry handling. One document/editor model supports guidance-only Terpandu/Pendamping/Kosong switching.
- Kirim ke Pemikiran stages a live candidate reflecting its draft's latest saved state. Withdrawal retains the draft. Exact-content/revision confirmation selects Thought Baru/Versi Lanjutan with optional rationale; commit creates an immutable version and optional immutable Context Snapshot.
- Context Snapshot is skippable and subjective, with optional Rendah/Sedang/Tinggi/Not provided confidence and optional reflection. No retrospective edit/correction system, score or automatic metadata commit. Confirmed whole-Thought deletion removes its versions/snapshots; no selective version deletion or content archive/trash system.
- Clarify/Challenge/Gap Check support deliberate bounded follow-ups. Disclose the selected draft including incorporated personal text, plus explicitly selected additional material. Changed drafts make old results stale; old-context continuation/refresh stays explicit. No hidden private expansion, URL retrieval or automatic authoring/commit.
- Referensi requires only Title/URL; reuse inserts them plus selected notes and retains the catalog record. Secure Auth/session foundations are preserved; full Account Settings UI does not block core writing. V3 Company create/find/edit/switch is a minimal draft approach, with destructive policy separately C1.
- All [14 canonical references](../../design/v3/references/README.md) are present and inspected. Home is [01-home.png](../../design/v3/references/01-home.png). These images have known exceptions, not blanket acceptance of every control. Content-first Home does not require hero photography.

Settled [P1–P8](01-PRODUCT-FOUNDATION.md#settled-owner-decisions) are separate from [C1](01-PRODUCT-FOUNDATION.md#narrow-open-owner-policy--company-management) and technical [T1–T7](06-TECHNICAL-ARCHITECTURE.md#open-decisions--technical-questions). The [V3 design workspace](../../design/v3/README.md) and [reference inventory](../../design/v3/references/README.md) are synchronized with the files, including existing local corrections not present in the first consolidation commit. No PNG processing is authorized.

## Current review boundary

Revision 2 edits the current drafts in place and preserves useful findings, cross-references and local README work. V2 audit/archive/source/migrations remain unchanged evidence. Review the revised specifications, technical recommendations and narrow C1 question before approving dependent implementation. No application behavior, authentication, dependencies, migrations, remote data, provider requests, image processing, commits, pushes, merges or pull requests are part of this revision.
