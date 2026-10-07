import { createServerClient, type CookieOptions } from "@supabase/ssr";

export const fixtureUrl = "http://127.0.0.1:54321";
export const fixtureKey = "sb_publishable_deterministic-test-key";
export const fixtureUserId = "11111111-1111-4111-8111-111111111111";

export function createCookieJar(
  initial: { name: string; value: string }[] = [],
) {
  const values = new Map(initial.map(({ name, value }) => [name, value]));
  return {
    getAll: () => Array.from(values, ([name, value]) => ({ name, value })),
    setAll: (
      cookies: { name: string; value: string; options: CookieOptions }[],
    ) => {
      for (const { name, value, options } of cookies) {
        if (options.maxAge === 0) values.delete(name);
        else values.set(name, value);
      }
    },
    header: () =>
      Array.from(values, ([name, value]) => `${name}=${value}`).join("; "),
  };
}

export function createAuthFixture() {
  let expiresAt = Math.floor(Date.now() / 1000) + 3600;
  let refreshCount = 0;
  let loggedOut = false;
  const user = {
    id: fixtureUserId,
    aud: "authenticated",
    role: "authenticated",
    email: "fixture@example.invalid",
    app_metadata: {},
    user_metadata: {},
    created_at: "2026-01-01T00:00:00Z",
  };
  function session() {
    const encode = (value: object) =>
      Buffer.from(JSON.stringify(value)).toString("base64url");
    const accessToken = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, exp: expiresAt, iat: expiresAt - 3600, aud: "authenticated" })}.c2lnbmF0dXJl`;
    return {
      access_token: accessToken,
      refresh_token: "fixture-refresh-token",
      token_type: "bearer",
      expires_in: Math.max(expiresAt - Math.floor(Date.now() / 1000), 0),
      expires_at: expiresAt,
      user,
    };
  }
  const fetcher: typeof fetch = async (input, init) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
    );
    const headers = new Headers(init?.headers);
    if (url.pathname === "/auth/v1/token") {
      if (url.searchParams.get("grant_type") === "refresh_token") {
        refreshCount++;
        expiresAt = Math.floor(Date.now() / 1000) + 3600;
      }
      return Response.json(session());
    }
    if (url.pathname === "/auth/v1/user") {
      if (
        loggedOut ||
        headers.get("authorization") !== `Bearer ${session().access_token}`
      ) {
        return Response.json(
          { msg: "Invalid session", code: "bad_jwt" },
          { status: 401 },
        );
      }
      return Response.json(user);
    }
    if (url.pathname === "/auth/v1/logout") {
      loggedOut = true;
      return new Response(null, { status: 204 });
    }
    throw new Error("Unexpected fixture request.");
  };
  const jar = createCookieJar();
  const createClient = () =>
    createServerClient(fixtureUrl, fixtureKey, {
      cookies: jar,
      global: { fetch: fetcher },
    });
  return {
    jar,
    createClient,
    fetcher,
    expire: () => {
      expiresAt = Math.floor(Date.now() / 1000) - 60;
    },
    session,
    refreshCount: () => refreshCount,
  };
}
