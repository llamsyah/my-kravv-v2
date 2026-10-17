# Milestone 5.5 Phase 4B — Refine UX, version flow and information hierarchy

> V2 checkpoint, 17 October 2026: temporary browser captures and measurement dumps were retired. Historical results and limitations below remain; see the [curated visual index](../design/README.md) for retained evidence.

Implemented on 12 October 2026. This phase is ready for user visual review; review approval is still pending. No real AI-provider request, new migration, commit or push was made.

## Baseline and preservation

Started from HEAD `6a80f47b87ac9bbb20259e93abafd2b0eb0aa65d` and the user's approved, uncommitted Phase 4A implementation. A temporary starting-status snapshot was recorded during implementation and retired at the V2 checkpoint; the baseline HEAD and preservation summary remain here. No reset, stash or discard was performed. Existing changes to Overview, Pemikiran, Home, navigation, migrations and prior notes are preserved; their presence in the final Git diff is not evidence of new Phase 4B changes.

Before implementation, read the latest blueprint and notes 19–21, the installed Next.js Server/Client Component, CSS, forms and revalidation guides, and the actual Refine route, forms, projection, display selector, pagination, deep-link and Server Action code. Captured hashes of 53 protected files covering server/domain behavior, migrations, Server Actions and the approved surrounding workspace. The Phase 4B hash comparison confirmed those files unchanged; its temporary raw dump was retired at the V2 checkpoint. Both Phase 4A display migrations are unchanged.

Protected behavior includes exact immutable originals, owned server projections, display revision checks, accepted/superseded eligibility, auth/RLS, capture/draft receipts, refinement lifecycle, request identity, prompts, gateway/provider routing, AI Run accounting, archive restrictions, revalidation and stable cursors. No database query or mutation implementation was changed.

## Actual files changed in this phase

Application presentation:

- `src/app/(private)/companies/[companyId]/thoughts/[thoughtId]/refine/page.tsx` — state-driven primary comparison/reading, contextual controls, compact history and truthful recovery.
- `src/app/(private)/companies/[companyId]/refinements/page.tsx` — minimal supporting hub title and persisted display labels; queue behavior unchanged.
- `src/features/refinements/presentation.ts` — pure presentation decisions and distinct review labels.
- `src/features/refinements/refine-comparison.tsx` — optional primary-original anchor, preserving progressive mobile controls and server-rendered documents.
- `src/features/refinements/refine-forms.tsx` — concise cost copy, local edit/cancel/resume behavior and review labels; existing actions and operation identity retained.
- `src/features/refinements/refine-workspace.module.css` — comparison spacing, neutral review statuses, contextual actions and compact version trail.
- `src/features/refinements/version-trail.tsx` — new server-rendered native history disclosures, warnings and secondary provenance.
- `src/features/thoughts/display-selector.tsx` — same single selector with compact review presentation and resolved primary reading; visible error outside collapsed controls.
- `src/features/thoughts/thought-display.module.css` — primary/secondary display-reading and disclosure styling.

Regression and QA support:

- `src/tests/refine-workspace.test.ts` — revised presentation expectation plus state-driven and chronology regression coverage.
- `scripts/phase-1-visual-fixture.ts` — guarded disposable Phase 4B fixture preparation and independent acceptance/display verification.
- `scripts/phase-4b-qa.mjs` — isolated browser screenshots, geometry, interactions, conflict and accessibility checks.
- `src/tests/helpers/phase-4b-read-fault.mjs` — development-only QA process preload; injects a read failure solely for the disposable owned pending Thought. Not imported by the application.
- This report and `design/milestone-5.5-phase-4b/` evidence/gallery.

## Hierarchy and state rules

The detail header is now `Tinjau pemikiran`, with concise review status, date, existing return/Thought links and a native keyboard-accessible `Tentang Refine` disclosure. Primary content follows the task; technical provenance and previous versions are secondary. The Company workspace grid and navigation remain intact.

