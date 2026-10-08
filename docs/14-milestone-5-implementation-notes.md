# Milestone 5 — AI Refine Slice

Implementation date: 2026-10-08. Milestones 0–4 were committed before this work.
This milestone adds Refine only; no commit or push is performed.

Real Refine evaluation preflight (2026-10-08): the trusted server factory accepts
`maxAttempts: 1` to restrict an evaluation to one initial attempt and no format
repair. It cannot increase the contract's allowance, is not a client input, and
leaves the normal product default unchanged. The existing reservation and attempt
accounting use that same ceiling. Mock regression coverage checks both valid and
invalid output through the complete Refine service, one receipt, no repair,
original preservation, and a reservation of IDR 13.7319 for 8,192 input / 512
output tokens. Pricing is USD 0.075 input / 0.30 output per million tokens,
with configured USD/IDR 17,880 (user-supplied Bank Indonesia midpoint reference,
2026-10-08). The unrounded equivalent ceiling is USD 0.000768 / IDR 13.73184;
the budget rounds upward to four decimals. This is internal estimated accounting,
not an independently verified provider bill. This preflight was followed by the
separately authorized single evaluation documented below; its authorization is
consumed and cannot be reused.

Real Refine Test 1 (2026-10-08) succeeded through the production Refine service,
including authenticated owned-source reads, durable claim, structured output
validation, AI Run settlement, and proposal persistence. Groq
`openai/gpt-oss-20b` reported 1,124 input and 102 output tokens. Run
`01320b71-5eb5-494e-9519-eb24c6d26a4a` and claim were SUCCEEDED; the proposal was
SUGGESTED, not accepted. Exactly one request/attempt occurred, with zero retries
and zero repairs. Equivalent cost was USD 0.0001149, rounded upward to IDR 2.0545;
IDR 11.6774 of the IDR 13.7319 reservation was released. Actual billed cost remains
unverified. Original bytes were unchanged. All disposable identity/Company/Thought,
proposal, claim and Run records were removed after verification. Accounting and
diagnostics contained no source text or credentials; the development log contained
neither evaluation text nor secrets.

Original (exact):

> menurutku ekspansi perusahaan ini menarik sih, tapi agak terlalu cepet. aku belum lihat apakah cash flow mereka cukup kuat buat dukung ekspansi itu. mungkin aku perlu cek laporan keuangannya dulu sebelum punya kesimpulan.

Generated refinement (exact):

> Ekspansi perusahaan ini menarik, tapi agak terlalu cepat. Aku belum yakin cash flow mereka cukup kuat mendukungnya. Mungkin perlu cek laporan keuangan dulu sebelum bersimpulan.

The output preserved interest, pace concern, cash-flow uncertainty and the need
to inspect statements, without invented metrics/facts or buy/sell advice. However,
"aku belum lihat apakah" became "Aku belum yakin": evidence not yet examined was
changed into insufficient confidence. It also reduced the first-person framing
and conversational register. Infrastructure success is therefore separate from
complete semantic fidelity.

Post-evaluation improvement: the existing v1 prompt now expressly preserves the
reason behind beliefs/uncertainty, distinguishes unexamined evidence, doubt,
missing information and lack of verification, retains meaningful first-person
agency, and avoids unnecessary formalization of conversational Indonesian.
Instructions express general principles, with no branch or hardcoded correction
for Test 1. Output schema, contract identity, model/configuration, RLS and budget
rules are unchanged. Initial and repair requests still fit the existing input
guard at the 2,000-byte source ceiling. Deterministic tests check that both outbound
prompts carry these requirements and that distinct synthetic epistemic states
retain exact source and proposal text through the service. These mocked responses
do not prove real-model fidelity; no second real request was authorized or made.
Normal Refine still reserves up to two attempts and permits one format repair;
only a trusted factory's explicit `maxAttempts: 1` lowers that ceiling, and client
attempt overrides are rejected. Normal successful-repair regression coverage
verifies both receipts and settlement. No additional migration is required.

