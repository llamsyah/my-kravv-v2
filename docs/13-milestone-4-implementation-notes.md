# Milestone 4 — AI infrastructure

The user confirmed successful application of the new migration to the configured
development Supabase project. The server infrastructure is implemented and final
repository validation passed. The single explicitly authorized real Groq smoke
test passed on 2026-10-08; see its results below. No product AI feature, public endpoint, UI change,
background agent or later milestone is implemented.

## Implementation and acceptance report

1. **Architecture.** A server-only gateway verifies identity with `getUser()`,
   validates contracts, authorizes context, resolves model configuration, bounds
   the complete request, reserves budget, records attempt start, calls a provider,
   validates output, records usage and finalizes accounting before returning a
   safe result. All executable AI modules import `server-only`. Configuration is
   lazy; missing AI configuration does not affect normal application operations.
2. **Files.** `src/server/ai/` contains configuration, contracts, registry, context,
   provider, gateway, costs, errors and synthetic internal verification.
   `src/server/db/ai-runs.ts` supplies narrow accounting closures. The migration,
   deterministic/live AI tests, fixture helper, optional `scripts/ai-smoke.ts`,
   `.env.example`, package manifests and setup documentation complete the change.
   No page, component, Company/Thought action or visual reference changed.
3. **Providers.** The official `openai` SDK uses Groq's fixed compatible endpoint
   initially; OpenAI has its own configurable path. SDK retries are disabled,
   logging is explicitly off, requests are non-streaming and bounded by timeout.
   Groq does not receive unsupported OpenAI `store` or metadata parameters;
   OpenAI requests set `store: false`. Response format and reasoning effort are
   explicit model capabilities, never inferred from a model's name.
4. **Routing.** Six canonical role identifiers have light/standard/deep routing
   metadata and optional per-role model overrides. Every product role remains
   unimplemented, and the default contract registry is empty. The synthetic
   nonce check uses `REFINE` only as an existing database role identifier; it does
   not refine a Thought or simulate a product workflow.
5. **Schema.** `20261008000400_ai_runs_and_budget_reservations.sql` adds `ai_runs`
   and at most two `ai_run_attempts` per run. Runs retain owner, optional Company,
   role, provider/model, versions, bounded reference UUIDs, lifecycle timestamps,
   token limits/usage, pricing/FX snapshots, nullable estimates and budget charge.
   Attempts preserve reported usage independently of output validity. Statuses
   follow the schema document: `PENDING`, `SUCCEEDED`, `FAILED`, `CANCELLED`.
6. **Authorization/RLS.** Both tables permit owner-only SELECT. Ordinary clients
   cannot write accounting or execute its four service-only RPCs. The gateway
   authenticates and authorizes context through the ordinary user's JWT/RLS
   client first. Only accounting uses the privileged server credential, with
   explicit owner predicates and validated return rows. These SECURITY INVOKER
   RPCs have empty search paths; PUBLIC/anonymous/authenticated execution is
   revoked. Existing Company and Thought operations keep their ordinary RLS path.
7. **Usage/cost.** Estimates use reported input/output tokens and the exact model's
   configured USD rates/IDR conversion, rounded up to four decimal places. Rates
   and FX snapshots normalize to database precision. Failed responses and repair
   calls count. Missing/partial usage or an unexpected reported model leaves cost
   NULL, retains any known tokens, warns `UNKNOWN_USAGE` and holds conservative
   funds. Cached discounts are not guessed. Estimates are not provider invoices.
8. **Budget.** A per-user transaction advisory lock serializes reservations.
   Settings are checked under a row lock; `ai_enabled`, the lower of the user
   monthly budget and server cap, and a daily attempt limit are enforced. NULL
   user budget keeps the server cap. Month/day boundaries use UTC. The complete
   permitted attempt capacity is reserved before transmission. Finalization
   releases unused capacity and confirmed excess; unknown attempts keep their
   maximum charge. Logging failures/interrupted attempts retain pending holds.
   No expiry automatically frees money while a provider may still be processing.
9. **Failures.** Allowlisted errors cover authentication, ownership, invalid input,
   inactive roles, missing credentials/model/pricing, disabled AI, budget/rate
   limits, timeout, provider failures, invalid output, unknown usage and logging
   failure. Diagnostics contain only run ID, stage and safe category. SDK bodies,
   Zod input errors and private content are never returned or printed. One repair
   is allowed only after a recorded schema failure; transport errors never retry.
10. **Privacy/context.** Minimal explicitly selected owned Company/Thought context
    is separated from externally verified evidence (empty in this milestone) and
    unverified model knowledge. User text stays in a JSON user message and cannot
    become system instructions. Optional output reference validation rejects
    invented IDs. Logs store neither private text, prompts, context nor response
    bodies; context hashing remains NULL. Original Thoughts are never modified.
    Company deletion detaches its ID while retaining spending; Thought deletion
    leaves only opaque reference UUIDs. Account deletion cascades accounting.
