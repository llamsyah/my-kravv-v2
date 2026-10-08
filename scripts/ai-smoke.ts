import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "../src/lib/env/public.ts";
import { getSupabaseSecretKey } from "../src/server/db/config.ts";
import { getAIConfig } from "../src/server/ai/config.ts";
import { createAIProvider } from "../src/server/ai/provider.ts";
import { createAIAccounting } from "../src/server/db/ai-runs.ts";
import { runInfrastructureCheck } from "../src/server/ai/verification.ts";
import { safeError } from "../src/server/ai/errors.ts";
import type { AIResult } from "../src/server/ai/contracts.ts";

/** Communication alone is insufficient: this check must verify usage/logging too. */
export function isSmokeVerified(
  result: AIResult,
  recorded: Record<string, unknown> | null,
  requests: number,
): boolean {
  return (
    result.ok &&
    requests === 1 &&
    result.provider === "groq" &&
    result.accountingStatus === "ESTIMATED" &&
    result.usage.inputTokens !== null &&
    result.usage.outputTokens !== null &&
    result.estimatedCostIdr !== null &&
    result.warnings.length === 0 &&
    recorded !== null &&
    recorded.status === "SUCCEEDED" &&
    recorded.accounting_status === "ESTIMATED" &&
    recorded.input_tokens === result.usage.inputTokens &&
    recorded.output_tokens === result.usage.outputTokens &&
    recorded.estimated_cost_idr === result.estimatedCostIdr &&
    recorded.budget_charge_idr === result.estimatedCostIdr
  );
}

export function requireSmokeAuthorization(
  env: Record<string, string | undefined>,
  args: readonly string[],
) {
  if (
    env.MY_KRAVV_LIVE_TESTS !== "development" ||
    env.MY_KRAVV_AI_SMOKE !== "authorized-once" ||
    !args.includes("--confirm-one-groq-request")
  ) {
    throw new Error(
      "A single Groq smoke request needs explicit authorization and development-only opt-in.",
    );
  }
  if (env.AI_PROVIDER !== "groq")
    throw new Error(
      "This verification command permits only the configured Groq provider.",
    );
}
export async function runAuthorizedSmoke() {
  requireSmokeAuthorization(process.env, process.argv.slice(2));
  // Validate all configuration before creating any disposable database fixture.
  const config = getAIConfig("REFINE", {
    ...process.env,
    AI_ROLE_REFINE_MODEL: process.env.GROQ_MODEL,
  });
  const { url, publishableKey } = getPublicSupabaseConfig();
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const admin = createClient(url, getSupabaseSecretKey(), options);
  const client = createClient(url, publishableKey, options);
  let userId: string | undefined;
  let requests = 0;
  try {
    const email = `my-kravv-m4-smoke-${randomUUID()}@example.invalid`;
    const password = randomBytes(32).toString("base64url");
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        purpose: "Milestone 4 disposable authorized Groq smoke",
      },
    });
    if (created.error || !created.data.user)
      throw new Error("Disposable smoke identity could not be created.");
    userId = created.data.user.id;
    if ((await client.auth.signInWithPassword({ email, password })).error)
      throw new Error("Disposable smoke sign-in failed.");
    const result = await runInfrastructureCheck(client, {
      configuration: () => config,
      accounting: () => createAIAccounting(admin),
      provider: (c) => {
        const adapter = createAIProvider(c);
        return {
          async generate(request, signal) {
            requests++;
            return adapter.generate(request, signal);
          },
        };
      },
    });
    let recorded: Record<string, unknown> | null = null;
    if (result.runId) {
      const row = await client
        .from("ai_runs")
        .select(
          "status,input_tokens,output_tokens,estimated_cost_idr,accounting_status,budget_charge_idr",
        )
        .eq("id", result.runId)
        .eq("user_id", userId)
        .single();
      if (row.error)
        throw new Error("Smoke run logging could not be verified.");
      recorded = row.data;
    }
    const passed = isSmokeVerified(result, recorded, requests);
    console.log(
      JSON.stringify({
        smoke: passed ? "passed" : "failed",
        provider: "groq",
        model: config.model,
        providerRequests: requests,
        outputTokenLimit: Math.min(128, config.outputTokenLimit),
        result: result.ok
          ? {
              runId: result.runId,
              usage: result.usage,
              estimatedCostIdr: result.estimatedCostIdr,
              warnings: result.warnings,
            }
          : result.error,
        recorded,
        providerQuotaMayBeConsumed: requests > 0,
        billedCostVerified: false,
      }),
    );
    if (!passed) process.exitCode = 1;
  } finally {
    if (userId) {
      if ((await admin.auth.admin.deleteUser(userId)).error)
        throw new Error("Disposable smoke identity cleanup failed.");
      for (const table of ["ai_runs", "ai_run_attempts", "user_settings"]) {
        const result = await admin
          .from(table)
          .select("user_id")
          .eq("user_id", userId);
        if (result.error || result.data?.length !== 0)
          throw new Error("Disposable smoke accounting cleanup failed.");
      }
    }
  }
}
if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  runAuthorizedSmoke().catch((error) => {
    // Never print raw SDK/Auth/DB errors, credentials, prompts or responses.
    console.error(
      JSON.stringify({ smoke: "not-completed", error: safeError(error) }),
    );
    process.exitCode = 1;
  });
}
