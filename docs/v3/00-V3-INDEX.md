# MY KRAVV V3 — Documentation Authority

Status: **Draft — ready for owner review**

Date: **17 October 2026 (Asia/Jakarta)**

Scope: transition scaffolding only; no application redesign or implementation approved here.

## Purpose and starting point

V3 is a deliberate redesign of a personal investment reasoning workspace. V2 supplies technical evidence and product history; its screens, workflow sequence, milestones, and visual identity do not become V3 requirements by inheritance.

The local `v3` branch starts at verified V2 commit `ee7be8ae8c481baebb5e159b57334333eb9994c9`. The [transition audit](00-V2-TRANSITION-AUDIT.md) records the preflight, implemented boundary, reuse candidates, and unresolved decisions. These two files establish the entry point for V3 documentation. They are not the final Product Foundation, AI workflow, UX system, or implementation plan.

## Source-of-truth precedence

For **what V3 should become**, apply this order:

1. **The owner's latest explicit V3 instructions and approved decisions**, including the transition brief summarized below. A later explicit decision supersedes an earlier one within its stated scope.
2. **Accepted V3 Product Foundation and product contracts**, plus accepted decision records that explicitly amend them. None have been drafted or accepted yet.
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
- Do not impose the entire V2 lifecycle as a mandatory linear workflow. The later approved structural direction below constrains navigation; detailed workflows and product contracts remain pending.

Clarify, Challenge, and lightweight manual References are **conceptually prioritized V3 directions, pending specification**. Their importance is established; interaction details, boundaries, and release placement remain open. They are not rejected, lower-priority by default, or indefinitely deferred. Conceptual priority does not authorize implementation.

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

Only the first two documents exist in this V3 scaffold. Planned names below are organizational placeholders, not an approved scope or schedule. The explicit design dependency is **Design Discovery → owner review of alternatives → final UX/design-system specification**.

The owner subsequently selected **Hybrid C** and the structural direction recorded below. Design Discovery should explore unresolved details within those constraints before final UX/design-system specification; it must not reopen approved direction without an explicit owner request. Typography, spacing, precise tokens and production implementation remain unspecified. No discovery document or visual exploration is created by this reorganization.

| Document                                               | Status  | Intended responsibility                                                                                                                              |
| ------------------------------------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| [00-V3-INDEX.md](00-V3-INDEX.md)                       | Draft   | Authority, conventions, current direction, and documentation map.                                                                                    |
| [00-V2-TRANSITION-AUDIT.md](00-V2-TRANSITION-AUDIT.md) | Draft   | Evidence-based V2 boundary, dispositions, risks, and review questions.                                                                               |
| `01-PRODUCT-FOUNDATION.md`                             | Planned | V3 problem, audience, value, principles, scope, and success criteria after owner decisions.                                                          |
| `02-WORKFLOWS-AND-INFORMATION-ARCHITECTURE.md`         | Planned | Flexible entry paths, navigation, content organization, and task boundaries.                                                                         |
| `03-AI-BEHAVIOR-AND-OWNERSHIP.md`                      | Planned | Explicit assistance, user authority, context/evidence boundaries, review, and failure behavior.                                                      |
| `04-DOMAIN-AND-PROVENANCE.md`                          | Planned | Content identities, version relationships, historical records, display selection, and deletion semantics.                                            |
| `DESIGN-DISCOVERY.md`                                  | Planned | Explore visual references and alternative layouts, typography, and UI compositions for owner review before the final UX/design-system specification. |
| `05-UX-AND-DESIGN-SYSTEM.md`                           | Planned | Specify writing/reading quality, interaction states, accessibility, and complete light/dark design after Design Discovery and owner review.          |
| `06-TECHNICAL-ARCHITECTURE.md`                         | Planned | Evaluated reuse, security boundaries, persistence, deployment, and configuration decisions.                                                          |
| `07-VALIDATION-AND-RECOVERY.md`                        | Planned | Contract checks, semantic evaluation, recovery, and evidence required for acceptance.                                                                |
| `08-IMPLEMENTATION-PLAN.md`                            | Planned | Reviewable delivery work derived from accepted specifications.                                                                                       |
| `decisions/`                                           | Planned | Small records of explicit owner decisions when needed; no records created yet.                                                                       |

## Later owner-approved visual direction — 17 October 2026

The repository reorganization brief records approval of **Hybrid C**: modern premium SaaS quality, calm and organized, light-first with thoughtfully designed dark mode, neutral reading surfaces and restrained green accents.

- Global top navigation uses Beranda and Perusahaan as main destinations; search, theme and account utilities may be separate.
- Company Workspace has a contextual collapsible left sidebar with Overview, Pemikiran, Explore and Referensi as current conceptual areas. Company switching must scale; reading/writing width remains controlled when the sidebar collapses, with discoverable contextual tools.
- Home centers mutable Quick Capture in a calm hero, with continue/resume, recent captures, contextual review and company access secondary. Quick Capture is not an automatic immutable Thought commit; this direction does not change the existing V2 capture contract.

See the [V3 design workspace](../../design/v3/README.md), [approved reference metadata](../../design/v3/references/README.md) and [unapproved exploration area](../../design/v3/explorations/README.md). The externally approved Home illustration is **AWAITING_OWNER_ASSET** at canonical path `design/v3/references/01-home-approved.png`. The owner confirmed the original PNG will be supplied separately; no substitute or placeholder is created. Concept approval does not imply local asset availability or implemented UI.

These later owner decisions supersede earlier statements that no visual or navigation direction has been selected, only within the scope stated above. The authority order, Draft statuses and Planned product specifications remain unchanged.

## Current review boundary

The owner accepted the overall audit direction on 17 October 2026, with the priority and Design Discovery clarifications recorded here, and subsequently authorized repository reorganization and V3 asset infrastructure. That organization work preserves V2 history and repairs navigation; it does not accept pending product specifications. Review unresolved questions before dependent implementation, and complete the remaining Design Discovery/specification review before locking the final UX/design system. No application UI/business logic changes, migrations, remote database modifications, real AI-provider requests, commits, pushes, pull requests, or bulk screenshots are part of this preparation.
