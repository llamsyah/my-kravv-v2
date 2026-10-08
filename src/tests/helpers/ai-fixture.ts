import {
  createClient,
  AuthSessionMissingError,
  type User,
} from "@supabase/supabase-js";
import type {
  AIAccounting,
  AIRunRow,
  Reservation,
} from "../../server/db/ai-runs.ts";
import type { AIConfig } from "../../server/ai/config.ts";
import type {
  AttemptReceipt,
  ProviderResult,
} from "../../server/ai/contracts.ts";
import { AIError } from "../../server/ai/errors.ts";
import { estimateCostIdr } from "../../server/ai/cost.ts";
import { fixtureUrl, fixtureKey, fixtureUserId } from "./auth-fixture.ts";

export const fixtureAIConfig: AIConfig = {
  provider: "groq",
  model: "openai/gpt-oss-20b",
  apiKey: "synthetic-provider-key",
  format: "json_schema",
  reasoningEffort: "low",
  inputTokenLimit: 8192,
  outputTokenLimit: 128,
  inputUsdPerMillion: 0.075,
  outputUsdPerMillion: 0.3,
  usdToIdr: 16000,
  pricingVersion: "synthetic-pricing-v1",
  monthlyLimitIdr: 25000,
  dailyCallLimit: 20,
  timeoutMs: 1000,
};
export const fixtureCompanyId = "33333333-3333-4333-8333-333333333333";
export const fixtureThoughtId = "44444444-4444-4444-8444-444444444444";
export function aiUserClient(
  options: {
    anonymous?: boolean;
    poisonOwner?: string;
    raw?: string;
    disabled?: boolean;
  } = {},
) {
  const queries: string[] = [];
  const client = createClient(fixtureUrl, fixtureKey, {
    auth: { persistSession: false },
    global: {
      fetch: async (input) => {
        const url = new URL(String(input));
        queries.push(url.href);
        const owner = options.poisonOwner ?? fixtureUserId;
        if (url.pathname.endsWith("user_settings"))
          return Response.json({
            user_id: owner,
            ai_enabled: !options.disabled,
            guidance_mode: "ADAPTIVE",
            challenge_intensity: "STANDARD",
          });
        if (url.pathname.endsWith("companies"))
          return Response.json({
            id: fixtureCompanyId,
            user_id: owner,
            name: "Private fixture",
            short_note: null,
          });
        if (url.pathname.endsWith("thoughts"))
          return Response.json([
            {
              id: fixtureThoughtId,
              user_id: owner,
              company_id: fixtureCompanyId,
              raw_content: options.raw ?? "Original thought",
            },
          ]);
        throw new Error("Unexpected fixture query.");
      },
    },
  });
  client.auth.getUser = async () =>
    options.anonymous
      ? { data: { user: null }, error: new AuthSessionMissingError() }
      : { data: { user: { id: fixtureUserId } as User }, error: null };
  return { client, queries };
}
export function aiResponse(
  content = '{"ok":true,"nonce":"MY_KRAVV_INFRA"}',
  usage = { inputTokens: 10, outputTokens: 8 } as ProviderResult["usage"],
): ProviderResult {
  return {
    content,
    validEnvelope: true,
    model: fixtureAIConfig.model,
    requestId: "fixture-request",
    usage,
  };
}
export function accountingFixture() {
  const calls: string[] = [];
  const runs = new Map<string, AIRunRow>();
  const receipts: AttemptReceipt[] = [];
  const reservations: Reservation[] = [];
  const accounting: AIAccounting = {
    async reserve(v) {
      calls.push("reserve");
      const c = v.config;
      const per = estimateCostIdr(
        { inputTokens: c.inputTokenLimit, outputTokens: v.outputTokenLimit },
        c,
      )!;
      const hold = per * v.maxAttempts;
      if (
        [...runs.values()].reduce((s, r) => s + r.budget_charge_idr, 0) + hold >
        c.monthlyLimitIdr
      )
        throw new AIError("BUDGET_EXHAUSTED");
      reservations.push(v);
      const row: AIRunRow = {
        id: v.runId,
        user_id: v.userId,
        company_id: v.companyId ?? null,
        role: v.role,
        provider: c.provider,
        model: c.model,
        prompt_version: v.promptVersion,
        output_schema_version: v.schemaVersion,
        status: "PENDING",
        input_token_limit: c.inputTokenLimit,
        output_token_limit: v.outputTokenLimit,
        max_attempts: v.maxAttempts,
        input_usd_per_million: c.inputUsdPerMillion,
        output_usd_per_million: c.outputUsdPerMillion,
        usd_to_idr: c.usdToIdr,
        pricing_version: c.pricingVersion,
        reserved_cost_idr: hold,
        budget_charge_idr: hold,
        estimated_cost_idr: null,
        input_tokens: null,
        output_tokens: null,
        accounting_status: "RESERVED",
      };
      runs.set(v.runId, row);
      return row;
    },
    async start(_user, id, attempt) {
      calls.push("start-" + attempt);
      if (!runs.has(id)) throw new Error("Missing reservation");
    },
    async record(value) {
      calls.push("record-" + value.attempt);
      receipts.push(value);
    },
    async finish(_user, id, status) {
      calls.push("finish-" + status);
      const row = runs.get(id)!;
      const values = receipts.filter((r) => r.runId === id);
      const costs = values.map((v) =>
        v.model === row.model
          ? estimateCostIdr(v.usage, fixtureAIConfig)
          : null,
      );
      const unknown = costs.some((c) => c === null);
      row.status = status;
      row.accounting_status = unknown ? "UNKNOWN" : "ESTIMATED";
      row.input_tokens = values.some((v) => v.usage.inputTokens === null)
        ? null
        : values.reduce((s, v) => s + v.usage.inputTokens!, 0);
      row.output_tokens = values.some((v) => v.usage.outputTokens === null)
        ? null
        : values.reduce((s, v) => s + v.usage.outputTokens!, 0);
      row.estimated_cost_idr = unknown
        ? null
        : costs.reduce<number>((s, c) => s + c!, 0);
      row.budget_charge_idr = costs.reduce<number>(
        (s, c) => s + (c ?? row.reserved_cost_idr / row.max_attempts),
        0,
      );
      return row;
    },
  };
  return { accounting, calls, runs, receipts, reservations };
}
