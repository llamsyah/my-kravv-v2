# Company Overview — Reference Refinement 03

Baseline: `7e99a6e35b4284e5b401b86aab42d08e6dd2d915`, branch `v3`.
Inspected `design/v3/references/03-company-overview.png` directly.

## Reference mapping and data

| Reference area | Implementation and actual source |
| --- | --- |
| Company identity | Existing owned Company lookup; monogram, name, ticker, sector and exchange. “Ruang pribadi” describes access, not an invented research status. |
| Summary/thesis | Prominent **Ringkasan perusahaan & catatan saya** from `companies.short_note`. Explicitly a personal note, not a formal thesis; existing metadata editor remains the write path. |
| Continue Writing | Latest owned, Company-associated `research_drafts` summary, ordered by update and ID. Existing editor/new-draft flow; no prerequisite Capture. |
| Workspace summary | Counts of the bounded loaded draft/revision lists (20 plus one lookahead), labelled accordingly. Revisions are not unique Thought totals. No extra totals/count scans. |
| Recent Thoughts | Owned `research_versions` filtered by immutable Company association. Title/date/version link to a minimal read-only snapshot using existing `getResearchVersion`; existing History remains accessible. |
| References | Honest unavailable state: no persistent V3 Reference domain or ingestion system exists. |

The full-width notes card and two-column lower cards follow the reference. Logo,
formal thesis, lifecycle classification, external business description, Capture
totals, unique Thought totals and Reference counts are not invented. There are no
new migrations, RPCs, write paths, data providers or acceptance launchers.

## Shared shell

The existing sidebar/drawer is reused with five distinct destinations: Overview,
Ruang Tulis, Pemikiran, Explore and Referensi. Company switching preserves the
destination; Writing keeps Company context and active navigation. Explore and
Referensi open explicit unavailable states. Existing standalone draft deep links
derive Company context from the authenticated draft, and explicit Company/draft
mismatches fail closed. Historical Thought snapshots retain their own Company
association even if the mutable draft later moves.

Sidebar search/pagination preserve an open draft; actual Company switching opens
the chosen Company's list/new-draft context. Owner/Company keys prevent prior
draft form state from carrying across accounts or Companies. Directory return,
collapse/reopen, session preference, native mobile drawer, Escape and focus
restoration remain separate and functional. Writing/History receive only routing
and anchor changes, without a visual redesign or mutation changes.

## Offline verification

- `npm test`: **285 passed, 0 failed, 0 skipped**.
- `npm run lint`, `npm run typecheck`, `npm run format:check`,
  `git diff --check`: passed.
- `node scripts/v3/offline-build.mjs`: passed in the existing disposable,
  credential-free, network-denied production-build workflow. Artifact is not
  deployment-ready.
- New deterministic coverage: bounded projections, paging, owner/Company checks,
  malformed/duplicate/oversized responses, immutable association after draft
  movement, route validation, truthful cards/states and the Writing shell.
- Existing offline HTTP adapter extended with nine read-only Company scenarios:
  Overview, empty Company, forbidden owner, scoped draft, cross-Company mismatch,
  legacy draft deep link, account switching and snapshot access/denial. This mode
  uses 54 synthetic loopback HTTP requests and zero external requests. It is not
  a Next.js Server Action/browser or live Cloud acceptance result.
- Synthetic browser checks: desktop/tablet/mobile light/dark, selected Company,
  Continue Writing, New Draft, Thought snapshot/History link, Company switching,
  unavailable destinations, metadata link, empty/error/schema-pending states,
  collapse/reopen without navigation, drawer Escape/focus and responsive bounds.
- Local ignored screenshots: `.qa/company-overview-reference-03/desktop-light.png`,
  `desktop-dark.png`, `tablet-light.png`, `mobile-light.png`, `mobile-dark.png`,
  `mobile-drawer.png`, `desktop-sidebar-closed.png`.

Accepted Home/Directory components are unchanged. Shared shell changes apply to
Company routes. Cloud/AI gates, runner pins, SQL, private evidence, V2 and `main`
remain unchanged. The two pre-existing untracked Research Core handoffs are
preserved and excluded. Live application acceptance remains unverified; this
checkpoint stops for owner visual review before any Writing refinement.
