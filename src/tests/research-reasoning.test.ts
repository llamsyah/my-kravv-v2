import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import {
  createResearchReasoner,
  authorizedResearchSnapshot,
  researchAIHistory,
  researchProviderRequest,
  type ResearchAccounting,
} from "../server/research/reasoning.ts";
import { getResearchRuntime } from "../server/research/reasoning-runtime.ts";
import {
  reasoningOutput,
  type ReasoningRequest,
  type ResearchAIRun,
} from "../features/research/reasoning-contract.ts";
import { createAIProvider } from "../server/ai/provider.ts";
import type { AIConfig } from "../server/ai/config.ts";
import type { AIProvider, ProviderResult } from "../server/ai/contracts.ts";
import { AIError } from "../server/ai/errors.ts";
import { mutateResearch } from "../server/research/service.ts";
import { researchFixture, A, B, uuid } from "./helpers/research-fixture.ts";
const config: AIConfig = {
  provider: "openai",
  model: "synthetic-model",
  format: "json_schema",
  apiKey: "offline-key-not-real",
  inputTokenLimit: 32768,
  outputTokenLimit: 2048,
  inputUsdPerMillion: 1,
  outputUsdPerMillion: 2,
  pricingVersion: "synthetic-v1",
  usdToIdr: 15000,
  monthlyLimitIdr: 100000,
  dailyCallLimit: 10,
  timeoutMs: 100,
};
const output = (mode: ReasoningRequest["mode"]) =>
  mode === "CLARIFY"
    ? {
        mode,
        summary: "Makna argumen",
        claim: "Hipotesis",
        reasoning: ["Penalaran suplai"],
        ambiguities: ["Definisi biaya"],
        assumptions: [],
        questions: ["Bukti apa yang belum ada?"],
      }
    : mode === "CHALLENGE"
      ? {
          mode,
          summary: "Uji penjelasan alternatif",
          counterarguments: [
            {
              argument: "Margin dapat bersifat sementara",
              relevance: "Menguji keberlanjutan premis",
              evidence_to_seek: "Bandingkan periode berikutnya",
            },
          ],
          alternatives: [],
          questions: [],
        }
      : {
          mode,
          summary: "Celah bukti",
          supported_claims: [
            { claim: "Pertanyaan disebutkan", evidence_excerpt: "Pertanyaan" },
          ],
          unsupported_claims: ["Hubungan sebab akibat"],
          missing_information: [],
          assumptions: [],
          uncertainties: ["Belum diverifikasi eksternal"],
          questions: [],
        };
