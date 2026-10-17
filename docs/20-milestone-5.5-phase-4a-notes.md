# Milestone 5.5 Phase 4A — Persistent Thought Display Selection

> V2 checkpoint, 17 October 2026: temporary browser captures and measurement dumps were retired. Historical results and limitations below remain; see the [curated visual index](../design/README.md) for retained evidence.

9 October 2026. Implemented for review. Stop after Phase 4A; no Phase 4B/6,
timeline redesign, generation CTA redesign, navigation animation or Referensi.

## Preflight and preserved boundaries

Initial working tree was clean at `6a80f47b87ac9bbb20259e93abafd2b0eb0aa65d`.
Read the approved blueprint, Phase 1–3/Refine reports, installed Next.js
Server/Client and revalidation guides, Thought/refinement models, existing
`resolve_refinement`, unique ACCEPTED index, reader queries and action/HTTP tests.
No applied migration was rewritten. No commit or push.

Review and reading are now independent. Accept/edit/reject/generate never set a
display preference. Absence defaults to ORIGINAL even with existing acceptance;
no backfill. A later acceptance may supersede the saved row's review status, but
its exact previously accepted wording remains displayed. Generation still uses
the immutable original through the unchanged gateway, service and accounting.
Capture, drafts/receipts, focus anchors, cursor order, legacy links, review actions
and deep links retain their contracts. No real provider request or new AI endpoint.

## Schema, authorization and deployment

Apply after existing migrations, in order:

1. `20261009000100_thought_display_preferences.sql` — dedicated additive table,
   owned batch reader and save RPC. User confirmed applied to configured development.
2. `20261009000200_display_conflict_response.sql` — narrowly changes the conflict
   code in the existing function; user separately confirmed applied. Both verified live.

Dedicated preferences avoid altering immutable Thought rows or review lifecycle.
One row per Thought: ORIGINAL/null ID or REFINEMENT/exact ID; revision and update
time. Composite foreign keys enforce owner/Company/Thought relationships.
Thought/Company/user deletion cascades preferences; the selected-refinement FK
checks at transaction end so existing cascades complete atomically. Deleting a
selected refinement alone fails rather than silently resetting the reading choice.

Only authenticated owned reads are granted; direct inserts/updates/deletes are
denied even to the service-role client. `set_thought_display` derives `auth.uid()`
and checks owned parents and ACCEPTED/SUPERSEDED with a recorded decision. A
parent-first lock and the existing Thought-specific review advisory lock serialize
review/selection. Expected revision prevents stale overwrite; identical current
choice is a no-op. No browser receives elevated credentials. Owned archived
Companies permit display changes; existing generation restrictions stay intact.

