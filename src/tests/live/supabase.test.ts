import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { test } from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { getPublicSupabaseConfig } from "../../lib/env/public.ts";
import { getSupabaseSecretKey } from "../../server/db/config.ts";
import { ensureUserSettings } from "../../server/db/user-settings.ts";
import {
  authenticatePassword,
  terminateSession,
} from "../../server/auth/operations.ts";
import { createCookieJar } from "../helpers/auth-fixture.ts";

// Opt in only for the development project explicitly named by the task.
// The secret is used solely to create/delete this run's disposable test users.
test(
  "development Supabase authentication and ownership",
  {
    skip: process.env.MY_KRAVV_LIVE_TESTS !== "development",
    timeout: 120000,
  },
  async (t) => {
    const { url, publishableKey } = getPublicSupabaseConfig();
    const admin = createClient(url, getSupabaseSecretKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const createdIds: string[] = [];
    const accounts: { id: string; email: string; password: string }[] = [];
    const nonce = randomUUID();
    try {
      for (const label of ["a", "b"]) {
        const email = `my-kravv-m1-${nonce}-${label}@example.invalid`;
        const password = randomBytes(32).toString("base64url");
        const { data, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            purpose: "MY KRAVV Milestone 1 disposable development verification",
          },
        });
        assert.ok(
          !error && data.user,
          "Temporary development user creation failed (provider details suppressed).",
        );
        createdIds.push(data.user.id);
        accounts.push({ id: data.user.id, email, password });
      }
      const clients = accounts.map((account) => {
        const jar = createCookieJar();
        return {
          account,
          jar,
          client: () =>
            createServerClient(url, publishableKey, { cookies: jar }),
        };
      });
      await t.test(
        "email/password sign-in and fresh server verification",
        async () => {
          for (const { account, client } of clients) {
            const form = new FormData();
            form.set("email", account.email);
            form.set("password", account.password);
            assert.equal(
              (await authenticatePassword(client(), form)).error,
              null,
              "Live sign-in failed.",
            );
            const verified = await client().auth.getUser();
            assert.ok(
              !verified.error && verified.data.user?.id === account.id,
              "Fresh server user verification failed.",
            );
          }
        },
      );
      await t.test(
        "session refresh persists to a subsequent request",
        async () => {
          const { account, client } = clients[0];
          const refresh = await client().auth.refreshSession();
          assert.ok(
            !refresh.error && refresh.data.session,
            "Live session refresh failed.",
          );
          assert.equal(
            (await client().auth.getUser()).data.user?.id,
            account.id,
          );
        },
      );
      const probe = await admin
        .from("user_settings")
        .select("user_id")
        .limit(0);
      const settingsAvailable = !probe.error;
      await t.test("user_settings migration is applied", () => {
        assert.ok(
          settingsAvailable,
          "Apply 20261007000100_user_settings_and_rls.sql to the development project before completing live verification.",
        );
      });
      await t.test(
        "bootstrap is concurrent-safe and preserves existing settings",
        { skip: !settingsAvailable },
        async () => {
          const { account, client } = clients[0];
          await Promise.all([
            ensureUserSettings(client(), account.id),
            ensureUserSettings(client(), account.id),
          ]);
          const updated = await client()
            .from("user_settings")
            .update({ display_name: "Disposable preference test" })
            .eq("user_id", account.id);
          assert.ok(!updated.error, "Own-settings update failed.");
          await ensureUserSettings(client(), account.id);
          const result = await client()
            .from("user_settings")
            .select(
              "user_id,display_name,app_language,guidance_mode,challenge_intensity,theme_key",
            )
            .eq("user_id", account.id);
          assert.ok(
            !result.error && result.data?.length === 1,
            "Bootstrap did not produce exactly one owned row.",
          );
          assert.equal(
            result.data[0].display_name,
            "Disposable preference test",
          );
          assert.equal(result.data[0].app_language, "id-ID");
          assert.equal(result.data[0].guidance_mode, "ADAPTIVE");
          assert.equal(result.data[0].challenge_intensity, "STANDARD");
          assert.equal(result.data[0].theme_key, "HYBRID_KRAVV");
          await ensureUserSettings(clients[1].client(), accounts[1].id);
        },
      );
      await t.test(
        "RLS blocks another user's select/update/insert/delete and owner changes",
        { skip: !settingsAvailable },
        async () => {
          const a = clients[0].client();
          const bId = accounts[1].id;
          const read = await a
            .from("user_settings")
            .select("user_id")
            .eq("user_id", bId);
          assert.ok(
            !read.error && read.data?.length === 0,
            "Cross-user settings were visible.",
          );
          const update = await a
            .from("user_settings")
            .update({ display_name: "Forbidden" })
            .eq("user_id", bId)
            .select("user_id");
          assert.ok(
            !update.error && update.data?.length === 0,
            "Cross-user settings update was allowed.",
          );
          const remove = await a
            .from("user_settings")
            .delete()
            .eq("user_id", bId)
            .select("user_id");
          assert.ok(
            !remove.error && remove.data?.length === 0,
            "Cross-user settings deletion was allowed.",
          );
          // Use a third disposable identity so a uniqueness conflict cannot hide a missing INSERT policy.
          const third = await admin.auth.admin.createUser({
            email: `my-kravv-m1-${nonce}-c@example.invalid`,
            password: randomBytes(32).toString("base64url"),
            email_confirm: true,
            user_metadata: {
              purpose:
                "MY KRAVV Milestone 1 disposable development verification",
            },
          });
          assert.ok(
            !third.error && third.data.user,
            "Third test identity could not be created.",
          );
          createdIds.push(third.data.user.id);
          const ownerChange = await a
            .from("user_settings")
            .update({ user_id: third.data.user.id })
            .eq("user_id", accounts[0].id);
          assert.equal(
            ownerChange.error?.code,
            "42501",
            "UPDATE WITH CHECK did not block an ownership change.",
          );
          const insert = await a
            .from("user_settings")
            .insert({ user_id: third.data.user.id });
          assert.equal(
            insert.error?.code,
            "42501",
            "Cross-user INSERT was not denied by RLS.",
          );
          const anonymous = createClient(url, publishableKey, {
            auth: { persistSession: false },
          });
          const publicRead = await anonymous
            .from("user_settings")
            .select("user_id");
          assert.ok(
            publicRead.error || publicRead.data?.length === 0,
            "Anonymous settings access was allowed.",
          );
          const untouched = await clients[1]
            .client()
            .from("user_settings")
            .select("display_name")
            .eq("user_id", bId)
            .single();
          assert.ok(
            !untouched.error && untouched.data,
            "User B's settings were removed.",
          );
          assert.notEqual(untouched.data.display_name, "Forbidden");
        },
      );
      await t.test(
        "local HTTP login, protected shell, reload, and logout actions",
        { skip: !settingsAvailable },
        async () => {
          const base =
            process.env.MY_KRAVV_TEST_APP_URL ?? "http://127.0.0.1:3000";
          const baseUrl = new URL(base);
          assert.ok(
            ["localhost", "127.0.0.1", "::1"].includes(baseUrl.hostname),
            "App verification is limited to localhost.",
          );
          const jar = new Map<string, string>();
          async function request(path: string, init: RequestInit = {}) {
            const headers = new Headers(init.headers);
            headers.set(
              "cookie",
              Array.from(jar, ([name, value]) => `${name}=${value}`).join("; "),
            );
            const response = await fetch(new URL(path, base), {
              ...init,
              headers,
              redirect: "manual",
              signal: AbortSignal.timeout(15000),
            });
            for (const value of response.headers.getSetCookie()) {
              const [pair] = value.split(";");
              const split = pair.indexOf("=");
              const name = pair.slice(0, split);
              const content = pair.slice(split + 1);
              if (/max-age=0/i.test(value)) jar.delete(name);
              else jar.set(name, content);
            }
            return response;
          }
          function actionForm(html: string) {
            const form = new FormData();
            const formHtml = html.match(/<form\b[\s\S]*?<\/form>/)?.[0];
            assert.ok(
              formHtml,
              "Expected server-rendered authentication form.",
            );
            for (const input of formHtml.matchAll(/<input\b[^>]*>/g)) {
              const name = input[0].match(/name="([^"]*)"/)?.[1];
              if (!name?.startsWith("$ACTION_")) continue;
              const value = input[0].match(/value="([^"]*)"/)?.[1] ?? "";
              form.set(
                name,
                value
                  .replaceAll("&quot;", '"')
                  .replaceAll("&amp;", "&")
                  .replaceAll("&#x27;", "'"),
              );
            }
            assert.ok(
              Array.from(form.keys()).length > 0,
              "Missing progressive-enhancement Server Action fields.",
            );
            return form;
          }
          const anonymous = await request("/");
          assert.equal(anonymous.status, 307);
          assert.equal(
            new URL(anonymous.headers.get("location")!, base).pathname,
            "/auth",
          );
          const auth = await request("/auth");
          assert.equal(auth.status, 200);
          const form = actionForm(await auth.text());
          form.set("email", accounts[0].email);
          form.set("password", accounts[0].password);
          const login = await request("/auth", {
            method: "POST",
            headers: { origin: baseUrl.origin },
            body: form,
          });
          assert.equal(
            login.status,
            303,
            "The actual login Server Action did not redirect.",
          );
          const workspace = await request("/");
          assert.equal(workspace.status, 200);
          const workspaceHtml = await workspace.text();
          assert.ok(
            workspaceHtml.includes("Catat pemikiran"),
            "Authenticated private shell did not render.",
          );
          assert.match(workspace.headers.get("cache-control")!, /no-store/);
          const reload = await request("/");
          assert.ok(
            (await reload.text()).includes("Catat pemikiran"),
            "Authenticated reload failed.",
          );
          const logout = await request("/", {
            method: "POST",
            headers: { origin: baseUrl.origin },
            body: actionForm(workspaceHtml),
          });
          assert.equal(
            logout.status,
            303,
            "The actual logout Server Action did not redirect.",
          );
          assert.equal(
            new URL(logout.headers.get("location")!, base).pathname,
            "/auth",
          );
          assert.equal(
            (await request("/")).status,
            307,
            "Private route remained accessible after logout.",
          );
        },
      );
      await t.test(
        "SDK logout removes cookies and invalidates server entry",
        async () => {
          for (const { client, jar } of clients) {
            assert.equal(
              (await terminateSession(client())).error,
              null,
              "Live logout failed.",
            );
            assert.equal(jar.getAll().length, 0);
            assert.equal((await client().auth.getUser()).data.user, null);
          }
        },
      );
    } finally {
      let cleanupFailed = false;
      for (const id of createdIds) {
        const result = await admin.auth.admin.deleteUser(id);
        if (result.error) cleanupFailed = true;
      }
      assert.ok(
        !cleanupFailed,
        "Temporary development user cleanup failed; inspect only users marked for this verification run.",
      );
    }
  },
);
