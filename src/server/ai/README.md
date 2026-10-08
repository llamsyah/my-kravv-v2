# Internal AI boundary

Milestone 4 supplies infrastructure only. No product contracts are registered and
no page, feature action, startup hook or capture invokes AI. Missing configuration
cannot stop ordinary authentication, Company or Thought operations.

Future approved features call `runAIRequest(userClient, request)` with a server
request-scoped ordinary Supabase client. Requests identify a registered contract,
role, validated task input, optional owned Company/Thought IDs and language.
Owners, models, prompts, prices and schemas come from trusted server code only.
The gateway independently calls `getUser()` and authorizes selected context.
Register each future role's Zod input/output, versioned instructions, context
permission, output cap and optional reference validator at its milestone.

`createAIGateway` exposes server-only dependency injection for deterministic tests.
`runInfrastructureCheck` uses a synthetic nonce contract with no stored research;
it is callable only from explicit internal verification. Its REFINE identifier is
solely the database enum value, not an implementation of Refine.

## Configuration

Keep these in the private server environment; never use `NEXT_PUBLIC_` prefixes:

- `AI_PROVIDER`: `groq` (default) or `openai`.
- Groq: `GROQ_API_KEY`, `GROQ_MODEL`. OpenAI: `OPENAI_API_KEY`, `OPENAI_MODEL`.
  Only the selected provider's key is required.
- `AI_ROLE_REFINE_MODEL`, `AI_ROLE_STRUCTURE_MODEL`, `AI_ROLE_GUIDE_MODEL`,
  `AI_ROLE_CHALLENGE_MODEL`, `AI_ROLE_COMPARE_MODEL`, `AI_ROLE_REFLECT_MODEL`:
  optional overrides; blank values use the provider's base model.
- `AI_MODEL_CONFIG_JSON`: JSON array of exact provider/model capability and
  pricing entries. At most 20 entries; duplicates are rejected. Each entry needs
  `provider`, `model`, `format` (`json_schema`, `json_object` or `text_json`),
  `inputTokenLimit` (2048–32768), `outputTokenLimit` (1–4096),
  `inputUsdPerMillion`, `outputUsdPerMillion`, and `pricingVersion`.
  Optional `reasoningEffort` must be supported by the selected model/provider.
- `AI_USD_TO_IDR`: chosen positive conversion; no exchange rate is invented.
- `AI_MONTHLY_COST_LIMIT_IDR`: server cap, default 25000. A zero cap blocks calls.
- `AI_DAILY_CALL_LIMIT`: attempt cap per user per UTC date, default 20.
- `AI_TIMEOUT_MS`: provider deadline, default 15000, maximum 30000.
- Existing Supabase URL/publishable key for user-context RLS, and
  `SUPABASE_SECRET_KEY` for narrowly scoped server accounting only.

For `groq` / `openai/gpt-oss-20b`, Groq's documentation checked on 2026-10-08
lists strict JSON schema, low/medium/high reasoning effort, USD 0.075 input and
USD 0.30 output per million tokens. These are documentation observations, not
code defaults; verify current capabilities, availability and rates before use.
An entry for that documented model could be:

```json
[
  {
    "provider": "groq",
    "model": "openai/gpt-oss-20b",
    "format": "json_schema",
    "reasoningEffort": "low",
    "inputTokenLimit": 8192,
    "outputTokenLimit": 512,
    "inputUsdPerMillion": 0.075,
    "outputUsdPerMillion": 0.3,
    "pricingVersion": "groq-verified-2026-10-08"
  }
]
```

Store the compact array as `AI_MODEL_CONFIG_JSON` in `.env.local` and independently
choose `AI_USD_TO_IDR`. This documentation does not modify your environment.
Missing rates/FX or mismatched model entries cause `PRICING_UNAVAILABLE` before
reservation/transmission. Never treat a provider free tier as unlimited or price
unknown calls at zero. OpenAI needs its own verified entry rather than Groq rates.

## Provider and accounting rules

The official OpenAI SDK targets fixed Groq/OpenAI hosts with zero automatic
retries, non-streaming responses, disabled SDK logging and an abortable deadline.
Groq receives no unsupported `store` or metadata parameters. OpenAI uses
`store: false`; this flag is not a claim about every provider retention policy.
No tools, browsing, external actions or public proxy are exposed.

The complete serialized request, including schema and context, must fit an input
byte bound plus 1024 bytes of framing allowance. This conservatively assumes
byte-based tokenization; other models need a reviewed adapter/bound. The budget
reserves the entire configured input/output token cap for every allowed attempt,
not a guessed character-to-token usage count. Both initial and repair inputs are
bounded before reservation. Output envelopes and JSON are independently checked;
invalid output never becomes a successful result.

`reserve_ai_run` serializes per-user budget checks and reserves up to two attempts.
`start_ai_run_attempt` commits before transmission and rejects duplicate starts.
Only schema failure can cause one repair, after the failed receipt is committed.
Transport failures never retry. Usage is parsed separately from output validity.
`record_ai_run_attempt` stores bounded metadata and reported usage;
`finish_ai_run` sums known estimates and retains maximum holds for unknown calls.
These four service-only RPCs expose no content query or generic privileged write.

Known cost uses the exact model's stored rates/FX, rounded up to 0.0001 IDR.
Missing/partial usage or a different provider-reported model makes estimated cost
NULL and retains reported tokens and conservative charge. Failed calls count.
No invoice verification is claimed. Interrupted start/record/finalization retains
funds. Operators must reconcile ambiguous holds with actual provider evidence;
never release them merely because a timer elapsed. No automated reconciliation,
queue or expiry mechanism is implemented.

Context separates selected owned user memory, verified external evidence (empty)
and unverified model knowledge. User text remains untrusted JSON user content.
Diagnostics expose only run ID, stage and safe category. Accounting stores no
raw Thoughts, assembled prompts, response bodies, credentials or private hashes.
Normal content operations remain on the user's JWT/RLS client.

## Verification

`npm run check` uses mocked providers and an SDK mock fetch; no quota is consumed.
Development-only `npm run test:live` checks real Supabase accounting/RLS with mock
provider output and removes disposable accounts. It needs the applied AI migration
but no AI credential, price configuration or provider network access.

`npm run test:ai-smoke` is optional and must never be placed in CI or normal tests.
Run it only after separate explicit human authorization for one real Groq request.
It requires complete Groq pricing/FX configuration, the applied migration,
`MY_KRAVV_LIVE_TESTS=development`, `MY_KRAVV_AI_SMOKE=authorized-once`, and the
CLI argument `--confirm-one-groq-request`. Those flags are technical guards, not
a substitute for human authorization. It sends only a synthetic nonce, permits
at most 128 output tokens, disables repair/retries, prints safe usage/accounting
metadata, and removes its disposable account. Do not automatically repeat a
failed/ambiguous request. A pass requires known usage and estimated cost matching
the finalized database receipt; unknown usage fails this verification. Quota may
be consumed even after timeout or invalid
output; the script cannot verify actual billed cost or future reasoning quality.

Sources:
[Groq compatibility](https://console.groq.com/docs/openai),
[configured Groq model](https://console.groq.com/docs/model/openai/gpt-oss-20b),
[structured output](https://console.groq.com/docs/structured-outputs),
[OpenAI SDK controls](https://github.com/openai/openai-node).
