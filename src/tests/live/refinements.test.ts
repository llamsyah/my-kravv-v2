import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { test } from "node:test";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "../../lib/env/public.ts";
import { getSupabaseSecretKey } from "../../server/db/config.ts";
import { createCompany, archiveCompany } from "../../server/db/companies.ts";
import { createThought, getThoughtById } from "../../server/db/thoughts.ts";
import { createAIAccounting } from "../../server/db/ai-runs.ts";
import {
  claimRefinement,
  getRefinement,
  getRefinements,
  getActiveRefinement,
  getRefinementQueue,
  createRefinementWriter,
} from "../../server/db/refinements.ts";
import {
  createRefineService,
  reviewRefinement,
} from "../../server/refinements/service.ts";
import { deleteOwnedRecord } from "../../server/db/data-control.ts";
import { fixtureAIConfig, aiResponse } from "../helpers/ai-fixture.ts";
import { refineResponseText } from "../helpers/refine-fixture.ts";
import {
  createLocalHttpSession,
  serverActionForm,
} from "../helpers/live-http.ts";

test(
  "development Refine RLS, lifecycle, mock gateway and relational integrity",
  {
    skip: process.env.MY_KRAVV_LIVE_TESTS !== "development",
    timeout: 240000,
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
    let calls = 0;
    const config = {
      ...fixtureAIConfig,
      outputTokenLimit: 512,
      dailyCallLimit: 60,
      pricingVersion: "synthetic-m5-verification",
    };
    const service = createRefineService({
      configuration: () => config,
      accounting: () => accounting,
      writer: () => createRefinementWriter(admin),
      provider: () => ({
        async generate() {
          calls++;
          return aiResponse(JSON.stringify(refineResponseText()));
        },
      }),
    });
    const metadata = (name: string) => ({
      name,
      ticker: "",
      exchange: "",
      sector: "",
      short_note: "",
    });
    try {
      for (const table of ["refinements", "refinement_requests"]) {
        const probe = await admin.from(table).select("user_id").limit(0);
        assert.ok(
          !probe.error,
          "Apply the exact Milestone 5 migration to the configured development project.",
        );
      }
      for (let i = 0; i < 2; i++) {
        const email = `my-kravv-m5-${randomUUID()}@example.invalid`;
        const password = randomBytes(32).toString("base64url");
        const result = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            purpose: "Disposable Milestone 5 mocked-provider verification",
          },
        });
        assert.ok(
          !result.error && result.data.user,
          "Disposable Refine account setup failed.",
        );
        users.push({ id: result.data.user.id, email, password });
        assert.ok(
          !(await clients[i].auth.signInWithPassword({ email, password }))
            .error,
          "Disposable login failed.",
        );
      }
      const owner = users[0].id;
      const company = await createCompany(
        clients[0],
        owner,
        metadata("Synthetic Refine workspace"),
      );
      const thought = await createThought(clients[0], owner, {
        company_id: company.id,
        capture_operation_id: randomUUID(),
        raw_content:
          "  ekspansinya agresif banget, tapi aku belum yakin cash flow mereka sanggup.\nApa mungkin temporary?",
      });
      const input = {
        company_id: company.id,
        thought_id: thought.id,
        operation_id: randomUUID(),
      };
      const first = await service(clients[0], input);
      const decision = (
        refinement_id: string,
        status: "ACCEPTED" | "REJECTED",
        final: string | null,
      ) =>
        reviewRefinement(clients[0], {
          company_id: company.id,
          thought_id: thought.id,
          refinement_id,
          status,
          user_final_content: final,
        });
      await t.test(
        "migration is present and one mocked request persists proposal, run provenance and settled usage",
        async () => {
          assert.equal(first.status, "SUGGESTED");
          assert.equal(first.ai_run_id, input.operation_id);
          assert.equal(first.prompt_version, "refine-v1");
          assert.equal(first.output_schema_version, "refine-schema-v1");
          const run = await clients[0]
            .from("ai_runs")
            .select("*")
            .eq("id", input.operation_id)
            .single();
          assert.ok(!run.error);
          assert.equal(run.data.status, "SUCCEEDED");
          assert.equal(run.data.accounting_status, "ESTIMATED");
          assert.equal(run.data.budget_charge_idr, 0.0504);
          assert.ok(run.data.budget_charge_idr < run.data.reserved_cost_idr);
          assert.deepEqual(run.data.input_refs, [
            { type: "THOUGHT", id: thought.id },
          ]);
          assert.equal(calls, 1);
        },
      );
      await t.test(
        "RLS hides owner artifacts and blocks ordinary mutation and service-only completion",
        async () => {
          for (const table of ["refinements", "refinement_requests"]) {
            const foreign = await clients[1]
              .from(table)
              .select("*")
              .eq("user_id", owner);
            assert.ok(!foreign.error && foreign.data.length === 0);
            assert.ok(
              (
                await clients[0]
                  .from(table)
                  .update({ status: "FAILED" })
                  .eq("user_id", owner)
              ).error,
            );
            assert.ok(
              (await clients[0].from(table).delete().eq("user_id", owner))
                .error,
            );
          }
          const forbidden = await clients[0].rpc(
            "complete_refinement_request",
            {
              p_user_id: owner,
              p_operation_id: input.operation_id,
              p_ai_run_id: input.operation_id,
              p_ai_content: "forged",
              p_warnings: [],
              p_error_code: null,
            },
          );
          assert.ok(forbidden.error);
          await assert.rejects(
            service(clients[1], { ...input, operation_id: randomUUID() }),
          );
          await assert.rejects(
            reviewRefinement(clients[1], {
              company_id: company.id,
              thought_id: thought.id,
              refinement_id: first.id,
              status: "ACCEPTED",
              user_final_content: null,
            }),
          );
          assert.equal(calls, 1);
        },
      );
      await t.test(
        "operation replay and concurrent distinct IDs cannot generate again",
        async () => {
          assert.equal((await service(clients[0], input)).id, first.id);
          const op = randomUUID();
          const claims = await Promise.all(
            Array.from({ length: 4 }, () =>
              claimRefinement(clients[0], owner, company.id, thought.id, op),
            ),
          );
          assert.equal(claims.filter((c) => c.claimed).length, 1);
          await assert.rejects(
            service(clients[0], { ...input, operation_id: randomUUID() }),
          );
          await createRefinementWriter(admin).complete({
            owner,
            operation: op,
            runId: null,
            content: null,
            warnings: [],
            error: "INVALID_REQUEST",
          });
          assert.equal(calls, 1);
        },
      );
      await t.test(
        "explicit acceptance is atomic and replay has exactly one timeline event",
        async () => {
          const edited =
            "  Aku tetap belum yakin arus kasnya sanggup. Apa mungkin temporary?\n";
          const accepted = await decision(first.id, "ACCEPTED", edited);
          assert.equal(accepted.user_final_content, edited);
          assert.equal(accepted.ai_content, first.ai_content);
          await decision(first.id, "ACCEPTED", edited);
          const events = await clients[0]
            .from("timeline_events")
            .select("*")
            .eq("entity_type", "REFINEMENT")
            .eq("entity_id", first.id);
          assert.ok(!events.error && events.data.length === 1);
          assert.equal(events.data[0].event_type, "REFINEMENT_ACCEPTED");
          await assert.rejects(decision(first.id, "REJECTED", null));
          assert.equal(
            (await getThoughtById(clients[0], owner, company.id, thought.id))!
              .raw_content,
            thought.raw_content,
          );
        },
      );
      const second = await service(clients[0], {
        ...input,
        operation_id: randomUUID(),
      });
      await t.test(
        "rejection preserves earlier acceptance; a later accepted version supersedes without overwriting",
        async () => {
          await decision(second.id, "REJECTED", null);
          assert.equal(
            (await getRefinement(
              clients[0],
              owner,
              company.id,
              thought.id,
              first.id,
            ))!.status,
            "ACCEPTED",
          );
          const third = await service(clients[0], {
            ...input,
            operation_id: randomUUID(),
          });
          await decision(third.id, "ACCEPTED", third.ai_content);
          const prior = await getRefinement(
            clients[0],
            owner,
            company.id,
            thought.id,
            first.id,
          );
          assert.equal(prior!.status, "SUPERSEDED");
          assert.equal(prior!.ai_content, first.ai_content);
          assert.equal(
            (await getRefinements(clients[0], owner, company.id, thought.id))
              .refinements.length,
            3,
          );
        },
      );
      const fourth = await service(clients[0], {
        ...input,
        operation_id: randomUUID(),
      });
      await t.test(
        "normal review GET and explicit acceptance Server Action use auth and persistence without a provider call",
        async () => {
          const app = createLocalHttpSession();
          const login = await app.request("/auth");
          assert.equal(login.status, 200);
          const form = serverActionForm(await login.text());
          form.set("email", users[0].email);
          form.set("password", users[0].password);
          assert.equal((await app.request("/auth", form)).status, 303);
          const path = `/companies/${company.id}/thoughts/${thought.id}/refine`;
          const before = calls;
          const hub = await app.request(`/companies/${company.id}/refinements`);
          assert.equal(hub.status, 200);
          assert.ok((await hub.text()).includes("Ada usulan"));
          const current = await app.request(path);
          assert.ok((await current.text()).includes("Versi pilihan"));
          const page = await app.request(`${path}?proposal=${fourth.id}`);
          assert.equal(page.status, 200);
          const html = await page.text();
          assert.ok(html.includes(">Asli</h3>") && html.includes("Usulan AI"));
          const target = html.match(
            new RegExp(`<form[^>]*id="review-${fourth.id}"[\\s\\S]*?</form>`),
          )?.[0];
          assert.ok(target, "Expected review form missing.");
          const review = serverActionForm(target);
          review.set("company_id", company.id);
          review.set("thought_id", thought.id);
          review.set("refinement_id", fourth.id);
          review.set("status", "ACCEPTED");
          review.set("user_final_content", "");
          const invalid = await app.request(
            `${path}?proposal=${fourth.id}`,
            review,
          );
          const invalidHtml = await invalid.text();
          assert.ok(
            invalidHtml.includes(
              "Permintaan atau teks versi pilihan tidak valid",
            ),
          );
          assert.ok(
            invalidHtml.includes(`id="review-${fourth.id}"`),
            "The selected proposal form must survive a no-JS validation error even when another accepted version exists.",
          );
          review.set(
            "user_final_content",
            "Versi pilihan dari tindakan server; aku belum yakin.",
          );
          assert.equal(
            (await app.request(`${path}?proposal=${fourth.id}`, review)).status,
            303,
          );
          assert.equal(
            (await getRefinement(
              clients[0],
              owner,
              company.id,
              thought.id,
              fourth.id,
            ))!.status,
            "ACCEPTED",
          );
          assert.equal(calls, before);
          const active = await getActiveRefinement(
            clients[0],
            owner,
            company.id,
            thought.id,
            "ACCEPTED",
          );
          assert.equal(active?.id, fourth.id);
          assert.equal(
            active?.user_final_content,
            "Versi pilihan dari tindakan server; aku belum yakin.",
          );
          const queue = await getRefinementQueue(
            clients[0],
            owner,
            company.id,
            [thought.id],
          );
          assert.ok(queue.get(thought.id)?.statuses?.includes("ACCEPTED"));
          const acceptedPage = await app.request(
            `${path}?resolved=${fourth.id}`,
          );
          const acceptedHtml = await acceptedPage.text();
          assert.ok(acceptedHtml.includes(active!.user_final_content!));
          assert.ok(!acceptedHtml.includes(`id="review-${fourth.id}"`));
          const unavailable = await app.request(
            `/companies/${randomUUID()}/refinements`,
          );
          const unavailableHtml = await unavailable.text();
          assert.ok(unavailableHtml.includes("Perusahaan tidak tersedia"));
          assert.ok(!unavailableHtml.includes(company.name));
          const foreignApp = createLocalHttpSession();
          const foreignLogin = serverActionForm(
            await (await foreignApp.request("/auth")).text(),
          );
          foreignLogin.set("email", users[1].email);
          foreignLogin.set("password", users[1].password);
          assert.equal(
            (await foreignApp.request("/auth", foreignLogin)).status,
            303,
          );
          const foreignHub = await (
            await foreignApp.request(`/companies/${company.id}/refinements`)
          ).text();
          assert.ok(foreignHub.includes("Perusahaan tidak tersedia"));
          assert.ok(!foreignHub.includes(company.name));
          assert.ok(!foreignHub.includes(thought.raw_content));
        },
      );
      await t.test(
        "accepted read stays authoritative beyond a full history window; pending queue reads never generate",
        async () => {
          for (let i = 0; i < 21; i++)
            await service(clients[0], { ...input, operation_id: randomUUID() });
          const before = calls;
          const history = await getRefinements(
            clients[0],
            owner,
            company.id,
            thought.id,
          );
          assert.equal(history.refinements.length, 20);
          assert.ok(history.hasMore);
          assert.ok(!history.refinements.some((r) => r.status === "ACCEPTED"));
          assert.equal(
            (
              await getActiveRefinement(
                clients[0],
                owner,
                company.id,
                thought.id,
                "ACCEPTED",
              )
            )?.id,
            fourth.id,
          );
          assert.equal(
            (
              await getRefinement(
                clients[0],
                owner,
                company.id,
                thought.id,
                first.id,
              )
            )?.status,
            "SUPERSEDED",
          );
          assert.equal(
            await getActiveRefinement(
              clients[1],
              users[1].id,
              company.id,
              thought.id,
              "ACCEPTED",
            ),
            null,
          );
          const queue = await getRefinementQueue(
            clients[0],
            owner,
            company.id,
            [thought.id],
          );
          assert.ok(queue.get(thought.id)?.statuses?.includes("ACCEPTED"));
          assert.equal(calls, before);
        },
      );
      await t.test(
        "archive blocks generation, allows review, and source gate rejects archived pre-transmission attempts",
        async () => {
          const pendingProposal = await service(clients[0], {
            ...input,
            operation_id: randomUUID(),
          });
          const op = randomUUID();
          await claimRefinement(clients[0], owner, company.id, thought.id, op);
          await accounting.reserve({
            userId: owner,
            runId: op,
            companyId: company.id,
            role: "REFINE",
            promptVersion: "refine-v1",
            schemaVersion: "refine-schema-v1",
            thoughtIds: [thought.id],
            config,
            maxAttempts: 2,
            outputTokenLimit: 512,
          });
          await archiveCompany(clients[0], owner, company.id);
          const before = calls;
          await assert.rejects(accounting.start(owner, op, 1));
          assert.equal(
            (
              await getRefinementQueue(clients[0], owner, company.id, [
                thought.id,
              ])
            ).get(thought.id)?.pending,
            true,
          );
          await assert.rejects(
            service(clients[0], { ...input, operation_id: randomUUID() }),
          );
          await decision(pendingProposal.id, "REJECTED", null);
          assert.equal(calls, before);
          assert.equal(
            (await getThoughtById(clients[0], owner, company.id, thought.id))!
              .raw_content,
            thought.raw_content,
          );
        },
      );
      await t.test(
        "permanent Thought deletion cascades artifacts and their timeline events but preserves accounting",
        async () => {
          const runs = await admin
            .from("ai_runs")
            .select("id,budget_charge_idr")
            .eq("user_id", owner);
          await deleteOwnedRecord(clients[0], "thought", thought.id, true);
          for (const table of ["refinements", "refinement_requests"]) {
            const rows = await admin
              .from(table)
              .select("id")
              .eq("thought_id", thought.id);
            assert.ok(!rows.error && rows.data.length === 0);
          }
          const history = await admin
            .from("timeline_events")
            .select("id")
            .eq("company_id", company.id);
          assert.ok(!history.error && history.data.length === 0);
          const retained = await admin
            .from("ai_runs")
            .select("id,budget_charge_idr")
            .eq("user_id", owner);
          assert.deepEqual(retained.data, runs.data);
        },
      );
      await t.test(
        "Company deletion removes all descendants and leaves run cost attached to the owner",
        async () => {
          const extra = await createCompany(
            clients[0],
            owner,
            metadata("Synthetic cascade Company"),
          );
          const extraThought = await createThought(clients[0], owner, {
            company_id: extra.id,
            raw_content: "aku belum yakin?",
            capture_operation_id: randomUUID(),
          });
          const proposal = await service(clients[0], {
            company_id: extra.id,
            thought_id: extraThought.id,
            operation_id: randomUUID(),
          });
          await deleteOwnedRecord(
            clients[0],
            "company",
            extra.id,
            true,
            extra.name,
          );
          const child = await admin
            .from("refinements")
            .select("id")
            .eq("id", proposal.id);
          assert.ok(!child.error && child.data.length === 0);
          const run = await admin
            .from("ai_runs")
            .select("company_id,budget_charge_idr")
            .eq("id", proposal.ai_run_id!)
            .single();
          assert.ok(
            !run.error &&
              run.data.company_id === null &&
              run.data.budget_charge_idr > 0,
          );
        },
      );
    } finally {
      for (const user of users)
        assert.ok(
          !(await admin.auth.admin.deleteUser(user.id)).error,
          "Disposable Refine account cleanup failed.",
        );
      for (const user of users)
        for (const table of [
          "refinements",
          "refinement_requests",
          "ai_runs",
          "ai_run_attempts",
          "companies",
          "thoughts",
          "timeline_events",
        ]) {
          const result = await admin
            .from(table)
            .select("user_id")
            .eq("user_id", user.id);
          assert.ok(
            !result.error && result.data.length === 0,
            "Disposable Refine fixture cascade cleanup failed.",
          );
        }
    }
  },
);