| Persisted condition            | Primary content                                        | Available action                                                                               |
| ------------------------------ | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Original only                  | Exact original                                         | One explicit `Rapikan dengan AI`; no empty history or selector                                 |
| Pending or uncertain read      | Honest processing/unknown notice and reachable wording | Existing reload/recovery; no generation or review decisions                                    |
| Relevant SUGGESTED             | Asli / Usulan AI comparison                            | `Sunting`, `Terima`, `Tolak`; no competing generation form                                     |
| Editing                        | Original and proposal with editable local text         | `Terima suntingan`, reject, or cancel editing; cancellation makes no decision                  |
| Accepted, ORIGINAL displayed   | Exact original reading                                 | Accepted alternate on demand; independently saved display control                              |
| Accepted, REFINEMENT displayed | Asli / exact saved `Versi pilihan`                     | Explicit preview/save; no resolved review buttons                                              |
| Selected SUPERSEDED            | Exact previously accepted saved wording                | `Diterima sebelumnya` is review provenance; `Ditampilkan` identifies the independent selection |
| Rejected                       | Actual saved reading; rejected proposal in history     | Secondary deliberate new generation when authorized                                            |
| Archived Company               | Existing reading/review/display operations             | New generation remains disabled under the existing archive guard                               |

A secondary `Buat usulan baru dari asli` disclosure appears only after review is resolved. Existing archive and source-size disabled reasons remain. No automatic generation, retries or hidden requests were introduced.

An explicit historical SUGGESTED target remains reviewable. Without an explicit target, a suggestion is the primary review only if it was created after the independently fetched current accepted row, or no accepted row exists. Older unresolved suggestions retain their truthful SUGGESTED status and explicit review entrance in history; they are not promoted as a new pending proposal after a newer acceptance. Timestamp comparison normalizes time zones and preserves database microseconds. This is a presentation policy, not a lifecycle/status rewrite or assessment of belief quality. The hub continues to report its actual persisted queue statuses, including historical unresolved suggestions.

## Acceptance, display and editing

`Diterima` describes a review decision. `Ditampilkan` identifies the Phase 4A owned projection's exact saved choice. `Pratinjau` is unsaved. Neutral review badges and the restrained selected marker keep these concepts distinct.

During review, the Asli/proposal comparison takes priority, while a compact saved-display section remains identifiable. Resolved pages prioritize the exact server-projected display text, including an explicitly selected SUPERSEDED row rather than inferring selection from the newest accepted/history entry. Accepted alternatives remain collapsed unless explicitly targeted. A resolved deep link exposes the relevant reviewed wording without replacing the persisted primary reading.

There is still only one display selector. Changing its option is local preview; only `Gunakan versi ini` invokes the existing save action. The revision receipt, progressive form action, native select, explicit save, revalidation and no-reset handling are preserved. Stale-save feedback is outside the controls disclosure so closing that disclosure during a request cannot hide the failure.

Editing uses local state within the mounted review form. Cancel closes editing without accepting, rejecting or posting, and preserves the draft for resuming. Closed editing submits the visible AI proposal rather than the cancelled hidden draft. Failed action reset cannot erase edited text. Existing server validation and progressive form permalink behavior remain. This phase does not introduce durable Refine draft storage; full reload retention is not a new guarantee. Original capture draft storage/recovery is unchanged.

## Version trail, pagination and links

`Jejak versi` is a collapsed native section with a thin decorative connector, status/time, exact 3-line excerpts and `Lihat selengkapnya`. Full text, provider warnings and provenance are available on demand. Edited acceptances retain access to the pre-edit AI wording. No confidence, quality or belief-progress metrics appear.

Main history retains the existing 20-row page with one-row lookahead, database ordering and original last-row cursor. Versions already shown in primary/alternate reading are not duplicated at full size. At most two explicitly relevant off-page rows are placed in a separately labeled related group, not inserted into the page as if chronologically newest. Older versions and return-to-latest navigation retain existing links. Cursor/explicit target opens the relevant history, while default resolved reading does not expand it.

`refinement-<id>`, `original-title`, `thought-display`, resolved target and history anchors remain accessible and unique. History read/disclosure links perform no generation. Preview links are absent when an entry is already the displayed version.

## Copy and visual decisions

Removed the generic philosophy headline and repeated original-preservation/onboarding paragraphs. Consolidated optional explanation in `Tentang Refine`, provenance behind native disclosure and new-generation information at its action. Preserved meaning/uncertainty/verification warnings, provider warnings, internal-budget notice, input/archive restrictions and visible failures.

Desktop comparison has equally wide but naturally sized reading surfaces, no fixed-height internal scroll area, and ordinary page scrolling. Asli and the proposal/selected wording have differentiated surfaces and restrained top rules. Mobile retains accessible Asli/right-document/`Lihat keduanya` pressed controls. Server markup contains both complete documents; no text normalization or truncation of primary wording is performed.

## Browser evidence and measurements