1. **Features.** An existing saved Thought has a contextual “Tinjau & rapikan
   pemikiran” link. Its review view has an explicit “Rapikan dengan AI” action,
   separate original/proposal text, acceptance with optional user edits, rejection,
   keep-original navigation, and paginated historical versions. Merely opening,
   capturing, reading, or navigating never generates AI output.

2. **Files.** New implementation files are
   `src/domain/refinement/refinement.ts`, `src/server/ai/prompts/refine-v1.ts`,
   `src/server/db/refinements.ts`, `src/server/refinements/service.ts`,
   `src/features/refinements/actions.ts`, `src/features/refinements/refine-forms.tsx`,
   and `src/app/(private)/companies/[companyId]/thoughts/[thoughtId]/refine/page.tsx`.
   Existing gateway/contracts/registry/context, AI accounting error mapping,
   Thought lookup/history, and scoped workspace CSS were extended. Tests:
   `src/tests/refinements.test.ts`, `src/tests/helpers/refine-fixture.ts`,
   `src/tests/live/refinements.test.ts`, and the existing AI registry/import tests.
   README and the internal AI boundary README were updated. No dependency,
   environment, applied historical migration, original product document, or visual
   reference was replaced.

3. **Database.** Additive migration:
   `supabase/migrations/20261008000500_refinements_and_request_identity.sql`.
   The user confirmed applying it once in the configured development project;
   subsequent live checks verified the tables and RPCs. Local PostgreSQL validation
   applied all six migrations and exercised claims, RLS/grants, provenance,
   idempotent resolution, Unicode-blank rejection, original preservation, archive,
   and cascade cleanup. Temporary validator dependencies stayed in the ignored
   build folder and were not added to the application dependency graph.

4. **Contract.** Server-registered `refine-v1` / `refine-schema-v1` implements
   only REFINE. Strict output follows document 10:
   `schema_version: "1"`, `role: "REFINE"`, `status: "OK"`,
   `data: { refined_text, preserved_uncertainty: true, meaning_changed: false }`,
   `warnings`. Text is nonblank, NUL-free, at most 3,000 JS characters; warnings are
   at most three strings of 160 characters each. Extra structures, incorrect
   preservation flags, malformed JSON, and invalid envelopes fail validation.
   The prompt preserves questions, ambiguity, emotion, uncertainty, mixed language
   and strength of conviction; it forbids invented facts, metrics, sources,
   confidence, recommendations, research and investment decisions.

5. **Original preservation.** `raw_content` remains immutable under the existing
   database permissions. Refine never updates it or Company metadata/state.
   Authoritative source reads use the verified user JWT, RLS, explicit owner,
   Company, and Thought filters. Client input consists only of validated IDs;
   replacement source text, role, ownership and instructions are rejected. Source
   bytes and line breaks are not trimmed or normalized. The initial source ceiling
   is 2,000 UTF-8 bytes; larger originals remain fully readable and are refused
   rather than silently truncated. Both complete initial/repair requests are also
   bounded by the gateway's existing conservative input guard.

6. **Persistence/lifecycle.** Documented domain/schema/implementation-plan rules
   require generated proposals to be persisted as SUGGESTED before review. This
   takes precedence over reading the brief's “save” wording as save-on-accept only.
   Each proposal keeps immutable `ai_content`, optional `user_final_content`,
   Thought/Company/owner references, AI Run, prompt/schema versions, provider/model,
   warnings and timestamps. Accept/edit creates a user decision; reject retains
   the rejected artifact. Keep-original navigation leaves a proposal undecided.
   A newly accepted version atomically marks a previous acceptance SUPERSEDED,
   retaining its text and decision time, and inserts one acceptance timeline event.
   The conceptual USER_EDITED_AI provenance is represented by separate
   `user_final_content`, following the canonical schema rather than adding a second
   conflicting source-type column. No thesis or belief is adopted automatically.

