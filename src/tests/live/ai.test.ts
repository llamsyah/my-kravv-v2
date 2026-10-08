import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { test } from "node:test";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "../../lib/env/public.ts";
import { getSupabaseSecretKey } from "../../server/db/config.ts";
import {
  createAIAccounting,
  type Reservation,
} from "../../server/db/ai-runs.ts";
import { AIError } from "../../server/ai/errors.ts";
import { createAIGateway } from "../../server/ai/gateway.ts";
import {
  infrastructureContract,
  runInfrastructureCheck,
} from "../../server/ai/verification.ts";
import { createCompany } from "../../server/db/companies.ts";
import { createThought } from "../../server/db/thoughts.ts";
import { deleteOwnedRecord } from "../../server/db/data-control.ts";
import { fixtureAIConfig, aiResponse } from "../helpers/ai-fixture.ts";

test(
  "development AI run ownership, reservations and mocked-provider gateway",
  {
    skip: process.env.MY_KRAVV_LIVE_TESTS !== "development",
    timeout: 150000,
  },
  async (t) => {
    const { url, publishableKey } = getPublicSupabaseConfig();
    const options = {
      auth: { persistSession: false, autoRefreshToken: false },
    };
    const admin = createClient(url, getSupabaseSecretKey(), options);
    const accounting = createAIAccounting(admin);
    const users: { id: string; email: string; password: string }[] = [];
    const clients = [
      createClient(url, publishableKey, options),
      createClient(url, publishableKey, options),
    ];
    let providerCalls = 0;
    try {
      for (const table of ["ai_runs", "ai_run_attempts"]) {
        const probe = await admin.from(table).select("user_id").limit(0);
        assert.ok(
          !probe.error,
          "Apply the AI infrastructure migration in the configured development project.",
        );
      }
      for (let i = 0; i < 2; i++) {
        const email = `my-kravv-m4-${randomUUID()}@example.invalid`;
        const password = randomBytes(32).toString("base64url");
        const result = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            purpose: "Milestone 4 disposable development verification",
          },
        });
        assert.ok(
          !result.error && result.data.user,
          "Disposable AI verification identity setup failed.",
        );
        users.push({ id: result.data.user.id, email, password });
        assert.ok(
          !(await clients[i].auth.signInWithPassword({ email, password }))
            .error,
        );
      }
      const owner = users[0].id;
      const company = await createCompany(clients[0], owner, {
        name: "Synthetic AI accounting",
        ticker: "",
        exchange: "",
        sector: "",
        short_note: "",
      });
      const otherCompany = await createCompany(clients[1], users[1].id, {
        name: "Foreign synthetic AI fixture",
        ticker: "",
        exchange: "",
        sector: "",
        short_note: "",
      });
      const thought = await createThought(clients[0], owner, {
        company_id: company.id,
        raw_content: "  Original remains immutable.\n",
        capture_operation_id: randomUUID(),
      });
      const config = {
        ...fixtureAIConfig,
        pricingVersion: "synthetic-database-verification",
      };
      const reserve = (overrides: Partial<Reservation> = {}) =>
        accounting.reserve({
          userId: owner,
          runId: randomUUID(),
          companyId: company.id,
          role: "REFINE",
          promptVersion: "infra-check-v1",
          schemaVersion: "infra-check-v1",
          thoughtIds: [thought.id],
          config,
          maxAttempts: 2,
          outputTokenLimit: 128,
          ...overrides,
        });
      const gatewayDependencies = {
        configuration: () => config,
        accounting: () => accounting,
        provider: () => ({
          async generate() {
            providerCalls++;
            return aiResponse();
          },
        }),
      };
      await t.test(
        "login, Company creation and original capture create no AI runs or attempts",
        async () => {
          for (const table of ["ai_runs", "ai_run_attempts"]) {
            const result = await clients[0]
              .from(table)
              .select("user_id")
              .eq("user_id", owner);
            assert.equal(result.error, null);
            assert.deepEqual(result.data, []);
          }
          assert.equal(providerCalls, 0);
        },
      );
      await t.test(
        "applied schema records a server-authenticated mocked-provider run with accurate estimates",
        async () => {
          const result = await runInfrastructureCheck(
            clients[0],
            gatewayDependencies,
          );
          assert.ok(result.ok);
          assert.equal(result.estimatedCostIdr, 0.0504);
          assert.deepEqual(result.usage, { inputTokens: 10, outputTokens: 8 });
          const row = await clients[0]
            .from("ai_runs")
            .select("*")
            .eq("id", result.runId)
            .single();
          assert.equal(row.error, null);
          assert.equal(row.data.user_id, owner);
          assert.equal(row.data.status, "SUCCEEDED");
          assert.equal(row.data.pricing_version, config.pricingVersion);
          assert.equal(row.data.input_refs.length, 0);
          const attempts = await clients[0]
            .from("ai_run_attempts")
            .select("*")
            .eq("ai_run_id", result.runId);
          assert.equal(attempts.data?.length, 1);
          assert.equal(attempts.data![0].usage_status, "REPORTED");
          assert.ok(
            !JSON.stringify(row.data).includes("synthetic-provider-key"),
          );
        },
      );
      await t.test(
        "owner reads and anonymous/foreign reads and mutations are independently enforced by RLS and grants",
        async () => {
          for (const table of ["ai_runs", "ai_run_attempts"]) {
            const foreign = await clients[1]
              .from(table)
              .select("*")
              .eq("user_id", owner);
            assert.equal(foreign.error, null);
            assert.deepEqual(foreign.data, []);
            const anon = await createClient(url, publishableKey, options)
              .from(table)
              .select("*");
            assert.ok(anon.error);
            for (const query of [
              clients[0].from(table).delete().eq("user_id", owner),
              clients[0]
                .from(table)
                .update({ user_id: users[1].id })
                .eq("user_id", owner),
              clients[0].from(table).insert({ user_id: owner }),
            ])
              assert.ok((await query).error);
          }
          for (const name of [
            "reserve_ai_run",
            "start_ai_run_attempt",
            "record_ai_run_attempt",
            "finish_ai_run",
          ]) {
            const args =
              name === "reserve_ai_run"
                ? {
                    p_user_id: owner,
                    p_run_id: randomUUID(),
                    p_company_id: null,
                    p_role: "REFINE",
                    p_provider: "groq",
                    p_model: config.model,
                    p_prompt_version: "infra-check-v1",
                    p_output_schema_version: "infra-check-v1",
                    p_input_refs: [],
                    p_input_context_hash: null,
                    p_input_token_limit: 8192,
                    p_output_token_limit: 128,
                    p_max_attempts: 1,
                    p_input_usd_per_million: 0.075,
                    p_output_usd_per_million: 0.3,
                    p_usd_to_idr: 16000,
                    p_pricing_version: "synthetic-v1",
                    p_monthly_limit_idr: 25000,
                    p_daily_call_limit: 20,
                  }
                : name === "start_ai_run_attempt"
                  ? {
                      p_user_id: owner,
                      p_run_id: randomUUID(),
                      p_attempt_number: 1,
                    }
                  : name === "record_ai_run_attempt"
                    ? {
                        p_user_id: owner,
                        p_run_id: randomUUID(),
                        p_attempt_number: 1,
                        p_provider_model: null,
                        p_provider_request_id: null,
                        p_input_tokens: null,
                        p_output_tokens: null,
                        p_error_code: "PROVIDER_TIMEOUT",
                        p_duration_ms: 100,
                      }
                    : {
                        p_user_id: owner,
                        p_run_id: randomUUID(),
                        p_status: "CANCELLED",
                        p_error_code: "CANCELLED",
                      };
            const result = await clients[0].rpc(name, args);
            assert.equal(result.error?.code, "42501");
            const anon = await createClient(url, publishableKey, options).rpc(
              name,
              args,
            );
            assert.equal(anon.error?.code, "42501");
          }
        },
      );
      await t.test(
        "foreign Company and Thought context fails before any provider or reservation",
        async () => {
          const before = providerCalls;
          const gateway = createAIGateway({
            ...gatewayDependencies,
            contracts: [
              { ...infrastructureContract, allowStoredContext: true },
            ],
          });
          const denied = await gateway(clients[0], {
            role: "REFINE",
            contract: "infrastructure-check",
            companyId: otherCompany.id,
            taskInput: { nonce: "MY_KRAVV_INFRA" },
          });
          assert.ok(!denied.ok && denied.error.code === "UNAUTHORIZED");
          assert.equal(providerCalls, before);
          await assert.rejects(
            () => reserve({ companyId: otherCompany.id }),
            (e) => e instanceof AIError && e.code === "UNAUTHORIZED",
          );
          await assert.rejects(
            () => reserve({ userId: users[1].id }),
            (e) => e instanceof AIError && e.code === "UNAUTHORIZED",
          );
        },
      );
      await t.test(
        "simultaneous independent requests cannot share remaining budget; duplicate starts and early commits fail safely",
        async () => {
          assert.equal(
            (
              await clients[0]
                .from("user_settings")
                .update({ monthly_ai_budget_idr: 25 })
                .eq("user_id", owner)
            ).error,
            null,
          );
          const attempts = await Promise.allSettled([
            reserve(),
            reserve(),
            reserve(),
          ]);
          const fulfilled = attempts.filter((r) => r.status === "fulfilled");
          assert.equal(fulfilled.length, 1);
          for (const failed of attempts.filter((r) => r.status === "rejected"))
            assert.ok(
              failed.reason instanceof AIError &&
                failed.reason.code === "BUDGET_EXHAUSTED",
            );
          const run = fulfilled[0].value;
          await accounting.start(owner, run.id, 1);
          await assert.rejects(() => accounting.start(owner, run.id, 1));
          await assert.rejects(() =>
            accounting.finish(owner, run.id, "SUCCEEDED", null),
          );
          const pending = await clients[0]
            .from("ai_runs")
            .select("budget_charge_idr,accounting_status")
            .eq("id", run.id)
            .single();
          assert.equal(pending.data?.accounting_status, "RESERVED");
          assert.equal(pending.data?.budget_charge_idr, run.reserved_cost_idr);
          await accounting.record({
            userId: owner,
            runId: run.id,
            attempt: 1,
            model: config.model,
            requestId: "synthetic-first",
            usage: { inputTokens: 10, outputTokens: 8 },
            error: null,
            durationMs: 1,
          });
          await accounting.finish(owner, run.id, "SUCCEEDED", null);
          assert.equal(
            (
              await clients[0]
                .from("user_settings")
                .update({ monthly_ai_budget_idr: 25000 })
                .eq("user_id", owner)
            ).error,
            null,
          );
        },
      );
      await t.test(
        "one repair records both costs; missing usage is NULL and retains its attempt hold",
        async () => {
          const run = await reserve();
          await accounting.start(owner, run.id, 1);
          const first = {
            userId: owner,
            runId: run.id,
            attempt: 1,
            model: config.model,
            requestId: "synthetic-repair",
            usage: { inputTokens: 10, outputTokens: 8 },
            error: "INVALID_PROVIDER_RESPONSE" as const,
            durationMs: 1,
          };
          await accounting.record(first);
          await accounting.record(first);
          await assert.rejects(() =>
            accounting.record({
              ...first,
              usage: { inputTokens: 99, outputTokens: 8 },
            }),
          );
          await accounting.start(owner, run.id, 2);
          await accounting.record({
            userId: owner,
            runId: run.id,
            attempt: 2,
            model: config.model,
            requestId: null,
            usage: { inputTokens: 5, outputTokens: null },
            error: null,
            durationMs: 1,
          });
          const finished = await accounting.finish(
            owner,
            run.id,
            "SUCCEEDED",
            null,
          );
          assert.equal(finished.estimated_cost_idr, null);
          assert.equal(finished.accounting_status, "UNKNOWN");
          assert.equal(finished.input_tokens, 15);
          assert.equal(finished.output_tokens, null);
          assert.equal(
            finished.budget_charge_idr,
            run.reserved_cost_idr / 2 + 0.0504,
          );
          const replay = await accounting.finish(
            owner,
            run.id,
            "SUCCEEDED",
            null,
          );
          assert.deepEqual(replay, finished);
          await assert.rejects(() =>
            accounting.finish(owner, run.id, "FAILED", "PROVIDER_TIMEOUT"),
          );
          await assert.rejects(() => accounting.start(owner, run.id, 2));
        },
      );
      await t.test(
        "daily caps, disabled AI and zero monthly budget stop new operations without affecting originals",
        async () => {
          await assert.rejects(
            () => reserve({ config: { ...config, dailyCallLimit: 1 } }),
            (e) => e instanceof AIError && e.code === "RATE_LIMIT",
          );
          assert.equal(
            (
              await clients[0]
                .from("user_settings")
                .update({ ai_enabled: false })
                .eq("user_id", owner)
            ).error,
            null,
          );
          const before = providerCalls;
          const disabled = await runInfrastructureCheck(
            clients[0],
            gatewayDependencies,
          );
          assert.ok(!disabled.ok && disabled.error.code === "AI_DISABLED");
          assert.equal(providerCalls, before);
          assert.equal(
            (
              await clients[0]
                .from("user_settings")
                .update({ ai_enabled: true, monthly_ai_budget_idr: 0 })
                .eq("user_id", owner)
            ).error,
            null,
          );
          await assert.rejects(
            () => reserve(),
            (e) => e instanceof AIError && e.code === "BUDGET_EXHAUSTED",
          );
          assert.equal(
            (
              await clients[0]
                .from("thoughts")
                .select("raw_content")
                .eq("id", thought.id)
                .single()
            ).data?.raw_content,
            thought.raw_content,
          );
          assert.equal(
            (
              await clients[0]
                .from("user_settings")
                .update({ monthly_ai_budget_idr: 25000 })
                .eq("user_id", owner)
            ).error,
            null,
          );
        },
      );
      await t.test(
        "Company deletion detaches accounting while preserving spend; user deletion cleans both tables",
        async () => {
          const before = await clients[0]
            .from("ai_runs")
            .select("id,budget_charge_idr")
            .eq("user_id", owner);
          assert.ok(before.data?.length);
          await deleteOwnedRecord(
            clients[0],
            "company",
            company.id,
            true,
            company.name,
          );
          const after = await clients[0]
            .from("ai_runs")
            .select("id,company_id,budget_charge_idr")
            .eq("user_id", owner);
          assert.equal(after.data?.length, before.data.length);
          assert.ok(after.data!.every((r) => r.company_id === null));
          assert.deepEqual(
            after
              .data!.map(({ id, budget_charge_idr }) => ({
                id,
                budget_charge_idr,
              }))
              .sort((a, b) => a.id.localeCompare(b.id)),
            before.data.sort((a, b) => a.id.localeCompare(b.id)),
          );
          const missing = await clients[0]
            .from("thoughts")
            .select("id")
            .eq("id", thought.id);
          assert.deepEqual(missing.data, []);
          assert.equal(
            providerCalls,
            1,
            "Only the injected mock may have generated; there is no real provider client here.",
          );
        },
      );
    } finally {
      for (const user of users)
        assert.ok(
          !(await admin.auth.admin.deleteUser(user.id)).error,
          "Disposable AI identity cleanup failed.",
        );
      for (const user of users)
        for (const table of [
          "ai_run_attempts",
          "ai_runs",
          "user_settings",
          "companies",
          "thoughts",
          "timeline_events",
        ]) {
          const result = await admin
            .from(table)
            .select("user_id")
            .eq("user_id", user.id);
          assert.ok(
            !result.error && result.data?.length === 0,
            "Disposable AI fixture cleanup failed.",
          );
        }
    }
  },
);
