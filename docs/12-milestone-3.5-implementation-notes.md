# Milestone 3.5 implementation notes

Status: application implementation and live verification complete. Browser QA
and visual refinement performed at all three requested sizes. Full visual
fidelity remains FAILED because the approved standalone landscape is missing;
the temporary gradient cannot reproduce it. Milestone 4 has not started.

## References inspected

All ten actual PNGs were visually inspected, including Thesis and Settings for
global consistency. Two mobile filenames differ from those in the task:

- Desktop: `01-home.png`, `02-companies.png`, `03-company-workspace.png`,
  `04-thesis-snapshot.png`, `05-settings.png`.
- Mobile: `01-home.png`, `02-companies.png`, `02-company-workspace.png`,
  `4-thesis-snapshot.png`, `05-settings.png`.

These are inside `public/visual-references/desktop/` and `mobile/`. The actual
reference guide is `visual-references-README.md`; the actual foundation document
is `docs/MY_KRAVV_Product_Foundation_v0.1.md`.
The milestone request makes fidelity an acceptance criterion beyond the older
reference guide's directional guidance. Illustrative future product features
remain outside this milestone.

## Before/after composition and implemented components

| Surface         | Before                                                                   | Implemented composition using existing data                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home            | Narrow hero and capture/history column; no continuation                  | Broad atmospheric hero, real most recent Company/Thought continuation, integrated full-width quick capture, compact recent-thinking rows                                    |
| Companies       | Spacious metadata rows with weak archive hierarchy                       | Broad archive index, compact identity/context/activity rows, clear active/archive controls, secondary destructive action                                                    |
| Workspace       | Identity/context, capture, and history in disconnected vertical sections | Shared Company header; related composer and thinking thread in the main column; restrained metadata/context beside it on desktop                                            |
| Mobile          | Desktop sections largely stacked                                         | Compact brand/context header, adapted hero and identity, focused composer, compact activity rows, progressive context/history, working navigation with touch-sized controls |
| Thought history | Preview and full text repeated even for short entries                    | Short originals shown once; long originals disclosed without duplicate text, preserved line breaks, clear capture time and secondary deletion                               |

The repository contains only the ten UI screenshots, with no standalone landscape
asset. The approved mountain/nature atmosphere therefore remains a visual-fidelity
blocker. Never use a complete UI reference as a background or silently substitute
stock imagery. Use restrained temporary CSS atmosphere until an original suitable
asset is supplied. References will not be modified.

Implementation sequence after migration confirmation:

1. Implemented server-authorized deletion and idempotent capture using normal
   authenticated Supabase clients, with ownership/concurrency regressions.
2. Added lightweight user/context-scoped draft recovery and stable browser-generated
   capture operation IDs. Preserve failed/ambiguous requests; clear only the exact
   draft after confirmed success. Provide discard and storage-failure feedback.
3. Rebuilt the three page compositions and responsive shell using actual data;
   omit AI, Open Gaps, Challenges, Thesis, Decisions, uploads, and Settings.
4. Validated auth/Company/Thought regressions, draft behavior, deletion, retry
   isolation, formatting/lint/types, live integration, build, audit, and secrets.
5. Compared desktop 1440×900, tablet 768×1024, and mobile 390×844 at scale 1,
   then refined Home hierarchy, mobile context disclosure and tablet overflow.
   Actual browser screenshots were inspected; automated checks were separate.

## Migration and security model

Applied migration:
`supabase/migrations/20261008000300_data_control_and_capture_idempotency.sql`.
The user confirmed application to the configured development project, and live
RPC, permission, concurrency and cascade tests passed. Existing columns and both composite
Company ownership relationships were checked through zero-row development API
queries; existing migration definitions establish their cascade behavior.
No live catalog SQL connection is configured.

- Nullable `capture_operation_id` preserves all legacy rows and original text.
  Uniqueness is per authenticated owner, not content: two intentional identical
  Thoughts can remain separate.
