import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import type { SupabaseClient } from "@supabase/supabase-js";
import { test } from "node:test";
import {
  captureInput,
  rawCaptureText,
  parseCapturePage,
  captureHref,
  captureTime,
} from "../features/captures/contract.ts";
import {
  captureSchemaReady,
  createCapture,
  listCaptures,
} from "../server/captures/service.ts";
import { workspaceLocation } from "../features/v3-workspace/model.ts";
const owner = "20000000-0000-4000-8000-000000000001",
  foreign = "20000000-0000-4000-8000-000000000002";
const id = "30000000-0000-4000-8000-000000000001",
  requestId = "40000000-0000-4000-8000-000000000001",
  companyId = "10000000-0000-4000-8000-000000000001";
const input = {
  request_id: requestId,
  raw_text: "  Mengapa?\r\nHipotesis 😀\n\n  ",
  company_id: null as string | null,
};
const row = {
  ...input,
  id,
  user_id: owner,
  created_at: "2026-10-26T04:00:00.000Z",
};
function fixture({
  user = owner as string | null,
  contract = 1 as unknown,
  contractError = null as unknown,
  results = [] as unknown[],
} = {}) {
  const calls: unknown[][] = [];
  const client = {
    auth: {
      getUser: async () => ({
        data: { user: user ? { id: user } : null },
        error: null,
      }),
    },
    rpc: async (name: string, args?: unknown) => {
      calls.push(["rpc", name, args]);
      return name === "v3_capture_contract"
        ? { data: contract, error: contractError }
        : results.shift();
    },
    from(table: string) {
      calls.push(["from", table]);
      const chain: Record<string, unknown> = {};
      for (const method of ["select", "eq", "in", "order", "range"])
        chain[method] = (...args: unknown[]) => {
          calls.push([method, ...args]);
          return chain;
        };
      chain.then = (resolve: (value: unknown) => void) =>
        resolve(results.shift());
      return chain;
    },
  };
  return { client: client as unknown as SupabaseClient, calls };
}
function render(props: object) {
  const result = spawnSync(
    process.execPath,
    [path.resolve("src/tests/helpers/v3-workspace-render.mjs")],
    {
      input: JSON.stringify({
        companies: [],
        location: { view: "captures" },
        ownerId: owner,
        ...props,
      }),
      encoding: "utf8",
      timeout: 20000,
    },
  );
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}
test("Capture validation preserves exact raw Unicode/whitespace and rejects blank, malformed or oversized input", () => {
  assert.deepEqual(captureInput.parse(input), input);
  assert.ok(rawCaptureText.safeParse("😀".repeat(8000)).success);
  for (const text of [
    "",
    " \t\r\n",
    "\u00a0",
    "x".repeat(8001),
    "a\0b",
    "a\ud800b",
  ])
    assert.equal(rawCaptureText.safeParse(text).success, false);
  for (const value of [
    { ...input, user_id: foreign },
    { ...input, company_id: "invalid" },
    { ...input, request_id: "invalid" },
  ])
    assert.equal(captureInput.safeParse(value).success, false);
});
test("Capture route/paging inputs are bounded and UTC timestamp output is deterministic", () => {
  assert.deepEqual(workspaceLocation({ view: "captures" }), {
    view: "captures",
  });
  assert.equal(parseCapturePage("12"), 12);
  for (const value of ["-1", "10001", ["1", "2"], "1.2", "1e2", null])
    assert.equal(parseCapturePage(value), 0);
  assert.equal(captureHref(2), "/foundation?view=captures&capture_page=2");
  assert.throws(() => captureHref(-1));
  assert.match(captureTime(row.created_at), /UTC$/);
});
test("Missing capture schema is honest unavailable; ambiguous capability/auth failures stop before data access", async () => {
  assert.equal(
    await captureSchemaReady(
      fixture({ contract: null, contractError: { code: "PGRST202" } }).client,
    ),
    false,
  );
  for (const options of [
    { contract: 2 },
    { contract: null },
    { contractError: { code: "private-error" } },
    { user: null },
  ]) {
    const f = fixture(options);
    await assert.rejects(() => createCapture(f.client, input));
    assert.equal(
      f.calls.filter((c) => c[1] === "v3_create_capture" || c[0] === "from")
        .length,
      0,
    );
  }
});
test("Capture create supplies only approved RPC args and verifies exact server-generated identity, owner and raw payload", async () => {
  const f = fixture({ results: [{ data: [row], error: null }] });
  assert.deepEqual(await createCapture(f.client, input), row);
  assert.deepEqual(f.calls.at(-1), [
    "rpc",
    "v3_create_capture",
    { p_request_id: requestId, p_raw_text: input.raw_text, p_company_id: null },
  ]);
  assert.equal(
    f.calls.some((c) => c[0] === "from"),
    false,
  );
});
test("Missing/ambiguous/foreign/rewritten create responses never acknowledge success or retry automatically", async () => {
  for (const data of [
    null,
    [],
    [row, row],
    [{ ...row, id: "bad" }],
    [{ ...row, user_id: foreign }],
    [{ ...row, raw_text: input.raw_text.trim() }],
    [{ ...row, company_id: companyId }],
    [{ ...row, request_id: id }],
    [{ ...row, created_at: "invalid" }],
  ]) {
    const f = fixture({ results: [{ data, error: null }] });
    await assert.rejects(() => createCapture(f.client, input));
    assert.equal(f.calls.filter((c) => c[1] === "v3_create_capture").length, 1);
  }
  const f = fixture({
    results: [{ data: null, error: { message: "PRIVATE SERVER DETAIL" } }],
  });
  await assert.rejects(
    () => createCapture(f.client, input),
    (e: unknown) => e instanceof Error && !e.message.includes("PRIVATE"),
  );
});
test("Invalid/forged input never reaches capture mutation", async () => {
  for (const value of [
    { ...input, raw_text: " " },
    { ...input, user_id: foreign },
    { ...input, company_id: "bad" },
  ]) {
    const f = fixture();
    await assert.rejects(() => createCapture(f.client, value));
    assert.equal(f.calls.length, 0);
  }
});
test("Capture inbox uses owner/newest/id ordering and bounded page lookahead", async () => {
  const rows = Array.from({ length: 21 }, (_, i) => ({
    ...row,
    id: `30000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
  }));
  const f = fixture({ results: [{ data: rows, error: null }] });
  const loaded = await listCaptures(f.client, 2);
  assert.equal(loaded.items.length, 20);
  assert.equal(loaded.hasNext, true);
  assert.ok(
    f.calls.some(
      (c) => JSON.stringify(c) === JSON.stringify(["eq", "user_id", owner]),
    ),
  );
  assert.ok(
    f.calls.some(
      (c) =>
        JSON.stringify(c) ===
        JSON.stringify(["order", "created_at", { ascending: false }]),
    ),
  );
  assert.ok(
    f.calls.some(
      (c) =>
        JSON.stringify(c) ===
        JSON.stringify(["order", "id", { ascending: false }]),
    ),
  );
  assert.ok(
    f.calls.some(
      (c) => JSON.stringify(c) === JSON.stringify(["range", 40, 60]),
    ),
  );
});
test("Inbox resolves only current-page owned company associations and rejects missing or foreign metadata", async () => {
  const company = {
    id: companyId,
    user_id: owner,
    name: "Perusahaan Sintetis",
  };
  const f = fixture({
    results: [
      { data: [{ ...row, company_id: companyId }], error: null },
      { data: [company], error: null },
    ],
  });
  assert.equal(
    (await listCaptures(f.client, 0)).items[0].company_name,
    company.name,
  );
  assert.ok(
    f.calls.some(
      (c) => JSON.stringify(c) === JSON.stringify(["in", "id", [companyId]]),
    ),
  );
  for (const data of [
    [],
    [{ ...company, user_id: foreign }],
    [company, company],
  ]) {
    const bad = fixture({
      results: [
        { data: [{ ...row, company_id: companyId }], error: null },
        { data, error: null },
      ],
    });
    await assert.rejects(() => listCaptures(bad.client, 0));
  }
});
test("Malformed, duplicate, foreign or failed capture reads expose no partial projection", async () => {
  for (const data of [
    null,
    [row, row],
    [{ ...row, user_id: foreign }],
    [{ ...row, created_at: "bad" }],
    Array(22).fill(row),
  ]) {
    await assert.rejects(() =>
      listCaptures(fixture({ results: [{ data, error: null }] }).client, 0),
    );
  }
  const denied = fixture({ user: null });
  await assert.rejects(() => listCaptures(denied.client, 0));
  assert.equal(denied.calls.length, 0);
  const invalid = fixture();
  await assert.rejects(() => listCaptures(invalid.client, -1));
  assert.equal(invalid.calls.length, 0);
});
test("Inbox renders full escaped raw text, company distinction, real navigation and newest-page controls", () => {
  const html = render({
    captureState: {
      ready: true,
      failed: false,
      page: 1,
      hasNext: true,
      items: [
        {
          ...row,
          raw_text: "  <script>private</script>\nFull text  ",
          company_id: companyId,
          company_name: "Sintetis",
        },
        { ...row, id: requestId, company_name: null },
      ],
    },
  });
  assert.match(html, /Quick Capture/);
  assert.match(html, /aria-current="page"/);
  assert.ok(html.includes("&lt;script&gt;private&lt;/script&gt;\nFull text  "));
  assert.ok(html.includes("Tanpa perusahaan"));
  assert.ok(html.includes("Sintetis"));
  assert.ok(html.includes("Lebih baru") && html.includes("Lebih lama"));
  assert.ok(!html.includes("<script>private"));
  assert.ok(!html.includes("Hapus catatan"));
});
test("Schema-pending, load-error and empty inbox states are distinct and cannot fabricate saved content", () => {
  for (const [state, message] of [
    [{ ready: false, failed: false }, "menunggu pembaruan skema"],
    [{ ready: false, failed: true }, "Penampungan belum dapat dimuat"],
    [{ ready: true, failed: false }, "Ruang untuk ide yang belum selesai"],
  ] as const) {
    const html = render({
      captureState: { ...state, page: 0, hasNext: false, items: [] },
    });
    assert.ok(html.includes(message));
    if (!state.ready) assert.match(html, /type="submit" disabled/);
  }
});
test("Capture form retries preserve exact request identity; owner changes clear state and reject stale actions", () => {
  const result = spawnSync(
    process.execPath,
    [path.resolve("src/tests/helpers/v3-captures-interaction.mjs")],
    { encoding: "utf8", timeout: 20000 },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /CAPTURE_INTERACTIONS_PASS/);
});
test("Review-only SQL preserves raw text, owner RLS, restrictive composite company FK and least-privilege insert", () => {
  const sql = fs.readFileSync("supabase/v3-captures/001-captures.sql", "utf8");
  assert.match(sql, /begin;[\s\S]*commit;/);
  assert.match(sql, /kjcvgjfwlmyfroiqlbmw/);
  assert.match(
    sql,
    /foreign key \(company_id, user_id\)[\s\S]*?references public.companies\(id, user_id\) on delete restrict/i,
  );
  assert.match(
    sql,
    /grant insert \(user_id, request_id, company_id, raw_text\)/i,
  );
  assert.match(sql, /for key share/i);
  assert.match(sql, /on conflict \(user_id, request_id\) do nothing/i);
  assert.match(sql, /saved.raw_text is distinct from p_raw_text/);
  assert.match(
    sql,
    /values \(owner_id, p_request_id, p_raw_text, p_company_id\)/,
  );
  assert.match(sql, /enable row level security/i);
  assert.equal(
    (sql.match(/security invoker set search_path = ''/g) ?? []).length,
    2,
  );
  assert.doesNotMatch(
    sql,
    /security definer|grant\s+(?:update|delete|all)|on delete (?:cascade|set null)|drop table|truncate/i,
  );
  const verify = fs.readFileSync("supabase/v3-captures/verify.sql", "utf8");
  assert.match(verify, /raise exception 'Ownership policy differs'/);
  assert.match(verify, /has_column_privilege/);
  assert.match(verify, /pg_get_functiondef/);
  assert.match(verify, /pg_get_constraintdef/);
  assert.match(verify, /pg_get_triggerdef/);
  assert.doesNotMatch(
    verify,
    /^\s*(?:insert|update|delete|alter|create|drop|grant|revoke|truncate)\s/im,
  );
});

test("Offline HTTP capture flow exercises real route/actions, idempotent save, account switching and load failures", () => {
  const result = spawnSync(
    process.execPath,
    [path.resolve("src/tests/helpers/v3-application-http.mjs"), "--captures"],
    { encoding: "utf8", timeout: 30000 },
  );
  assert.equal(result.status, 0, result.stderr);
  const evidence = JSON.parse(result.stdout);
  assert.equal(evidence.outcome, "PASS");
  assert.equal(evidence.externalRequests, 0);
  assert.equal(evidence.realNextRuntime, false);
  assert.ok(evidence.assertions >= 160);
});
