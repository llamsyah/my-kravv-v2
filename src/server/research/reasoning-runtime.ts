import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getAIConfig } from "../ai/config.ts";
import { createAIProvider } from "../ai/provider.ts";
import { AIError } from "../ai/errors.ts";
import type { ResearchAccounting } from "./reasoning.ts";
import { validateCloudTarget } from "../../lib/env/v3-cloud.ts";
import { z } from "zod";

// Offline milestone only. Credentials/configuration alone never authorize spending.
// A later owner-reviewed source change AND application activation are required.
const approvedResearchAIExecution: boolean = false;
export function getResearchRuntime() {
  if (!approvedResearchAIExecution) throw new AIError("AI_DISABLED");
  const target = validateCloudTarget({
    profile: "my-kravv-v3-cloud-dev",
    projectRef: "kjcvgjfwlmyfroiqlbmw",
    apiOrigin: "https://kjcvgjfwlmyfroiqlbmw.supabase.co",
  });
  const e = process.env;
  const config = getAIConfig("GUIDE", {
    AI_PROVIDER: e.MY_KRAVV_V3_RESEARCH_AI_PROVIDER,
    OPENAI_API_KEY: e.MY_KRAVV_V3_RESEARCH_AI_KEY,
    GROQ_API_KEY: e.MY_KRAVV_V3_RESEARCH_AI_KEY,
    OPENAI_MODEL: e.MY_KRAVV_V3_RESEARCH_AI_MODEL,
    GROQ_MODEL: e.MY_KRAVV_V3_RESEARCH_AI_MODEL,
    AI_MODEL_CONFIG_JSON: e.MY_KRAVV_V3_RESEARCH_AI_MODELS_JSON,
    AI_USD_TO_IDR: e.MY_KRAVV_V3_RESEARCH_AI_USD_TO_IDR,
    AI_MONTHLY_COST_LIMIT_IDR:
      e.MY_KRAVV_V3_RESEARCH_AI_MONTHLY_LIMIT_IDR ?? "0",
    AI_DAILY_CALL_LIMIT: e.MY_KRAVV_V3_RESEARCH_AI_DAILY_LIMIT ?? "10",
    AI_TIMEOUT_MS: "15000",
  });
  const key = z
    .string()
    .regex(/^sb_secret_[A-Za-z0-9_-]{5,}$/)
    .safeParse(e.MY_KRAVV_V3_RESEARCH_ACCOUNTING_KEY);
  if (!key.success) throw new AIError("CONFIGURATION_MISSING");
  // Dedicated V3-only credential, never generic SUPABASE_SERVICE_ROLE_KEY or V2 config.
  const client = createClient(target.apiOrigin, key.data, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (url, init) => fetch(url, { ...init, redirect: "error" }),
    },
  });
  const accounting: ResearchAccounting = {
    async reserve({ owner, request, config, snapshot, quote }) {
      const { data, error } = await client.rpc("v3_reserve_research_ai", {
        p_owner: owner,
        p_operation: request.operation,
        p_draft: request.draftId,
        p_expected: request.revision,
        p_mode: request.mode,
        p_provider: config.provider,
        p_model: config.model,
        p_snapshot: snapshot,
        p_quote: quote,
        p_monthly_limit: config.monthlyLimitIdr,
        p_daily_limit: config.dailyCallLimit,
      });
      const row = z
        .object({ id: z.uuid(), execute: z.boolean() })
        .strict()
        .safeParse(data);
      if (error || !row.success) throw new AIError("DATABASE_LOGGING_FAILED");
      return row.data;
    },
    async finish(owner, id, status, output, errorCode) {
      const { error } = await client.rpc("v3_finish_research_ai", {
        p_owner: owner,
        p_run: id,
        p_status: status,
        p_output: output,
        p_error: errorCode,
      });
      if (error) throw new AIError("DATABASE_LOGGING_FAILED");
    },
  };
  // Reuse the audited adapter and its fixed official endpoints, no SDK retries,
  // disabled SDK logging, strict structured envelope and bounded timeout.
  return { config, accounting, provider: createAIProvider(config, fetch) };
}