- `capture_thought` is SECURITY INVOKER and retains caller RLS and both existing
  capture/history triggers. Matching retries return the committed original;
  reusing an operation ID for another Company or different exact text fails.
  Concurrent requests use uniqueness plus `DO NOTHING`, never an UPDATE.
- Narrow deletion RPCs are SECURITY DEFINER, executable only by `authenticated`,
  with empty search paths and explicit `auth.uid()` ownership predicates on every
  target. Their privilege bypass is deliberate and limited to owned deletion;
  the application never uses a service key for ordinary user operations.
- Owner-only DELETE RLS policies are added as defense in depth. Ordinary table
  DELETE rights remain absent; callers must use the confirmation-taking RPCs.
  Original Thought UPDATE and history mutation privileges remain absent.
- Company deletion locks the owned parent, requires explicit confirmation, and
  requires its exact current name when Thoughts exist. The lock excludes new
  captures between the check and cascading deletion.
- Thought deletion locks the parent first. A restricted deletion trigger removes
  its associated history atomically, also during Company/account cascades.
  No deleted-content event or trash is created. Future restrictive foreign keys
  reject unsafe deletion and roll back cleanup; this does not invent protections
  for analysis tables that have not been implemented.
- Permanent deletion concerns active records, not immediate provider backup
  erasure. Operation IDs live on their Thoughts; deleting a Thought also removes
  its retry identity. No separate ledger retains deleted research content.

## Implemented draft behavior and browser regression

Browser persistence is implemented with user, Company and Home context keys.
Home also restores the selected Company. Keystrokes update the editor snapshot;
storage writes debounce for 250ms and flush on blur, submission and pagehide.
Unchanged snapshots do not cause repeated writes. Failed saves and ambiguous
responses retain the draft and operation identity; editing after an attempted
save rotates the identity. Discard starts a new operation. Successful saves clear
only a matching owner/context/operation/content draft using a server-verified
receipt. A receipt for a Home save cannot clear a different Company draft.

Browser QA caught HTML form transport converting LF to CRLF, preventing the
initial exact receipt comparison from clearing drafts. The acknowledgement now
compares equivalent textarea line endings without rewriting database originals.
A dedicated regression and repeat browser save/reload checks passed.

Local storage is readable
by scripts running on the app's origin and by someone with access to the same
browser profile. User/context keys prevent accidental cross-account display;
they are not encryption. Reaching the verified signed-out login screen removes
app drafts across accounts in that browser profile; browser logout/relogin
confirmed this. Storage failures retain memory text and show a warning to copy
before refresh. The composer exposes this tradeoff in a plain-language disclosure.

The migration was applied once in the project matching `NEXT_PUBLIC_SUPABASE_URL`
after the required section 12 pause. There is no linked SQL migration tool; do not
replay previous migrations. No dependencies or approved visual references changed.

## Browser QA results and refinement

All nine page/viewport combinations were inspected using a disposable development
account, with viewport sizes confirmed through the rendered page and zoom scale 1.

| Page              | 1440×900               | 768×1024               | 390×844                |
| ----------------- | ---------------------- | ---------------------- | ---------------------- |
| Home              | No horizontal overflow | No horizontal overflow | No horizontal overflow |
| Companies         | No horizontal overflow | No horizontal overflow | No horizontal overflow |
| Company Workspace | No horizontal overflow | No horizontal overflow | No horizontal overflow |

The first tablet pass found a 4px overflow: the hero's 32px atmospheric overhang
exceeded its 28px page margin. It now matches that margin. Company actions also
inherited a column flex direction on tablet; the intended horizontal row is
explicit. Both issues were rechecked visually and through page width measurements.
Home's shorter desktop hero and compact continuation bring activity higher into
the page. Recent excerpts and long Company identities are visually clamped;
complete originals remain available in their Company workspace.

