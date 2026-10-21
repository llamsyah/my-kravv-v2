# V3 design workspace

Status: **Draft — awaiting owner review**. Hybrid C and settled P1–P8/C1/T1–T7 constrain the revised specifications; the documents themselves are not Accepted. Updated: **21 October 2026 (Asia/Jakarta)** — Revision 3.

Start with the [V3 authority index](../../docs/v3/00-V3-INDEX.md), [Design Discovery ledger](../../docs/v3/DESIGN-DISCOVERY.md) and [UX/design-system draft](../../docs/v3/05-UX-AND-DESIGN-SYSTEM.md). These documents consolidate intentions and proposals, not implementation authorization.

The owner selected **Hybrid C**: calm, premium modern SaaS; light-first with deliberate dark mode; neutral reading surfaces, restrained green interaction accents and consistent hierarchy/actions/focus. Exact fonts, numeric spacing and tokens are not inferred from illustrations. Long-form writing and reading take priority over decorative hero photography or dashboard density.

## Approved structural direction

- Global top navigation: Beranda and Perusahaan are main destinations; search, theme and account utilities can be separate.
- Company Workspace: contextual collapsible sidebar with Overview, Ruang Tulis, Pemikiran, Explore, Referensi; scalable company switching and independently collapsible right context panel. Keep writing width controlled with either panel open or closed. Account Settings is global via navbar avatar, not a company destination.
- Home: Quick Capture may omit company and saves to temporary Penampungan. Explicit moves to Explore/writing ask for a company when needed, remove the source only on successful destination save and preserve it on failure/retry. No capture archive/trash or permanent lineage product is required. Use content-first capture/resume/company access without unnecessary hero photography.
- One writing model supports guidance-only Terpandu/Pendamping/Kosong switching without altering authored text/format. Kirim ke Pemikiran stages a live saved-draft candidate; withdrawal retains the draft. Tinjau & Rekam explicitly selects Thought Baru/Versi Lanjutan with optional rationale and exact-revision reconfirmation after changes.
- Context Snapshot is optional, subjective and immutable once committed, with optional Rendah/Sedang/Tinggi/Not provided confidence/reflection and no retrospective edit or separate correction flow. Confirmed whole-Thought deletion removes all versions/snapshots; no selective version deletion or content archive/trash. AI Review/follow-ups are deliberate bounded requests with disclosed selected draft/materials, never a recording gate. See [workflows](../../docs/v3/02-WORKFLOWS-AND-INFORMATION-ARCHITECTURE.md).
- Reference creation requires Title/URL only; writing reuse inserts them and selected notes without deleting the catalog record. Personal text inside the selected draft is part of outgoing AI context, while unselected notes/company data/Context Snapshot are not silently added. Core writing requires secure sessions/isolation, not completion of every Account Settings form.

## Assets and approval

- [References](references/README.md): **all 14 canonical PNGs are tracked and locally present**, including `01-home.png`. Introduced at `5e85068` and visually inspected during consolidation; dimensions, sizes and hashes are reverified for Revision 3 at `5518624`. Availability does not imply implementation or blanket feature approval; no Home asset is missing.
- [Explorations](explorations/README.md): unapproved alternatives or unresolved details; record provenance and review status.
- [V2 visuals](../archive-v2/README.md): historical evidence; no inherited V3 approval.

The [per-image ledger](../../docs/v3/DESIGN-DISCOVERY.md#reference-interpretation-ledger) records what to carry forward and correct. Current Explore, Add Reference and commit-context images already contain important corrections; do not confuse them with rejected older alternatives. Sample facts, usage figures, controls and exact styling are not verified requirements.

Record source filenames, approval scope/dates and replacement context only when known. Presence does not supply missing external provenance. Future deliberate replacements need explicit review; unapproved concepts stay in explorations. V2 archive material remains historical evidence, unchanged by this task.

Revision 3 begins from the clean committed Revision 2 baseline, including the earlier README corrections. [P1–P8](../../docs/v3/01-PRODUCT-FOUNDATION.md#settled-owner-decisions) remain intact. Settled [C1](../../docs/v3/01-PRODUCT-FOUNDATION.md#settled-company-policy--c1) permits Company deletion only when empty, without cascading/detaching research; Company archive is outside MVP. [T1–T7](../../docs/v3/06-TECHNICAL-ARCHITECTURE.md#settled-technical-directions) select Markdown, server autosave, staging on drafts, numeric revisions, bounded persistent reviews, isolated V3 development/server budget/one active model and desktop side-by-side/narrow unified diff. Exact design constants and minor interaction proposals remain recommendations to validate, not new product-choice blockers.

**No PNG was compressed, converted, renamed, replaced, deleted or regenerated.** Optimization is a separate explicitly reviewed operation after documentation consolidation. Disposable screenshots, measurements, logs and generated QA reports belong in ignored `.qa/<task>/`, never the curated reference directory. New specifications remain Draft, pending owner review.
