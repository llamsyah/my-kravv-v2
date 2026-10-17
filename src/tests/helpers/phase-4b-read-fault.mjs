/** Test-process-only read failure; never imported by the application. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
assert.equal(process.env.MY_KRAVV_LIVE_TESTS, "development");
const f = JSON.parse(readFileSync(".env.phase-1-visual-fixture.json", "utf8"));
assert.ok(f.phase4b);
const thought = f.refineStates.pending.split("/").at(-2);
const origin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const u = new URL(
    typeof input === "string" || input instanceof URL ? input : input.url,
  );
  const method =
    init?.method ?? (input instanceof Request ? input.method : "GET");
  if (
    method === "GET" &&
    u.origin === origin &&
    u.pathname === "/rest/v1/refinements" &&
    u.searchParams.get("thought_id") === `eq.${thought}` &&
    u.searchParams.get("user_id") === `eq.${f.id}`
  ) {
    return Response.json(
      { message: "Synthetic QA read unavailable" },
      { status: 400 },
    );
  }
  return originalFetch(input, init);
};
