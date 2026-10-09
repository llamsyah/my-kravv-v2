import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { test } from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { getPublicSupabaseConfig } from "../../lib/env/public.ts";
import { getSupabaseSecretKey } from "../../server/db/config.ts";
import {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  archiveCompany,
} from "../../server/db/companies.ts";
import { createCookieJar } from "../helpers/auth-fixture.ts";
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
  state: "EXPLORING",
});
test(
  "development Company lifecycle, RLS, and protected routes",
  { skip: process.env.MY_KRAVV_LIVE_TESTS !== "development", timeout: 120000 },
  async (t) => {
    const { url, publishableKey } = getPublicSupabaseConfig();
    const admin = createClient(url, getSupabaseSecretKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const ids: string[] = [];
    const accounts: { id: string; email: string; password: string }[] = [];
    const nonce = randomUUID();
    try {
      const probe = await admin.from("companies").select("id").limit(0);
      assert.ok(
        !probe.error,
        "The Company migration must be applied to the configured development project.",
      );
      for (const label of ["a", "b"]) {
        const email = `my-kravv-m2-${nonce}-${label}@example.invalid`;
        const password = randomBytes(32).toString("base64url");
        const result = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            purpose: "MY KRAVV Milestone 2 disposable development verification",
          },
        });
        assert.ok(
          !result.error && result.data.user,
          "Disposable user creation failed (provider details suppressed).",
        );
        ids.push(result.data.user.id);
        accounts.push({ id: result.data.user.id, email, password });
      }
      const clients = accounts.map(() => {
        const jar = createCookieJar();
        return createServerClient(url, publishableKey, { cookies: jar });
      });
      for (let i = 0; i < clients.length; i++) {
        const login = await clients[i].auth.signInWithPassword(accounts[i]);
        assert.ok(!login.error, "Live test sign-in failed.");
      }
      const aId = accounts[0].id;
      const bId = accounts[1].id;
      const a = await createCompany(clients[0], aId, {
        ...metadata("Disposable company A"),
        user_id: bId,
      });
      const b = await createCompany(
        clients[1],
        bId,
        metadata(`Private company B ${nonce}`),
      );
      await t.test(
        "create binds verified ownership and preserves incomplete metadata",
        async () => {
          assert.equal(a.user_id, aId);
          assert.equal(a.ticker, null);
          assert.equal(a.state, "EXPLORING");
          assert.equal(a.archived_at, null);
        },
      );
      await t.test(
        "list/workspace/edit are explicitly owner scoped",
        async () => {
          assert.deepEqual(
            (await getCompanies(clients[0], aId)).map((company) => company.id),
            [a.id],
          );
          assert.equal((await getCompanyById(clients[0], aId, a.id))?.id, a.id);
          assert.equal(await getCompanyById(clients[0], aId, b.id), null);
          assert.equal(
            await getCompanyById(clients[0], aId, randomUUID()),
            null,
          );
          const edited = await updateCompany(clients[0], aId, a.id, {
            ...metadata("Corrected Company A"),
            ticker: "MANUAL",
            state: "REVIEWING",
            user_id: bId,
          });
          assert.equal(edited.user_id, aId);
          assert.equal(edited.ticker, "MANUAL");
          assert.equal(edited.state, "REVIEWING");
          await assert.rejects(
            updateCompany(clients[0], aId, b.id, metadata("Forbidden")),
            /tidak tersedia/,
          );
          await assert.rejects(
            archiveCompany(clients[0], aId, b.id),
            /tidak tersedia/,
          );
        },
      );
      await t.test(
        "database RLS independently denies foreign read/edit/archive/insert and identity changes",
        async () => {
          const read = await clients[0]
            .from("companies")
            .select("id")
            .eq("id", b.id);
          assert.ok(
            !read.error && read.data?.length === 0,
            "Cross-user read was allowed.",
          );
          for (const patch of [{ name: "Forbidden" }, { state: "ARCHIVED" }]) {
            const update = await clients[0]
              .from("companies")
              .update(patch)
              .eq("id", b.id)
              .select("id");
            assert.ok(
              !update.error && update.data?.length === 0,
              "Cross-user mutation was allowed.",
            );
          }
          const forged = await clients[0]
            .from("companies")
            .insert({ name: "Forbidden", user_id: bId });
          assert.equal(
            forged.error?.code,
            "42501",
            "Foreign ownership INSERT was allowed.",
          );
          const transfer = await clients[0]
            .from("companies")
            .update({ user_id: bId })
            .eq("id", a.id);
          assert.equal(
            transfer.error?.code,
            "42501",
            "Ownership mutation was allowed.",
          );
          const remove = await clients[0]
            .from("companies")
            .delete()
            .eq("id", a.id);
          assert.equal(
            remove.error?.code,
            "42501",
            "Ordinary hard deletion was allowed.",
          );
          const anonymous = await createClient(url, publishableKey, {
            auth: { persistSession: false },
          })
            .from("companies")
            .select("id");
          assert.ok(
            anonymous.error || anonymous.data?.length === 0,
            "Anonymous read was allowed.",
          );
          const untouched = await getCompanyById(clients[1], bId, b.id);
          assert.equal(untouched?.name, b.name);
          assert.equal(untouched?.state, "EXPLORING");
        },
      );
      await t.test(
        "archive retains the record/timestamp and archived metadata remains editable",
        async () => {
          const archived = await archiveCompany(clients[0], aId, a.id);
          assert.equal(archived.state, "ARCHIVED");
          assert.ok(archived.archived_at);
          assert.equal(
            (await archiveCompany(clients[0], aId, a.id)).archived_at,
            archived.archived_at,
          );
          assert.equal((await getCompanies(clients[0], aId)).length, 0);
          assert.equal(
            (await getCompanies(clients[0], aId, true))[0]?.id,
            a.id,
          );
          const corrected = await updateCompany(
            clients[0],
            aId,
            a.id,
            metadata("Archived correction"),
          );
          assert.equal(corrected.state, "ARCHIVED");
          assert.equal(corrected.archived_at, archived.archived_at);
        },
      );
      await t.test(
        "HTTP forms create/edit/archive and workspace does not reveal foreign existence",
        async () => {
          const http = createLocalHttpSession();
          for (const path of [
            "/companies",
            "/companies/new",
            `/companies/${a.id}`,
            `/companies/${a.id}/edit`,
            `/companies/${a.id}/thoughts`,
            `/companies/${a.id}/thoughts`,
          ])
            assert.equal((await http.request(path)).status, 307);
          const loginForm = serverActionForm(
            await (await http.request("/auth")).text(),
          );
          loginForm.set("email", accounts[0].email);
          loginForm.set("password", accounts[0].password);
          assert.equal((await http.request("/auth", loginForm)).status, 303);
          const empty = await (await http.request("/companies")).text();
          assert.ok(empty.includes("Mulai dari satu perusahaan."));
          assert.ok(!empty.includes(b.name));
          for (const id of [b.id, randomUUID(), "invalid-id"]) {
            for (const suffix of ["", "/edit", "/thoughts"]) {
              const missing = await (
                await http.request(`/companies/${id}${suffix}`)
              ).text();
              assert.ok(
                missing.includes("Perusahaan tidak tersedia."),
                "Missing/foreign workspace did not return the safe state.",
              );
              assert.ok(
                !missing.includes(b.name),
                "Foreign company metadata leaked.",
              );
            }
          }
          const createHtml = await (
            await http.request("/companies/new")
          ).text();
          const invalidForm = serverActionForm(createHtml, "company-form");
          invalidForm.set("name", " ");
          invalidForm.set("ticker", "RETAINED");
          const invalid = await http.request("/companies/new", invalidForm);
          assert.equal(invalid.status, 200);
          const invalidHtml = await invalid.text();
          assert.ok(invalidHtml.includes("Isi nama perusahaan."));
          assert.ok(
            invalidHtml.includes('value="RETAINED"'),
            "Validation discarded the submitted metadata.",
          );
          const createForm = serverActionForm(createHtml, "company-form");
          createForm.set("name", `HTTP Company ${nonce}`);
          createForm.set("user_id", bId);
          const created = await http.request("/companies/new", createForm);
          assert.equal(created.status, 303);
          const path = http.redirectPath(created);
          const id = path.split("/").at(-1)!;
          const record = await getCompanyById(clients[0], aId, id);
          assert.equal(record?.user_id, aId);
          const workspace = await http.request(path);
          assert.equal(workspace.status, 200);
          assert.match(workspace.headers.get("cache-control")!, /no-store/);
          const editForm = serverActionForm(
            await (await http.request(`${path}/edit`)).text(),
            "company-form",
          );
          const forgedEdit = serverActionForm(
            await (await http.request(`${path}/edit`)).text(),
            "company-form",
          );
          forgedEdit.set("company_id", b.id);
          forgedEdit.set("name", "Forbidden");
          const deniedEdit = await http.request(`${path}/edit`, forgedEdit);
          assert.equal(deniedEdit.status, 200);
          assert.ok(
            (await deniedEdit.text()).includes("Perusahaan tidak tersedia."),
          );
          assert.equal(
            (await getCompanyById(clients[1], bId, b.id))?.name,
            b.name,
          );
          editForm.set("name", "HTTP corrected company");
          editForm.set("short_note", "Manual context only");
          editForm.set("state", "DEVELOPING");
          editForm.set("user_id", bId);
          assert.equal(
            (await http.request(`${path}/edit`, editForm)).status,
            303,
          );
          const changed = await (await http.request(path)).text();
          assert.ok(changed.includes("HTTP corrected company"));
          assert.ok(changed.includes("Manual context only"));
          const archiveForm = serverActionForm(changed, "archive-company-form");
          const forgedArchive = serverActionForm(
            changed,
            "archive-company-form",
          );
          forgedArchive.set("company_id", b.id);
          forgedArchive.set("confirm_archive", "yes");
          const deniedArchive = await http.request(path, forgedArchive);
          assert.equal(deniedArchive.status, 200);
          assert.ok(
            (await deniedArchive.text()).includes("Perusahaan tidak tersedia."),
          );
          assert.equal(
            (await getCompanyById(clients[1], bId, b.id))?.state,
            "EXPLORING",
          );
          const noConfirm = await http.request(path, archiveForm);
          assert.equal(noConfirm.status, 200);
          assert.ok(
            (await noConfirm.text()).includes("Konfirmasikan pengarsipan"),
          );
          archiveForm.set("confirm_archive", "yes");
          assert.equal((await http.request(path, archiveForm)).status, 303);
          const archivedPage = await (await http.request(path)).text();
          assert.ok(
            archivedPage.includes(
              "Capture dan generasi AI baru tidak tersedia.",
            ),
          );
          assert.ok(
            archivedPage.includes(
              "Tidak ada pemikiran tersimpan di ruang arsip ini.",
            ),
          );
          const archivedThoughts = await (
            await http.request(`${path}/thoughts`)
          ).text();
          assert.ok(
            archivedThoughts.includes(
              "Tidak ada pemikiran tersimpan di ruang arsip ini.",
            ),
          );
          assert.ok(!archivedThoughts.includes('id="thought-form"'));
          assert.ok(
            !(await (await http.request("/companies")).text()).includes(
              "HTTP corrected company",
            ),
          );
          assert.ok(
            (
              await (await http.request("/companies?view=archived")).text()
            ).includes("HTTP corrected company"),
          );
          const saved = await getCompanyById(clients[0], aId, id);
          assert.equal(saved?.state, "ARCHIVED");
          assert.ok(saved?.archived_at);
          const finalEdit = await updateCompany(clients[0], aId, id, {
            ...metadata("HTTP corrected company"),
            short_note: "Final owner check",
          });
          assert.equal(finalEdit.user_id, aId);
        },
      );
    } finally {
      let cleanupFailed = false;
      for (const id of ids) {
        const result = await admin.auth.admin.deleteUser(id);
        if (result.error) cleanupFailed = true;
      }
      assert.ok(
        !cleanupFailed,
        "Disposable Company test users could not be removed; inspect this verification run's marked identities.",
      );
      if (ids.length) {
        const leftovers = await admin
          .from("companies")
          .select("id")
          .in("user_id", ids);
        assert.ok(
          !leftovers.error && leftovers.data?.length === 0,
          "Disposable companies remained after cleanup.",
        );
      }
    }
  },
);
