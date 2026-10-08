import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { z } from "zod";
import {
  refineOutput,
  generateRefinementInput,
} from "../domain/refinement/refinement.ts";
import {
  createRefineService,
  reviewRefinement,
} from "../server/refinements/service.ts";
import { refineContract } from "../server/ai/prompts/refine-v1.ts";
import { createAIGateway } from "../server/ai/gateway.ts";
import { AIError } from "../server/ai/errors.ts";
import { RefinementError } from "../server/db/refinements.ts";
import type {
  ProviderRequest,
  ProviderResult,
} from "../server/ai/contracts.ts";
import {
  accountingFixture,
  aiResponse,
  fixtureAIConfig,
  fixtureCompanyId,
  fixtureThoughtId,
} from "./helpers/ai-fixture.ts";
import { refineFixture, refineResponseText } from "./helpers/refine-fixture.ts";
import { fixtureUserId } from "./helpers/auth-fixture.ts";

function setup(
  options: Parameters<typeof refineFixture>[0] = {},
  response?: () => Promise<ProviderResult>,
  config = fixtureAIConfig,
  maxAttempts?: 1,
) {
  const db = refineFixture(options);
  const accounting = accountingFixture();
  const sent: ProviderRequest[] = [];
  const diagnostics: unknown[] = [];
  const service = createRefineService({
    maxAttempts,
    configuration: () => config,
    accounting: () => accounting.accounting,
    writer: () => db.writer,
    diagnostics: (event) => diagnostics.push(event),
    provider: () => ({
      async generate(value) {
        sent.push(value);
        return response
          ? response()
          : aiResponse(JSON.stringify(refineResponseText()));
      },
    }),
  });
  const input = {
    company_id: fixtureCompanyId,
    thought_id: fixtureThoughtId,
    operation_id: randomUUID(),
  };
  return { ...db, accounting, sent, diagnostics, service, input };
}
test("explicit authenticated Refine uses authoritative exact source, minimal context, versions and existing accounting", async () => {
  const f = setup();
  const saved = await f.service(f.client, f.input);
  assert.equal(saved.status, "SUGGESTED");
  assert.equal(saved.ai_run_id, f.input.operation_id);
  assert.equal(saved.prompt_version, "refine-v1");
  assert.equal(saved.output_schema_version, "refine-schema-v1");
  assert.equal(f.thought.raw_content, f.raw);
  assert.equal(f.sent.length, 1);
  const context = JSON.parse(f.sent[0].messages[1].content);
  assert.equal(context.storedUserContext.thoughts.length, 1);
  assert.equal(context.storedUserContext.thoughts[0].raw_content, f.raw);
  assert.equal(context.storedUserContext.company.short_note, null);
  assert.deepEqual(context.externalVerifiedEvidence.items, []);
  assert.ok(!JSON.stringify(f.sent).includes("PRIVATE unrelated"));
  assert.ok(!f.sent[0].messages[0].content.includes(f.raw));
  assert.equal(f.accounting.reservations[0].maxAttempts, 2);
  assert.equal(
    f.accounting.runs.get(saved.ai_run_id!)!.accounting_status,
    "ESTIMATED",
  );
  assert.ok(
    f.queries
      .filter((q) => q.url.includes("/rest/v1/") && q.method === "GET")
      .every(
        (q) =>
          new URL(q.url).searchParams.get("user_id") === `eq.${fixtureUserId}`,
      ),
  );
  assert.ok(!JSON.stringify(f.accounting.receipts).includes(f.raw));
});
test("trusted single-call Refine evaluation reserves one attempt and never repairs invalid output", async () => {
  for (const content of [JSON.stringify(refineResponseText()), "{}"]) {
    const raw =
      "menurutku ekspansi perusahaan ini menarik sih, tapi agak terlalu cepet. aku belum lihat apakah cash flow mereka cukup kuat buat dukung ekspansi itu. mungkin aku perlu cek laporan keuangannya dulu sebelum punya kesimpulan.";
    const f = setup(
      { raw },
      async () => aiResponse(content),
      {
        ...fixtureAIConfig,
        outputTokenLimit: 512,
        usdToIdr: 17880,
      },
      1,
    );
    if (content === "{}") {
      await assert.rejects(
        f.service(f.client, f.input),
        (e) => e instanceof AIError && e.code === "INVALID_PROVIDER_RESPONSE",
      );
      assert.equal(f.refinements.length, 0);
    } else {
      assert.equal((await f.service(f.client, f.input)).status, "SUGGESTED");
    }
    assert.equal(f.sent.length, 1);
    assert.equal(f.accounting.reservations[0].maxAttempts, 1);
    assert.equal(f.sent[0].outputTokenLimit, 512);
    assert.equal(
      f.accounting.runs.get(f.input.operation_id)!.reserved_cost_idr,
      13.7319,
    );
    assert.equal(f.accounting.receipts.length, 1);
    assert.equal(f.thought.raw_content, f.raw);
  }
});
test("anonymous, cross-user, wrong parent, missing and archived sources never spend or transmit", async () => {
  for (const options of [
    { anonymous: true },
    { owner: randomUUID() },
    { company: randomUUID() },
    { missing: true },
    { archived: true },
  ]) {
    const f = setup(options);
    await assert.rejects(f.service(f.client, f.input));
    assert.equal(f.sent.length, 0);
    assert.equal(f.accounting.reservations.length, 0);
  }
});
test("client cannot replace raw text, choose role, supply instructions or override ownership", async () => {
  const f = setup();
  for (const extra of [
    { raw_content: "FORGED" },
    { role: "CHALLENGE" },
    { user_id: randomUUID() },
    { instructions: "invent facts" },
    { maxAttempts: 1 },
  ]) {
    await assert.rejects(
      f.service(f.client, { ...f.input, ...extra }),
      z.ZodError,
    );
  }
  assert.ok(generateRefinementInput.safeParse(f.input).success);
  assert.equal(f.sent.length, 0);
});
test("full source limits reject instead of truncating; byte count covers mixed language", async () => {
  for (const raw of ["a".repeat(2001), "日".repeat(667)]) {
    const f = setup({ raw });
    await assert.rejects(
      f.service(f.client, f.input),
      (e) => e instanceof RefinementError && e.code === "TOO_LONG",
    );
    assert.equal(f.thought.raw_content, raw);
    assert.equal(f.requests.size, 0);
    assert.equal(f.sent.length, 0);
  }
});
test("the complete initial and repair requests fit the input guard at the documented 2000-byte source ceiling", async () => {
  let count = 0;
  const f = setup({ raw: "a".repeat(2000) }, async () =>
    aiResponse(++count === 1 ? "{}" : JSON.stringify(refineResponseText())),
  );
  await f.service(f.client, f.input);
  assert.equal(f.sent.length, 2);
  assert.equal(f.accounting.reservations[0].config.inputTokenLimit, 8192);
});
test("Refine schema enforces preservation flags, bounded structure and nonblank text", () => {
  const valid = refineResponseText();
  assert.ok(refineOutput.safeParse(valid).success);
  for (const invalid of [
    { ...valid, schema_version: "2" },
    { ...valid, role: "STRUCTURE" },
    { ...valid, invented: "research" },
    { ...valid, data: { ...valid.data, meaning_changed: true } },
    { ...valid, data: { ...valid.data, preserved_uncertainty: false } },
    { ...valid, data: { ...valid.data, refined_text: "\n\u00a0" } },
    { ...valid, data: { ...valid.data, refined_text: "a".repeat(3001) } },
    { ...valid, warnings: ["a", "b", "c", "d"] },
  ])
    assert.ok(!refineOutput.safeParse(invalid).success);
  assert.match(refineContract.instructions, /Keep questions as questions/);
  assert.match(refineContract.instructions, /mixed Indonesian-English/);
  assert.match(refineContract.instructions, /Do not invent metrics/);
});
test("mixed language, emotion, uncertainty and incomplete questions survive a fixture review without normalization", async () => {
  const raw =
    "  aku takut terlalu optimistic... cash flow? honestly belum yakin\r\n";
  const proposal =
    "Aku takut terlalu optimistic... Bagaimana cash flow-nya? Honestly, aku belum yakin.";
  const f = setup({ raw }, async () =>
    aiResponse(JSON.stringify(refineResponseText(proposal))),
  );
  const saved = await f.service(f.client, f.input);
  assert.equal(saved.ai_content, proposal);
  assert.equal(f.thought.raw_content, raw);
  // Fixture verifies plumbing and prompt constraints, not real model faithfulness.
});
test("malformed outputs get at most one accounted repair; invalid final result is not saved", async () => {
  let calls = 0;
  const f = setup({}, async () => {
    calls++;
    return aiResponse(
      calls === 1
        ? "not JSON"
        : JSON.stringify({
            ...refineResponseText(),
            data: { ...refineResponseText().data, meaning_changed: true },
          }),
    );
  });
  await assert.rejects(
    f.service(f.client, f.input),
    (e) => e instanceof AIError && e.code === "INVALID_PROVIDER_RESPONSE",
  );
  assert.equal(calls, 2);
  assert.equal(f.accounting.receipts.length, 2);
  assert.equal(f.refinements.length, 0);
  assert.equal(f.requests.get(f.input.operation_id)!.status, "FAILED");
  assert.equal(f.thought.raw_content, f.raw);
});
test("successful bounded repair is saved once, with both attempts settled", async () => {
  let calls = 0;
  const f = setup({}, async () =>
    aiResponse(++calls === 1 ? "{}" : JSON.stringify(refineResponseText())),
  );
  const saved = await f.service(f.client, f.input);
  assert.equal(calls, 2);
  assert.equal(f.accounting.receipts.length, 2);
  assert.equal(f.accounting.reservations[0].maxAttempts, 2);
  assert.equal(refineContract.repair, true);
  assert.equal(f.refinements.length, 1);
  assert.equal(
    f.accounting.runs.get(saved.ai_run_id!)!.estimated_cost_idr,
    0.1008,
  );
});
test("initial and repair prompts keep epistemic causes, perspective and conversational register distinct", async () => {
  let calls = 0;
  const f = setup({}, async () =>
    aiResponse(++calls === 1 ? "{}" : JSON.stringify(refineResponseText())),
  );
  await f.service(f.client, f.input);
  assert.equal(f.sent.length, 2);
  for (const request of f.sent) {
    const system = request.messages[0].content;
    assert.match(
      system,
      /Preserve the reason behind each belief or uncertainty/,
    );
    assert.match(
      system,
      /Unexamined evidence must remain explicitly unexamined/,
    );
    assert.match(
      system,
      /do not replace not having looked with not being convinced/,
    );
    assert.match(
      system,
      /Keep uncertainty, doubt, missing information and lack of verification distinct/,
    );
    assert.match(
      system,
      /Never imply evidence was examined or verified when it was not/,
    );
    assert.match(system, /Preserve meaningful first-person perspective/);
    assert.match(
      system,
      /Do not turn a personal impression into an impersonal factual claim/,
    );
    assert.match(
      system,
      /preserve conversational Indonesian and the user's register/,
    );
    assert.match(system, /without unnecessarily formalizing natural wording/);
  }
});
test("distinct epistemic states and personal informal wording survive the deterministic Refine pipeline", async () => {
  const cases = [
    [
      "aku belum baca hasil auditnya jadi belum bisa nilai kontrolnya",
      "Aku belum baca hasil auditnya, jadi belum bisa nilai kontrolnya.",
    ],
    [
      "aku udah baca hasilnya tapi masih ragu asumsi pertumbuhannya",
      "Aku udah baca hasilnya, tapi masih ragu asumsi pertumbuhannya.",
    ],
    [
      "datanya soal retensi belum ada, jadi aku belum tahu polanya",
      "Datanya soal retensi belum ada, jadi aku belum tahu polanya.",
    ],
    [
      "aku dengar pesanan naik sih tapi belum cek kabar itu bener apa enggak",
      "Aku dengar pesanan naik sih, tapi belum cek kabar itu bener apa enggak.",
    ],
    [
      "menurutku idenya menarik sih mungkin aku perlu lihat detailnya dulu",
      "Menurutku idenya menarik sih. Mungkin aku perlu lihat detailnya dulu.",
    ],
  ];
  for (const [raw, expected] of cases) {
    const f = setup({ raw }, async () =>
      aiResponse(JSON.stringify(refineResponseText(expected))),
    );
    const saved = await f.service(f.client, f.input);
    const context = JSON.parse(f.sent[0].messages[1].content);
    assert.equal(context.storedUserContext.thoughts[0].raw_content, raw);
    assert.equal(saved.ai_content, expected);
    assert.equal(f.thought.raw_content, raw);
  }
  // These fixtures verify exact context/persistence, not a semantic evaluator or live model.
});
test("budget denial and disabled AI leave originals and proposals intact without transmission", async () => {
  for (const [options, config, code] of [
    [{}, { ...fixtureAIConfig, monthlyLimitIdr: 0 }, "BUDGET_EXHAUSTED"],
    [{ disabled: true }, fixtureAIConfig, "AI_DISABLED"],
  ] as const) {
    const f = setup(options, undefined, config);
    await assert.rejects(
      f.service(f.client, f.input),
      (e) => e instanceof AIError && e.code === code,
    );
    assert.equal(f.sent.length, 0);
    assert.equal(f.refinements.length, 0);
    assert.equal(f.thought.raw_content, f.raw);
  }
});
test("provider timeout and rate limit have no transport retries, no result and durable failure replay", async () => {
  for (const code of ["PROVIDER_TIMEOUT", "PROVIDER_RATE_LIMIT"] as const) {
    const f = setup({}, async () => {
      throw new AIError(code);
    });
    await assert.rejects(
      f.service(f.client, f.input),
      (e) => e instanceof AIError && e.code === code,
    );
    await assert.rejects(f.service(f.client, f.input));
    assert.equal(f.sent.length, 1);
    assert.equal(f.refinements.length, 0);
    assert.equal(f.requests.get(f.input.operation_id)!.status, "FAILED");
  }
});
test("unknown usage keeps the conservative hold while the valid proposal is separately persisted", async () => {
  const f = setup({}, async () =>
    aiResponse(JSON.stringify(refineResponseText()), {
      inputTokens: 10,
      outputTokens: null,
    }),
  );
  const row = await f.service(f.client, f.input);
  const run = f.accounting.runs.get(row.ai_run_id!)!;
  assert.equal(run.accounting_status, "UNKNOWN");
  assert.equal(run.budget_charge_idr, run.reserved_cost_idr / 2);
  assert.equal(run.estimated_cost_idr, null);
});
test("same operation replay returns the saved proposal without spending; intentional new version preserves prior accepted work", async () => {
  const f = setup();
  const first = await f.service(f.client, f.input);
  const replay = await f.service(f.client, f.input);
  assert.equal(first.id, replay.id);
  assert.equal(f.sent.length, 1);
  await reviewRefinement(f.client, {
    company_id: first.company_id,
    thought_id: first.thought_id,
    refinement_id: first.id,
    status: "ACCEPTED",
    user_final_content: first.ai_content,
  });
  const second = await f.service(f.client, {
    ...f.input,
    operation_id: randomUUID(),
  });
  assert.notEqual(first.id, second.id);
  assert.equal(
    f.refinements.find((r) => r.id === first.id)!.status,
    "ACCEPTED",
  );
  await reviewRefinement(f.client, {
    company_id: second.company_id,
    thought_id: second.thought_id,
    refinement_id: second.id,
    status: "REJECTED",
    user_final_content: null,
  });
  assert.equal(f.refinements.length, 2);
  assert.equal(
    f.refinements.find((r) => r.id === first.id)!.status,
    "ACCEPTED",
  );
  assert.equal(f.thought.raw_content, f.raw);
});
test("pending duplicate operations and different concurrent IDs cannot cause a second paid request", async () => {
  let release!: (value: ProviderResult) => void;
  const f = setup(
    {},
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const first = f.service(f.client, f.input);
  while (!release) await new Promise((resolve) => setImmediate(resolve));
  await assert.rejects(
    f.service(f.client, f.input),
    (e) => e instanceof RefinementError && e.code === "BUSY",
  );
  await assert.rejects(
    f.service(f.client, { ...f.input, operation_id: randomUUID() }),
    (e) => e instanceof RefinementError && e.code === "BUSY",
  );
  release(aiResponse(JSON.stringify(refineResponseText())));
  await first;
  assert.equal(f.sent.length, 1);
});
test("persistence failure keeps the claim pending and stops replay without revealing private failures", async () => {
  const f = setup({ writerFailure: true });
  await assert.rejects(f.service(f.client, f.input));
  await assert.rejects(
    f.service(f.client, f.input),
    (e) => e instanceof RefinementError && e.code === "BUSY",
  );
  assert.equal(f.requests.get(f.input.operation_id)!.status, "PENDING");
  assert.equal(f.sent.length, 1);
  assert.equal(f.refinements.length, 0);
  assert.ok(!JSON.stringify(f.diagnostics).includes("private"));
});
test("accounting write failure retains the durable claim and reservation without saving or resending", async () => {
  const f = setup();
  const service = createRefineService({
    configuration: () => fixtureAIConfig,
    writer: () => f.writer,
    accounting: () => ({
      ...f.accounting.accounting,
      async record() {
        throw new Error("private receipt");
      },
    }),
    provider: () => ({
      async generate(value) {
        f.sent.push(value);
        return aiResponse(JSON.stringify(refineResponseText()));
      },
    }),
  });
  await assert.rejects(
    service(f.client, f.input),
    (e) => e instanceof AIError && e.code === "DATABASE_LOGGING_FAILED",
  );
  await assert.rejects(
    service(f.client, f.input),
    (e) => e instanceof RefinementError && e.code === "BUSY",
  );
  assert.equal(f.requests.get(f.input.operation_id)!.status, "PENDING");
  assert.equal(
    f.accounting.runs.get(f.input.operation_id)!.accounting_status,
    "RESERVED",
  );
  assert.equal(f.refinements.length, 0);
  assert.equal(f.sent.length, 1);
});
test("edited acceptance stores user text separately, supersedes older acceptance, rejection retains AI and raw", async () => {
  const f = setup();
  const first = await f.service(f.client, f.input);
  const decision = (
    id: string,
    status: "ACCEPTED" | "REJECTED",
    final: string | null,
  ) =>
    reviewRefinement(f.client, {
      company_id: fixtureCompanyId,
      thought_id: fixtureThoughtId,
      refinement_id: id,
      status,
      user_final_content: final,
    });
  const accepted = await decision(
    first.id,
    "ACCEPTED",
    "  pilihan saya, masih ragu?\n",
  );
  assert.equal(accepted.user_final_content, "  pilihan saya, masih ragu?\n");
  assert.equal(accepted.ai_content, first.ai_content);
  const second = await f.service(f.client, {
    ...f.input,
    operation_id: randomUUID(),
  });
  await decision(second.id, "ACCEPTED", second.ai_content);
  assert.equal(
    f.refinements.find((r) => r.id === first.id)!.status,
    "SUPERSEDED",
  );
  assert.equal(
    f.refinements.find((r) => r.id === first.id)!.user_final_content,
    "  pilihan saya, masih ragu?\n",
  );
  assert.equal(f.thought.raw_content, f.raw);
  await assert.rejects(decision(second.id, "REJECTED", null));
});
test("generic gateway rejects mismatched primary source or multiple Thoughts before reservation", async () => {
  const f = setup();
  const gateway = createAIGateway({
    contracts: [refineContract],
    accounting: () => f.accounting.accounting,
    configuration: () => fixtureAIConfig,
    provider: () => {
      throw new Error("must not initialize");
    },
  });
  for (const ids of [[], [randomUUID()], [fixtureThoughtId, randomUUID()]]) {
    const result = await gateway(f.client, {
      role: "REFINE",
      contract: "refine-v1",
      companyId: fixtureCompanyId,
      thoughtIds: ids,
      taskInput: { thought_id: fixtureThoughtId },
    });
    assert.ok(!result.ok && result.error.code === "INVALID_REQUEST");
  }
  assert.equal(f.accounting.reservations.length, 0);
});
test("review GET never invokes generation; UI preserves server/client boundaries and pending controls", () => {
  const page = readFileSync(
    "src/app/(private)/companies/[companyId]/thoughts/[thoughtId]/refine/page.tsx",
    "utf8",
  );
  assert.ok(
    !/generateRefinement\(|runAIRequest\(|createAIGateway\(|\.generate\(/.test(
      page,
    ),
  );
  assert.match(page, /await params/);
  const form = readFileSync(
    "src/features/refinements/refine-forms.tsx",
    "utf8",
  );
  assert.ok(form.startsWith('"use client"'));
  assert.match(form, /useActionState/);
  assert.match(form, /disabled=\{pending/);
  assert.ok(!/useEffect|\buse\(/.test(form));
  const action = readFileSync("src/features/refinements/actions.ts", "utf8");
  assert.ok(action.startsWith('"use server"'));
  assert.match(action, /await getCompanyContext\(\)/);
});
