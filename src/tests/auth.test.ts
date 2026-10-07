import assert from "node:assert/strict";
import { test } from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextRequest } from "next/server.js";
import {
  authenticatePassword,
  terminateSession,
} from "../server/auth/operations.ts";
import { updateSession } from "../server/auth/proxy.ts";
import { ensureUserSettings } from "../server/db/user-settings.ts";
import {
  createAuthFixture,
  createCookieJar,
  fixtureKey,
  fixtureUrl,
  fixtureUserId,
} from "./helpers/auth-fixture.ts";

function loginForm() {
  const form = new FormData();
  form.set("email", "fixture@example.invalid");
  form.set("password", "  unchanged password  ");
  return form;
}

test("empty/invalid login is rejected before any provider request", async () => {
  const client = createClient(fixtureUrl, fixtureKey, {
    global: {
      fetch: async () => {
        throw new Error("Must not send invalid credentials");
      },
    },
  });
  assert.match(
    (await authenticatePassword(client, new FormData())).error!,
    /email/,
  );
});

test("login provider failures return safe Indonesian feedback", async () => {
  for (const status of [400, 429, 503]) {
    const client = createClient(fixtureUrl, fixtureKey, {
      global: {
        fetch: async () =>
          Response.json(
            { msg: "private-provider-detail", code: "invalid_credentials" },
            { status },
          ),
      },
      auth: { persistSession: false },
    });
    const state = await authenticatePassword(client, loginForm());
    assert.ok(state.error);
    assert.ok(!state.error.includes("private-provider-detail"));
  }
});

test("authenticated identity survives a fresh server client and logout clears cookies", async () => {
  const fixture = createAuthFixture();
  assert.equal(
    (await authenticatePassword(fixture.createClient(), loginForm())).error,
    null,
  );
  assert.ok(fixture.jar.getAll().length > 0);
  assert.equal(
    (await fixture.createClient().auth.getUser()).data.user?.id,
    fixtureUserId,
  );
  assert.equal((await terminateSession(fixture.createClient())).error, null);
  assert.equal(fixture.jar.getAll().length, 0);
  assert.equal((await fixture.createClient().auth.getUser()).data.user, null);
});

test("Proxy rejects anonymous/forged cookies and preserves refreshed cookies", async (t) => {
  const oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const oldKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = fixtureUrl;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = fixtureKey;
  t.after(() => {
    if (oldUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = oldUrl;
    if (oldKey === undefined)
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = oldKey;
  });
  const fixture = createAuthFixture();
  t.mock.method(globalThis, "fetch", fixture.fetcher);
  const anonymous = await updateSession(
    new NextRequest("http://localhost:3000/"),
  );
  assert.equal(anonymous.status, 307);
  assert.equal(anonymous.headers.get("location"), "http://localhost:3000/auth");
  for (const path of [
    "/companies",
    "/companies/new",
    `/companies/${fixtureUserId}`,
    `/companies/${fixtureUserId}/edit`,
  ]) {
    assert.equal(
      (await updateSession(new NextRequest(`http://localhost:3000${path}`)))
        .status,
      307,
    );
  }
  const auth = await updateSession(
    new NextRequest("http://localhost:3000/auth"),
  );
  assert.equal(auth.status, 200);
  await authenticatePassword(fixture.createClient(), loginForm());
  const allowed = await updateSession(
    new NextRequest("http://localhost:3000/", {
      headers: { cookie: fixture.jar.header() },
    }),
  );
  assert.equal(allowed.status, 200);
  assert.match(allowed.headers.get("cache-control")!, /no-store/);
  const cookieName = fixture.jar.getAll()[0].name;
  const forgedSession = {
    ...fixture.session(),
    access_token: fixture.session().access_token + "forged",
  };
  const forgedJar = createCookieJar([
    {
      name: cookieName,
      value:
        "base64-" +
        Buffer.from(JSON.stringify(forgedSession)).toString("base64url"),
    },
  ]);
  assert.equal(
    (
      await updateSession(
        new NextRequest("http://localhost:3000/", {
          headers: { cookie: forgedJar.header() },
        }),
      )
    ).status,
    307,
  );
  const malformedJar = createCookieJar([
    {
      name: cookieName,
      value:
        "base64-" +
        Buffer.from(
          JSON.stringify({ ...fixture.session(), access_token: "invalid.jwt" }),
        ).toString("base64url"),
    },
  ]);
  assert.equal(
    (
      await updateSession(
        new NextRequest("http://localhost:3000/", {
          headers: { cookie: malformedJar.header() },
        }),
      )
    ).status,
    307,
  );
  fixture.expire();
  const expiredJar = createCookieJar([
    {
      name: cookieName,
      value:
        "base64-" +
        Buffer.from(JSON.stringify(fixture.session())).toString("base64url"),
    },
  ]);
  const refreshed = await updateSession(
    new NextRequest("http://localhost:3000/", {
      headers: { cookie: expiredJar.header() },
    }),
  );
  assert.equal(refreshed.status, 200);
  assert.ok(refreshed.cookies.getAll().length > 0);
  assert.ok(fixture.refreshCount() > 0);
  // A fresh request using only response cookies can verify the new session.
  const refreshedJar = createCookieJar(refreshed.cookies.getAll());
  const freshClient = createServerClient(fixtureUrl, fixtureKey, {
    cookies: refreshedJar,
    global: { fetch: fixture.fetcher },
  });
  assert.equal((await freshClient.auth.getUser()).data.user?.id, fixtureUserId);
});

test("bootstrap ignores duplicates, retains existing preferences, and checks returned owner", async () => {
  let row: { user_id: string; display_name: string } | undefined;
  let created = 0;
  const requests: string[] = [];
  const client = createClient(fixtureUrl, fixtureKey, {
    auth: { persistSession: false },
    global: {
      fetch: async (input, init) => {
        const url = new URL(String(input));
        requests.push(url.searchParams.get("user_id") ?? "");
        if (init?.method === "POST") {
          assert.match(
            new Headers(init.headers).get("prefer")!,
            /resolution=ignore-duplicates/,
          );
          const body = JSON.parse(String(init.body));
          assert.deepEqual(body, { user_id: fixtureUserId });
          if (!row) {
            row = {
              user_id: fixtureUserId,
              display_name: "Keep my preference",
            };
            created++;
          }
          return new Response(null, { status: 201 });
        }
        return Response.json({ user_id: row?.user_id });
      },
    },
  });
  await ensureUserSettings(client, fixtureUserId);
  await ensureUserSettings(client, fixtureUserId);
  assert.equal(created, 1);
  assert.equal(row?.display_name, "Keep my preference");
  assert.ok(requests.includes(`eq.${fixtureUserId}`));
  row!.user_id = "22222222-2222-4222-8222-222222222222";
  await assert.rejects(ensureUserSettings(client, fixtureUserId), /verified/);
});

test("bootstrap fails closed on database errors", async () => {
  const client = createClient(fixtureUrl, fixtureKey, {
    auth: { persistSession: false },
    global: {
      fetch: async () =>
        Response.json(
          { code: "42501", message: "private database detail" },
          { status: 403 },
        ),
    },
  });
  await assert.rejects(
    ensureUserSettings(client, fixtureUserId),
    (error: Error) => {
      assert.ok(!error.message.includes("private database detail"));
      return true;
    },
  );
});
