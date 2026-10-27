# Research Core deployment handoff

Offline artifacts only. Nothing in this package has been executed against Cloud.
The existing application Cloud interlock, all acceptance-runner pins, and the new
Research AI execution switch remain closed. Deployment does not authorize execution.

## Target and order

Only the dedicated V3 project `kjcvgjfwlmyfroiqlbmw`, with the existing marker
`disposable-v3-slice0-cloud`, schema version `1`, is supported. Existing Company
Management and Capture contract version `1` are prerequisites. Never use V2.

After separate owner approval, an owner can:

1. Check the dashboard project reference and review the complete SQL and hashes.
2. Execute `001-research-core.sql` **once**, as one transaction.
3. Execute `verify-core.sql` separately. Inspect the consolidated result, including
   every constraint, index, trigger and function definition against `001`.
4. Optionally, after a separate AI-storage review, execute `002-reasoning.sql`
   **once**, then `verify-reasoning.sql`; inspect all reported definitions.
5. Stop on any SQL error, unexpected pre-existing object, marker mismatch, missing
   prerequisite, changed privilege, or verification mismatch. Do not rerun, repair,
   roll back, drop objects or clean up data automatically.

Both migrations are non-idempotent. Transactions prevent a partial successful
deployment on a SQL error; an interrupted editor session still requires inspection
before another operation. Verification files contain read-only catalog assertions
and a SELECT, with no repair or fixture writes. Their PASS is **catalog-only**;
definition review and real transaction/RLS acceptance remain required.

## Persistence and privilege contract

- `research_drafts`: editable owner-scoped document, optional owned Company,
  optional original Capture, revision counter and timestamps. Source Capture is
  unchanged. One source Capture opens the same draft rather than making copies.
- `research_thoughts`: separate stable identity, created by the first explicit
  commit; one Thought lineage per draft in this milestone.
- `research_versions`: immutable title/body/Company snapshots, ordered version
  number, source draft revision, optional message and timestamp. Restore changes
  only the Working Tree. No update/delete API for history or Thought identity.
- `v3_internal.research_operations`: private transaction receipts. Per-owner
  advisory locking serializes short mutations; payload hashes reject conflicting
  reuse; effects and receipts commit together. Save/restore require the expected
  draft revision; commit additionally requires the expected latest version.
- Authenticated users have owner-only SELECT policies, no raw table writes.
  Four narrow, authenticated, server-owner-derived RPCs perform mutations.
  Definer functions have empty search paths and explicit ownership checks.
  Composite Company/Thought foreign keys, Capture-owner validation and RESTRICT
  references prevent foreign associations or silent cascades.
- Body limits: 100,000 PostgreSQL characters and 262,144 UTF-8 bytes. The app's
  100,000 UTF-16-code-unit check can be stricter for supplementary Unicode. It
  rejects malformed Unicode/NUL and preserves the submitted string. Empty drafts
  are allowed; blank Thought commits are rejected. Mode is editor guidance, not
  part of an immutable research conclusion.

Existing Companies, Captures, themes, Auth configuration, deployed RPC definitions
and previous acceptance evidence are not altered. New RESTRICT references can
block future deletion of a referenced Company, Capture or Auth user; deletion is
outside this milestone. No cleanup or reverse migration is provided.

## Optional AI storage and future activation

`002` adds `research_ai_runs`, owner-only reads of snapshot/provenance/result/status,
and **service-role-only** reservation/completion RPCs. Ordinary sessions cannot
forge results, spend through those RPCs or release cost holds. Accounting does not
write authored documents. Source text and AI output are private database content;
they are intentionally not ordinary logs or a public analytics stream.

The server runtime reuses the existing OpenAI/Groq adapter, fixed official endpoints,
strict structured JSON, zero SDK retries, bounded input/output and a 15-second
timeout. Three distinct contracts implement CLARIFY, CHALLENGE and GAP_CHECK.
No external sources are verified. GAP_CHECK evidence excerpts must exist verbatim
in the selected context; this does not establish that a claim is true.

`approvedResearchAIExecution` stays **false** in source, before any provider or
accounting credential lookup. Existing Cloud application authorization also remains
necessary. No env variable, selected writing mode or populated configuration opens
these boundaries. No real provider call has been tested or authorized.

Future owner-reviewed activation would need dedicated, server-only V3 configuration:

- `MY_KRAVV_V3_RESEARCH_AI_PROVIDER` (`openai` or `groq`), `..._AI_KEY`,
  `..._AI_MODEL`, `..._AI_MODELS_JSON`, `..._AI_USD_TO_IDR`.
- `MY_KRAVV_V3_RESEARCH_AI_MONTHLY_LIMIT_IDR` (default zero),
  `..._AI_DAILY_LIMIT` (default ten, database maximum twenty).
- `MY_KRAVV_V3_RESEARCH_ACCOUNTING_KEY`: a dedicated V3 `sb_secret_` key,
  never a generic repository/V2 secret. This is a privileged project credential;
  introducing it and opening the provider switch require separate owner security
  and spending approval. Never place it in browser configuration or Git.

The model/pricing JSON uses the existing `src/server/ai/config.ts` schema. Models
must support its byte-based input bound and structured-output format. Configuration
and credentials alone do not authorize calls. Per-owner UTC database-month/day
limits serialize reservations. The entire configured worst-case price stays held
for completed, failed, timed-out or uncertain attempts; it is a conservative cap,
**not reported usage or actual billing**. There are no automatic refunds, retries,
repair generations, claim reapers or background jobs. Provider account limits and
the sum of per-user budgets also need owner review before activation.

## Separately authorized live acceptance

No new live runner is introduced. A later bounded acceptance must verify, using
ordinary synthetic user sessions: exact round trips, Capture provenance, foreign
association denial, CAS conflicts under actual concurrent PostgreSQL transactions,
same-key replay, immutable ordered commits, restore without history changes, and
two-account browser/cache/recovery isolation. Provider activation, quota races,
timeouts, persisted private AI results and actual billing need separate approval.
Do not infer any of these from deterministic fake-store tests or catalog PASS.
