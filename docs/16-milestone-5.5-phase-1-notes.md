# MY KRAVV — Milestone 5.5, Phase 1 implementation

Date: 2026-10-08. **Phase 1 foundations implemented; awaiting user review.**
The user's Phase 1 brief separately authorizes this implementation after the
design-only record in [the approved blueprint](15-milestone-5.5-ux-blueprint.md).
No later phase is implemented or authorized here.

## Baseline and inspection

Baseline HEAD: `ea7a7adca1d404dd75a86186a690bf97b9cd0a50`. Before editing,
tracked files were clean. Existing untracked `design/` and
`docs/15-milestone-5.5-ux-blueprint.md` were preserved. No reset, discard, stage,
commit or push was performed. The blueprint and original prototype files remain
unchanged in this phase; new QA captures occupy a separate directory.

Read the latest blueprint including its final approved revisions, the 2,022-line
global stylesheet, AppShell, navigation, authentication/Company/Thought/Refine and
destructive forms, existing dependencies and development/mock test conventions.
Inspected the desktop/mobile prototype boards, prototype CSS and original
Home/Company desktop/mobile visual references. Read installed Next.js 16.4
font, CSS and Server/Client boundary guidance before editing. No new dependency.

## Files and migration

| Files                                                                                                  | Concrete change                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/styles/tokens.css`                                                                                | Approved semantic colors, typography/spacing/radius/width/target/motion tokens; compatibility aliases for remaining feature CSS.                                                                    |
| `src/styles/typography.css`                                                                            | Editorial h1 versus sans-serif sections, readable Thought text, wrapping, tabular timestamps and 16px inputs.                                                                                       |
| `src/styles/controls.css`                                                                              | Shared native control variants, focus/selected/disabled/busy/error treatments, fields, badges and disclosures.                                                                                      |
| `src/app/globals.css`                                                                                  | Imports the foundations; removes superseded foundation and shell rules while retaining feature compositions. Removes shrinking metadata overrides; fixes the existing tablet edit control's sizing. |
| `src/components/app-shell.module.css`, `app-shell.tsx`                                                 | Scoped canvas/header/width/brand/footer/skip-link/navigation styling; retains the same shell, landmarks, destinations, sign-out placement and mobile rail.                                          |
| `src/app/layout.tsx`, `src/styles/fonts/*`                                                             | Two local, licensed font assets through `next/font/local`; original license notices and provenance README.                                                                                          |
| `src/components/ui/button.tsx`, `status-badge.tsx`, `icon.tsx`                                         | Three lightweight presentational primitives, compatible with Server Components and existing client islands.                                                                                         |
| `src/features/auth/login-form.tsx`, `logout-form.tsx`, `src/features/companies/private-navigation.tsx` | Native Button/consistent SVG integration; existing actions, labels, pending states and active-route logic preserved.                                                                                |
| `src/app/(private)/companies/page.tsx`                                                                 | Representative StatusBadge and contextual SVG integration only; no query, route, copy, filtering or management behavior change.                                                                     |
| `.prettierignore`                                                                                      | Two precise upstream license exclusions preserve the verbatim production and preexisting prototype notice; no source/test formatting exemption.                                                     |
| `scripts/phase-1-visual-fixture.ts`                                                                    | Development-only disposable fixture setup/population/cleanup, with an injected mock response and identity guard. No production route or test endpoint.                                              |
| `design/milestone-5.5-phase-1/*`                                                                       | Actual browser captures, final render metrics, image-dimension manifest and QA instructions.                                                                                                        |

The CSS migration removes 106 superseded foundation rules rather than adding an
override appendix. Global CSS now retains 1,436 lines of feature
layouts and compatibility styling; later compositions remain separate work.
Foundation control styles replace their corresponding legacy declarations.
Shell styles no longer compete with repeated global shell/media overrides.
CSS Modules are used for shell ownership; no cascade-layer/framework replacement.

## Tokens, typography and shared primitives

Canvas `#0b141c`; working `#14222b`; interactive `#1b2d37`; contextual `#101d25`;
selected `#233c35`. Mineral green `#9fc6b5`, reading text `#e9edeb`, supporting
text `#a8b8c4`, meaningful control outline `#607d86`, separate rose error and warm
warning roles. Primary controls have a solid accent and dark label; important
secondary links have a visible bounded surface. Tertiary and destructive controls
remain distinct. Focus is a 2px accent outline with 3px offset; navigation combines
fill, weight, marker and existing `aria-current`. Disabled controls retain readable
labels and boundaries; caller-owned pending text and `aria-busy` remain intact.

Source Serif 4 Regular 400 is limited to display headings and the existing K mark.
Inter handles sections, controls, inputs and reading. Main display 44/32px,
Company title 36/28px, section baseline 22/20px, full Thought 17/16px at 1.75,
inputs 16px, controls 15px, ordinary metadata at least 13px, badges/eyebrows 12px.
Existing compact identity headings remain appropriate to lists. Reading is capped
at 68ch; shell 1280px with 48/24/16px gutters. Tokens use rem for text/spacing;
44px targets and short color transitions respect reduced motion.

`Button` forwards native attributes and defaults to `type="button"`; existing
authentication submits explicitly pass `type="submit"`. Fieldset disabling is
unchanged. `StatusBadge` is a span with caller-supplied text/tone; it computes no
domain status. `Icon` supplies one local, rounded 1.75-stroke SVG vocabulary,
20px default / 16px supporting / 28px large. Icons are decorative beside labels
or existing accessible control names. No Lucide package or other icon dependency
was needed. No new client hook, state manager, behavior abstraction or generic
polymorphic control was introduced. Unused Surface/EmptyState/IconButton wrappers
were not added merely for a future API.

## Font status and evidence

Both fonts were already available in the approved isolated prototypes. Unmodified
copies and their SIL OFL 1.1 notices now belong to the application, independent of
`design/`. The installed Next.js fontkit decoded Inter Variable (normal, wght
100–900, opsz 14–32) and static Source Serif 4 Regular. Both contain the glyphs
in the Indonesian verification text. Next.js compiled the local assets successfully;
swap and automatic metric-adjusted/system fallbacks are enabled. No remote runtime
font service is used.

The real app's observed asset inventory includes both generated same-origin WOFF2
files. Computed heading/body families resolve to Next.js's `sourceSerif` / `inter`;
the browser reports `document.fonts.status = loaded` and both named-face checks
pass in all 26 final cases. Heading/reading screenshots were visually inspected.
This is stronger evidence than CSS family declarations alone. Independent
per-glyph inspection in a browser Fonts panel and deliberate network-failure
fallback/200% text-zoom testing remain manual follow-ups; no such pass is claimed.

## Visible integration and runtime QA

The actual Next.js application now shows clearer green primary actions, bounded
secondary entrances, readable navigation icons and selected destinations,
consistent fields/errors/disclosures, larger metadata and distinct serif display
versus sans-serif task/reading text. The Company library supplies a small real
example of the badge/icon primitives. Continuous lists remain lists; feature
responsibilities and layouts have not been rebuilt to match the prototypes.

The existing development server at `http://localhost:3000` was reused. A disposable
owned development account was inspected empty, then populated with three fictional
Companies, a long Company identity, multiline Indonesian/mixed-language Thoughts,
an unbroken long word, an archived Company and a saved locally mocked proposal.
Only fixture-owned records were touched. The mock uses the existing Refine Gateway,
validation/persistence/accounting dependencies with injected synthetic config; it
does not contact Groq/OpenAI. Its prices are test fixtures, not production prices.
The account was signed out and deleted; all owned records and accounting cascades
were verified absent, and the ignored credential file was removed.

[Screenshot evidence and instructions](../design/milestone-5.5-phase-1/README.md),
[render metrics](../design/milestone-5.5-phase-1/render-metrics.json),
and [actual image dimensions](../design/milestone-5.5-phase-1/capture-manifest.json).

| Verification                                                                                                                        | Result                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home, Companies, current combined Company workspace, Refine detail, Company create, authentication at 1440 / 768 / 390 / 320 CSS px | 24 final cases, plus archive at 390 and long-source Refine at 320. No page-wide document overflow; all measured visible native buttons/navigation/disclosures ≥44px high; all measured form text ≥16px.                                                         |
| Empty states                                                                                                                        | Empty Home and library inspected/captured before fixture population; normal empty form/auth screens captured.                                                                                                                                                   |
| Long text                                                                                                                           | Long Company title wraps; exact multiline original and the unbroken word remain readable without overflow. Existing source-limit generation button is disabled with its explanation.                                                                            |
| Validation and keyboard                                                                                                             | Whitespace Company name rejected by the unchanged Server Action; input retained, rose invalid border and feedback visible. Tab focus is outlined; Enter expands native disclosure. Refine edit remains 16px, keyboard reaches acceptance without submitting it. |
| Disabled / pending                                                                                                                  | Empty-draft discard and source-limit generation stay disabled. Initial login showed disabled pending fields and existing busy wording. Existing live suites verify pending/lifecycle behavior with mocks.                                                       |
| Runtime                                                                                                                             | No warning/error entries in the test tab after navigation/editing. No nested link/button containers observed in the inspected form.                                                                                                                             |
| Browser limitations                                                                                                                 | CSS zoom 1 and measured CSS widths confirmed. Native 100% browser zoom, DPR, actual phone keyboard, screen-reader interaction and forced fallback/text-zoom tests not independently verified.                                                                   |

Browser QA caught and fixed three concrete regressions during migration: the
search button could shrink and split `Cari`; a tablet edit link could shrink while
its label overflowed beside the long Company title; the context disclosure lost
its 44px minimum. Final captures/metrics replace those failing intermediate cases.
No warning was hidden and Next.js development indicators remain enabled.

Captured image dimensions differ from CSS viewports because the in-app capture
surface scales/trims output. Requested viewport overrides were adjusted until
DOM-reported widths matched the specified targets. This does not establish native
zoom or a device-pixel ratio. Full-page captures can position the fixed mobile rail
within the exported sheet; they are not proof of keyboard/rail behavior on a phone.
Images are actual unretouched captures, not prototype or application-layout edits
made for export.

## Functional preservation and quality gates

No changes to Server Actions, database/schema/migrations, auth/RLS, Supabase or AI
configuration, owned lookups, raw content, draft keys/operation IDs/receipts,
redirects/deep links/cursors, archive/delete confirmations, Refine prompts/gateway,
provider routing or budget policy. No real AI request. No new application route,
Overview, Pemikiran split, Refine index, projection query, Company-local navigation,
account relocation, Referensi surface or Phase 6 behavior.

| Gate                                                         | Result                                                                                                                                                                                    |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ESLint, Next route type generation + TypeScript, formatting  | Passed. Upstream license notices preserved verbatim via two specific exclusions.                                                                                                          |
| Existing deterministic suite                                 | 64 passed; zero failures/skips. No assertions weakened.                                                                                                                                   |
| Development database/HTTP suite with injected mock providers | 49 passed; zero failures/skips. Includes auth/session refresh/logout, RLS/foreign parents, original immutability, drafts/capture identity, archive/deletion, Refine lifecycle/accounting. |
| Next.js production build                                     | Passed; original eight route entries retained. Local fonts compile without remote downloads.                                                                                              |
| Final source review                                          | Only Phase 1 styling/presentational integration, QA assets/helper and notes; existing blueprint/prototypes retained. No commit/push.                                                      |

Initial restricted-sandbox compilation could not canonicalize the Windows workspace;
the same required checks succeeded with the approved local process permission.
A sandbox preview bind also failed; the existing server was reused without stopping
or replacing it. These were environment restrictions, not application failures.

New primitives are presentational attribute forwarding, without nontrivial new
behavior. Existing behavior tests and actual browser checks were used instead of
tests that merely mirror their markup. The disposable fixture script retains a
repeatable long-name/long-text/mock-proposal QA setup; screenshots and metrics are
evidence, not a substitute for future interaction regression tests.

## Remaining debt and Phase 2 boundary

Phase 1 is ready for review; this does not complete the whole Milestone 5.5 visual
acceptance matrix. Native zoom/phone keyboard/screen-reader/text zoom/forced font
fallback remain explicit checkpoints. Hover/pressed/reduced-motion styling exists;
an exhaustive pointer/state/device audit remains for later accessibility QA.
The final atmospheric artwork is still an independent design decision; no reference
screenshot or new landscape asset was used as an application background.

Retained feature CSS still contains composition-specific sizes/surfaces and cascade
debt. Repeated page copy, the combined workspace and vertical Refine stack await
their approved later phases. Existing Home continuation can select a recent archived
Company; its active-only selection rule is deferred to the Home/data phase rather
than changing queries or product behavior here. Preferred accepted wording and the
selective version-evolution motif also remain future presentation work.

**Phase 2 requires a separate instruction.** Its navigation/Company shell work
must preserve authentication, current links, sign-out POST/draft cleanup and owned
lookups. New section links cannot ship before their working leaf routes exist.
Referensi remains future link-only scope with no tab, placeholder, scaffold or
fetching/AI integration. Phase 6 has not begun. Stop after this Phase 1 review.