async function setup() {
  const f = researchFixture();
  const created = await mutateResearch(
    f.client,
    {
      kind: "create",
      operation: uuid(90),
      title: "Pertanyaan",
      mode: "assisted",
      company_id: uuid(1),
      capture_id: uuid(3),
    },
    A,
  );
  const d = created.draft!;
  let calls = 0,
    next = 300;
  const quotes = new Map<string, number>();
  const accounting: ResearchAccounting = {
    async reserve({ owner, request, config, snapshot, quote }) {
      const old = f.runs.find(
        (r) => r.user_id === owner && r.operation_id === request.operation,
      );
      if (old) {
        if (
          old.mode !== request.mode ||
          old.source_revision !== request.revision
        )
          throw new AIError("INVALID_REQUEST");
        return { id: old.id, execute: false };
      }
      if (
        [...quotes.values()].reduce((a, b) => a + b, 0) + quote >
        config.monthlyLimitIdr
      )
        throw new AIError("BUDGET_EXHAUSTED");
      const run: ResearchAIRun = {
        id: uuid(next++),
        user_id: owner,
        draft_id: d.id,
        operation_id: request.operation,
        source_revision: request.revision,
        mode: request.mode,
        status: "reserved",
        provider: config.provider,
        model: config.model,
        prompt_version: "research-v1",
        snapshot: structuredClone(snapshot),
        output: null,
        error_code: null,
        created_at: f.stamp(),
      };
      f.runs.push(run);
      quotes.set(run.id, quote);
      return { id: run.id, execute: true };
    },
    async finish(owner, id, status, value, error) {
      const run = f.runs.find(
        (r) => r.id === id && r.user_id === owner && r.status === "reserved",
      );
      if (!run) throw Error("private failure");
      run.status = status;
      run.output = value as ResearchAIRun["output"];
      run.error_code = error;
    },
  };
  const request: ReasoningRequest = {
    operation: uuid(100),
    draftId: d.id,
    revision: 1,
    mode: "CLARIFY",
    includeCompany: false,
    includeCapture: false,
    versionId: null,
  };
  const provider = (mode: ReasoningRequest["mode"]): AIProvider => ({
    async generate() {
      calls++;
      return {
        validEnvelope: true,
        content: JSON.stringify(output(mode)),
        model: config.model,
        requestId: null,
        usage: { inputTokens: 10, outputTokens: 20 },
      };
    },
  });
  const reason = (mode = request.mode, override?: AIProvider, cfg = config) =>
    createResearchReasoner({
      configuration: () => cfg,
      accounting: () => accounting,
      provider: () => override ?? provider(mode),
    });
  return {
    f,
    d,
    accounting,
    request,
    reason,
    quotes,
    get calls() {
      return calls;
    },
  };
}
test("Three reasoning contracts have distinct bounded sections and reject malformed/mismatched output", () => {
  for (const mode of ["CLARIFY", "CHALLENGE", "GAP_CHECK"] as const) {
    assert.ok(reasoningOutput.safeParse(output(mode)).success);
    assert.equal(
      reasoningOutput.safeParse({ ...output(mode), invented: "unexpected" })
        .success,
      false,
    );
  }
  assert.equal(
    reasoningOutput.safeParse({ mode: "CLARIFY", summary: "text only" })
      .success,
    false,
  );
  assert.throws(
    () => getResearchRuntime(),
    (e) => e instanceof AIError && e.code === "AI_DISABLED",
  );
});
test("Context contains only the owned current snapshot and explicitly selected sources, never unrelated archive data", async () => {
  const s = await setup(),
    r = s.request;
  let snapshot = await authorizedResearchSnapshot(s.f.client, r, A);
  assert.equal(snapshot.capture, null);
  assert.equal(snapshot.company, null);
  assert.equal(snapshot.version, null);
  snapshot = await authorizedResearchSnapshot(
    s.f.client,
    { ...r, includeCapture: true, includeCompany: true },
    A,
  );
  assert.equal(snapshot.capture, s.f.captures[0].raw_text);
  assert.equal(snapshot.company?.name, "Synthetic A");
  const prompt = researchProviderRequest(r, snapshot);
  assert.match(prompt.messages[0].content, /untrusted source DATA/);
  assert.doesNotMatch(prompt.messages[1].content, /Synthetic B|20000000-/);
  s.f.setActor(B);
  await assert.rejects(() => authorizedResearchSnapshot(s.f.client, r, A));
  await assert.rejects(() => authorizedResearchSnapshot(s.f.client, r, B));
  assert.equal(s.calls, 0);
});
test("Capture → draft → Thought → AI → manual edit → Thought leaves original and historical content unchanged", async () => {
  const s = await setup(),
    original = structuredClone(s.f.captures[0]);
  const first = await mutateResearch(
    s.f.client,
    {
      kind: "commit",
      operation: uuid(91),
      id: s.d.id,
      expected: 1,
      latest: 0,
      message: "Premis awal",
    },
    A,
  );
  const before = structuredClone(s.f.drafts[0]);
  const result = await s.reason()(
    s.f.client,
    { ...s.request, includeCapture: true, versionId: first.version!.id },
    A,
  );
  assert.equal(result.ok, true);
  assert.deepEqual(s.f.drafts[0], before);
  assert.deepEqual(s.f.captures[0], original);
  const updated = await mutateResearch(
    s.f.client,
    {
      kind: "save",
      operation: uuid(92),
      id: s.d.id,
      expected: 1,
      fields: {
        title: s.d.title,
        body: s.d.body + "\nInterpretasi saya diperbarui.",
        mode: s.d.mode,
        company_id: s.d.company_id,
      },
    },
    A,
  );
  const second = await mutateResearch(
    s.f.client,
    {
      kind: "commit",
      operation: uuid(93),
      id: s.d.id,
      expected: updated.draft!.revision,
      latest: 1,
      message: "Tanggapan pengguna",
    },
    A,
  );
  assert.equal(second.version?.number, 2);
  assert.equal(s.f.versions[0].body, before.body);
  assert.equal(s.f.runs[0].source_revision, 1);
  assert.equal((await researchAIHistory(s.f.client, s.d.id)).length, 1);
  assert.equal(s.quotes.size, 1);
});
test("Same operation across concurrent UI calls cannot trigger duplicate provider generation", async () => {
  const s = await setup();
  const run = s.reason();
  const results = await Promise.all([
    run(s.f.client, s.request, A),
    run(s.f.client, s.request, A),
  ]);
  assert.ok(results.some((r) => r.ok));
  assert.equal(s.calls, 1);
  assert.equal(s.f.runs.length, 1);
  const again = await run(s.f.client, s.request, A);
  assert.equal(again.ok, true);
  assert.equal(s.calls, 1);
});
test("Known provider failures, malformed output and invented GAP evidence never become valid analysis", async () => {
  for (const mode of [
    "timeout",
    "rate",
    "json",
    "shape",
    "evidence",
    "usage",
  ]) {
    const s = await setup();
    let attempts = 0;
    const request = {
      ...s.request,
      mode: mode === "evidence" ? ("GAP_CHECK" as const) : ("CLARIFY" as const),
    };
    const provider: AIProvider = {
      async generate() {
        attempts++;
        if (mode === "timeout")
          return await new Promise<ProviderResult>(() => {});
        if (mode === "rate") throw new AIError("PROVIDER_RATE_LIMIT");
        return {
          validEnvelope: true,
          model: config.model,
          requestId: null,
          usage: {
            inputTokens: mode === "usage" ? null : 10,
            outputTokens: 20,
          },
          content:
            mode === "json"
              ? "PRIVATE INVALID JSON"
              : JSON.stringify(
                  mode === "shape"
                    ? { mode: "CLARIFY", summary: "missing fields" }
                    : mode === "evidence"
                      ? {
                          ...output("GAP_CHECK"),
                          supported_claims: [
                            {
                              claim: "fake",
                              evidence_excerpt: "not in supplied context",
                            },
                          ],
                        }
                      : output("CLARIFY"),
                ),
        };
      },
    };
    const result = await s.reason(request.mode, provider, {
      ...config,
      timeoutMs: 10,
    })(s.f.client, request, A);
    assert.equal(result.ok, false);
    assert.equal(attempts, 1);
    assert.equal(s.f.runs[0].output, null);
    assert.ok(s.quotes.size === 1);
    assert.ok(!JSON.stringify(result).includes("PRIVATE"));
  }
});
test("Missing configuration, source revision drift, budget denial and session changes prevent unintended provider work", async () => {
  const s = await setup();
  let calls = 0;
  const disabled = createResearchReasoner({
    configuration: () => {
      throw new AIError("API_KEY_MISSING");
    },
    accounting: () => s.accounting,
    provider: () => {
      calls++;
      throw Error();
    },
  });
  const no = await disabled(s.f.client, s.request, A);
  assert.equal(no.ok, false);
  assert.equal(calls, 0);
  assert.equal(s.f.runs.length, 0);
  assert.equal(
    (await s.reason()(s.f.client, { ...s.request, revision: 2 }, A)).ok,
    false,
  );
  assert.equal(s.calls, 0);
  assert.equal(
    (
      await s.reason("CLARIFY", undefined, { ...config, monthlyLimitIdr: 0 })(
        s.f.client,
        s.request,
        A,
      )
    ).ok,
    false,
  );
  assert.equal(s.calls, 0);
  const staleProvider: AIProvider = {
    async generate() {
      s.f.setActor(B);
      return {
        validEnvelope: true,
        content: JSON.stringify(output("CLARIFY")),
        model: config.model,
        requestId: null,
        usage: { inputTokens: 10, outputTokens: 20 },
      };
    },
  };
  const changed = await s.reason("CLARIFY", staleProvider)(
    s.f.client,
    s.request,
    A,
  );
  assert.equal(changed.ok, false);
  assert.equal(s.f.runs[0].status, "reserved");
  assert.equal(s.f.runs[0].output, null);
});
test("Existing fixed-endpoint provider adapter sends structured reasoning through a fake transport with no retries", async () => {
  let calls = 0;
  const s = await setup(),
    request = researchProviderRequest(s.request, {
      title: s.d.title,
      body: s.d.body,
      company: null,
      capture: null,
      version: null,
    });
  const provider = createAIProvider(config, async (url, init) => {
    calls++;
    assert.ok(String(url).startsWith("https://api.openai.com/v1/"));
    const body = JSON.parse(String(init?.body));
    assert.equal(body.response_format.type, "json_schema");
    assert.equal(body.store, false);
    assert.equal(body.stream, false);
    return new Response(
      JSON.stringify({
        object: "chat.completion",
        id: "offline",
        model: config.model,
        choices: [
          {
            index: 0,
            finish_reason: "stop",
            message: {
              role: "assistant",
              content: JSON.stringify(output("CLARIFY")),
            },
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  });
  const r = await provider.generate(request, new AbortController().signal);
  assert.equal(calls, 1);
  assert.equal(r.validEnvelope, true);
});
test("AI accounting SQL is service-only, owner-scoped, budget-serialized and cannot mutate authored content", () => {
  const sql = fs.readFileSync(
    "supabase/v3-research-core/002-reasoning.sql",
    "utf8",
  );
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /total\+p_quote>p_monthly_limit/);
  assert.match(sql, /to service_role/);
  assert.match(sql, /from public,anon,authenticated/);
  assert.doesNotMatch(
    sql,
    /update public.research_drafts|insert into public.research_versions|on delete cascade/i,
  );
  const runtime = fs.readFileSync(
    "src/server/research/reasoning-runtime.ts",
    "utf8",
  );
  assert.match(runtime, /approvedResearchAIExecution: boolean = false/);
  assert.doesNotMatch(
    runtime,
    /e\.OPENAI_API_KEY|e\.GROQ_API_KEY|e\.SUPABASE_SERVICE_ROLE_KEY/,
  );
});
