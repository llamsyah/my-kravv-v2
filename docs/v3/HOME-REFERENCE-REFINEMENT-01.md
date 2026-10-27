# Home reference refinement 01

Baseline: `b98fb1f7680388e0a5cc4bc6020638903a7cb9dc`. Primary reference inspected:
`design/v3/references/01-home.png`; Directory/Company Overview references inspected
only for shared navigation and workspace relationships.

Home restores the reference's compact Beranda/Perusahaan navigation, wide welcome
hero, inline Quick Capture composer, Continue Research / Recent Captures / Needs
Review row, and four compact Company cards. Responsive layout stacks the same
sections; the existing light/dark tokens remain authoritative. The navbar search
honestly searches Companies, not unavailable cross-account notes/topics.

The composer is the existing Capture component in a Home presentation, using the
same action, raw-text validation, idempotency, owned Company picker and stale-owner
checks. Confirmed saves stay on Home, update Recent Captures from the verified
action result and refresh server data. Uncertain saves retain exact text, selected
Company and request identity; no automatic retry or optimistic success is added.
The dedicated Capture route, paging and Capture-to-draft links remain valid.

The authenticated Home route loads page zero through existing owner-scoped draft
and Capture services, regardless of unrelated paging/filter parameters. Each
module handles unavailable schema, load failure and empty data independently.
The latest draft shows its actual title, Company, update time and working revision,
then opens the existing Writing Workspace. An empty research area links directly
to draft creation. Companies and writing do not require a Capture or AI first.

Needs Review is intentionally unavailable: AI run status is execution state, not a
durable pending-review/applied-feedback concept. No review counts, recommendations,
example securities, company logos or Thought/reference totals are fabricated.

## Reference limitations

The approved screenshot exists, but its exact landscape/window/plant decorative
image is not a standalone project asset. The hero preserves its proportions with
a restrained temporary CSS landscape/window treatment. No reference screenshot is
rendered as the interface, no replacement image is generated, and no archived V2
asset is presented as the approved original. The existing application brand mark
is retained. A separately supplied decorative original can replace the temporary
treatment without changing the Home composition.

## Validation

Existing deterministic patterns cover section composition, escaped owned data,
independent entry points, meaningful empty/error states, Capture save confirmation
without navigation, exact-key uncertain retries and account-state isolation. The
existing offline HTTP adapter additionally checks Home's real route and services
across two synthetic accounts, with no external requests.

Synthetic browser review at 1440×1000 and 390×844 checks reference composition,
light/dark appearance, Company selection, retained text after a simulated failure,
independent draft creation and error states. The checked mobile layout has no
horizontal overflow; the checked pages report no browser errors/warnings. Preview
data and server actions are mocked; this is not persisted Cloud/browser acceptance.

Screenshots are disposable ignored output under `.qa/home-reference-01/`:
`desktop-light.png`, `desktop-dark.png`, `mobile-light.png`, `mobile-dark.png` and
`capture-uncertain.png`. Recreate the preview with `npm run v3:ui:preview` on
127.0.0.1:3104; it is separate from the guarded Next application and never grants
Cloud access. An already-running preview must be restarted by its owner to rebuild
its static bundle after source changes.

Validation uses `npm test`, `npm run lint`, `npm run typecheck`,
`npm run format:check`, `git diff --check` and
`node scripts/v3/offline-build.mjs` (network denied, isolated artifact).
Results: 275 tests passed with zero failures/skips; lint, typecheck, formatting,
diff checks and the network-denied production build passed. The Capture/Home
offline HTTP walkthrough passed 199 assertions over 57 loopback requests with
zero external requests. No mocked result is presented as live persistence.
No migrations, backend mutation semantics, RLS, credential handling, execution
interlocks, AI contracts or previous private evidence change. No Cloud/provider
calls occur. The two earlier uncommitted Research Core handoff files are preserved
outside this focused Home checkpoint.
