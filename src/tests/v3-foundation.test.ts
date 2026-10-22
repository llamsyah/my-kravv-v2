import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server.js";
import {
  assertV3PublicTarget,
  v3ApiUrl,
  v3ProjectId,
  refuseLegacyWorkspace,
} from "../lib/env/v3.ts";
import {
  validateDisposable,
  validateStatus,
  isolatedChildEnvironment,
  verifyLayout,
  workdir,
} from "../../scripts/v3/guards.ts";
import { verifyV3DatabaseTarget } from "../server/auth/v3-target.ts";
import { updateSession } from "../server/auth/proxy.ts";
import {
  createFoundationCompany,
  listFoundationCompanies,
  renameFoundationCompany,
} from "../server/foundation/service.ts";
import { createAIProvider } from "../server/ai/provider.ts";
import { fixtureAIConfig } from "./helpers/ai-fixture.ts";

const owner = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const id = "33333333-3333-4333-8333-333333333333";
const identity = {
  project_id: v3ProjectId,
  purpose: "disposable-v3-slice0",
  schema_version: 1,
};

test("V3 target guard refuses missing profile, remote/legacy URLs, URL tricks and alternate workdir", () => {
  assert.doesNotThrow(() => assertV3PublicTarget(v3ProjectId, v3ApiUrl));
  for (const url of [
    "http://127.0.0.1:54321",
    "https://example.supabase.co",
    "http://localhost:55321",
    `${v3ApiUrl}/`,
    "http://127.0.0.1:55321@remote.invalid",
    "http://127.0.0.1:55321?redirect=remote",
  ])
    assert.throws(() => assertV3PublicTarget(v3ProjectId, url), /isolated/);
  assert.throws(() => assertV3PublicTarget(undefined, v3ApiUrl));
  assert.throws(() => verifyLayout(path.resolve(workdir, "..")), /workdir/);
  assert.doesNotThrow(() => verifyLayout());
  assert.throws(refuseLegacyWorkspace, /unavailable/);
});

test("reset/status proofs reject wrong target, incompatible keys and non-synthetic owners", () => {
  assert.doesNotThrow(() =>
    validateDisposable({ identity, foreign_users: 0, unexpected_tables: 0 }),
  );
  for (const proof of [
    { identity, foreign_users: 1, unexpected_tables: 0 },
    { identity, foreign_users: 0, unexpected_tables: 1 },
    {
      identity: { ...identity, project_id: "v2" },
      foreign_users: 0,
      unexpected_tables: 0,
    },
  ])
    assert.throws(() => validateDisposable(proof));
  const status = {
    API_URL: v3ApiUrl,
    PUBLISHABLE_KEY: "sb_publishable_fixture",
    SECRET_KEY: "sb_secret_fixture",
  };
  assert.doesNotThrow(() => validateStatus(status));
  assert.throws(() =>
    validateStatus({ ...status, API_URL: "https://remote.invalid" }),
  );
  assert.throws(() => validateStatus({ ...status, SECRET_KEY: "legacy-jwt" }));
});

test("child environment blanks inherited and future V2 dotenv secrets without changing their files", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "kravv-v3-env-"));
  const content =
    "FUTURE_PRIVATE_TOKEN=never-inherit-this\nNEXT_PUBLIC_SUPABASE_URL=https://remote.invalid\nOPENAI_API_KEY=never-call\n";
  try {
    fs.writeFileSync(path.join(directory, ".env.local"), content);
    const env = isolatedChildEnvironment(directory);
    assert.equal(env.FUTURE_PRIVATE_TOKEN, "");
    assert.equal(env.OPENAI_API_KEY, "");
    assert.equal(env.SUPABASE_SECRET_KEY, "");
    assert.equal(env.NEXT_PUBLIC_SUPABASE_URL, v3ApiUrl);
    assert.equal(
      fs.readFileSync(path.join(directory, ".env.local"), "utf8"),
      content,
    );
  } finally {
    fs.rmSync(directory, { recursive: true });
  }
});

