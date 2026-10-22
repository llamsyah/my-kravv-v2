import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import type { TestContext } from "node:test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { v3ApiUrl, v3AppUrl, v3ProjectId } from "../../lib/env/v3.ts";
import { assertCloudExecutionReady } from "../../../scripts/v3/cloud-guards.ts";
import { verifyApiIdentity } from "../../../scripts/v3/guards.ts";
import {
  createFoundationCompany,
  renameFoundationCompany,
  listFoundationCompanies,
} from "../../server/foundation/service.ts";
import { createLocalHttpSession, serverActionForm } from "./live-http.ts";

export type PortableTarget = {
  kind: "local" | "cloud";
  apiUrl: string;
  appUrl: string;
  projectId: string;
  fixturePurpose: string;
};
export type PortableFixtures = {
  clients: SupabaseClient[];
  created: { id: string; user_id: string; name: string }[];
  accounts: { id: string }[];
};

/** API/HTTP assertions separated from SQL. Cloud execution is not authorized yet. */
export async function runPortableFoundationTests(
  t: TestContext,
  target: PortableTarget,
  localSql?: (fixtures: PortableFixtures) => Promise<void>,
) {
  if (target.kind === "cloud") assertCloudExecutionReady();
  assert.equal(target.kind, "local");
  assert.equal(target.apiUrl, v3ApiUrl);
  assert.equal(target.projectId, v3ProjectId);
  assert.equal(target.appUrl, v3AppUrl);
  assert.equal(target.fixturePurpose, "my-kravv-v3-slice0");
  assert.equal(process.env.MY_KRAVV_V3_INTEGRATION, v3ProjectId);
  assert.equal(process.env.MY_KRAVV_TEST_APP_URL, target.appUrl);
  assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, target.apiUrl);
  assert.equal(
    typeof localSql,
    "function",
    "Local SQL coverage must not be omitted.",
  );
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const secret = process.env.SUPABASE_SECRET_KEY!;
  assert.ok(
    key?.startsWith("sb_publishable_") && secret?.startsWith("sb_secret_"),
    "Local keys unavailable.",
  );
  await verifyApiIdentity(key);
  const outgoingOrigins = new Set<string>();
  const localFetch: typeof fetch = async (input, init) => {
    const address = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
    );
    assert.equal(
      address.origin,
      target.apiUrl,
      "Unexpected database target refused.",
    );
    outgoingOrigins.add(address.origin);
    return fetch(input, {
      ...init,
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
  };
  const options = {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: localFetch },
  };
  const admin = createClient(target.apiUrl, secret, options);
  const clients = [
    createClient(target.apiUrl, key, options),
    createClient(target.apiUrl, key, options),
  ];
  const anonymous = createClient(target.apiUrl, key, options);
  const runId = randomUUID();
  const accounts: { id: string; email: string; password: string }[] = [];
  const created: { id: string; user_id: string; name: string }[] = [];
  try {
    for (let index = 0; index < 2; index++) {
      const email = `v3-slice0-${randomUUID()}@example.invalid`;
      const password = randomBytes(32).toString("base64url");
      const user = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { purpose: target.fixturePurpose, test_run: runId },
      });
      assert.ok(
        !user.error && user.data.user,
        "Synthetic account creation failed.",
      );
      accounts.push({ id: user.data.user!.id, email, password });
      const login = await clients[index].auth.signInWithPassword({
        email,
        password,
      });
      assert.ok(
        !login.error && login.data.user?.id === accounts[index].id,
        "Synthetic login failed.",
      );
      created.push(
        await createFoundationCompany(
          clients[index],
          `Synthetic owner ${index}-${randomUUID()}`,
        ),
      );
    }

    await t.test(
      "anonymous data access/mutation denied; public identity contains no research",
      async () => {
        assert.ok(
          (await anonymous.from("companies").select("id")).error,
          "Anonymous read unexpectedly allowed.",
        );
        assert.ok(
          (
            await anonymous
              .from("companies")
              .insert({ user_id: accounts[0].id, name: "Forbidden" })
          ).error,
        );
        const proof = await anonymous.rpc("v3_target_identity");
        assert.ok(!proof.error && proof.data.project_id === target.projectId);
        assert.deepEqual(Object.keys(proof.data).sort(), [
          "project_id",
          "purpose",
          "schema_version",
        ]);
      },
    );

    await t.test(
      "two users read/mutate only owned rows and cannot forge ownership",
      async () => {
        for (let index = 0; index < 2; index++) {
          const own = await listFoundationCompanies(clients[index]);
          assert.ok(own.some((row) => row.id === created[index].id));
          assert.ok(own.every((row) => row.user_id === accounts[index].id));
          const foreign = created[1 - index];
          const read = await clients[index]
            .from("companies")
            .select("id")
            .eq("id", foreign.id);
          assert.ok(!read.error && read.data?.length === 0);
          const update = await clients[index]
            .from("companies")
            .update({ name: "Forbidden" })
            .eq("id", foreign.id)
            .select("id");
          assert.ok(!update.error && update.data?.length === 0);
          assert.ok(
            (
              await clients[index].from("companies").insert({
                user_id: accounts[1 - index].id,
                name: "Forged owner",
              })
            ).error,
          );
          assert.ok(
            (
              await clients[index]
                .from("companies")
                .update({ user_id: accounts[1 - index].id })
                .eq("id", created[index].id)
            ).error,
          );
          assert.ok(
            (
              await clients[index]
                .from("user_settings")
                .insert({ user_id: accounts[1 - index].id })
            ).error,
          );
          await assert.rejects(
            () =>
              renameFoundationCompany(clients[index], foreign.id, "Forbidden"),
            /tidak tersedia/,
          );
        }
        await assert.rejects(
          () => renameFoundationCompany(clients[0], "malformed", "No write"),
          /tidak tersedia/,
        );
        await assert.rejects(
          () => createFoundationCompany(clients[0], " "),
          /nama/,
        );
      },
    );

    await localSql!({ clients, created, accounts });

    await t.test(
      "invalid session denied; logout clears client session; fresh reauthentication works",
      async () => {
        const invalid = await clients[0].auth.getUser("invalid.synthetic.jwt");
        assert.ok(invalid.error && !invalid.data.user);
        assert.ok(!(await clients[0].auth.signOut({ scope: "local" })).error);
        await assert.rejects(
          () => listFoundationCompanies(clients[0]),
          /masuk/,
        );
        const again = await clients[0].auth.signInWithPassword({
          email: accounts[0].email,
          password: accounts[0].password,
        });
        assert.ok(!again.error && again.data.user?.id === accounts[0].id);
      },
    );

    await t.test(
      "HTTP login/action/logout/account switching; public-route action cannot bypass identity",
      async () => {
        const http = createLocalHttpSession();
        const noSession = createLocalHttpSession();
        const denied = await noSession.request("/foundation");
        assert.equal(denied.status, 307);
        assert.equal(noSession.redirectPath(denied), "/auth");
        assert.match(denied.headers.get("cache-control")!, /no-store/);
        const login = async (index: number) => {
          const form = serverActionForm(
            await (await http.request("/auth")).text(),
          );
          form.set("email", accounts[index].email);
          form.set("password", accounts[index].password);
          const result = await http.request("/auth", form);
          assert.equal(result.status, 303, "HTTP login did not complete.");
          assert.equal(http.redirectPath(result), "/foundation");
        };
        await login(0);
        let html = await (await http.request("/foundation")).text();
        assert.ok(
          html.includes(created[0].name) && !html.includes(created[1].name),
        );
        assert.ok(
          !html.includes(secret),
          "Privileged credential must never be rendered.",
        );
        const forbidden = serverActionForm(html, "foundation-create");
        const deniedName = `No anonymous write-${randomUUID()}`;
        forbidden.set("name", deniedName);
        forbidden.set("user_id", accounts[0].id);
        // /auth is public in Proxy. The foundation action must verify identity itself.
        const actionDenied = await noSession.request("/auth", forbidden);
        assert.equal(
          actionDenied.status,
          200,
          "Public-route action must execute and return its safe denial.",
        );
        assert.ok(
          (await actionDenied.text()).includes("Silakan masuk kembali."),
          "Expected action-level authentication denial was absent.",
        );
        const absent = await admin
          .from("companies")
          .select("id")
          .eq("name", deniedName);
        assert.ok(
          !absent.error && absent.data?.length === 0,
          "Public-route action bypassed identity.",
        );
        const create = serverActionForm(html, "foundation-create");
        const actionName = `Owned action-${randomUUID()}`;
        create.set("name", actionName);
        create.set("user_id", accounts[1].id);
        const saved = await http.request("/foundation", create);
        assert.equal(saved.status, 200);
        await saved.text();
        const actionRow = await admin
          .from("companies")
          .select("user_id")
          .eq("name", actionName)
          .single();
        assert.ok(
          !actionRow.error && actionRow.data?.user_id === accounts[0].id,
          "Action trusted forged owner.",
        );
        html = await (await http.request("/foundation")).text();
        const rename = serverActionForm(html, `rename-${created[0].id}`);
        rename.set("company_id", created[1].id);
        rename.set("name", "Forbidden foreign rename");
        await (await http.request("/foundation", rename)).text();
        const unchanged = await admin
          .from("companies")
          .select("name")
          .eq("id", created[1].id)
          .single();
        assert.ok(!unchanged.error && unchanged.data?.name === created[1].name);
        assert.equal((await http.request("/companies")).status, 404);
        const logout = serverActionForm(html);
        const signedOut = await http.request("/foundation", logout);
        assert.equal(signedOut.status, 303);
        assert.equal(http.redirectPath(signedOut), "/auth");
        assert.equal((await http.request("/foundation")).status, 307);
        await login(1);
        html = await (await http.request("/foundation")).text();
        assert.ok(
          html.includes(created[1].name) &&
            !html.includes(created[0].name) &&
            !html.includes(actionName),
        );
      },
    );
    assert.deepEqual(
      [...outgoingOrigins],
      [target.apiUrl],
      "Only the identified V3 endpoint may be contacted.",
    );
  } finally {
    // Each account must still be the exact marked synthetic identity before deletion.
    const cleanupFailures: string[] = [];
    for (const account of accounts) {
      const proof = await admin.auth.admin.getUserById(account.id);
      if (
        proof.error ||
        proof.data.user?.email !== account.email ||
        proof.data.user.user_metadata.purpose !== target.fixturePurpose ||
        proof.data.user.user_metadata.test_run !== runId
      ) {
        cleanupFailures.push(
          "Synthetic identity verification failed; cleanup refused.",
        );
        continue;
      }
      const content = await admin
        .from("companies")
        .delete()
        .eq("user_id", account.id);
      if (content.error) {
        cleanupFailures.push("Synthetic Company cleanup failed.");
        continue;
      }
      if ((await admin.auth.admin.deleteUser(account.id)).error)
        cleanupFailures.push("Synthetic account cleanup failed.");
    }
    assert.equal(cleanupFailures.length, 0, cleanupFailures.join(" "));
  }
}