7. **UI.** The focused review route stays within Company Workspace and prioritizes
   one original on mobile. It reuses ink/navy surfaces, mineral green accents,
   editorial hierarchy, whitespace, quiet contextual links and progressive
   disclosure. Original, read-only AI proposal, and accepted user edits have
   distinct labels. Twenty historical versions are shown per stable keyset page.
   Home and Companies were not redesigned. The original reference landscape asset
   and typography fidelity debt remain; gradients/system fonts are unchanged.
   The brief's mobile workspace filename differs from the actual
   `mobile/02-company-workspace.png`; the existing files were used without renaming.

8. **Auth/RLS.** Every action verifies authentication; the service verifies it
   again and checks both source parents. Owner reads remain ordinary RLS queries.
   Authenticated users cannot directly INSERT/UPDATE/DELETE either new table.
   Claim/review RPCs derive `auth.uid()`, not a caller-supplied owner.
   A narrow server-only writer can complete a claim only with the matching owned,
   successful REFINE Run and exact source/version provenance. Anonymous/foreign
   access, mutation and service-only RPC access were tested. Thought/Company/user
   cascades remove artifacts and associated timeline events; Company deletion
   retains owner accounting with a null Company reference.

9. **Gateway/budget.** No second provider client or budget subsystem was added.
   A durable operation UUID is claimed before the existing gateway reserves money,
   and is reused as its trusted Run ID. Replaying a completed operation reads its
   previous result; replaying a pending or failed operation never re-sends it.
   Only one pending claim per owned Thought is possible, including simultaneous
   distinct operation IDs. A Refine-specific trigger on the existing attempt-start
   path requires the claim and rechecks accessible/active source parents before
   transmission. Ordinary SDK transport retries remain zero; only malformed output
   permits one accounted format repair. Timeout/rate-limit/transport failures do
   not repair. An archived Company blocks NEW generation; saved proposals may
   still be read and explicitly reviewed. No long database transaction spans the
   provider request. Deletion after transmission can prevent proposal persistence,
   but cannot erase incurred accounting or create orphan artifacts.

10. **Failures.** Pending controls disable repeated submission. Invalid IDs,
    oversized source, unavailable/foreign/deleted parents, archive, budget, disabled
    AI, provider rate limit/timeout, malformed output and unexpected persistence
    failures produce safe feedback. A failed attempt leaves original and earlier
    proposals intact. Uncertain accounting/persistence keeps the durable claim
    pending; it is never automatically expired or re-sent. This deliberately needs
    operator reconciliation after an interrupted process. Status-recovery controls
    perform an explicit browser reload so stale action state/router caches cannot masquerade as
    refreshed status. Client-side errors never imply successful empty output.

11. **Deterministic checks.** 64 tests pass, including 22 Refine cases. They
    cover authorized explicit execution, cross-user/parent rejection, immutable
    source, prompt/minimum context, strict output flags and shape, mixed-language
    fixture handling, 2,000-byte initial/repair input boundaries, bounded repair,
    budgets, disabled AI, provider failures, unknown usage, duplicate concurrency,
    lifecycle/history, persistence failure and accounting failure. Fixtures test
    plumbing and policy; they do not establish real-model semantic faithfulness.
    TypeScript, lint and formatting pass. Production build passes with the new
    private dynamic review route.

12. **Live checks.** All 49 development Supabase/HTTP checks pass; ten are the
    Refine test group and its nine scenarios. Provider responses are injected mocks.
    Tests verify applied migration, settled Run usage and released unused budget,
    RLS/grants, concurrent durable claims, idempotent acceptance timeline, rejected
    and superseded history, real authenticated review GET/accept Server Action,
    archive/source-attempt gate, deletion cascades and retained accounting.
    Disposable identities and descendant fixture records were removed and checked.