Live concurrent-save testing found that using SQLSTATE `40001` for a stale
revision triggered PostgREST's serialization retry behavior (requests stalled).
The additive fix returns `PT409`/HTTP 409; the same concurrency test now returns
one committed revision and one immediate conflict. The app requires the exact
conflict receipt, never retries display writes, and bounds the request to 15s.
Transport uncertainty asks for reload rather than claiming success.
See [Supabase's documented retry issue](https://supabase.com/docs/guides/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b).

## Shared reading and UI

`read_thought_displays` is a JWT/RLS-owned, bounded RPC (40 IDs maximum). It joins
one stored preference and its exact selected row, plus approved-option presence.
No unbounded history download or per-Thought network query. Home has five Thoughts,
Overview four, history twenty plus at most two independent targets; each uses
one display RPC. Existing raw query functions remain unchanged for gateway and
receipt safety. Projection validates every returned owner/parent/status/ref ID.
Missing/malformed/failed lookups show exact raw as explicitly labeled recovery
(`Asli · pilihan belum tersedia`), never as a confirmed saved choice.

Home continuation/recent, Overview, Pemikiran/history/focus, Refine picker and
detail share this projection. Exact `user_final_content ?? ai_content` is selected;
raw and both saved refinement text fields remain intact. React text rendering
escapes content; pre-wrap retains line breaks. Excerpts clamp without normalizing
stored whitespace. Thought creation determines chronological order and cursors.

Refine detail is the only selector. `Ditampilkan` heads the primary persisted
reading text. Dropdown or exact `display` links only preview; `Gunakan versi ini`
saves. Confirmation requires the server receipt's revision. ORIGINAL-only has no
redundant selector. Approved choices use a separate 21/20 keyset window; the saved
row and explicit approved preview load independently when outside it. Choice
pagination resets unsaved off-page previews to the saved choice, never saving them.
Decision timestamps include seconds to distinguish closely reviewed versions.

Two-tab browser QA found React's action form reset returning the native select
to its initial option while the preview state remained changed after a failed
save. This form now cancels native reset; a confirmed save navigates to fresh
server-owned props. Browser regression verified the dropdown and preview stay
consistent on conflict and reload shows the winning saved version.

Review comparison still names original/proposal/accepted text independently;
`Kamu terima` is review provenance, not `Ditampilkan`. Pemikiran shows one primary
reading version; `Lihat asli` discloses exact original secondarily. Focus and saved
anchors remain unchanged. Original-only entries have no artificial accepted label.
No multiple full versions are stacked by default in Pemikiran or Overview.

Confirmed display saves revalidate `/`, exact Company Overview, `/thoughts`
(including focus), `/refinements` and the canonical Thought Refine detail, then
redirect with `displaySaved=<revision>#thought-display`. No shared private cache.

## Actual changed files

| Area                          | Files                                                                                                                                                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Migrations                    | `supabase/migrations/20261009000100_thought_display_preferences.sql`, `20261009000200_display_conflict_response.sql`                                                                                                  |
| Domain / ordinary DB boundary | `src/domain/thought/display.ts`, `src/server/db/thought-display.ts`                                                                                                                                                   |
| Selection / reader UI         | `src/features/thoughts/display-actions.ts`, `display-selector.tsx`, `thought-display.module.css`, `thought-history.tsx`                                                                                               |
| Existing reader routes        | `src/app/(private)/page.tsx`, `companies/[companyId]/page.tsx`, `thoughts/page.tsx`, `refinements/page.tsx`, `thoughts/[thoughtId]/refine/page.tsx`                                                                   |
| Measured visual correction    | `src/app/globals.css`: Home-only decorative inset at mobile/tablet matched the existing gutter. Previously −20/−28px overran 16/24px gutters by 4px; final document overflow is zero. No page grid/navigation change. |
| Regression coverage           | `src/tests/thought-display.test.ts`, `src/tests/live/thought-display.test.ts`, one updated contract assertion in `src/tests/live/refinements.test.ts`                                                                 |
| Disposable QA                 | `scripts/phase-1-visual-fixture.ts`, `design/milestone-5.5-phase-4a/`                                                                                                                                                 |
| Documentation                 | `docs/15-milestone-5.5-ux-blueprint.md`, `docs/19-milestone-5.5-refine-workspace-notes.md`, this report                                                                                                               |

## Verification and evidence

Lint, Next route types/TypeScript, formatting and **87 deterministic tests** pass.
The full suite passes **62 live development DB/HTTP checks**, including ten new
display cases. All AI responses are injected mocks. Production build passes with
the same ten route entries. Final focused recheck and cleanup are recorded below.

Coverage: no preference/accepted default; explicit approved/ORIGINAL/no-op saves;
user edits; acceptance, rejection, suggestions and supersession independence;
foreign/wrong-parent/missing/ineligible references; unauthenticated/elevated-key
ownerless RPC and direct write denial; concurrent stale revision; pagination and
one-network batching; archived policy; selected FK rejection; deletion cascades
and accounting retention; server-action errors, refresh, fresh HTTP sessions and
consistent six-reader projection. Recovery and poisoned read receipts are covered
deterministically without manufacturing corrupt user data.

[Retained evidence and historical QA notes](../design/milestone-5.5-phase-4a/README.md)
cover six detail states × four widths (1440/768/390/320 CSS px), plus long ORIGINAL,
Home, Overview and Pemikiran at all widths. Final measured document overflow is
zero; fonts loaded; select/button height 44px, select font 16px; primary text uses
pre-wrap. The earlier selected SUPERSEDED version stays primary despite 21 newer
approved versions. Long original matches exact fixture text at each width.

Browser checks also verified preview-only behavior, explicit save/reset, older
choices, off-page preview reset, keyboard selection/submission, original disclosure,
invalid cross-Thought preview target and stale two-tab conflict/reload. Archive
selection saves while the expanded generation control is disabled. No generation
control was submitted. Native full-page export can paint the fixed mobile rail
at its initial viewport band; focused viewport captures show actual layout.

CSS zoom 1 and visual scale 1 were measured separately; native browser zoom is
not exposed by this in-app-browser tooling. Screenshot scaling is not CSS geometry.
Physical mobile keyboard/safe areas, native 100%/80% zoom and assistive-reader QA
remain manual device checkpoints. Corrupt/unresolved stored-reference recovery is
unit tested; browser invalid-target QA does not claim to corrupt a protected FK.

## Phase 4B handoff

Review Phase 4A before any further work. Future timeline/CTA polishing must keep
review comparison, local preview and saved display choice distinct. Reuse the
projection and exact approved target; never infer selection from latest ACCEPTED,
latest history row, or a green badge. Keep request identity, raw gateway source,
review/capture protections and budget accounting. Navigation animation, References
and Phase 6 remain separately authorized scopes.

## Final result and cleanup

Final lint/type/format checks and all 87 deterministic tests passed after the
browser fixes; final production build passed. The 62-check full live suite passed,
then all 11 focused display live checks passed again. Forty final responsive cases
and 48 saved actual screenshots are recorded. Browser warning/error log is empty;
sign-out/new-login explicitly preserved the selected reading. The two-tab conflict
check retained matching dropdown/preview state and reload recovered the winner.

Before deletion, all exact original strings and the same 27 injected-mock AI Runs
were verified unchanged by browser QA. The disposable account was signed out,
deleted, and nine owned-table cascades (including preferences) verified empty.
Its ignored credential file was removed, viewport override reset and temporary
QA tabs closed. Existing local development server retained. HEAD remains the
preflight commit, with all authorized changes uncommitted. No push or real AI call.

Phase 4A is ready for user review. Remaining manual checkpoints are native-device
keyboard/safe areas, assistive-reader and independently controlled browser zoom;
there is no outstanding development migration checkpoint. Stop here.

## Focused visual correction — Overview rows and reading order

9 October 2026, following user visual review. Preserved all existing uncommitted
Phase 4A work. The earlier overflow-only QA was insufficient: actual browser
inspection reproduced a 20px excerpt at every requested width, despite zero
document overflow. Four direct children (date, new provenance badge, excerpt,
arrow) entered an existing three-column grid. Auto-placement assigned the excerpt
to the 20px arrow column and wrapped the arrow into the next row.

Overview now has three structural columns: compact chronological marker, flexible
reading body, stable arrow. Excerpt and compact provenance/date are grouped inside
the reading body. Metadata can wrap within that body; the excerpt still clamps to
two lines without altering its exact stored string. No arbitrary fixed text width
or hidden badge masks the regression. Latest Thought is position 01; the bounded
earlier list starts at 02, based only on the existing four-Thought creation order.
Existing whole-row links, hover/focus styles and deep-link destinations remain.

Pemikiran uses semantic ordered lists with restrained 01… numbering and a
decorative vertical connector. Numbers are hidden from the accessibility tree;
list semantics remain explicit when visual markers are suppressed. The heading
labels the sequence as page-local. Both keyset pages restart at 01; independently
focused/saved off-page entries keep their separately labeled target list. No
global offset, persistent ID, score or acceptance state is inferred. Exact selected
wording stays primary; original disclosure, long reader, Refine entrance, secondary
deletion disclosure and focus inset remain. No per-Thought review timeline added.

Only four application files changed for this correction:
`companies/[companyId]/page.tsx`, `company-overview.module.css`,
`thought-history.tsx`, `thought-workspace.module.css`. The existing disposable
fixture gained a guarded `reading-order` mode for long selected wording. This
report and a separate evidence directory record the correction. Both applied
migrations and all domain/DB/auth/RLS/gateway/accounting/capture/review code remain
untouched by this correction.

| CSS viewport | Earlier excerpt before → after | Pemikiran primary reading width |
| ------------ | ------------------------------ | ------------------------------- |
| 1440         | 20 → 863.875px                 | 725.875px                       |
| 768          | 20 → 600.675px                 | 660.800px                       |
| 390          | 20 → 271.075px                 | 307.200px                       |
| 320          | 20 → 200.675px                 | 236.800px                       |

All earlier row bounds were measured; assertions require over 60% of each row for
the excerpt, arrow after the text and within its row, and zero document overflow.
Eight matched before/after pairs use identical fictional Company/data, 900px
viewport height and scroll 0. Sixteen additional responsive cases cover one
Thought and 20/5-entry history pages. Keyboard checks exercise row focus,
canonical focus navigation, full reader and exact original disclosure. Short and
very long selected refinements, approved-but-original and no-approved originals,
long Company name and independent off-page target all remain readable.

[Reading-order QA retention note](../design/milestone-5.5-phase-4a-reading-order/README.md)
record the actual application. CSS zoom/visual scale 1, DPR approximately 1 and
loaded fonts are measured; native browser zoom remains independently unverified.
Physical keyboard/safe-area and assistive-reader checks remain manual. Fixed-rail
full-page export limitations are recorded separately from CSS geometry.

Production build and all 62 development integration checks passed with injected
mock providers. Final lint/type/format/deterministic results are recorded below.
Browser warning/error log is empty. Exact original strings and the same 28 mocked
AI Runs were verified unchanged; disposable sign-out/deletion and nine cascades
completed, local credentials removed and viewport reset. No real provider calls,
commits or pushes. Stop for user visual review before Phase 4B.

Final lint, Next-generated route types/TypeScript, formatting and all **87
deterministic tests** passed. The initial format check caught an unformatted new
measurement artifact; evidence was formatted and the complete check passed.
Production build and the **62-check mock-provider live suite** passed; no
application code changed after those checks. Git whitespace check passed.

## Final visual polish — 11 October 2026

The subsequently authorized Personal × Professional polish is recorded in
[Phase 4A final visual polish](21-milestone-5.5-phase-4a-visual-polish.md), with
fresh matched actual-application screenshots and individual geometry checks.
It preserves this implementation's display/data contracts and both migrations.
Await visual review; Phase 4B remains a separate authorization.
