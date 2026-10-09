import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { test } from "node:test";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "../../lib/env/public.ts";
import { getSupabaseSecretKey } from "../../server/db/config.ts";
import { createCompany, archiveCompany } from "../../server/db/companies.ts";
import { createThought } from "../../server/db/thoughts.ts";
import { deleteOwnedRecord } from "../../server/db/data-control.ts";
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
test(
  "development data control and capture idempotency",
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
    const accounts: { id: string; email: string; password: string }[] = [];
    const clients = [
      createClient(url, publishableKey, options),
      createClient(url, publishableKey, options),
    ];
    try {
      const probe = await admin
        .from("thoughts")
        .select("capture_operation_id")
        .limit(0);
      assert.ok(
        !probe.error,
        "Apply Milestone 3.5 migration to the configured development project.",
      );
      for (let i = 0; i < 2; i++) {
        const email = `my-kravv-m35-${randomUUID()}@example.invalid`;
        const password = randomBytes(32).toString("base64url");
        const result = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            purpose: "Milestone 3.5 disposable development verification",
          },
        });
        assert.ok(
          !result.error && result.data.user,
          "Disposable identity setup failed.",
        );
        accounts.push({ id: result.data.user.id, email, password });
        assert.ok(
          !(await clients[i].auth.signInWithPassword({ email, password }))
            .error,
          "Disposable login failed.",
        );
      }
      const owner = accounts[0].id;
      const company = await createCompany(
        clients[0],
        owner,
        metadata("Confirmation Company"),
      );
      const other = await createCompany(
        clients[1],
        accounts[1].id,
        metadata("Foreign Company"),
      );
      const original =
        "\n  Original  reasoning.\r\n\n<script>private</script>  ";
      const operation = randomUUID();
      let thoughtId = "";
      await t.test(
        "concurrent retries produce one unchanged Thought and one atomic event; distinct operation IDs preserve identical intentional captures",
        async () => {
          const input = {
            company_id: company.id,
            raw_content: original,
            capture_operation_id: operation,
          };
          const saved = await Promise.all(
            Array.from({ length: 4 }, () =>
              createThought(clients[0], owner, input),
            ),
          );
          thoughtId = saved[0].id;
          assert.ok(
            saved.every(
              (row) => row.id === thoughtId && row.raw_content === original,
            ),
          );
          const events = await clients[0]
            .from("timeline_events")
            .select("id,created_at")
            .eq("entity_id", thoughtId);
          assert.ok(!events.error);
          assert.equal(events.data?.length, 1);
          assert.equal(events.data![0].created_at, saved[0].created_at);
          const distinct = await createThought(clients[0], owner, {
            ...input,
            capture_operation_id: randomUUID(),
          });
          assert.notEqual(distinct.id, thoughtId);
          const conflict = await clients[0].rpc("capture_thought", {
            p_company_id: company.id,
            p_raw_content: "different",
            p_operation_id: operation,
          });
          assert.equal(conflict.error?.code, "23505");
          const ownerSecond = await createCompany(
            clients[0],
            owner,
            metadata("Another owned Company"),
          );
          const wrongParent = await clients[0].rpc("capture_thought", {
            p_company_id: ownerSecond.id,
            p_raw_content: original,
            p_operation_id: operation,
          });
          assert.equal(wrongParent.error?.code, "23505");
          const separateOwner = await createThought(
            clients[1],
            accounts[1].id,
            {
              company_id: other.id,
              raw_content: original,
              capture_operation_id: operation,
            },
          );
          assert.notEqual(separateOwner.id, thoughtId);
        },
      );
      await t.test(
        "ownership, immutable originals, function privileges and explicit confirmation remain enforced",
        async () => {
          for (const kind of ["thought", "company"] as const)
            await assert.rejects(
              deleteOwnedRecord(
                clients[1],
                kind,
                kind === "thought" ? thoughtId : company.id,
                true,
                company.name,
              ),
            );
          const unconfirmed = await clients[0].rpc("delete_thought", {
            p_thought_id: thoughtId,
            p_confirmed: false,
          });
          assert.equal(unconfirmed.error?.code, "22023");
          const anon = createClient(url, publishableKey, options);
          const anonymous = await anon.rpc("delete_company", {
            p_company_id: company.id,
            p_confirmed: true,
            p_company_name: company.name,
          });
          assert.ok(anonymous.error);
          const edit = await clients[0]
            .from("thoughts")
            .update({
              raw_content: "overwritten",
              capture_operation_id: randomUUID(),
            })
            .eq("id", thoughtId);
          assert.ok(edit.error);
          const rawDelete = await clients[0]
            .from("thoughts")
            .delete()
            .eq("id", thoughtId);
          assert.ok(rawDelete.error);
          const originalAgain = await clients[0]
            .from("thoughts")
            .select("raw_content")
            .eq("id", thoughtId)
            .single();
          assert.equal(originalAgain.data?.raw_content, original);
          const fabricatedHistory = await clients[0]
            .from("timeline_events")
            .delete()
            .eq("entity_id", thoughtId);
          assert.ok(fabricatedHistory.error);
        },
      );
      await t.test(
        "owner Thought deletion removes applicable history atomically without damaging other originals",
        async () => {
          await deleteOwnedRecord(clients[0], "thought", thoughtId, true);
          const thought = await clients[0]
            .from("thoughts")
            .select("id")
            .eq("id", thoughtId);
          const history = await clients[0]
            .from("timeline_events")
            .select("id")
            .eq("entity_id", thoughtId);
          assert.deepEqual(thought.data, []);
          assert.deepEqual(history.data, []);
          const retained = await clients[0]
            .from("thoughts")
            .select("raw_content")
            .eq("company_id", company.id);
          assert.equal(retained.data?.length, 1);
          assert.equal(retained.data![0].raw_content, original);
        },
      );
      await t.test(
        "empty Company deletion and exact-name confirmed Company deletion cascade all active records",
        async () => {
          const empty = await createCompany(
            clients[0],
            owner,
            metadata("Empty"),
          );
          await deleteOwnedRecord(clients[0], "company", empty.id, true);
          const wrong = await clients[0].rpc("delete_company", {
            p_company_id: company.id,
            p_confirmed: true,
            p_company_name: "confirmation company",
          });
          assert.equal(wrong.error?.code, "22023");
          await archiveCompany(clients[0], owner, company.id);
          await deleteOwnedRecord(
            clients[0],
            "company",
            company.id,
            true,
            company.name,
          );
          for (const table of ["companies", "thoughts", "timeline_events"]) {
            const result = await admin
              .from(table)
              .select("id")
              .eq(table === "companies" ? "id" : "company_id", company.id);
            assert.ok(!result.error);
            assert.equal(result.data?.length, 0);
          }
        },
      );
      await t.test(
        "capture/empty-delete races never bypass stronger confirmation or leave children orphaned",
        async () => {
          const race = await createCompany(clients[0], owner, metadata("Race"));
          const [capture, deletion] = await Promise.all([
            clients[0].rpc("capture_thought", {
              p_company_id: race.id,
              p_raw_content: original,
              p_operation_id: randomUUID(),
            }),
            clients[0].rpc("delete_company", {
              p_company_id: race.id,
              p_confirmed: true,
              p_company_name: "",
            }),
          ]);
          const parent = await clients[0]
            .from("companies")
            .select("id")
            .eq("id", race.id);
          const children = await admin
            .from("thoughts")
            .select("id")
            .eq("company_id", race.id);
          const history = await admin
            .from("timeline_events")
            .select("id")
            .eq("company_id", race.id);
          if (!deletion.error) {
            assert.equal(parent.data?.length, 0);
            assert.equal(children.data?.length, 0);
            assert.equal(history.data?.length, 0);
            assert.ok(capture.error);
          } else {
            assert.equal(deletion.error.code, "22023");
            assert.ok(!capture.error);
            assert.equal(parent.data?.length, 1);
            assert.equal(children.data?.length, 1);
            assert.equal(history.data?.length, 1);
          }
        },
      );
      await t.test(
        "committed capture retry remains readable after archive while new captures are denied",
        async () => {
          const archived = await createCompany(
            clients[0],
            owner,
            metadata("Archived retry"),
          );
          const input = {
            company_id: archived.id,
            raw_content: original,
            capture_operation_id: randomUUID(),
          };
          const first = await createThought(clients[0], owner, input);
          await archiveCompany(clients[0], owner, archived.id);
          const retry = await createThought(clients[0], owner, input);
          assert.equal(retry.id, first.id);
          await assert.rejects(
            createThought(clients[0], owner, {
              ...input,
              capture_operation_id: randomUUID(),
            }),
          );
        },
      );
      await t.test(
        "real server forms preserve retry identity, simplify short originals, reject foreign targets and confirm deletion",
        async () => {
          const web = createLocalHttpSession();
          const login = serverActionForm(
            await (await web.request("/auth")).text(),
          );
          login.set("email", accounts[0].email);
          login.set("password", accounts[0].password);
          assert.ok(
            [303, 307].includes((await web.request("/auth", login)).status),
          );
          const httpCompany = await createCompany(
            clients[0],
            owner,
            metadata("HTTP confirmation"),
          );
          const root = `/companies/${httpCompany.id}`;
          const path = `${root}/thoughts`;
          const form = serverActionForm(
            await (await web.request(path)).text(),
            "thought-form",
          );
          const short = "Short original appears only once in visible history.";
          form.set("raw_content", short);
          const first = await web.request(path, form);
          assert.ok([303, 307].includes(first.status));
          const second = await web.request(path, form);
          assert.equal(
            second.headers.get("location"),
            first.headers.get("location"),
          );
          const page = await (await web.request(path)).text();
          const originals = [
            ...page.matchAll(
              /<div class="thought-original">([\s\S]*?)<\/div>/g,
            ),
          ];
          assert.equal(
            originals.filter((match) => match[1] === short).length,
            1,
          );
          const rows = await clients[0]
            .from("thoughts")
            .select("id,capture_operation_id")
            .eq("company_id", httpCompany.id);
          assert.equal(rows.data?.length, 1);
          const savedId = rows.data![0].id;
          const deletion = serverActionForm(page, `delete-${savedId}`);
          const unconfirmed = await web.request(path, deletion);
          assert.equal(unconfirmed.status, 200);
          assert.match(
            await unconfirmed.text(),
            /<details class="delete-disclosure" open="">/,
            "A failed confirmation must leave its error disclosure visible.",
          );
          deletion.set("confirm_delete", "yes");
          deletion.set("company_id", other.id);
          const foreign = await web.request(path, deletion);
          assert.equal(foreign.status, 200);
          assert.match(await foreign.text(), /tidak tersedia di perusahaan/);
          deletion.set("company_id", httpCompany.id);
          assert.ok(
            [303, 307].includes((await web.request(path, deletion)).status),
          );
          const emptyPage = await (await web.request(root)).text();
          const companyDelete = serverActionForm(
            emptyPage,
            "delete-company-form",
          );
          companyDelete.set("confirm_delete", "yes");
          assert.ok(
            [303, 307].includes(
              (await web.request(root, companyDelete)).status,
            ),
          );
        },
      );
    } finally {
      for (const account of accounts) {
        assert.ok(
          !(await admin.auth.admin.deleteUser(account.id)).error,
          "Disposable identity cleanup failed.",
        );
      }
      for (const account of accounts) {
        for (const table of [
          "user_settings",
          "companies",
          "thoughts",
          "timeline_events",
        ]) {
          const result = await admin
            .from(table)
            .select("user_id")
            .eq("user_id", account.id);
          assert.ok(
            !result.error && result.data?.length === 0,
            "Disposable research cleanup failed.",
          );
        }
      }
    }
  },
);
