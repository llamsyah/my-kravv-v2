import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import type { SupabaseClient } from "@supabase/supabase-js";
import { test } from "node:test";
import {
  companyMetadataInput,
  parseDirectorySearch,
  directoryHref,
} from "../features/v3-workspace/management-contract.ts";
import {
  companyManagementReady,
  loadCompanyDirectory,
  getManagedCompany,
  saveCompanyMetadata,
  readAccountTheme,
  saveAccountTheme,
} from "../server/foundation/management.ts";
const owner = "20000000-0000-4000-8000-000000000001",
  foreign = "20000000-0000-4000-8000-000000000002";
const id = "10000000-0000-4000-8000-000000000001";
const input = {
  name: "Sintetis",
  ticker: "SYN",
  exchange: "Contoh",
  sector: "Contoh",
  short_note: "Catatan\npribadi",
};
const row = { id, user_id: owner, ...input };
function mock(
  rows: unknown[] = [],
  contract: unknown = 1,
  contractError: object | null = null,
) {
  const calls: unknown[][] = [];
  const client = {
    auth: {
      getUser: async () => ({ data: { user: { id: owner } }, error: null }),
    },
    rpc: async (name: string, params?: unknown) => {
      calls.push(["rpc", name, params]);
      return name === "v3_company_management_contract"
        ? { data: contract, error: contractError }
        : { data: rows.shift(), error: null };
    },
    from(table: string) {
      calls.push(["from", table]);
      const query: Record<string, unknown> = {};
      for (const method of [
        "select",
        "eq",
        "order",
        "range",
        "ilike",
        "insert",
        "update",
      ])
        query[method] = (...args: unknown[]) => {
          calls.push([method, ...args]);
          return query;
        };
      query.then = (resolve: (value: unknown) => void) =>
        resolve(rows.shift() ?? { data: null, error: null });
      query.single = query.maybeSingle = async () =>
        rows.shift() ?? { data: null, error: null };
      return query;
    },
  };
  return { client: client as unknown as SupabaseClient, calls };
}
test("Company metadata has optional bounded text, no V2 taxonomy or client ownership authority", () => {
  assert.deepEqual(
    companyMetadataInput.parse({
      ...input,
      ticker: "  ",
      short_note: "  a\nb  ",
    }),
    { ...input, ticker: null, short_note: "a\nb" },
  );
  for (const bad of [
    { ...input, name: " " },
    { ...input, ticker: "x".repeat(33) },
    { ...input, exchange: "x".repeat(81) },
    { ...input, sector: "x".repeat(121) },
    { ...input, short_note: "x".repeat(2001) },
    { ...input, ticker: "a\nb" },
    { ...input, short_note: "a\0b" },
    { ...input, user_id: foreign },
  ])
    assert.equal(companyMetadataInput.safeParse(bad).success, false);
});
test("Missing management schema allows only the legacy profile; ambiguous capability fails closed", async () => {
  assert.equal(
    await companyManagementReady(mock([], null, { code: "PGRST202" }).client),
    false,
  );
  for (const config of [mock([], 2), mock([], null, { code: "unexpected" })])
    await assert.rejects(() => companyManagementReady(config.client));
  const absent = mock([], null, { code: "PGRST202" });
  await assert.rejects(
    () => saveCompanyMetadata(absent.client, id, input),
    /pembaruan skema/,
  );
  assert.equal(
    absent.calls.some((call) => call[0] === "from"),
    false,
  );
});
test("Legacy directory uses stable bounded pages and literal name search rather than the 100-row cap", async () => {
  const records = Array.from({ length: 25 }, (_, index) => ({
    ...row,
    id: "10000000-0000-4000-8000-" + String(index + 1).padStart(12, "0"),
  }));
  const { client, calls } = mock([{ data: records, error: null }]);
  const result = await loadCompanyDirectory(client, "%_\\,", 2, false);
  assert.equal(result.items.length, 24);
  assert.equal(result.hasNext, true);
  assert.ok(
    calls.some(
      (call) => JSON.stringify(call) === JSON.stringify(["range", 48, 72]),
    ),
  );
  assert.ok(
    calls.some(
      (call) =>
        JSON.stringify(call) === JSON.stringify(["eq", "user_id", owner]),
    ),
  );
  assert.deepEqual(
    calls.find((call) => call[0] === "ilike"),
    ["ilike", "name", "%\\%\\_\\\\,%"],
  );
  const invalid = mock();
  await assert.rejects(() =>
    loadCompanyDirectory(invalid.client, "x", 10001, false),
  );
  assert.equal(invalid.calls.length, 0);
});
test("Management search passes text as RPC data and rejects foreign, duplicate or malformed returned rows", async () => {
  const query = "SYN),user_id.eq.foreign";
  const config = mock([[row]]);
  assert.equal(
    (await loadCompanyDirectory(config.client, query, 0, true)).items[0].ticker,
    "SYN",
  );
  assert.deepEqual(config.calls[0], [
    "rpc",
    "v3_company_directory",
    { p_query: query, p_page: 0 },
  ]);
  for (const records of [
    [{ ...row, user_id: foreign }],
    [row, row],
    [{ id, user_id: owner, name: "x" }],
  ])
    await assert.rejects(() =>
      loadCompanyDirectory(mock([records]).client, "", 0, true),
    );
});
test("Selected company lookup is independent of directory page and always owner-scoped", async () => {
  const config = mock([{ data: row, error: null }]);
  assert.equal((await getManagedCompany(config.client, id, true))?.id, id);
  assert.ok(
    config.calls.some(
      (call) =>
        JSON.stringify(call) === JSON.stringify(["eq", "user_id", owner]),
    ),
  );
  assert.equal(
    await getManagedCompany(
      mock([{ data: null, error: null }]).client,
      id,
      true,
    ),
    undefined,
  );
  await assert.rejects(() =>
    getManagedCompany(
      mock([{ data: { ...row, user_id: foreign }, error: null }]).client,
      id,
      true,
    ),
  );
  await assert.rejects(() =>
    getManagedCompany(
      mock([{ data: { ...row, id: foreign }, error: null }]).client,
      id,
      true,
    ),
  );
});
test("Metadata create/update confirms actual ownership and complete values; writes never change owner or ID", async () => {
  const create = mock([{ data: row, error: null }]);
  assert.equal(
    (await saveCompanyMetadata(create.client, undefined, input)).id,
    id,
  );
  assert.deepEqual(
    create.calls.find((call) => call[0] === "insert"),
    ["insert", { ...input, user_id: owner }],
  );
  const edit = mock([{ data: row, error: null }]);
  await saveCompanyMetadata(edit.client, id, input);
  assert.deepEqual(
    edit.calls.find((call) => call[0] === "update"),
    ["update", input],
  );
  assert.ok(
    edit.calls.some(
      (call) =>
        JSON.stringify(call) === JSON.stringify(["eq", "user_id", owner]),
    ),
  );
  for (const response of [
    { data: { ...row, user_id: foreign }, error: null },
    { data: { ...row, ticker: "different" }, error: null },
    { data: null, error: { message: "PRIVATE DB DETAIL" } },
  ]) {
    await assert.rejects(
      () => saveCompanyMetadata(mock([response]).client, id, input),
      (error) => !String(error).includes("PRIVATE DB DETAIL"),
    );
  }
});
test("Theme uses ordinary owner sessions, theme-only UPDATE, and safe INSERT without ownership upsert", async () => {
  assert.equal(
    await readAccountTheme(mock([{ data: null, error: null }]).client),
    "light",
  );
  await assert.rejects(() =>
    readAccountTheme(
      mock([{ data: { user_id: foreign, theme: "dark" }, error: null }]).client,
    ),
  );
  const edit = mock([
    { data: { user_id: owner }, error: null },
    { data: { user_id: owner, theme: "dark" }, error: null },
  ]);
  assert.equal(await saveAccountTheme(edit.client, "dark"), "dark");
  assert.deepEqual(
    edit.calls.find((call) => call[0] === "update"),
    ["update", { theme: "dark" }],
  );
  const create = mock([
    { data: null, error: null },
    { data: { user_id: owner, theme: "light" }, error: null },
  ]);
  await saveAccountTheme(create.client, "light");
  assert.deepEqual(
    create.calls.find((call) => call[0] === "insert"),
    ["insert", { user_id: owner, theme: "light" }],
  );
  await assert.rejects(() => saveAccountTheme(mock().client, "system"));
});
test("Directory query and pagination URLs reject ambiguous selectors and safely encode query text", () => {
  assert.deepEqual(parseDirectorySearch({ q: ["x", "y"], page: "-1" }), {
    query: "",
    page: 0,
  });
  assert.deepEqual(parseDirectorySearch({ q: " SYN ", page: "2" }), {
    query: "SYN",
    page: 2,
  });
  const url = new URL(
    directoryHref("company", "a&company=bad", 2, id),
    "http://localhost",
  );
  assert.equal(url.searchParams.get("company"), id);
  assert.equal(url.searchParams.get("q"), "a&company=bad");
});
test("Theme preference persists locally and fails safely on invalid or blocked storage", () => {
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    import assert from "node:assert/strict";
    const stored=new Map();
    globalThis.window={localStorage:{getItem:key=>stored.get(key),setItem:(key,value)=>stored.set(key,value)}};
    const first=await import("./src/features/v3-workspace/theme-preference.ts?first");
    assert.equal(first.readThemePreference(),"light"); first.setThemePreference("dark");
    const remount=await import("./src/features/v3-workspace/theme-preference.ts?second");
    assert.equal(remount.readThemePreference(),"dark");
    window.localStorage.getItem=()=>{throw Error("blocked");}; window.localStorage.setItem=()=>{throw Error("blocked");};
    first.setThemePreference("light"); assert.equal(first.readThemePreference(),"light");
    window.localStorage.getItem=()=>"invalid";
    const invalid=await import("./src/features/v3-workspace/theme-preference.ts?invalid"); assert.equal(invalid.readThemePreference(),"light");
  `,
    ],
    { encoding: "utf8", timeout: 10000 },
  );
  assert.equal(result.status, 0, result.stderr);
});
test("Review-only migration is exact-target, additive and preserves restricted SQL/RLS contracts", () => {
  const sql = fs.readFileSync(
    "supabase/v3-company-management/001-company-management.sql",
    "utf8",
  );
  assert.ok(
    sql.indexOf("Refusing unknown V3 environment") <
      sql.indexOf("alter table public.companies"),
  );
  assert.match(sql, /security invoker set search_path = ''/);
  assert.match(sql, /where c.user_id = \(select auth.uid\(\)\)/);
  assert.match(sql, /limit 25 offset p_page \* 24/);
  assert.ok(
    !/security definer|disable row level|grant all|grant delete|drop table|truncate|update \(user_id\)/i.test(
      sql,
    ),
  );
  assert.match(sql, /grant insert \(theme\), update \(theme\)/);
  assert.equal(
    createHash("sha256")
      .update(fs.readFileSync("supabase/v3-cloud/bootstrap.sql"))
      .digest("hex"),
    "3a833df429954f968daacff8ba4c4c54735eaa008f605b75a22a5c9edb1bbee9",
  );
});
