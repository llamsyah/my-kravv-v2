# MY KRAVV — Milestone 5.5, Phase 2

Date: 2026-10-09. **Navigation and Company shell implemented; awaiting user review.**
This phase is separately authorized by the user's Phase 2 brief. The approved
[blueprint](15-milestone-5.5-ux-blueprint.md) and [Phase 1 report](16-milestone-5.5-phase-1-notes.md)
remain intact. Phase 3, Referensi and Phase 6 have not begun.

## Baseline and scope

HEAD remains `ea7a7adca1d404dd75a86186a690bf97b9cd0a50`. At the start, eight tracked
files were modified by Phase 1: `.prettierignore`, Companies index, global CSS,
root layout, AppShell, login/logout forms and PrivateNavigation. The existing
untracked design artifacts, blueprint, Phase 1 report, fixture helper, shell CSS
Module, shared UI and foundation styles were preserved. No reset, stash, discard,
stage, commit or push.

Inspected the current root/edit/Refine routes, auth/owned lookups, mutations,
redirects, hashes, forms, draft cleanup, primitives and styles. Read installed
Next.js 16.4 layout, pathname and Server/Client guidance before editing. No new
dependency, schema, domain model, provider configuration or route.

## Actual Phase 2 files

| Files                                                                                  | Change                                                                                                                                                                               |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/app/(private)/layout.tsx`, `src/components/app-shell.tsx`, `app-shell.module.css` | Account slot; authenticated header with two global links and Akun. Mobile rail retains only Beranda/Perusahaan and existing safe-area reservation. Public/auth edition stays intact. |
| `src/features/companies/private-navigation.tsx`                                        | Removes LogoutForm from navigation; uses segment-aware global selection.                                                                                                             |
| `src/components/disclosure-menu.tsx`, `disclosure-menu.module.css`                     | Small native disclosure enhancement reused by account and management; keyboard, focus, Escape, outside/blur/navigation close.                                                        |
| `src/components/ui/icon.tsx`                                                           | Extends the existing local set with user, chevron, back and prepared Overview glyphs.                                                                                                |
| `src/features/companies/company-workspace-shell.tsx`, `company-workspace.module.css`   | Shared server header, owned identity, derived monogram, optional metadata, persisted state, breadcrumb and secondary Kelola disclosure.                                              |
| `src/server/companies/workspace.ts`                                                    | Request-local owned Company/auth helper used by leaf pages and shell.                                                                                                                |
| `src/features/companies/navigation.ts`, `company-section-navigation.tsx`               | Pure active-route/rollout policy and prepared link navigation; unmounted until working sections ship.                                                                                |
| Existing Company root, edit and Thought Refine detail `page.tsx`                       | Adopt shared shell; remove duplicate Company heroes. Edit Back is consolidated into its same-destination breadcrumb; Refine's exact focus/hash Back link remains.                    |
| `src/app/globals.css`, `src/styles/typography.css`                                     | Remove ten obsolete Company hero rules plus its former type selector, after confirming no remaining consumers. Other feature compositions stay operational.                          |
| `src/tests/navigation.test.ts`                                                         | Four focused tests for global prefix boundaries, nested Refine priority, management exclusion, rollout allowlist and Unicode monograms.                                              |
| `design/milestone-5.5-phase-2/*`                                                       | Actual app captures, final layout metrics and runtime evidence.                                                                                                                      |

Inherited Phase 1 modifications still appear in Git status. Login/LogoutForm,
font assets/licenses, tokens, original prototypes, blueprint and Phase 1 report
were not rewritten in Phase 2.

## Architecture and authorization

`CompanyWorkspaceShell` is a Server Component rendered **inside each existing leaf
page**, rather than a new retained `[companyId]/layout.tsx`. This small phased
adaptation ensures the identity and working body follow the same page render and
existing mutation invalidation. It avoids needing broader subtree invalidation
changes to Company or capture/review actions in this phase.

Both shell and leaf call `getCompanyWorkspaceContext(companyId)`. It delegates to
the existing authenticated context and explicit owner-scoped `getCompanyById`,
then uses the existing unavailable state. React `cache` deduplicates the same
argument within the render; there is no persistent or cross-user private cache.
Each leaf still obtains its own verified context. Refine independently validates
the owned Thought and Company relationship; history/review reads and all Server
Actions retain their separate predicates and RLS. The shell never authorizes a
mutation by itself.

Company data and page bodies stay on the server. Existing composer/review islands
stay unchanged. Client additions only read pathname or enhance native disclosure
closing/focus. Params and searchParams remain awaited in the leaves; no client
promise resources or conditional React `use()` were introduced.

Saved identity/state changes were observed in the root and nested Refine detail.
Archive updated the shared badge and archive breadcrumb, removed capture and
disabled new Refine generation. After deleting a disposable Company, a fresh
visit showed the unavailable state without a stale Company header. Existing live
checks separately cover foreign parents and authenticated HTTP ownership.

## Account and management behavior

Akun is a labeled native `details`/`summary` disclosure, with native expanded
semantics and a linked panel ID. Enter/Space opens it; Tab reaches Keluar;
Escape closes and restores trigger focus. Focus leaving, outside pointer input,
pathname changes and selected navigation links close disclosures. Same-page
`#data-control` selection also closes Kelola. These are disclosures containing
normal links/forms, not incomplete ARIA menu widgets.

The original LogoutForm stays mounted as disclosure content and uses its existing
Server Action POST, pending/error feedback, session termination and auth redirect.
Opening Akun has no auth or storage side effect. The actual logout was exercised;
private navigation afterward returned to auth. Signing in again confirmed the
unsaved private draft had been cleared by existing signed-out cleanup. Native
disclosure and server-rendered forms remain available without the close enhancement.

Kelola contains links to the existing edit route and root `#data-control` region.
Archive/delete forms and required confirmations remain only in their current
locations. Their visual relocation belongs to later composition work. No Settings,
Profile, account page, new management endpoint or duplicated destructive form.

## Visible navigation and prepared infrastructure

Global: **Beranda / Perusahaan**, with a separate **Akun → Keluar** disclosure.
Mobile has the same account access in the top header and two destinations below.
Selected links have a mineral-green surface/marker, weight and `aria-current`.

The current Company root is explicitly **Ruang perusahaan**, retaining its combined
capture/history/context body. It is not labeled a finished Overview. Its Company
name is the sole h1 on root, edit and Refine detail; child tasks use h2.

`CompanySectionNavigation` is prepared but **not mounted**. Activation requires an
explicit enabled-section allowlist. The policy maps root to future Overview,
Thought list/focus to Pemikiran, refinements index and nested Thought Refine detail
to Refine; `/edit` and unrelated/prefix-collision paths select none. Nested Refine
is checked before ordinary Thought reading. Tests cover these distinctions.

No broken, disabled or decorative section links appear. No empty leaf routes were
created. The flexible scrolling link row and descriptor-based mapping can be
extended later without a fixed three-column assumption; no Referensi entry or
scaffold exists now.

## Route and functional preservation

All original eight build route entries remain. There is no redirect/compatibility
dispatcher or pathname migration. Existing `before`, `focus`, `saved`, `deleted`,
`proposal`, `resolved`, Thought/refinement/history IDs and management hash remain.

Browser capture verified the original `?saved=...#thought-...` redirect and exact
receipt clearing. A multiline synthetic input retained the existing browser form
transport behavior; no source normalization was introduced. Refine Back still
uses `?focus=...#thought-...`. Archive and Company deletion redirects remain root
and `/companies?deleted=company`. The edit Back destination remains available in
the shared breadcrumb and existing Batal control.

No edits to capture/review/auth/Company/data-control actions, draft identity or
acknowledgement, DB helpers/schema/migrations, RLS, raw immutability, cursor codec,
AI prompts/routing/gateway or budget accounting. No real AI provider request.

## Browser evidence and quality gates

[Captures and QA instructions](../design/milestone-5.5-phase-2/README.md),
[final metrics](../design/milestone-5.5-phase-2/render-metrics.json), and
[runtime evidence](../design/milestone-5.5-phase-2/runtime-summary.json).

Reused the existing development-only fixture helper with a new marked disposable
account: fictional long/missing-metadata/archived Companies and a locally injected
mock proposal. Actual edit/capture/archive/delete/logout actions touched only that
account. It was signed out and removed; eight owned-table cascades and removal of
the ignored credential file were verified.

| Check                          | Result                                                                                                                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1440 / 768 / 390 / 320 CSS px  | Home, library, root, edit, Refine detail, archived root and missing-metadata root: 28 final cases. Two additional updated/archived-detail cases: 30 total.                                       |
| Layout/navigation              | No measured page-wide overflow, duplicate h1 or exposed unfinished section link. Account/Kelola triggers are 44px high; global links have two correct destinations/states.                       |
| Content/fonts                  | Long Company identity wraps; absent ticker/sector is omitted rather than invented. Both local named font checks pass with loaded status.                                                         |
| Keyboard/controls              | Enter/Space, Tab, Escape/focus return, outside click and blur close verified. Breadcrumb and management links work. Edit Save/Batal were reachable above the mobile rail in viewport simulation. |
| Lifecycle/drafts               | Saved identity and archive status refresh; capture receipt clearing; Refine Back focus/hash; navigation restores unsaved draft; logout clears it; deleted root unavailable.                      |
| Runtime                        | Test tab recorded no warnings/errors. Next dev indicators remain enabled.                                                                                                                        |
| Typecheck/lint/format          | Passed.                                                                                                                                                                                          |
| Deterministic tests            | 68 passed, no failures/skips: existing 64 plus four navigation tests.                                                                                                                            |
| Development DB/HTTP with mocks | 49 passed, no failures/skips; auth/logout, RLS/foreign parents, immutable originals, capture/drafts, lifecycle/confirmations, Refine and budget accounting.                                      |
| Production build               | Passed; original eight route entries and Proxy retained.                                                                                                                                         |

Initial restricted Windows compilation could not resolve the workspace and
restricted fixture setup lacked network access. The same commands succeeded with
approved local process permissions. A local development preview was started because
the former server was no longer running. No billing or provider settings changed.

## Limitations and Phase 3 handoff

Viewport overrides were compensated to match DOM-reported CSS widths. Captured
image dimensions can differ because the in-app surface scales/trims them; these
are unretouched screenshots. DOM CSS zoom was 1, visual viewport scale 1 and
reported DPR approximately 0.8. None establishes native 100% browser zoom.
Native zoom, real phone keyboard/safe-area behavior, screen-reader interaction,
forced font-load failure and exhaustive hover/zoom/reduced-motion QA remain manual
checkpoints. No complete accessibility conformance claim.

The Company body, vertical Refine history, Home's archived continuation selection
and remaining copy/density debt are retained later-phase work. No original asset
or atmospheric-art decision is resolved here.

**Phase 3 requires a separate instruction.** It should add the actual Overview and
working Pemikiran route before activating their section links, retaining capture,
receipt/draft identities, immutable sources, confirmations, cursors and old deep
links. Keep the server shell/owned context and explicit per-leaf/action checks;
use the prepared navigation only for shipped destinations. Any later adoption of
a retained layout must verify subtree invalidation after mutations. Refine index,
preferred-version reading and comparison redesign remain their later phases.
Referensi and Phase 6 remain outside scope. Stop here for user review.
