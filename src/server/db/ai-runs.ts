import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getPublicSupabaseConfig } from "../../lib/env/public.ts";
import { getSupabaseSecretKey } from "./config.ts";
import type { AIConfig } from "../ai/config.ts";
import type { AIRole, AttemptReceipt } from "../ai/contracts.ts";
import { AIError, type AIErrorCode } from "../ai/errors.ts";

const amount = z.number().finite().min(0).max(99999999);
const runSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  company_id: z.uuid().nullable(),
  role: z.enum([
    "REFINE",
    "STRUCTURE",
    "GUIDE",
    "CHALLENGE",
    "COMPARE",
    "REFLECT",
  ]),
  provider: z.enum(["groq", "openai"]),
  model: z.string(),
  prompt_version: z.string(),
  output_schema_version: z.string(),
  status: z.enum(["PENDING", "SUCCEEDED", "FAILED", "CANCELLED"]),
  input_token_limit: z.number().int(),
  output_token_limit: z.number().int(),
  max_attempts: z.number().int(),
  input_usd_per_million: amount,
  output_usd_per_million: amount,
  usd_to_idr: amount,
  pricing_version: z.string(),
  reserved_cost_idr: amount,
  budget_charge_idr: amount,
  estimated_cost_idr: amount.nullable(),
  input_tokens: z.number().int().nonnegative().nullable(),
  output_tokens: z.number().int().nonnegative().nullable(),
  accounting_status: z.enum([
    "RESERVED",
    "ESTIMATED",
    "UNKNOWN",
    "NOT_REQUESTED",
  ]),
});
export type AIRunRow = z.infer<typeof runSchema>;
export type Reservation = {
  userId: string;
  runId: string;
  companyId?: string;
  role: AIRole;
  promptVersion: string;
  schemaVersion: string;
  thoughtIds: string[];
  config: AIConfig;
  maxAttempts: 1 | 2;
  outputTokenLimit: number;
};
export type AIAccounting = {
  reserve(value: Reservation): Promise<AIRunRow>;
  start(userId: string, runId: string, attempt: number): Promise<void>;
  record(value: AttemptReceipt): Promise<void>;
  finish(
    userId: string,
    runId: string,
    status: "SUCCEEDED" | "FAILED" | "CANCELLED",
    error: string | null,
  ): Promise<AIRunRow>;
};
function databaseFailure(error: unknown): AIError {
  const message = z.object({ message: z.string() }).safeParse(error);
  const mapped: Record<string, AIErrorCode> = {
    AI_BUDGET_EXHAUSTED: "BUDGET_EXHAUSTED",
    AI_RATE_LIMIT: "RATE_LIMIT",
    AI_DISABLED: "AI_DISABLED",
    AI_RESOURCE_UNAVAILABLE: "UNAUTHORIZED",
    AI_RESERVATION_EXPIRED: "RATE_LIMIT",
  };
  const code = message.success ? mapped[message.data.message] : undefined;
  return new AIError(code ?? "DATABASE_LOGGING_FAILED");
}
/** Inject only a trusted server accounting client, never an ordinary browser client. */
export function createAIAccounting(client: SupabaseClient): AIAccounting {
  const rpc = async (name: string, args: Record<string, unknown>) => {
    try {
      const { data, error } = await client.rpc(name, args).select("*").single();
      if (error) throw databaseFailure(error);
      return data as unknown;
    } catch (error) {
      throw error instanceof AIError
        ? error
        : new AIError("DATABASE_LOGGING_FAILED");
    }
  };
  const row = (data: unknown, userId: string, runId: string) => {
    const parsed = runSchema.safeParse(data);
    if (
      !parsed.success ||
      parsed.data.user_id !== userId ||
      parsed.data.id !== runId
    )
      throw new AIError("DATABASE_LOGGING_FAILED");
    return parsed.data;
  };
  const attemptRow = (
    data: unknown,
    userId: string,
    runId: string,
    attempt: number,
  ) => {
    const parsed = z
      .object({
        ai_run_id: z.uuid(),
        user_id: z.uuid(),
        attempt_number: z.number().int(),
        status: z.enum(["STARTED", "COMPLETED", "FAILED"]),
      })
      .safeParse(data);
    if (
      !parsed.success ||
      parsed.data.ai_run_id !== runId ||
      parsed.data.user_id !== userId ||
      parsed.data.attempt_number !== attempt
    )
      throw new AIError("DATABASE_LOGGING_FAILED");
    return parsed.data;
  };
  return {
    async reserve(v) {
      const c = v.config;
      const saved = row(
        await rpc("reserve_ai_run", {
          p_user_id: v.userId,
          p_run_id: v.runId,
          p_company_id: v.companyId ?? null,
          p_role: v.role,
          p_provider: c.provider,
          p_model: c.model,
          p_prompt_version: v.promptVersion,
          p_output_schema_version: v.schemaVersion,
          p_input_refs: v.thoughtIds.map((id) => ({ type: "THOUGHT", id })),
          p_input_context_hash: null,
          p_input_token_limit: c.inputTokenLimit,
          p_output_token_limit: v.outputTokenLimit,
          p_max_attempts: v.maxAttempts,
          p_input_usd_per_million: c.inputUsdPerMillion,
          p_output_usd_per_million: c.outputUsdPerMillion,
          p_usd_to_idr: c.usdToIdr,
          p_pricing_version: c.pricingVersion,
          p_monthly_limit_idr: c.monthlyLimitIdr,
          p_daily_call_limit: c.dailyCallLimit,
        }),
        v.userId,
        v.runId,
      );
      if (
        saved.status !== "PENDING" ||
        saved.model !== c.model ||
        saved.provider !== c.provider ||
        saved.role !== v.role ||
        saved.company_id !== (v.companyId ?? null) ||
        saved.input_token_limit !== c.inputTokenLimit ||
        saved.output_token_limit !== v.outputTokenLimit ||
        saved.max_attempts !== v.maxAttempts ||
        saved.input_usd_per_million !== c.inputUsdPerMillion ||
        saved.output_usd_per_million !== c.outputUsdPerMillion ||
        saved.usd_to_idr !== c.usdToIdr ||
        saved.pricing_version !== c.pricingVersion ||
        saved.prompt_version !== v.promptVersion ||
        saved.output_schema_version !== v.schemaVersion
      )
        throw new AIError("DATABASE_LOGGING_FAILED");
      return saved;
    },
    async start(userId, runId, attempt) {
      const saved = attemptRow(
        await rpc("start_ai_run_attempt", {
          p_user_id: userId,
          p_run_id: runId,
          p_attempt_number: attempt,
        }),
        userId,
        runId,
        attempt,
      );
      if (saved.status !== "STARTED")
        throw new AIError("DATABASE_LOGGING_FAILED");
    },
    async record(v) {
      const saved = attemptRow(
        await rpc("record_ai_run_attempt", {
          p_user_id: v.userId,
          p_run_id: v.runId,
          p_attempt_number: v.attempt,
          p_provider_model: v.model,
          p_provider_request_id: v.requestId,
          p_input_tokens: v.usage.inputTokens,
          p_output_tokens: v.usage.outputTokens,
          p_error_code: v.error,
          p_duration_ms: v.durationMs,
        }),
        v.userId,
        v.runId,
        v.attempt,
      );
      if (saved.status !== (v.error ? "FAILED" : "COMPLETED"))
        throw new AIError("DATABASE_LOGGING_FAILED");
    },
    async finish(userId, runId, status, error) {
      const saved = row(
        await rpc("finish_ai_run", {
          p_user_id: userId,
          p_run_id: runId,
          p_status: status,
          p_error_code: error,
        }),
        userId,
        runId,
      );
      if (saved.status !== status) throw new AIError("DATABASE_LOGGING_FAILED");
      return saved;
    },
  };
}
/** This elevated client exposes ONLY accounting closures, no content queries. */
export function getServerAIAccounting(): AIAccounting {
  try {
    const { url } = getPublicSupabaseConfig();
    return createAIAccounting(
      createClient(url, getSupabaseSecretKey(), {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          fetch: (input, init) =>
            fetch(input, {
              ...init,
              signal: init?.signal
                ? AbortSignal.any([init.signal, AbortSignal.timeout(10000)])
                : AbortSignal.timeout(10000),
            }),
        },
      }),
    );
  } catch {
    throw new AIError("DATABASE_LOGGING_FAILED");
  }
}
