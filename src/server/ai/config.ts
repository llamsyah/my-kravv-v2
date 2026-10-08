import "server-only";
import { z } from "zod";

import { identifier, modelIdentifier, type AIRole } from "./contracts.ts";
import { AIError } from "./errors.ts";

const modelConfigSchema = z
  .strictObject({
    provider: z.enum(["groq", "openai"]),
    model: modelIdentifier,
    format: z.enum(["json_schema", "json_object", "text_json"]),
    reasoningEffort: z
      .enum(["none", "minimal", "low", "medium", "high", "xhigh", "max"])
      .optional(),
    inputTokenLimit: z.number().int().min(2048).max(32768),
    outputTokenLimit: z.number().int().min(1).max(4096),
    inputUsdPerMillion: z.number().finite().min(0).max(10000),
    outputUsdPerMillion: z.number().finite().min(0).max(10000),
    pricingVersion: identifier,
  })
  .refine((v) => v.inputUsdPerMillion + v.outputUsdPerMillion > 0);
export type ModelConfig = z.infer<typeof modelConfigSchema>;
export type AIConfig = ModelConfig & {
  apiKey: string;
  usdToIdr: number;
  monthlyLimitIdr: number;
  dailyCallLimit: number;
  timeoutMs: number;
};
type Environment = Record<string, string | undefined>;
const number = (value: string | undefined, fallback?: number) =>
  value === undefined || value.trim() === "" ? fallback : Number(value);
/** Lazy: missing AI configuration cannot affect login, page loads or captures. */
export function getAIConfig(
  role: AIRole,
  env: Environment = process.env,
): AIConfig {
  const selected = z
    .enum(["groq", "openai"])
    .safeParse(env.AI_PROVIDER ?? "groq");
  if (!selected.success) throw new AIError("CONFIGURATION_MISSING");
  const provider = selected.data;
  const key = z
    .string()
    .trim()
    .min(1)
    .safeParse(provider === "groq" ? env.GROQ_API_KEY : env.OPENAI_API_KEY);
  if (!key.success) throw new AIError("API_KEY_MISSING");
  const routed =
    env[`AI_ROLE_${role}_MODEL`]?.trim() ||
    (provider === "groq" ? env.GROQ_MODEL : env.OPENAI_MODEL);
  const model = modelIdentifier.safeParse(routed);
  if (!model.success) throw new AIError("MODEL_MISSING");
  let entries: ModelConfig[];
  try {
    entries = z
      .array(modelConfigSchema)
      .min(1)
      .max(20)
      .parse(JSON.parse(env.AI_MODEL_CONFIG_JSON ?? ""));
  } catch {
    throw new AIError("PRICING_UNAVAILABLE");
  }
  if (
    new Set(entries.map((e) => `${e.provider}:${e.model}`)).size !==
    entries.length
  )
    throw new AIError("PRICING_UNAVAILABLE");
  const entry = entries.find(
    (e) => e.provider === provider && e.model === model.data,
  );
  const usdToIdr = z
    .number()
    .finite()
    .positive()
    .max(1000000)
    .safeParse(number(env.AI_USD_TO_IDR));
  if (!entry || !usdToIdr.success) throw new AIError("PRICING_UNAVAILABLE");
  const limits = z
    .object({
      monthlyLimitIdr: z.number().finite().min(0).max(99999999),
      dailyCallLimit: z.number().int().min(1).max(1000),
      timeoutMs: z.number().int().min(100).max(30000),
    })
    .safeParse({
      monthlyLimitIdr: number(env.AI_MONTHLY_COST_LIMIT_IDR, 25000),
      dailyCallLimit: number(env.AI_DAILY_CALL_LIMIT, 20),
      timeoutMs: number(env.AI_TIMEOUT_MS, 15000),
    });
  if (!limits.success) throw new AIError("CONFIGURATION_MISSING");
  if (
    provider === "groq" &&
    entry.reasoningEffort &&
    !["low", "medium", "high"].includes(entry.reasoningEffort)
  )
    throw new AIError("CONFIGURATION_MISSING");
  const normalized = {
    ...entry,
    inputUsdPerMillion: Number(entry.inputUsdPerMillion.toFixed(8)),
    outputUsdPerMillion: Number(entry.outputUsdPerMillion.toFixed(8)),
    usdToIdr: Number(usdToIdr.data.toFixed(4)),
  };
  if (
    normalized.inputUsdPerMillion + normalized.outputUsdPerMillion <= 0 ||
    normalized.usdToIdr <= 0
  )
    throw new AIError("PRICING_UNAVAILABLE");
  return { ...normalized, ...limits.data, apiKey: key.data };
}
/** Legacy credential accessor, not an AI invocation. */
export function getOpenAIConfig() {
  const result = z.string().trim().min(1).safeParse(process.env.OPENAI_API_KEY);
  if (!result.success) {
    throw new Error(
      "Set OPENAI_API_KEY before enabling the server-side AI Gateway.",
    );
  }
  return { apiKey: result.data };
}