See the [screenshot gallery](../design/milestone-5.5-phase-4b/README.md): **115 actual-application screenshots were originally captured**, including 48 matched before and 48 after screenshots, viewport captures, read-fault recovery and interaction evidence. Only five selected Phase 4B images remain after the V2 checkpoint; the full temporary matrix was retired. All use fictional owned Company/Thought data. Matched captures precede intentional browser mutations and use the same data, widths, 900px viewport height and scroll start.

| CSS viewport width | Comparison geometry                     | Overflow |
| ------------------ | --------------------------------------- | -------- |
| 1440               | Two 628px columns at x80/x732, 24px gap | 0px      |
| 768                | Two 348px columns at x24/x396, 24px gap | 0px      |
| 390                | Single 358px surface at x16             | 0px      |
| 320                | Single 288px surface at x16             | 0px      |

Measured original-only, pending, suggested, editing, long multiline, accepted/original, accepted/selected, selected-superseded, rejected, multiple-version, archived and hub states at all four widths. Separate owned read-failure injection verified uncertain recovery at all four widths. All measured states have no horizontal overflow; fonts report loaded. CSS root/body zoom is 1, visual viewport scale 1, DPR 1 in the fresh isolated Chrome profile.

Verified interactions:

- Edit/cancel/resume preserves draft; cancellation sends no decision request.
- Mobile keyboard focus and Asli/both-document switching retain exact original.
- Preview followed by reload does not save.
- One browser acceptance of an injected mock proposal preserves the exact older selected refinement and preference revision 1, independently checked through owned database reads.
- Resolved proposal anchor, unique version anchors, full history and older-page navigation work.
- Archived generation stays disabled while an explicit no-op saved-display action remains permitted.
- Two-tab stale save returns the existing conflict, retains preview and shows the error even with controls closed; reload shows the winner.
- Exact raw contents and the same 53 injected-mock AI Runs remain after browser interactions; no browser generation was invoked.

Accessibility checks on the final production build verified mobile switch targets at least 44px, visible 2px keyboard focus, named/pressed controls, and reduced-motion transitions at 0s. Measured contrast: reading 14.52:1, status 8.43:1 and accept button 9.92:1. A focused mobile accept button ended at y477.91, above the bottom navigation at y827.56; its height was 44px. These focused checks are not a full assistive-technology audit.

Successful screenshot, interaction, fault, final production conflict and accessibility passes recorded no browser console errors/warnings. A development conflict run emitted a Chrome unused-preload advisory for the unchanged AppShell CSS. It was not suppressed during testing; the temporary advisory dump was retired at the V2 checkpoint. The strict conflict scenario passed on a fresh final production server with an empty browser log. No React runtime error was observed.

### Honest rendering limits

Native browser zoom at the user's 100%/80% settings was not manually verified. The screenshots use a fresh isolated Chrome default profile; CSS zoom, DPR and viewport scale measurements do not establish the user's native zoom setting. Physical mobile keyboard/safe-area behavior, touch interaction and screen-reader traversal need manual review.

With client script chunks blocked but the inline Next.js streaming bootstrap retained, both complete comparison documents and exact original were visible on mobile. That temporary capture was retired at the V2 checkpoint; this paragraph preserves the result and its limits. A fully JavaScript-disabled development browser remained in the streaming loading boundary; therefore whole-application zero-JavaScript operation is **not** claimed. No framework/loading architecture change was made for this presentation task.

Full-page screenshot exports can position fixed bottom navigation at the initial viewport band. The retained desktop viewport capture helps distinguish export behavior from actual control coverage.

## Quality gates and cleanup

- ESLint with zero warnings: passed.
- Next route type generation and TypeScript: passed.
- Prettier: passed, with notes explicitly formatted because the root formatting configuration excludes `docs/`.
- Deterministic tests: **89 passed**, including state-specific controls, historical/explicit suggestions and microsecond/time-zone ordering.
- Existing development database/HTTP suite using injected mock providers: **62 passed**.
- Focused display database suite after the final visible-error change: **11 passed**.
- Production build after the final application change: passed.
- Browser/state/interaction/conflict/accessibility checks and protected-file hash verification: passed with the limitations above.

QA used only a purpose-checked disposable account, authenticated owned records and injected providers. The read-fault preload was confined to the task's isolated QA server. Disposable account deletion verified empty ownership rows across nine tables before removing the ignored local credential file. The task's extra QA server and isolated browser contexts were closed; the main development server remains available for user review. Credentials were never included in evidence.

## Deferred and stopping point

Await user visual review of Phase 4B. Navigation smoothness, future Referensi, Clarify/Challenge, Portfolio, Phase 6, additional migrations and AI/provider changes remain out of scope. No commit or push was performed.
