# Milestone 5.5 — Company Refine workspace

Implemented October 9, 2026. Awaiting user visual review; no commit or push.

## Scope and preflight

Preserved the existing uncommitted Phase 3, alignment A and Pemikiran B work.
Reviewed the approved blueprint, Phase 1–3 notes, owned Company shell, Refine
forms/actions/read helpers, lifecycle constraints and installed Next.js 16.4
Server/Client and page conventions. The partial unique indexes already enforce
one accepted version and one pending request per Thought; no migration was needed.

Pemikiran remains capture and original reading. Refine now owns a Company work
queue and the existing Thought comparison/decision route. No product-wide
preferred-version projection, Referensi, Phase 6, new prompt, real provider call,
retry policy, schema, billing or accounting change.

## Changed files in this scope

| File                                                                                                                                                   | Purpose                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/(private)/companies/[companyId]/refinements/page.tsx`                                                                                         | Owned, paginated Company queue; compact original excerpts, persisted status, explicit detail entrances, empty/archive states. No capture or generation on GET.                                                                    |
| `src/app/(private)/companies/[companyId]/thoughts/[thoughtId]/refine/page.tsx`                                                                         | Independent current acceptance, explicit proposal/resolved target, comparison, original access, secondary history/provenance, deliberate pending recovery.                                                                        |
| `src/features/refinements/presentation.ts`                                                                                                             | Pure comparison selection/text and truthful queue labels.                                                                                                                                                                         |
| `src/features/refinements/refine-comparison.tsx`, `refine-workspace.module.css`                                                                        | Equal desktop columns; mobile pressed-button document selection or sequential comparison; server fallback renders both. Natural page scrolling.                                                                                   |
| `src/server/db/refinements.ts`                                                                                                                         | Owner/Company/Thought-scoped independent active-version lookup and bounded queue metadata reads through the session/RLS client.                                                                                                   |
| `src/features/refinements/refine-forms.tsx`                                                                                                            | Honest reader link; secondary explicit new-proposal disclosure; selected-proposal permalink preserves form errors even when another accepted version exists. Existing action-state/operation identity and review fields retained. |
| `src/features/companies/company-workspace-shell.tsx`, `company-workspace.module.css`                                                                   | Activate the functional third section and fit its three navigation links at 320px. Shared Company alignment retained.                                                                                                             |
| `src/features/refinements/actions.ts`, `src/features/companies/actions.ts`, `src/features/thoughts/actions.ts`, `src/features/data-control/actions.ts` | Add queue cache invalidation after existing successful mutations; no mutation/service semantics changed.                                                                                                                          |
| `src/tests/refine-workspace.test.ts`, `src/tests/live/refinements.test.ts`                                                                             | State/read boundaries, edited/superseded wording, unknown/truncated status, explicit server-form validation recovery, acceptance outside 20 history rows and pending metadata.                                                    |
| `scripts/phase-1-visual-fixture.ts`                                                                                                                    | Guarded disposable mocked fixtures, original/run checkpoints, existing cascade cleanup.                                                                                                                                           |
| `design/milestone-5.5-refine-workspace/`                                                                                                               | Actual screenshots, measured geometry, workflow and runtime evidence.                                                                                                                                                             |

## State and data rules

The canonical Thought route is unchanged. `proposal` and `resolved` are validated
and independently retrieved with ownership and parent checks, even outside the
current history window. Their exact `refinement-<id>` anchors remain unique.
Missing/foreign targets produce safe feedback, never a fabricated proposal.
`original-title` and `refine-history-title` remain available.

An explicitly selected SUGGESTED row takes comparison focus. Otherwise the current
ACCEPTED row takes precedence over the newest suggestion. Accepted wording uses
`user_final_content !== null` before AI content; earlier SUPERSEDED history also
retains its user-edited wording. Rejected/superseded targets are pinned in secondary
history and cannot become current accepted wording. The newest unreviewed proposal
remains available through an explicit entrance. Resolved versions have no active
accept/reject form. Rejection leaves current acceptance or original intact.

History remains twenty rows plus a lookahead with the existing timestamp/id cursor.
Acceptance is queried independently of this page. Read failures block generation
and review presentation and offer a full reload rather than representing unknown
as no versions. PENDING is independently persisted, disables new generation and
never polls, retries or repairs. Archive and 2,000-byte source gates remain intact.

Queue pages contain at most twenty owned Thoughts. Three scoped batch reads fetch
up to 101 history metadata rows and up to 21 accepted/pending metadata rows. The
unique indexes bound the latter two to at most twenty valid results. When history
is truncated, observed active statuses remain evidence of presence; absence is
**unknown** for unseen Thoughts. “Belum dirapikan” requires a complete empty
history result and verified absence of pending work. Failed pending reads show
unknown status. This deliberate bounded-read limitation avoids an unbounded
history scan or a new schema/RPC. Open the detail to independently resolve state.

New generation remains explicit, available secondarily even with an existing
proposal, and uses unchanged request identity and budget guards. Generation errors
open their enclosing disclosure; proposal validation errors retain the selected
review form and text. “Lihat pemikiran” is navigation, not restore-original.

## Browser evidence and limitations

[Screenshot gallery and geometry](../design/milestone-5.5-refine-workspace/README.md).
Forty responsive state measurements cover 1440, 768, 390 and 320 CSS px, including
long Company identity, long/multiline Indonesian original, suggested, edited
accepted, multiple/off-page versions, rejected, original-only, pending, empty and
archived cases. No horizontal document or Company-navigation overflow; fonts loaded.
At 1440 the comparison has two 628px columns starting at x=70.5 and x=722.5,
separated by 24px. At 768 the columns are 338.5px. Mobile uses one 339px/269px
surface at x=16; show-both restores sequential documents. Shared header/nav edges
are stable for the same Company. Shorter names and scrollbar absence legitimately
change header height/gutters; no independently centered Refine wrapper was added.

Keyboard activation tested Asli, Usulan, show-both and proposal edit disclosure.
Mobile view controls measured at least 44px; textarea text is 16px. A disposable
browser edit/accept saved exact chosen text, removed its review form and preserved
resolved anchor/return/Browser Back. Pending full reload and archived generation
guard were inspected. No warning/error logs observed. The checkpoint retained
exact original text and the same 27 locally mocked AI runs through browser QA.

The no-JavaScript fallback is supported by server-rendered documents, native
disclosures/forms and HTTP validation recovery; a separate JavaScript-disabled
browser session was not available. CSS zoom=1 and visual viewport scale=1 were
recorded separately from DPR approximately 0.8. Native browser zoom could not be
independently confirmed; native 100%/80%, physical phone keyboard/nonzero safe
areas and assistive screen-reader use remain explicit manual checks. Full-page
exports may include the fixed mobile rail at its initial viewport position and
surplus canvas; use focused viewport captures for actual mobile interaction views.

## Validation and stop

Final gates: ESLint, Next route generation/TypeScript, repository formatting,
**78 deterministic tests**, **51 full live development DB/HTTP checks**, and the
production build passed. After the last foreign-account hub regression was added,
the focused **11 Refine live checks** passed again. All provider responses were
mocked. The build includes the new owned Company Refine route and retains the
existing canonical detail. Evidence contains **49 actual screenshots** and forty
responsive geometry cases; browser warning/error log is empty.

The disposable account was signed out and deleted; eight owned-table cascades
and removal of its ignored credential file were verified. Its exact originals
and the same 27 mocked AI runs were checked again before deletion. Viewport
override reset; local development server retained. No real provider call,
commit or push. Pre-existing uncommitted files remain intact.

An initial
live assertion expected a bare HTTP 404 for a streamed unavailable route. It was
corrected to check the safe unavailable UI and absence of private Company data;
all production ownership checks remain in place. No tests were disabled.

Stop after this Refine workspace. Visual approval and the named manual device
checks remain outstanding. Do not begin preferred-version reading or Phase 6.