11. **Deterministic validation.** New tests cover configuration, routing, ownership,
    hostile input, provider-specific SDK requests, zero SDK retries, timeout aborts,
    bounded repair, output/reference validation, costs, incomplete logging, safe
    errors and inactive product roles. Static import traversal proves normal
    app/feature operations do not reach AI. All 42 deterministic tests passed,
    including 15 new AI tests. ESLint, strict TypeScript, Prettier and production
    build passed. Production audit reports zero vulnerabilities; the full audit
    retains the same five high development-only entries in the existing
    ESLint/fast-glob/micromatch/braces chain. No dependency downgrade was made.
    Exact configured secret scans found no matches in 121 repository files or
    20 production browser assets; `.env.local` is untracked. `git diff --check`
    passed. Next route generation required execution outside the Windows sandbox
    because the sandbox denied workspace canonicalization; the rerun passed.
12. **Live database verification.** The applied development schema passed lifecycle,
    owner/foreign/anonymous RLS, restricted writes/RPCs, concurrent budget contention,
    duplicate starts/receipts, partial usage, daily/zero budget, disabled AI and
    Company-deletion accounting checks. Of three concurrent reservations fitting
    only one remaining allocation, exactly one won. Live tests inject a mocked
    provider and remove their disposable accounts; cleanup verifies all six private
    tables. All 39 full live checks passed (9 AI and 30 existing auth, Company,
    Thought and data-control checks), including actual HTTP forms/actions. No
    existing research was modified. Earlier SQL preparation
    also passed 21 local PostgreSQL checks; temporary PGlite under ignored `.next/`
    is not a project dependency.
13. **Real calls.** Exactly one authorized real Groq smoke request succeeded;
    provider-reported usage was 450 input / 49 output tokens. No OpenAI calls,
    retries or repairs occurred. Actual billed cost remains unverified.
    Deterministic and live database verification consume no provider quota.
    The separately gated smoke
    script permits one synthetic Groq request, at most 128 output tokens, no repair
    and no automatic repeat. It reports usage, estimates and possible quota
    consumption separately; it cannot verify provider billing. It reports a pass
    only when both usage totals and estimated cost match the finalized database
    receipt. Unknown usage or inconsistent accounting fails smoke verification
    without repeating the call; this rule has deterministic regression coverage.
14. **Dependencies.** One runtime dependency was added: `openai@7.30.0`, pinned with
    the lockfile. No tokenizer, vector store, UI kit or provider framework was added.
    Existing Next/React versions remain unchanged.
15. **Environment.** Groq needs `AI_PROVIDER=groq`, `GROQ_API_KEY`, `GROQ_MODEL`,
    `AI_MODEL_CONFIG_JSON`, `AI_USD_TO_IDR` and existing Supabase configuration.
    OpenAI alternatively needs its own key/model and matching pricing/capability
    entry. Optional controls and role overrides are documented in
    `src/server/ai/README.md` and `.env.example`. `.env.local` was not changed;
    credentials were not printed. Missing OpenAI credentials do not block Groq.
16. **Setup/limits.** Pricing/capabilities and USD/IDR conversion are now configured
    and validated for the synthetic smoke request; see the preflight below.
    Missing or invalid configuration still fails safely before transmission. Separate explicit user
    authorization was granted for this single completed smoke test only; any
    further provider call requires new authorization. Conservative
    input bounds assume byte-based tokenization plus framing allowance; other
    model tokenizers need a reviewed bound/adapter. Future role schemas need
    provider-compatible review. Holds after ambiguous network/accounting failures
    require operator reconciliation; there is no automatic reaper. This verifies
    infrastructure, not reasoning quality. The existing Milestone 3.5 missing
    landscape/visual-sign-off limit is unchanged.
17. **Next phase.** `docs/11-implementation-plan.md` specifies Phase 5 — Refine
    Slice. It has not started. No Refine, Structure, Guide, Challenge, Compare or
    Reflect behavior, research, embeddings, background work or Settings UI exists.

## Final smoke preflight — 2026-10-08

The local configuration validates through `getAIConfig` with the same base model
selection used by the smoke script. The server-side key is available; its value
was not printed. The configured provider is Groq, model `openai/gpt-oss-20b`,
strict JSON schema, low reasoning effort. This preflight preceded the separately
authorized single request reported below.

