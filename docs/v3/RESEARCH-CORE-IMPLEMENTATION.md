# Research Core offline milestone

This milestone connects Writing Workspace, immutable Thought revisions and optional
structured AI reasoning. It does not reopen frozen Slice 1 acceptance, activate
Cloud, execute SQL, use real credentials, call providers or change existing private
evidence. Real persistence requires the separately reviewed deployment described in
`supabase/v3-research-core/README.md`.

## User workflow

1. Open **Ruang Riset** in global navigation (`/foundation?view=research`), or
   **Buka Ruang Riset** in a Company overview. The latter filters recent drafts
   and preselects the optional Company for creation.
2. In **Penampungan**, choose **Kembangkan menjadi draf**. The owned Capture is
   copied once as a starting point; the original remains unchanged and visible as
   provenance. Reopening the same source resumes its existing draft. This owner
   mandate supersedes older roadmap wording about moving/removing a Capture.
3. Choose Kosong, Terpandu or Pendamping. All use one plain Markdown-oriented text
   editor; guidance is displayed alongside the document. There is no forced AI,
   hidden template insertion, HTML rendering or automatic rewriting. Title, body,
   mode and optional owned Company are editable. Recent drafts use bounded pages
   of twenty, ordered by updated timestamp and ID.
4. Edit, autosave after one idle second, explicitly save, reopen and continue.
   States distinguish dirty, saving, confirmed saved, uncertain and conflicting.
   A single save is in flight; newer input survives an older acknowledgment.
   Uncertain retries reuse the exact payload/operation. Conflicts expose the server
   copy and require deliberate resolution rather than silent overwrite.
5. Review the snapshot, add an optional message and **Rekam Thought**. Saving a
   draft does not commit. The first commit creates a separate stable Thought
   identity; later commits append immutable numbered versions. Unchanged content
   cannot create a duplicate conclusion. History is paged twenty at a time.
6. Open historical snapshots, choose a comparison base, and inspect a bounded
   prefix/suffix line-block diff. This is readable text comparison, not a semantic
   or minimal-edit diff. Restoring requires confirmation and changes only the
   saved Working Tree; committing the restored state is a separate action.
7. With a clean saved draft, explicitly request **Clarify**, **Challenge** or
   **Gap Check**. Current title/body are disclosed as mandatory context; Company
   metadata, original Capture and the opened historical version are opt-in.
   Results are structured, attributed to the exact source revision, and shown
   separately from authored text. Feedback can be copied explicitly and manually
   incorporated. AI never edits, commits or determines an investment decision.

In this offline milestone the actual AI runtime returns an honest disabled state.
No synthetic inference or save is substituted in production. Missing research
schema, denied documents and load failures have explicit states. Editor/history
do not depend on AI being enabled.

## Recovery and account boundaries

`WritingSession` stores a best-effort, per-tab `sessionStorage` recovery envelope
under the exact V3 project/owner/draft namespace. It contains text, revision and
pending save identity. A recovered envelope is unconfirmed and never gains server
authority. A revision mismatch requires review. Limits are ten envelopes and
1,048,576 serialized UTF-16 code units across this feature; no older buffer is
silently evicted. Storage/quota failures warn and retain in-memory text.

This is recovery, not encryption, durable disk backup or an offline-first queue.
Browser session termination/storage clearing can lose unsaved text. Copy important
text if recovery storage is unavailable. Unmount cancels autosave, stores recovery
and ignores late responses. Logout revokes active sessions before clearing buffers,
so late callbacks/unmount cannot recreate prior-account text. A new owner clears
other-owner recovery. The existing owner-keyed application tree resets component
draft/AI/history state on account changes. All server actions independently check
the authenticated owner; client owner fields are only stale-form rejection hints.

## Implementation map

- `src/features/research/contract.ts`, `session.ts`: exact text/domain validation,
  routes, guidance, bounded comparison and save/recovery state machine.
- `workspace.tsx`, `actions.ts`: draft creation, owned Company selection, editor,
  commit/history/restore, authenticated Server Actions. Existing global navigation,
  Company overview and Capture entry points connect these routes.
- `src/server/research/service.ts`: bounded owner queries, capability checks,
  strict atomic RPC inputs and read-back receipt validation. No raw table mutation
  or caller-supplied owner authority.
- `reasoning-contract.ts`, `reasoning-panel.tsx`, `reasoning-actions.ts`: three
  validated output contracts, context disclosure, safe rendering and private run
  history. Uncertain operations are not regenerated automatically.
- `src/server/research/reasoning.ts`: authorized snapshot, untrusted-data prompt
  boundary, one provider call, output/evidence validation, session recheck, private
  persistence acknowledgment and safe fixed errors. No source text/raw provider
  errors in ordinary logging.
- `reasoning-runtime.ts`: disabled-by-default dedicated V3 provider/accounting
  configuration, reusing the existing adapter. See deployment handoff for the
  privileged accounting credential and conservative budget limitations.
- `supabase/v3-research-core/`: additive core/optional AI migrations and separate
  read-only verification. No previously deployed migration is changed.
- `scripts/v3/ui-preview*`: existing synthetic UI preview extended with mocked
  research boundaries; it cannot import server persistence or provider modules.

## Verification and remaining limits

Feature tests exercise draft CRUD/CAS/replay, Capture preservation, immutable
Thought lineage, restore, recovery, late responses/logout, scoped context,
provider failures/structured outputs and the integrated manual feedback workflow.
They use a deterministic fake store and fake provider; SQL checks are static.
The existing SDK adapter is tested with an injected fake fetch, not its endpoint.
UI server rendering escapes untrusted text and the isolated preview compiles real
components with mocked actions. These do not prove live RLS, SQL function behavior,
browser hydration or paid inference.

Validation commands for this milestone:

```text
node --conditions=react-server --test src/tests/research-core.test.ts src/tests/research-reasoning.test.ts
npm test
npm run lint
npm run typecheck
npm run format:check
git diff --check
node scripts/v3/offline-build.mjs
```

Validated on 2026-10-27: 274 deterministic tests passed, zero failures/skips,
including 19 Research Core tests. Lint, typecheck, format and diff checks passed.
The network-denied offline production build passed with no Node network attempts.
It uses the established isolated copy; it does not open an execution gate and its
artifact is not deployment-ready. A synthetic browser check confirmed editor
rendering, unsaved/uncertain-save states and dirty-state commit/AI disabling; it
did not exercise actual persistence or provider inference.

Remaining work is separated:

- **Product implementation:** Markdown preview/rich text, search across drafts,
  multiple Capture attachments, deletion and collaborative editing are outside
  this minimal milestone. Core writing/version/critique paths are implemented.
- **Database deployment:** separately approve `001`, catalog/definition review,
  optional `002`, then real transaction/ownership/idempotency acceptance.
- **AI activation:** approve spending/configuration, V3-only private secrets and
  privileged accounting access, provider/model compatibility and the independent
  source activation; existing application authorization remains required.
- **Live application validation:** persisted workflow, hydration, account switching,
  recovery on real browsers, concurrent SQL writers and provider behavior remain
  unverified. Prior Slice 1 PARTIAL/CSRF/session-refresh coverage is unchanged.

No new acceptance framework or claims about production readiness are introduced.