Mobile uses working bottom navigation, smaller hero typography, icon-sized edit
access, collapsed Company context/facts, compact timestamps and readable history.
Touch controls and expanded deletion confirmation were checked without overflow.
No new console errors/warnings appeared during the fresh navigation and QA flows;
no dev indicator or React/Next.js behavior was suppressed or downgraded.

Browser checks also passed for draft refresh, failed-validation retention,
Home Company selection recovery, Company/context isolation, confirmed-save clear,
retention of an unrelated draft after Home save, and logout cleanup. The delete
confirmation interface showed its required checkbox and exact-name field; actual
permanent deletion and failure handling were verified through the real Server
Action HTTP forms and database integration tests.

Full visual fidelity: **FAILED / outstanding asset blocker**. Browser runtime and
responsive checks: **PASSED**. The approved mountain/nature image is absent, the
gradient is flatter, and Georgia/Segoe UI only approximate the reference fonts.
The reference's future AI/thesis/gap regions are intentionally omitted; a real
Company list occupies Home's secondary activity region. Capture includes current
Company selection and draft controls absent from the mockup, so it remains taller.
User visual sign-off is still required; this report does not call the milestone
visually complete.

Screenshots and viewport measurements are saved locally at:
`C:/Users/PIXWAR/.codex/visualizations/2026/10/07/01a11630-ec88-7b60-93ef-5a0f088d0b17/milestone-3.5/`.
Files use `{home,companies,workspace}-{desktop-1440,tablet-768,mobile-390}.jpg`;
`viewport-checks.json` records the final matrix. They contain explicitly marked
disposable QA data, not another user's research. The QA account/data are removed
after inspection, so those sample rows are not permanent application seed data.

## Automated validation and dependency audit

- Formatting, lint and strict TypeScript: passed.
- Deterministic tests: 27 passed, including five draft regressions.
- Live integration checks: 30 passed, including ownership, immutable originals,
  exact-text capture, stable pagination, archive behavior, atomic deletion,
  concurrent idempotency, payload conflicts and capture/delete confirmation races.
- Production build: passed.
- Secret scan: no configured private key found in repository files or browser
  build artifacts. Credentials are not embedded in application source.
- Production dependency audit: zero vulnerabilities.
- Full dependency audit: five high entries trace to one pre-existing development
  `braces` advisory through the Next ESLint dependency chain. No patched version is
  published; `3.0.4` is unavailable. The suggested forced downgrade was not applied.
  See [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
- No dependency was added or changed. No OpenAI calls or Milestone 4 work occurred.

All live test accounts are deleted in cleanup and absence of their rows in
settings, Companies, Thoughts and history is checked. The initial new test had a
cleanup verification column typo; the two remaining marked disposable identities
were explicitly removed, and the corrected full suite passed cleanup verification.

## Remaining manual QA and limits

1. Review Home, Companies and Workspace against their approved desktop/mobile
   references at 100% zoom, and supply the original standalone landscape asset
   before full atmosphere/sign-off can pass.
2. On a physical mobile device, check keyboard opening, bottom safe area, textarea
   scrolling, browser back navigation and very long real Company names.
3. Refresh a draft, switch Home Companies, fail a save, then confirm success clears
   only the saved draft. Check disabled/private browser storage warning behavior.
4. On disposable data, open/cancel deletion, test missing/wrong exact-name
   confirmation, then delete a Thought and a Company containing Thoughts.
5. Confirm archive still preserves history and blocks new capture; read a long
   original and move between pagination pages.

Draft persistence requires JavaScript and the same browser profile; it is not
encrypted or synchronized across devices/tabs. If storage is unavailable or a
tab is terminated before a flush, recovery cannot be promised. Operation identity
persists with its Thought, so permanent deletion also removes that identity;
there is no deleted-content retry ledger. Future analysis slices must add proper
restrictive FKs and dependency-specific deletion rules. Provider backups follow
provider retention rather than immediate active-record deletion.