13. **Visual/runtime QA.** Desktop and mobile review/edit/accept/failure paths were
    inspected in the in-app browser at measured 1,440×900 and 390×844 CSS viewports;
    no horizontal overflow, CSS zoom 1 and visual-viewport scale 1. The browser
    reports devicePixelRatio 0.8, so native browser 100% zoom could not be independently
    confirmed through the available controls; normal desktop-browser zoom remains
    on the manual checklist. Default fieldset/textarea styling was corrected after
    visual inspection. Edited acceptance, preserved previous versions, disabled-AI
    feedback, and explicit browser-reload status recovery were checked. Same-URL
    navigation retained stale form state, which the reload control fixes without
    regeneration. No React `use()` or hydration error was observed; dev indicators
    remain enabled. Fast Refresh emitted its ordinary full-reload notice during
    code edits. Captures
    contain only synthetic fixture content. Automated success is separate from
    original-reference pixel fidelity, which is not claimed.

14. **Real calls.** Exactly one separately authorized real Groq REFINE request in
    Milestone 5, documented above. No calls were made during the subsequent prompt
    improvement. The consumed Milestone 4 authorization was not reused. No test adapter or unrestricted AI
    endpoint was introduced into the application. Browser QA used a disposable
    account with AI disabled after mocked proposal creation.

15. **Cost.** Mocked usage/cost receipts are synthetic test accounting, not provider
    billing. No actual billed cost is independently asserted. Current server
    configuration: Groq `openai/gpt-oss-20b`, input 8,192/output up to 512, timeout
    15 seconds, USD 0.075 input / 0.30 output per million tokens, pricing version
    `groq-verified-2026-10-08`, USD/IDR 17,880 (user's Bank Indonesia October 8
    reference), monthly cap IDR 25,000. Rates/FX are explicit configuration, not
    invented defaults. Equivalent maximum per-attempt cost is USD 0.000768;
    conservative reservation rounds each attempt to IDR 13.7319 and reserves two
    attempts: IDR 27.4638. This is an internal reservation ceiling, not a payment
    or an assertion that Free Tier is unlimited. Missing/unknown usage retains only
    the conservative hold for started uncertain attempts; unstarted repair capacity
    is released under existing accounting rules.

16. **Limitations.** Initial source/output limits, one format repair, manual
    reconciliation of interrupted PENDING claims, no automatic factual/semantic
    verification. One real-model evaluation exposed the epistemic substitution
    documented above; the improved prompt has not been tested against a real model.
    The strict schema can reject
    a model's admitted meaning change, but cannot detect a false preservation claim.
    Users must compare the proposal with the original. Existing visual asset/font
    debt remains. Production dependency audit reports zero vulnerabilities; full
    development audit retains the five known high findings in the existing ESLint
    glob/micromatch/braces chain. The suggested audit downgrade is incompatible and
    was not applied. No runtime dependency was added for Milestone 5.
    Privacy scan checked both configured private keys against 133 repository files,
    20 production browser assets and the development log: zero secret matches,
    zero browser private-environment identifiers, and zero fixture prompt markers
    in logs. `git diff --check` passes. Temporary QA login files were removed.

17. **Manual QA checklist.** At normal browser zoom, locate a saved original,
    open Refine without a provider call, compare exact text/line breaks, inspect
    clear AI labels, edit and accept, reload and inspect history/provenance, reject
    another proposal, keep raw only, verify archive read/review behavior, check
    disabled/budget/rate-limit/error recovery, and verify keyboard focus/mobile
    controls. Real successful generation or provider semantic evaluation requires
    fresh explicit authorization before triggering it. Never click generation
    during unapproved QA of a real user's account.

18. **Readiness.** Milestone 5 implementation, mock/live-database verification and
    one authorized real-provider evaluation are complete. The semantic-fidelity
    improvement is covered by deterministic prompt/service regressions, with no
    further provider request. Any future evaluation requires fresh authorization.
    Real-model faithfulness and native 100%-zoom manual sign-off remain unclaimed.
    Structure, Guide, Challenge, Compare, Reflect and every later milestone remain
    inactive. No commit/push or deployment is performed.