- Configured input cap reserved: 8192 tokens (the whole cap, not guessed usage).
- Smoke output cap: 128 tokens, overriding the model entry's 512-token ceiling.
- Maximum requests: one; SDK retries zero; schema repair disabled.
- Prices: USD 0.075 input / USD 0.30 output per million tokens, verified against
  [Groq's model page](https://console.groq.com/docs/model/openai/gpt-oss-20b).
- Pricing version: `groq-verified-2026-10-08`.
- FX: 17880 IDR per USD, supplied by the user and verified as the midpoint of
  USD sell 17969.40 / buy 17790.60 on the
  [Bank Indonesia transaction-rate page](https://www.bi.go.id/id/statistik/informasi-kurs/transaksi-bi/Default.aspx),
  updated 8 October 2026. This is a planning conversion, not provider billing FX.
- Server monthly cap: 25000 IDR; daily attempt cap: 20; timeout: 15000 ms.
  User settings and transactional budget checks remain mandatory.

Maximum configured estimate before rounding:
`((8192 × 0.075 + 128 × 0.30) / 1000000) × 17880 = 11.672064 IDR`.
The existing fixed-decimal cost function rounds upward to 0.0001 IDR, matching
the SQL reservation formula: **11.6721 IDR** for one attempt (USD 0.0006528).
This is the amount that must be reserved before transmission; known actual usage
can release confirmed excess afterward. Unknown usage retains a conservative hold.
No cached-input discount, free-tier assumption or budget bypass is used.

The request remains a short synthetic nonce with no Company/Thought context.
Real-provider access, usage and compatibility were subsequently verified by the
single authorized call below. No application code or credentials changed during
preflight; only this report was updated. No commit, push or Phase 5 work occurred.

## Final authorized Groq smoke result — 2026-10-08

The user confirmed the Groq account is on the Free Plan and explicitly authorized
exactly one request under the preflight limits. The available console previously
required sign-in, so Free Plan status rests on the user's confirmation rather
than independent console inspection. Actual provider-billed cost is **unknown**;
no invoice or usage billing record was independently available. Do not infer a
zero charge from a successful response or from internal estimated token prices.

A fresh server process parsed the current `.env.local` directly, overriding any
inherited environment values. The selected key and the actual outbound
Authorization header both matched that file in memory; only boolean match
results were emitted. No key value, fingerprint or previous credential was
printed or used. Configuration was checked again against the authorized model,
8192 input cap, 128 output cap, 15000 ms timeout and 11.6721 IDR reservation.

- Provider/model: Groq / `openai/gpt-oss-20b`.
- Actual provider HTTP requests: **one**, HTTP 200, finish reason `stop`.
- SDK retries: zero; repairs: zero; no subsequent provider request.
- Synthetic nonce input only; no Company, Thought, identity or external evidence
  entered the provider request. Output matched the strict Zod/JSON contract.
- Provider-reported tokens: **450 input, 49 output**.
- Estimated equivalent cost: **USD 0.00004845** from the published USD 0.075
  input / USD 0.30 output per million tokens.
- FX snapshot: 17880 IDR/USD; unrounded estimate 0.866286 IDR, rounded up to
  **0.8663 IDR** by database accounting.
- Run ID: `9d181ebd-e408-42c7-80d1-bba5562e06c6`.
- Persisted run moved from `PENDING` to **`SUCCEEDED`**, with `ESTIMATED`
  accounting; its one attempt was `COMPLETED`, usage `REPORTED`, no error code.
- Persisted initial reservation: **11.6721 IDR**. Final budget charge:
  **0.8663 IDR**. Unused reservation released: **10.8058 IDR**.
- An ordinary owner read independently confirmed finalized usage, status and
  cost. The existing smoke script then removed its disposable Supabase account
  and verified cascade cleanup of settings/runs/attempts; this run does not
  remain in the database after cleanup. Only the minimal result metadata here
  remains in the repository.
- No observed API compatibility issue: Groq accepted strict JSON schema,
  `reasoning_effort=low`, non-streaming output and `max_completion_tokens=128`.
  This proves this connectivity/contract path, not future role reasoning quality.
- SDK logging remained disabled. Console output was checked for configured
  secret values before emission; no credentials or prompt/response bodies were
  logged. No private user context was retrieved for the request.
- No application code change was necessary. Additional credential/request and
  RPC metadata verification ran in the one-shot execution process only. This
  report is the only repository file updated for the final result.

Milestone 4 infrastructure and the complete authenticated gateway → Groq → run
persistence → budget-settlement path are verified. The one-request authorization
is consumed. No paid plan, billing setting, public endpoint, product AI role,
commit, push or Phase 5 implementation was introduced. Provider quota was used;
actual billing remains independently unverified.

## Documentation alignment and source decisions

The actual foundation remains `docs/MY_KRAVV_Product_Foundation_v0.1.md`; the brief's
`docs/01-product-foundation.md` does not exist. Original approved documents remain
unchanged. The current brief replaces the older architecture's OpenAI-first choice
with Groq first. Schema statuses follow the approved schema. The illustrative
successful-run-only spending query is extended to cover failures, unknown usage
and concurrent reservations as this task requires.

The composite Company FK uses `ON DELETE SET NULL (company_id)` so deletion cannot
null the mandatory owner or erase spend. This requires PostgreSQL 15+. The schema
permits server-only privileged operations after independent ownership checks;
accounting uses that exception so owners cannot fabricate or erase charges.
The migration was prepared first, implementation paused for manual application,
and live verification began only after the user's confirmation. It was not replayed.

Provider behavior was checked against
[Groq compatibility](https://console.groq.com/docs/openai),
[GPT OSS 20B capabilities](https://console.groq.com/docs/model/openai/gpt-oss-20b),
[Groq structured outputs](https://console.groq.com/docs/structured-outputs) and
[the official OpenAI SDK](https://github.com/openai/openai-node).
Column-specific FK nulling follows
[PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html).
