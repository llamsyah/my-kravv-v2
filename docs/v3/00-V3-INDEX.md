# MY KRAVV V3 — Documentation Authority

Status: **Draft — awaiting owner review**

Date: **21 October 2026 (Asia/Jakarta)**. Initial scaffold: 17 October 2026.

Scope: Revision 3 documentation and architecture planning only; no application implementation authorized here.

## Purpose and starting point

V3 is a deliberate redesign of a personal investment reasoning workspace. V2 supplies technical evidence and product history; its screens, workflow sequence, milestones, and visual identity do not become V3 requirements by inheritance.

**Revision 3** starts from clean `v3` at Revision 2 baseline `55186247ac3f66dfab9d4cacb0c8c45759c42af3`. Local `main` remains the verified V2 checkpoint `ee7be8ae8c481baebb5e159b57334333eb9994c9`. Earlier consolidation/asset commits are `fd04ff5`/`5e85068`; the formerly local design README corrections are included in the clean Revision 2 baseline. The [transition audit](00-V2-TRANSITION-AUDIT.md) remains unchanged dated evidence. The owner's Revision 3 brief settles C1 and primary T1–T7 while preserving P1–P8; it neither accepts these documents nor authorizes implementation. No pre-existing local changes were present at preflight.

Start review at [P1–P8](01-PRODUCT-FOUNDATION.md#settled-owner-decisions), [settled C1](01-PRODUCT-FOUNDATION.md#settled-company-policy--c1) and the [single T1–T7 technical register](06-TECHNICAL-ARCHITECTURE.md#settled-technical-directions). Then inspect the [proposed persistence shapes](04-DOMAIN-AND-PROVENANCE.md#proposed-persistence-model), [critical write/recovery protocols](06-TECHNICAL-ARCHITECTURE.md#critical-writes-replay-and-conflict-boundaries), [isolated environment/migration proposal](06-TECHNICAL-ARCHITECTURE.md#isolated-environment-and-migration-proposal), [validation cases](07-VALIDATION-AND-RECOVERY.md#revision-3-critical-verification-plan) and [bounded implementation slices](08-IMPLEMENTATION-PLAN.md). All nine existing specifications remain **Draft — awaiting owner review**. C1 and primary T1–T7 are settled directions; SQL, packages, limits and measurements are technical recommendations/validation work, not reopened product questions.

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

The accepted direction is **Hybrid C**. The [discovery ledger](DESIGN-DISCOVERY.md) records visual evidence, known exceptions and design recommendations without reopening that direction. Primary T1–T7 directions are settled; exact tokens/fonts, SQL/package choices and performance parameters still need engineering validation. Unapproved screenshot extras stay excluded; no image proves implemented behavior.

| Document                                                                                     | Status  | Intended responsibility                                                                                                      |
| -------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| [00-V3-INDEX.md](00-V3-INDEX.md)                                                             | Draft   | Authority, conventions, current direction, and documentation map.                                                            |
| [00-V2-TRANSITION-AUDIT.md](00-V2-TRANSITION-AUDIT.md)                                       | Draft   | Evidence-based V2 boundary, dispositions, risks, and review questions.                                                       |
| [01-PRODUCT-FOUNDATION.md](01-PRODUCT-FOUNDATION.md)                                         | Draft   | Purpose, philosophy, preserved P1–P8 and settled empty-only Company deletion C1.                                             |
| [02-WORKFLOWS-AND-INFORMATION-ARCHITECTURE.md](02-WORKFLOWS-AND-INFORMATION-ARCHITECTURE.md) | Draft   | Navigation, informal entry paths, three writing approaches and explicit stage/review/record workflow.                        |
| [03-AI-BEHAVIOR-AND-OWNERSHIP.md](03-AI-BEHAVIOR-AND-OWNERSHIP.md)                           | Draft   | Review modes, snapshots/staleness, consent/context, ownership, failure and cost boundaries.                                  |
| [04-DOMAIN-AND-PROVENANCE.md](04-DOMAIN-AND-PROVENANCE.md)                                   | Draft   | Domain relationships, proposed field/constraint outlines, immutable versions/context and ownership. No migrations.           |
| [DESIGN-DISCOVERY.md](DESIGN-DISCOVERY.md)                                                   | Draft   | Accepted visual direction, inspection of 14 images, superseded interpretations, recommendations and open design questions.   |
| [05-UX-AND-DESIGN-SYSTEM.md](05-UX-AND-DESIGN-SYSTEM.md)                                     | Draft   | Coherent layout/actions/states, long-form writing, accessibility, responsive and light/dark proposals.                       |
| [06-TECHNICAL-ARCHITECTURE.md](06-TECHNICAL-ARCHITECTURE.md)                                 | Draft   | Settled T1–T7 register, V2 evidence, proposed transactions/save recovery/AI budget/security and isolated migration sequence. |
| [07-VALIDATION-AND-RECOVERY.md](07-VALIDATION-AND-RECOVERY.md)                               | Draft   | Proposed contract/security/recovery cases and required acceptance evidence, not tests already run.                           |
| [08-IMPLEMENTATION-PLAN.md](08-IMPLEMENTATION-PLAN.md)                                       | Draft   | Proposed dependency-based staged sequence and acceptance criteria; planning only.                                            |
| `decisions/`                                                                                 | Planned | Small records of explicit owner decisions when needed; no records created yet.                                               |

## Later owner-approved visual direction — 17 October 2026

This dated heading is retained for historical incoming links. The initial reorganization established **Hybrid C**, a contextual sidebar, mutable Home capture and an externally discussed Home reference. The 20 October consolidation and 21 October Revision 2 supersede incomplete navigation and missing-asset statements from that scaffold. No precise image-approval date or wholesale screenshot acceptance is inferred.

## Current consolidated direction — 21 October 2026

- Global Beranda/Perusahaan navigation; global Account Settings via avatar. Company sidebar: Overview, Ruang Tulis, Pemikiran, Explore, Referensi. Supporting panels collapse independently.
- Quick Capture can omit company, then explicitly move from temporary Penampungan to Explore/writing with reliable save/remove/retry handling. One document/editor model supports guidance-only Terpandu/Pendamping/Kosong switching.
- Kirim ke Pemikiran stages a live candidate reflecting its draft's latest saved state. Withdrawal retains the draft. Exact-content/revision confirmation selects Thought Baru/Versi Lanjutan with optional rationale; commit creates an immutable version and optional immutable Context Snapshot.
- Context Snapshot is skippable and subjective, with optional Rendah/Sedang/Tinggi/Not provided confidence and optional reflection. No retrospective edit/correction system, score or automatic metadata commit. Confirmed whole-Thought deletion removes its versions/snapshots; no selective version deletion or content archive/trash system.
- Clarify/Challenge/Gap Check support deliberate bounded follow-ups. Disclose the selected draft including incorporated personal text, plus explicitly selected additional material. Changed drafts make old results stale; old-context continuation/refresh stays explicit. No hidden private expansion, URL retrieval or automatic authoring/commit.
- Referensi requires only Title/URL; reuse inserts them plus selected notes and retains the catalog record. Secure Auth/session foundations are preserved; full Account Settings UI does not block core writing. C1 permits deletion only for a truly empty Company, with server race protection and no automatic cascade/detach/reassignment; Company archive is outside MVP.
- All [14 canonical references](../../design/v3/references/README.md) are present and inspected. Home is [01-home.png](../../design/v3/references/01-home.png). These images have known exceptions, not blanket acceptance of every control. Content-first Home does not require hero photography.

Settled [C1](01-PRODUCT-FOUNDATION.md#settled-company-policy--c1) and [T1–T7](06-TECHNICAL-ARCHITECTURE.md#settled-technical-directions) implement preserved P1–P8: Markdown, server autosave/local recovery, draft staging flag, numeric saved revisions, bounded persistent reviews, isolated V3 development/server AI budget/one active model and responsive committed diff. The [V3 design workspace](../../design/v3/README.md) and [reference inventory](../../design/v3/references/README.md) remain synchronized. All 14 PNG bytes are protected; no image processing is authorized.

## Current review boundary

Revision 3 revises existing drafts in place, preserving valid Revision 2 contracts and historical evidence. Owner requirements are settled; the proposed mechanisms/numerical bounds remain recommendations requiring review, and runtime/SQL/package/remote details remain unverified until the relevant later checks. The three [narrow interaction recommendations](02-WORKFLOWS-AND-INFORMATION-ARCHITECTURE.md#revision-3-narrow-ux-recommendations) do not reopen P1–P8 or block secure environment preparation. No new owner product decision is needed for the proposed first slice. Review this architecture and explicitly authorize its bounded preparation/coding scope before implementation. No application behavior, authentication, dependency, migration, remote-data, provider, image, commit, push, merge or pull-request action occurs in this task.
