# Company Directory — Reference Refinement 02

Baseline: `738f113c9fda67ba7e5f2fe09dc3af1cd0bb1fe6`, branch `v3`.

Visually inspected `design/v3/references/02-company-directory.png`, with
`01-home.png` and `03-company-overview.png` as secondary references.

## Implemented

- Accepted shared navbar and Home retained. Directory uses the same page frame
  and the existing temporary CSS landscape treatment, without changing Home files.
- Reference hero, grouped search/scope/sort/create toolbar, horizontal rows by
  default, optional functional grid, and responsive grouped mobile rows.
- Real Company name/ticker, sector/exchange, personal note, monogram, available
  updated timestamp, Company-specific workspace link and existing edit route.
- Global updated-descending, created-ascending or name-ascending ordering with a
  unique ID tie-breaker, applied before 24-row pagination. Query/sort survive page
  links; search or sort changes return to page one. Counts describe loaded results.
- Directory-only sorting uses existing authenticated table SELECT permissions and
  explicit owner filtering plus RLS. Literal name/ticker search escapes regex
  metacharacters and independently quotes PostgREST reserved characters. Home and
  workspace pickers keep the existing RPC/pagination path. No new database API,
  migration, write privilege or credential path is introduced.

## Deliberate limitations

The actual V3 Company contract has **no archive column, policy or archive API**.
Consequently Aktif/Diarsipkan filtering and archive mutations are unavailable;
their acceptance cannot be marked passed. The scope is truthfully “Semua”, with
an accessible, Escape-dismissable explanation. “Tersimpan” describes an existing
record, never an invented active/archive state. Adding archives requires a
separately approved product/schema change.

No real logos, verified business descriptions or research statistics are supplied
by this read contract. Monograms replace logos; short notes are labelled personal;
unavailable counts are omitted. The decorative window/plant asset is not separately
available, so the accepted Home CSS treatment is reused. Missing optional fields
remain visibly absent/unavailable. Existing creation errors are never shown as a
successful save. No archive action is simulated.

## Validation

- `npm test`: **278 passed, 0 failed, 0 skipped**. Includes owner/account isolation,
  existing application guards, Home regressions, globally ordered bounded queries,
  SDK filter serialization, timestamp validation, Directory states and links.
- `npm run lint`, `npm run typecheck`, `npm run format:check`,
  `git diff --check`: passed.
- `node scripts/v3/offline-build.mjs`: passed; disposable production compilation,
  no credentials, no Node network attempts; artifact is not deployment-ready.
- Browser review through the existing synthetic-only preview: desktop/tablet/mobile
  (requested widths 1440/900/390 and 320), light/dark, list/grid, ticker search,
  empty search and recovery, sorting, pagination and sort reset, Add Company,
  row-specific workspace navigation, creation failure, empty/error/loading/legacy
  states, long names, archive explanation and Escape/focus restoration. No
  horizontal overflow at the observed viewport widths; no warning/error logs.
- Screenshots (ignored, local only): `.qa/directory-reference-02/desktop-light.png`,
  `desktop-dark.png`, `tablet-light.png`, `mobile-light.png`, `mobile-dark.png`,
  `mobile-error.png`.

These are offline checks and synthetic browser observations. Live application
acceptance of the new sorted read path remains unverified. Cloud interlocks,
runner pins, SQL, V2 and `main` are unchanged. The two pre-existing untracked
Research Core handoff files are preserved and excluded from this checkpoint.
