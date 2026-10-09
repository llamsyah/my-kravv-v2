import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { test } from "node:test";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "../../lib/env/public.ts";
import { getSupabaseSecretKey } from "../../server/db/config.ts";
import { createCompany, archiveCompany } from "../../server/db/companies.ts";
import {
  createThought,
  getCompanyThoughts,
  getRecentThoughts,
  getCompanyOverviewThoughts,
} from "../../server/db/thoughts.ts";
import {
  readThoughtCursor,
  thoughtCursor,
} from "../../domain/thought/thought.ts";
import {
  createLocalHttpSession,
  serverActionForm,
} from "../helpers/live-http.ts";

const metadata = (name: string) => ({
  name,
  ticker: "",
  exchange: "",
  sector: "",
  short_note: "",
});
const original =
  "\n  Aku belum yakin perusahaan ini punya posisi kuat.  \n\n\tMargin  turun.\r\n<script>alert('private')</script> & belum tahu.  \n";
test(
  "development immutable Raw Thoughts, initial history, RLS, and capture HTTP",
  {
    skip: process.env.MY_KRAVV_LIVE_TESTS !== "development",
    timeout: 150000,
  },
  async (t) => {
    const { url, publishableKey } = getPublicSupabaseConfig();
    const admin = createClient(url, getSupabaseSecretKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const accounts: { id: string; email: string; password: string }[] = [];
    const nonce = randomUUID();
    try {
      for (const table of ["thoughts", "timeline_events"]) {
        const probe = await admin.from(table).select("id").limit(0);
        assert.ok(
          !probe.error,
          "Apply the Thought migration to the configured development project before live verification.",
        );
      }
      for (const label of ["a", "b"]) {
        const email = `my-kravv-m3-${nonce}-${label}@example.invalid`;
        const password = randomBytes(32).toString("base64url");
        const result = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            purpose: "MY KRAVV Milestone 3 disposable development verification",
          },
        });
        assert.ok(
          !result.error && result.data.user,
          "Disposable user creation failed (provider details suppressed).",
        );
        accounts.push({ id: result.data.user.id, email, password });
      }
      const clients = accounts.map(() =>
        createClient(url, publishableKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        }),
      );
      for (let i = 0; i < clients.length; i++)
        assert.ok(
          !(await clients[i].auth.signInWithPassword(accounts[i])).error,
          "Test login failed.",
        );
      const aId = accounts[0].id,
        bId = accounts[1].id;
      const a = await createCompany(
        clients[0],
        aId,
        metadata("Thought Company A"),
      );
      const second = await createCompany(
        clients[0],
        aId,
        metadata("Other owned Company"),
      );
      const b = await createCompany(
        clients[1],
        bId,
        metadata("Private Company B"),
      );
      const captured = await createThought(clients[0], aId, {
        company_id: a.id,
        raw_content: original,
        user_id: bId,
        created_at: "forged",
      });
      const foreign = await createThought(clients[1], bId, {
        company_id: b.id,
        raw_content: `Foreign private thought ${nonce}`,
      });
      await t.test(
        "capture preserves exact multiline original and atomically creates authoritative history",
        async () => {
          assert.equal(captured.raw_content, original);
          assert.equal(captured.user_id, aId);
          assert.equal(captured.intent, null);
          const events = await clients[0]
            .from("timeline_events")
            .select("*")
            .eq("entity_id", captured.id);
          assert.ok(!events.error);
          assert.equal(events.data?.length, 1);
          const event = events.data![0];
          assert.equal(event.user_id, aId);
          assert.equal(event.company_id, a.id);
          assert.equal(event.event_type, "THOUGHT_CREATED");
          assert.equal(event.entity_type, "THOUGHT");
          assert.equal(event.created_at, captured.created_at);
          assert.equal(event.title, "Pemikiran asli disimpan");
          assert.equal(event.summary, null);
          const duplicate = await createThought(clients[0], aId, {
            company_id: a.id,
            raw_content: original,
          });
          assert.notEqual(duplicate.id, captured.id);
        },
      );
      await t.test(
        "fresh requests retrieve company-specific history and cross-user reads remain private",
        async () => {
          const fresh = createClient(url, publishableKey, {
            auth: { persistSession: false },
          });
          assert.ok(!(await fresh.auth.signInWithPassword(accounts[0])).error);
          const history = await getCompanyThoughts(fresh, aId, a.id);
          assert.equal(history.thoughts.length, 2);
          assert.ok(
            history.thoughts.every(
              (thought) => thought.raw_content === original,
            ),
          );
          assert.equal(
            (await getCompanyThoughts(fresh, aId, second.id)).thoughts.length,
            0,
          );
          await assert.rejects(
            getCompanyThoughts(fresh, aId, b.id),
            /tidak tersedia/,
          );
          const read = await clients[0]
            .from("thoughts")
            .select("id")
            .eq("id", foreign.id);
          assert.ok(!read.error);
          assert.deepEqual(read.data, []);
          const historyRead = await clients[0]
            .from("timeline_events")
            .select("id")
            .eq("user_id", bId);
          assert.ok(!historyRead.error);
          assert.deepEqual(historyRead.data, []);
          const anonymous = createClient(url, publishableKey, {
            auth: { persistSession: false },
          });
          for (const table of ["thoughts", "timeline_events"])
            assert.ok(
              (await anonymous.from(table).select("id")).error,
              "Anonymous private access was allowed.",
            );
          assert.ok(
            (await getRecentThoughts(fresh, aId)).every(
              (thought) => thought.user_id === aId,
            ),
          );
          await fresh.auth.signOut();
        },
      );
      await t.test(
        "RLS/constraints deny forged ownership, foreign or missing parents, and blank content",
        async () => {
          for (const values of [
            { user_id: aId, company_id: b.id, raw_content: "forbidden parent" },
            { user_id: bId, company_id: b.id, raw_content: "forged owner" },
            {
              user_id: aId,
              company_id: randomUUID(),
              raw_content: "missing parent",
            },
            {
              user_id: aId,
              company_id: "bad-id",
              raw_content: "malformed parent",
            },
            ...["", " \n\t\r", "\u00a0\u3000\ufeff"].map((raw_content) => ({
              user_id: aId,
              company_id: a.id,
              raw_content,
            })),
          ])
            assert.ok(
              (await clients[0].from("thoughts").insert(values)).error,
              "Invalid direct thought insert was accepted.",
            );
          for (const id of [b.id, randomUUID(), "bad-id", ""])
            await assert.rejects(
              createThought(clients[0], aId, {
                company_id: id,
                raw_content: original,
              }),
            );
          const count = await clients[0]
            .from("timeline_events")
            .select("id")
            .eq("company_id", a.id);
          assert.equal(
            count.data?.length,
            2,
            "Rejected captures fabricated history.",
          );
        },
      );
      await t.test(
        "ordinary API cannot overwrite content/ownership/timestamps or modify/fabricate history",
        async () => {
          for (const id of [captured.id, foreign.id])
            for (const patch of [
              { raw_content: "rewritten" },
              { user_id: bId },
              { company_id: second.id },
              { created_at: "2000-01-01T00:00:00Z" },
            ])
              assert.ok(
                (await clients[0].from("thoughts").update(patch).eq("id", id))
                  .error,
              );
          assert.ok(
            (await clients[0].from("thoughts").delete().eq("id", captured.id))
              .error,
          );
          assert.ok(
            (
              await clients[0].from("thoughts").insert({
                user_id: aId,
                company_id: a.id,
                raw_content: original,
                created_at: "2000-01-01T00:00:00Z",
              })
            ).error,
          );
          assert.ok(
            (
              await clients[0].from("timeline_events").insert({
                user_id: aId,
                company_id: a.id,
                event_type: "THOUGHT_CREATED",
                title: "Forged",
              })
            ).error,
          );
          assert.ok(
            (
              await clients[0]
                .from("timeline_events")
                .update({ title: "Forged" })
                .eq("entity_id", captured.id)
            ).error,
          );
          assert.ok(
            (
              await clients[0]
                .from("timeline_events")
                .delete()
                .eq("entity_id", captured.id)
            ).error,
          );
          assert.equal(
            (await getCompanyThoughts(clients[0], aId, a.id)).thoughts.find(
              (thought) => thought.id === captured.id,
            )?.raw_content,
            original,
          );
        },
      );
      await t.test(
        "equal-timestamp history has deterministic identity ordering and complete keyset pagination",
        async () => {
          const result = await clients[0]
            .from("thoughts")
            .insert(
              Array.from({ length: 23 }, (_, i) => ({
                user_id: aId,
                company_id: second.id,
                raw_content: `Intentional thought ${i}`,
                capture_operation_id: randomUUID(),
              })),
            )
            .select("id,created_at");
          assert.ok(!result.error, "Batch capture failed.");
          assert.equal(
            new Set(result.data!.map((row) => row.created_at)).size,
            1,
          );
          const first = await getCompanyThoughts(clients[0], aId, second.id);
          assert.equal(first.thoughts.length, 20);
          assert.equal(first.hasMore, true);
          const next = await getCompanyThoughts(
            clients[0],
            aId,
            second.id,
            readThoughtCursor(thoughtCursor(first.thoughts.at(-1)!)),
          );
          assert.equal(next.thoughts.length, 3);
          assert.equal(next.hasMore, false);
          const ids = [...first.thoughts, ...next.thoughts].map(
            (thought) => thought.id,
          );
          assert.equal(new Set(ids).size, 23);
          assert.deepEqual(ids, [...ids].sort());
        },
      );
      await t.test(
        "Overview and Pemikiran preserve legacy dispatch, independent targets, and owned boundaries",
        async () => {
          const http = createLocalHttpSession();
          const login = serverActionForm(
            await (await http.request("/auth")).text(),
          );
          login.set("email", accounts[0].email);
          login.set("password", accounts[0].password);
          assert.equal((await http.request("/auth", login)).status, 303);
          const root = `/companies/${second.id}`;
          const path = `${root}/thoughts`;
          const first = await getCompanyThoughts(clients[0], aId, second.id);
          const cursor = thoughtCursor(first.thoughts.at(-1)!);
          const target = first.thoughts[0];
          const overview = await (await http.request(root)).text();
          assert.ok(overview.includes("Pemikiran terakhir"));
          assert.ok(!overview.includes('id="thought-form"'));
          assert.ok(overview.includes('id="data-control"'));
          const previews = await getCompanyOverviewThoughts(
            clients[0],
            aId,
            second.id,
          );
          assert.deepEqual(
            previews.map((row) => row.id),
            first.thoughts.slice(0, 4).map((row) => row.id),
          );
          await assert.rejects(
            getCompanyOverviewThoughts(clients[0], aId, b.id),
          );
          for (const [query, expected] of [
            [
              `before=${encodeURIComponent(cursor)}&focus=${target.id}&saved=${target.id}`,
              `${path}?before=${encodeURIComponent(cursor)}&focus=${target.id}&saved=${target.id}#thought-${target.id}`,
            ],
            ["before=invalid", `${path}#thought-history-title`],
            [
              "before=bad&before=bad&focus=invalid",
              `${path}#thought-history-title`,
            ],
            [
              "deleted=thought",
              `${path}?deleted=thought#thought-history-title`,
            ],
          ]) {
            const response = await http.request(`${root}?${query}`);
            assert.notEqual(response.status, 308);
            const actual = response.headers.get("location");
            if (actual) {
              assert.equal(response.status, 307);
              assert.equal(
                new URL(actual, "http://localhost").href,
                new URL(expected, "http://localhost").href,
              );
            } else {
              // Parent loading boundary may stream Next's temporary redirect.
              assert.equal(response.status, 200);
              const body = await response.text();
              assert.ok(body.includes('id="__next-page-redirect"'));
              assert.ok(body.includes(expected.replaceAll("&", "&amp;")));
            }
          }
          const older = await (
            await http.request(
              `${path}?before=${encodeURIComponent(cursor)}&focus=${target.id}&saved=${target.id}`,
            )
          ).text();
          assert.ok(older.includes('id="linked-thought-title"'));
          assert.ok(older.includes(`id="thought-${target.id}"`));
          assert.ok(older.includes("Pemikiran asli tersimpan."));
          assert.ok(target.capture_operation_id);
          assert.ok(
            older.includes(target.capture_operation_id),
            "Off-page receipt did not carry the persisted operation identity.",
          );
          assert.ok(!older.includes('id="thought-form"'));
          const inside = await (
            await http.request(`${path}?focus=${target.id}`)
          ).text();
          assert.ok(!inside.includes('id="linked-thought-title"'));
          assert.equal(
            inside.match(new RegExp(`id="thought-${target.id}"`, "g"))?.length,
            1,
          );
          for (const id of [foreign.id, captured.id, randomUUID()]) {
            const body = await (
              await http.request(`${path}?focus=${id}&saved=${id}`)
            ).text();
            assert.ok(body.includes("Pemikiran yang dituju tidak tersedia"));
            assert.ok(!body.includes(`id="thought-${id}"`));
            assert.ok(!body.includes(foreign.raw_content));
            assert.ok(!body.includes("Pemikiran asli tersimpan."));
          }
          const detail = await (
            await http.request(
              `/companies/${a.id}/thoughts/${captured.id}/refine`,
            )
          ).text();
          assert.ok(
            detail.includes(
              `/companies/${a.id}/thoughts?focus=${captured.id}#thought-${captured.id}`,
            ),
          );
        },
      );
      await t.test(
        "HTTP capture rejects anonymous/forged inputs, preserves failed drafts, escapes markup, and persists on reload",
        async () => {
          const http = createLocalHttpSession();
          const login = serverActionForm(
            await (await http.request("/auth")).text(),
          );
          login.set("email", accounts[0].email);
          login.set("password", accounts[0].password);
          assert.equal((await http.request("/auth", login)).status, 303);
          const path = `/companies/${a.id}/thoughts`;
          const page = await (await http.request(path)).text();
          const form = serverActionForm(page, "thought-form");
          form.set("raw_content", original);
          const anonymous = createLocalHttpSession();
          assert.equal((await anonymous.request(path, form)).status, 307);
          const blank = serverActionForm(page, "thought-form");
          blank.set("raw_content", " \n\t");
          const invalid = await http.request(path, blank);
          assert.equal(invalid.status, 200);
          assert.ok(
            (await invalid.text()).includes(
              "Tuliskan pemikiranmu terlebih dahulu.",
            ),
          );
          for (const company_id of [b.id, randomUUID(), "invalid-id", ""]) {
            const forged = serverActionForm(page, "thought-form");
            forged.set("company_id", company_id);
            const draft = `  Draf unik yang belum disimpan ${nonce}\n\n\tJangan ubah kata-katanya.  `;
            forged.set("raw_content", draft);
            const denied = await http.request(path, forged);
            assert.equal(denied.status, 200);
            const body = await denied.text();
            assert.ok(
              body.includes("Perusahaan tidak tersedia.") ||
                body.includes("Pilih perusahaan yang tersedia."),
            );
            assert.ok(
              body.includes(`Draf unik yang belum disimpan ${nonce}`),
              "Failed capture discarded original draft.",
            );
          }
          form.set("user_id", bId);
          const saved = await http.request(path, form);
          assert.equal(saved.status, 303);
          const location = saved.headers.get("location")!;
          assert.ok(location.includes("?saved="));
          assert.ok(location.startsWith(`${path}?saved=`));
          const redirected = await (await http.request(location)).text();
          assert.ok(redirected.includes("Pemikiran asli tersimpan."));
          assert.ok(redirected.includes("&lt;script&gt;"));
          assert.ok(!redirected.includes("<script>alert('private')</script>"));
          const resetComposer = redirected.match(
            /<textarea\b[^>]*id="raw-content"[^>]*>([\s\S]*?)<\/textarea>/,
          );
          assert.equal(
            resetComposer?.[1],
            "",
            "Successful capture did not reset the composer.",
          );
          const failureAfterSave = serverActionForm(redirected, "thought-form");
          failureAfterSave.set("company_id", b.id);
          failureAfterSave.set(
            "raw_content",
            "Draf setelah penyimpanan pertama.",
          );
          const failurePage = await http.request(location, failureAfterSave);
          assert.ok(
            (await failurePage.text()).includes(
              "Draf setelah penyimpanan pertama.",
            ),
          );
          const firstHistory = await getCompanyThoughts(
            clients[0],
            aId,
            second.id,
          );
          const olderHistory = await http.request(
            `/companies/${second.id}/thoughts?before=${encodeURIComponent(thoughtCursor(firstHistory.thoughts.at(-1)!))}`,
          );
          const olderBody = await olderHistory.text();
          assert.ok(olderBody.includes("Kembali ke yang terbaru"));
          assert.ok(
            !olderBody.includes(`id="thought-${firstHistory.thoughts[0].id}"`),
          );
          const reload = await (await http.request(path)).text();
          const repeatedQuery = await http.request(
            `${path}?before=invalid&before=invalid`,
          );
          assert.ok(
            (await repeatedQuery.text()).includes("Pemikiran tersimpan"),
          );
          assert.ok(reload.includes("Aku belum yakin"));
          assert.ok(!reload.includes(foreign.raw_content));
          assert.equal(
            (await getCompanyThoughts(clients[0], aId, a.id)).thoughts.length,
            3,
          );
          const home = await (await http.request("/")).text();
          assert.ok(home.includes('id="thought-form"'));
          assert.ok(home.includes("Pemikiran terbaru"));
          const quick = serverActionForm(home, "thought-form");
          quick.set("company_id", a.id);
          quick.set("raw_content", "Pemikiran singkat dari Beranda.");
          assert.equal((await http.request("/", quick)).status, 303);
          const stale = serverActionForm(page, "thought-form");
          // This is a new intentional capture after earlier confirmed saves.
          stale.set("capture_operation_id", randomUUID());
          stale.set(
            "raw_content",
            "Draft tetap utuh setelah arsip.\n  Baris kedua.",
          );
          await archiveCompany(clients[0], aId, a.id);
          const deniedArchived = await http.request(path, stale);
          assert.equal(deniedArchived.status, 200);
          const retainedDraft = await deniedArchived.text();
          assert.ok(retainedDraft.includes("Perusahaan diarsipkan."));
          assert.ok(retainedDraft.includes("Draft tetap utuh setelah arsip."));
          const archived = await (await http.request(path)).text();
          assert.ok(!archived.includes('id="thought-form"'));
          assert.ok(archived.includes("Aku belum yakin"));
        },
      );
      await t.test(
        "archive keeps originals/history readable and denies new capture independently in the database",
        async () => {
          const history = await getCompanyThoughts(clients[0], aId, a.id);
          assert.equal(history.thoughts.length, 4);
          assert.equal(
            history.thoughts.find((thought) => thought.id === captured.id)
              ?.raw_content,
            original,
          );
          await assert.rejects(
            createThought(clients[0], aId, {
              company_id: a.id,
              raw_content: "late thought",
            }),
            /diarsipkan/,
          );
          assert.ok(
            (
              await clients[0].from("thoughts").insert({
                user_id: aId,
                company_id: a.id,
                raw_content: "late direct capture",
              })
            ).error,
          );
          const events = await clients[0]
            .from("timeline_events")
            .select("id")
            .eq("company_id", a.id);
          assert.ok(!events.error);
          assert.equal(events.data?.length, 4);
        },
      );
    } finally {
      let cleanupFailed = false;
      for (const account of accounts)
        if ((await admin.auth.admin.deleteUser(account.id)).error)
          cleanupFailed = true;
      assert.ok(
        !cleanupFailed,
        "Disposable Thought test users could not be removed; inspect this run's marked identities.",
      );
      if (accounts.length)
        for (const table of [
          "companies",
          "thoughts",
          "timeline_events",
          "user_settings",
        ]) {
          const remaining = await admin
            .from(table)
            .select("user_id")
            .in(
              "user_id",
              accounts.map((account) => account.id),
            );
          assert.ok(
            !remaining.error && remaining.data?.length === 0,
            "Disposable private rows remained after account cleanup.",
          );
        }
    }
  },
);
