import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { test } from "node:test";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "../../lib/env/public.ts";
import { getSupabaseSecretKey } from "../../server/db/config.ts";
import { createCompany, archiveCompany } from "../../server/db/companies.ts";
import {
  createThought,
  getThoughtById,
  getCompanyThoughts,
} from "../../server/db/thoughts.ts";
import { thoughtCursor } from "../../domain/thought/thought.ts";
import { createAIAccounting } from "../../server/db/ai-runs.ts";
import {
  createRefinementWriter,
  getRefinement,
} from "../../server/db/refinements.ts";
import {
  createRefineService,
  reviewRefinement,
} from "../../server/refinements/service.ts";
import {
  projectThoughts,
  setThoughtDisplay,
  getApprovedDisplayVersions,
} from "../../server/db/thought-display.ts";
import { deleteOwnedRecord } from "../../server/db/data-control.ts";
import { fixtureAIConfig, aiResponse } from "../helpers/ai-fixture.ts";
import { refineResponseText } from "../helpers/refine-fixture.ts";
import {
  createLocalHttpSession,
  serverActionForm,
} from "../helpers/live-http.ts";

test(
  "development persistent display RLS, review independence, conflict and reader actions",
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
    const clients = [
      createClient(url, publishableKey, options),
      createClient(url, publishableKey, options),
    ];
    const users: { id: string; email: string; password: string }[] = [];
    let calls = 0;
    const service = createRefineService({
      configuration: () => ({
        ...fixtureAIConfig,
        outputTokenLimit: 512,
        dailyCallLimit: 60,
        pricingVersion: "synthetic-display-verification",
      }),
      accounting: () => createAIAccounting(admin),
      writer: () => createRefinementWriter(admin),
      provider: () => ({
        async generate() {
          calls++;
          return aiResponse(
            JSON.stringify(
              refineResponseText(
                "  aku belum membaca laporannya.\n\nIni usulan fiktif.  ",
              ),
            ),
          );
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
      assert.ok(
        !(
          await admin
            .from("thought_display_preferences")
            .select("thought_id")
            .limit(0)
        ).error,
        "Apply Phase 4A migration to configured development project.",
      );
      for (let i = 0; i < 2; i++) {
        const email = `my-kravv-display-${randomUUID()}@example.invalid`;
        const password = randomBytes(32).toString("base64url");
        const result = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            purpose: "Disposable Phase 4A mock-provider verification",
          },
        });
        assert.ok(!result.error && result.data.user);
        users.push({ id: result.data.user.id, email, password });
        assert.ok(
          !(await clients[i].auth.signInWithPassword({ email, password }))
            .error,
        );
      }
      const owner = users[0].id;
      const company = await createCompany(
        clients[0],
        owner,
        metadata("Synthetic display workspace"),
      );
      const otherCompany = await createCompany(
        clients[0],
        owner,
        metadata("Synthetic second parent"),
      );
      const foreignCompany = await createCompany(
        clients[1],
        users[1].id,
        metadata("Synthetic foreign parent"),
      );
      const create = (
        index: number,
        companyId = company.id,
        client = clients[0],
      ) =>
        createThought(
          client,
          companyId === foreignCompany.id ? users[1].id : owner,
          {
            company_id: companyId,
            capture_operation_id: randomUUID(),
            raw_content: `  Catatan ${index}: aku belum memeriksa laporannya.\n\nJangan ganti alasan ketidakpastianku.  `,
          },
        );
      const bulk = await clients[0]
        .from("thoughts")
        .insert(
          Array.from({ length: 21 }, (_, i) => ({
            user_id: owner,
            company_id: company.id,
            capture_operation_id: randomUUID(),
            raw_content: `Catatan fiktif halaman ${i}`,
          })),
        )
        .select("id");
      assert.ok(!bulk.error && bulk.data.length === 21);
      const thought = await create(1);
      const secondThought = await create(2, otherCompany.id);
      const foreignThought = await create(3, foreignCompany.id, clients[1]);
      const generate = (
        id = thought.id,
        parent = company.id,
        client = clients[0],
      ) =>
        service(client, {
          company_id: parent,
          thought_id: id,
          operation_id: randomUUID(),
        });
      const review = (
        id: string,
        status: "ACCEPTED" | "REJECTED",
        final: string | null = null,
      ) =>
        reviewRefinement(clients[0], {
          company_id: company.id,
          thought_id: thought.id,
          refinement_id: id,
          status,
          user_final_content: final,
        });
      const projected = async () =>
        (await projectThoughts(clients[0], owner, [thought]))[0].display;
      const choose = (ref: string | null, revision: number) =>
        setThoughtDisplay(clients[0], owner, {
          company_id: company.id,
          thought_id: thought.id,
          source: ref ? "REFINEMENT" : "ORIGINAL",
          refinement_id: ref,
          expected_revision: revision,
        });
      const first = await generate();
      const exactEdited =
        "  aku belum baca laporan arus kasnya.\n\nIni suntinganku sendiri, bukan fakta terverifikasi.  ";
      await t.test(
        "absent preference remains ORIGINAL after edited acceptance",
        async () => {
          assert.equal((await projected()).source, "ORIGINAL");
          await review(first.id, "ACCEPTED", exactEdited);
          const value = await projected();
          assert.equal(value.source, "ORIGINAL");
          assert.equal(value.text, thought.raw_content);
          assert.equal(value.hasApproved, true);
          assert.equal(value.preference, null);
        },
      );
      await t.test(
        "explicit selection, original reset and repeated no-op preserve exact wording and revisions",
        async () => {
          assert.equal((await choose(first.id, 0)).revision, 1);
          assert.equal((await projected()).text, exactEdited);
          assert.equal((await choose(first.id, 1)).revision, 1);
          assert.equal((await choose(null, 1)).revision, 2);
          assert.equal((await projected()).text, thought.raw_content);
          assert.equal((await choose(first.id, 2)).revision, 3);
        },
      );
      const rejected = await generate();
      await review(rejected.id, "REJECTED");
      const later = await generate();
      const latestText =
        "Ini versi diterima yang lebih baru. aku belum melihat laporannya.";
      await t.test(
        "suggesting, rejecting and later accepting never replace saved SUPERSEDED selection",
        async () => {
          assert.equal((await projected()).selected?.id, first.id);
          await review(later.id, "ACCEPTED", latestText);
          const value = await projected();
          assert.equal(value.selected?.id, first.id);
          assert.equal(value.selected?.status, "SUPERSEDED");
          assert.equal(value.text, exactEdited);
          assert.equal(value.preference?.revision, 3);
          assert.equal(
            (
              await getRefinement(
                clients[0],
                owner,
                company.id,
                thought.id,
                first.id,
              )
            )?.user_final_content,
            exactEdited,
          );
        },
      );
      const suggested = await generate();
      const unrelated = await generate(secondThought.id, otherCompany.id);
      const foreign = await generate(
        foreignThought.id,
        foreignCompany.id,
        clients[1],
      );
      await t.test(
        "database rejects suggested, rejected, absent, foreign and cross-parent versions without mutation",
        async () => {
          for (const id of [
            suggested.id,
            rejected.id,
            randomUUID(),
            unrelated.id,
            foreign.id,
          ])
            await assert.rejects(choose(id, 3));
          const rawArgs = {
            p_company_id: company.id,
            p_thought_id: thought.id,
            p_source: "REFINEMENT",
            p_refinement_id: first.id,
            p_expected_revision: 3,
          };
          assert.ok(
            (await clients[1].rpc("set_thought_display", rawArgs)).error,
          );
          assert.ok(
            (
              await clients[0].rpc("set_thought_display", {
                ...rawArgs,
                p_company_id: otherCompany.id,
              })
            ).error,
          );
          assert.ok(
            (
              await clients[0].rpc("set_thought_display", {
                ...rawArgs,
                p_source: "ORIGINAL",
              })
            ).error,
          );
          assert.equal((await projected()).preference?.revision, 3);
        },
      );
      await t.test(
        "RLS and grants block all direct writes, unauthenticated and elevated-key ownerless RPCs",
        async () => {
          const hidden = await clients[1]
            .from("thought_display_preferences")
            .select("*")
            .eq("user_id", owner);
          assert.ok(!hidden.error && hidden.data.length === 0);
          const hiddenBatch = await clients[1].rpc("read_thought_displays", {
            p_thought_ids: [thought.id],
          });
          assert.ok(!hiddenBatch.error && hiddenBatch.data.length === 0);
          for (const c of [clients[0], admin]) {
            assert.ok(
              (
                await c
                  .from("thought_display_preferences")
                  .update({ source: "ORIGINAL", refinement_id: null })
                  .eq("thought_id", thought.id)
              ).error,
            );
            assert.ok(
              (
                await c
                  .from("thought_display_preferences")
                  .delete()
                  .eq("thought_id", thought.id)
              ).error,
            );
            assert.ok(
              (
                await c.from("thought_display_preferences").insert({
                  thought_id: secondThought.id,
                  user_id: owner,
                  company_id: otherCompany.id,
                  source: "ORIGINAL",
                  revision: 1,
                })
              ).error,
            );
          }
          const anon = createClient(url, publishableKey, options);
          const args = {
            p_company_id: company.id,
            p_thought_id: thought.id,
            p_source: "ORIGINAL",
            p_refinement_id: null,
            p_expected_revision: 3,
          };
          assert.ok((await anon.rpc("set_thought_display", args)).error);
          assert.ok((await admin.rpc("set_thought_display", args)).error);
          assert.ok(
            (
              await anon.rpc("read_thought_displays", {
                p_thought_ids: [thought.id],
              })
            ).error,
          );
          assert.ok(
            (
              await clients[0].rpc("read_thought_displays", {
                p_thought_ids: Array.from({ length: 41 }, () => thought.id),
              })
            ).error,
          );
        },
      );
      await t.test(
        "conflicting concurrent choices permit one write and return a safe explicit conflict",
        async () => {
          const contender = createClient(url, publishableKey, options);
          assert.ok(
            !(
              await contender.auth.signInWithPassword({
                email: users[0].email,
                password: users[0].password,
              })
            ).error,
          );
          const rawArgs = {
            p_company_id: company.id,
            p_thought_id: thought.id,
            p_source: "REFINEMENT",
            p_refinement_id: later.id,
            p_expected_revision: 3,
          };
          const results = await Promise.allSettled([
            choose(null, 3),
            (async () => {
              const result = await contender
                .rpc("set_thought_display", rawArgs)
                .retry(false)
                .abortSignal(AbortSignal.timeout(20000))
                .select("*")
                .single();
              if (result.error) {
                t.diagnostic(
                  `Competing save database code: ${result.error.code || "transport-error"}; HTTP ${result.status}`,
                );
                throw { conflict: result.error.code === "PT409" };
              }
              return result.data;
            })(),
          ]);
          assert.equal(
            results.filter((r) => r.status === "fulfilled").length,
            1,
          );
          const failure = results.find(
            (r) => r.status === "rejected",
          ) as PromiseRejectedResult;
          assert.equal(failure.reason.conflict, true);
          assert.equal((await projected()).preference?.revision, 4);
          await choose(first.id, 4);
        },
      );
      await t.test(
        "owned paginated batches preserve creation order and selected text independent of versions",
        async () => {
          const a = await getCompanyThoughts(clients[0], owner, company.id);
          assert.equal(a.thoughts.length, 20);
          assert.equal(a.hasMore, true);
          const displayed = await projectThoughts(
            clients[0],
            owner,
            a.thoughts,
          );
          assert.deepEqual(
            displayed.map((r) => r.id),
            a.thoughts.map((r) => r.id),
          );
          assert.equal(
            displayed.find((r) => r.id === thought.id)?.display.text,
            exactEdited,
          );
          const b = await getCompanyThoughts(clients[0], owner, company.id, {
            created_at: a.thoughts.at(-1)!.created_at,
            id: a.thoughts.at(-1)!.id,
          });
          assert.equal(b.thoughts.length, 2);
          assert.equal(
            new Set([...a.thoughts, ...b.thoughts].map((r) => r.id)).size,
            22,
          );
          assert.equal(
            (await projectThoughts(clients[0], owner, b.thoughts)).length,
            2,
          );
          const choices = await getApprovedDisplayVersions(
            clients[0],
            owner,
            company.id,
            thought.id,
          );
          assert.deepEqual(
            new Set(choices.versions.map((r) => r.id)),
            new Set([first.id, later.id]),
          );
          assert.ok(thoughtCursor(thought).includes(thought.id));
        },
      );
      await t.test(
        "server action, refresh and fresh sessions agree across Home, Overview, history, focus and Refine with no generation",
        async () => {
          const login = async () => {
            const app = createLocalHttpSession();
            const response = await app.request("/auth");
            const form = serverActionForm(await response.text());
            form.set("email", users[0].email);
            form.set("password", users[0].password);
            assert.equal((await app.request("/auth", form)).status, 303);
            return app;
          };
          const app = await login();
          const path = `/companies/${company.id}/thoughts/${thought.id}/refine`;
          const html = (await (await app.request(path)).text()).replaceAll(
            "<!-- -->",
            "",
          );
          assert.ok(html.includes("Ditampilkan · Hasil Refine · Kamu sunting"));
          const form = serverActionForm(html, "thought-display-form");
          form.set("expected_revision", "5");
          form.set("display_version", suggested.id);
          const invalid = await app.request(path, form);
          assert.ok(
            (await invalid.text()).includes("Pilihan belum dapat disimpan"),
          );
          assert.equal((await projected()).preference?.revision, 5);
          form.set("display_version", later.id);
          const saved = await app.request(path, form);
          assert.equal(saved.status, 303);
          assert.ok(saved.headers.get("location")?.includes("displaySaved=6"));
          const reload = (
            await (await app.request(`${path}?displaySaved=6`)).text()
          ).replaceAll("<!-- -->", "");
          assert.ok(reload.includes("Tampilan tersimpan."));
          assert.ok(
            reload.includes("Ditampilkan · Hasil Refine · Kamu sunting"),
          );
          for (const session of [app, await login()])
            for (const route of [
              "/",
              `/companies/${company.id}`,
              `/companies/${company.id}/thoughts`,
              `/companies/${company.id}/thoughts?focus=${thought.id}`,
              `/companies/${company.id}/refinements`,
              path,
            ]) {
              const response = await session.request(route);
              assert.equal(response.status, 200);
              const body = await response.text();
              assert.ok(
                body.includes(latestText),
                `Saved display missing on ${route}`,
              );
              assert.ok(!body.includes("Asli · pilihan belum tersedia"));
            }
          const old = serverActionForm(reload, "thought-display-form");
          old.set("expected_revision", "5");
          old.set("display_version", "ORIGINAL");
          assert.ok(
            (await (await app.request(path, old)).text()).includes(
              "Pilihan sudah berubah",
            ),
          );
          assert.equal((await projected()).preference?.revision, 6);
          assert.equal(
            (await getThoughtById(clients[0], owner, company.id, thought.id))
              ?.raw_content,
            thought.raw_content,
          );
          assert.equal(calls, 6);
        },
      );
      await t.test(
        "archived owned selection remains available, while generation stays blocked",
        async () => {
          await archiveCompany(clients[0], owner, company.id);
          await choose(first.id, 6);
          assert.equal((await projected()).text, exactEdited);
          await choose(null, 7);
          assert.equal((await projected()).text, thought.raw_content);
          await choose(first.id, 8);
          await assert.rejects(generate());
          assert.equal(calls, 6);
        },
      );
      await t.test(
        "selected-refinement deletion fails; Thought/Company cascades remove preferences but preserve accounting",
        async () => {
          const blocked = await admin
            .from("refinements")
            .delete()
            .eq("id", first.id);
          assert.equal(blocked.error?.code, "23503");
          const accounting = await admin
            .from("ai_runs")
            .select("id,budget_charge_idr")
            .eq("user_id", owner)
            .order("id");
          await deleteOwnedRecord(clients[0], "thought", thought.id, true);
          assert.ok(
            !(
              await admin
                .from("thought_display_preferences")
                .select("*")
                .eq("thought_id", thought.id)
            ).data?.length,
          );
          const remaining = await admin
            .from("ai_runs")
            .select("id,budget_charge_idr")
            .eq("user_id", owner)
            .order("id");
          assert.deepEqual(remaining.data, accounting.data);
          await reviewRefinement(clients[0], {
            company_id: otherCompany.id,
            thought_id: secondThought.id,
            refinement_id: unrelated.id,
            status: "ACCEPTED",
            user_final_content: null,
          });
          await setThoughtDisplay(clients[0], owner, {
            company_id: otherCompany.id,
            thought_id: secondThought.id,
            source: "REFINEMENT",
            refinement_id: unrelated.id,
            expected_revision: 0,
          });
          await deleteOwnedRecord(
            clients[0],
            "company",
            otherCompany.id,
            true,
            otherCompany.name,
          );
          const pref = await admin
            .from("thought_display_preferences")
            .select("*")
            .eq("company_id", otherCompany.id);
          assert.ok(!pref.error && pref.data.length === 0);
          const run = await admin
            .from("ai_runs")
            .select("company_id,budget_charge_idr")
            .eq("id", unrelated.ai_run_id!)
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
          "Disposable display cleanup failed.",
        );
      for (const user of users)
        for (const table of [
          "thought_display_preferences",
          "companies",
          "thoughts",
          "refinements",
          "refinement_requests",
          "ai_runs",
          "ai_run_attempts",
          "timeline_events",
          "user_settings",
        ]) {
          const result = await admin
            .from(table)
            .select("user_id")
            .eq("user_id", user.id);
          assert.ok(
            !result.error && result.data.length === 0,
            "Disposable display cascade incomplete.",
          );
        }
    }
  },
);