test("wrong database marker and unavailable database fail closed before authentication", async (t) => {
  const previous = { ...process.env };
  Object.assign(process.env, {
    NEXT_PUBLIC_MY_KRAVV_ENV: v3ProjectId,
    NEXT_PUBLIC_SUPABASE_URL: v3ApiUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fixture-marker-key",
  });
  t.after(() => {
    for (const name of [
      "NEXT_PUBLIC_MY_KRAVV_ENV",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    ]) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  });
  let calls = 0;
  const wrong: typeof fetch = async (input, init) => {
    calls++;
    assert.equal(String(input), `${v3ApiUrl}/rest/v1/rpc/v3_target_identity`);
    assert.equal(init?.redirect, "error");
    return Response.json({ ...identity, project_id: "v2" });
  };
  await assert.rejects(() => verifyV3DatabaseTarget(wrong), /identity/);
  assert.equal(calls, 1);
  await assert.rejects(
    () =>
      verifyV3DatabaseTarget(async () => {
        throw Error("private-connection-detail");
      }),
    (error) => !String(error).includes("private-connection-detail"),
  );
  t.mock.method(globalThis, "fetch", wrong);
  const response = await updateSession(
    new NextRequest("http://127.0.0.1:3103/foundation"),
  );
  assert.equal(response.status, 503);
  assert.match(response.headers.get("cache-control")!, /no-store/);
});

test("production AI adapter is disabled even with otherwise valid configuration", () => {
  assert.throws(
    () => createAIProvider(fixtureAIConfig),
    (error) => (error as { code: string }).code === "AI_DISABLED",
  );
});

test("foundation service independently verifies identity; scopes reads/writes; fails safely", async (t) => {
  let rows: unknown = [{ id, user_id: owner, name: "Synthetic" }];
  let failedWrite = false;
  const calls: { url: URL; body?: Record<string, unknown> }[] = [];
  const client = createClient(v3ApiUrl, "sb_publishable_fixture-service-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init) => {
        const url = new URL(String(input));
        calls.push({
          url,
          body: init?.body ? JSON.parse(String(init.body)) : undefined,
        });
        return failedWrite
          ? Response.json(
              { message: "private-database-detail" },
              { status: 403 },
            )
          : Response.json(rows, { status: 200 });
      },
    },
  });
  let authenticated = true;
  t.mock.method(client.auth, "getUser", async () => ({
    data: { user: authenticated ? { id: owner } : null },
    error: null,
  }));
  assert.equal((await listFoundationCompanies(client)).length, 1);
  assert.equal(calls.at(-1)!.url.searchParams.get("user_id"), `eq.${owner}`);
  rows = { id, user_id: owner, name: "Synthetic" };
  await createFoundationCompany(client, "Synthetic");
  assert.deepEqual(calls.at(-1)!.body, { user_id: owner, name: "Synthetic" });
  await renameFoundationCompany(client, id, "Renamed");
  assert.equal(calls.at(-1)!.url.searchParams.get("user_id"), `eq.${owner}`);
  assert.equal(calls.at(-1)!.url.searchParams.get("id"), `eq.${id}`);
  assert.deepEqual(calls.at(-1)!.body, { name: "Renamed" });
  const before = calls.length;
  await assert.rejects(
    () => renameFoundationCompany(client, "bad-id", "Name"),
    /tidak tersedia/,
  );
  assert.equal(calls.length, before);
  authenticated = false;
  await assert.rejects(
    () => createFoundationCompany(client, "Forged"),
    /masuk/,
  );
  assert.equal(calls.length, before);
  authenticated = true;
  rows = [{ id, user_id: other, name: "foreign-private-detail" }];
  await assert.rejects(
    () => listFoundationCompanies(client),
    (error) => !String(error).includes("foreign-private-detail"),
  );
  rows = null;
  await assert.rejects(
    () => renameFoundationCompany(client, id, "Foreign"),
    /tidak tersedia/,
  );
  failedWrite = true;
  for (const write of [
    () => createFoundationCompany(client, "Insert rejected"),
    () => renameFoundationCompany(client, id, "Update rejected"),
  ])
    await assert.rejects(
      write,
      (error) => !String(error).includes("private-database-detail"),
    );
});
