import assert from "node:assert/strict";
import { test } from "node:test";
import { createClient } from "@supabase/supabase-js";
import {
  companyInputSchema,
  readCompanyForm,
  type Company,
} from "../domain/company/company.ts";
import {
  archiveCompany,
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
} from "../server/db/companies.ts";
import {
  fixtureKey,
  fixtureUrl,
  fixtureUserId,
} from "./helpers/auth-fixture.ts";

const otherUser = "22222222-2222-4222-8222-222222222222";
const ownId = "33333333-3333-4333-8333-333333333333";
const otherId = "44444444-4444-4444-8444-444444444444";
const input = {
  name: "Perusahaan tanpa ticker",
  ticker: "",
  exchange: "",
  sector: "",
  short_note: "",
};
function row(id = ownId, user_id = fixtureUserId): Company {
  return {
    id,
    user_id,
    name: "Private company",
    ticker: null,
    exchange: null,
    sector: null,
    short_note: null,
    state: "EXPLORING",
    archived_at: null,
    created_at: "2026-10-08T00:00:00Z",
    updated_at: "2026-10-08T00:00:00Z",
  };
}
function database() {
  const rows = new Map([
    [ownId, row()],
    [otherId, row(otherId, otherUser)],
  ]);
  const mutations: { method: string; body: Record<string, unknown> }[] = [];
  let count = 0;
  const client = createClient(fixtureUrl, fixtureKey, {
    auth: { persistSession: false },
    global: {
      fetch: async (resource, init) => {
        count++;
        const url = new URL(String(resource));
        const method = init?.method ?? "GET";
        const headers = new Headers(init?.headers);
        let selected = [...rows.values()].filter((item) =>
          [...url.searchParams].every(([key, value]) => {
            if (!["id", "user_id", "state"].includes(key)) return true;
            const current = item[key as "id" | "user_id" | "state"];
            return value.startsWith("eq.")
              ? current === value.slice(3)
              : value.startsWith("neq.")
                ? current !== value.slice(4)
                : false;
          }),
        );
        if (method === "POST") {
          const body = JSON.parse(String(init?.body));
          mutations.push({ method, body });
          const created = { ...row(), ...body };
          rows.set(created.id, created);
          selected = [created];
        } else if (method === "PATCH") {
          const body = JSON.parse(String(init?.body));
          mutations.push({ method, body });
          selected = selected.map((item) => {
            const updated = {
              ...item,
              ...body,
              ...(body.state === "ARCHIVED"
                ? { archived_at: "2026-10-08T01:00:00Z" }
                : {}),
            };
            rows.set(updated.id, updated);
            return updated;
          });
        }
        return Response.json(
          headers.get("accept")?.includes("vnd.pgrst.object")
            ? selected[0]
            : selected,
        );
      },
    },
  });
  return { client, rows, mutations, count: () => count };
}
test("Company input accepts incomplete identity and validates bounded user text", () => {
  const value = companyInputSchema.parse({
    ...input,
    name: "  Nama pribadi  ",
    user_id: otherUser,
  });
  assert.equal(value.name, "Nama pribadi");
  assert.equal(value.ticker, null);
  assert.equal(value.state, "EXPLORING");
  assert.ok(!("user_id" in value));
  for (const patch of [
    { name: " " },
    { name: "x".repeat(201) },
    { short_note: "x".repeat(2001) },
    { state: "BUY" },
  ])
    assert.ok(!companyInputSchema.safeParse({ ...input, ...patch }).success);
  const form = new FormData();
  form.set("name", "Private");
  form.set("user_id", otherUser);
  form.set("id", otherId);
  assert.ok(!("user_id" in readCompanyForm(form)));
  assert.ok(!("id" in readCompanyForm(form)));
  form.set("name", new Blob(["invalid"]));
  assert.ok(!companyInputSchema.safeParse(readCompanyForm(form)).success);
});
test("creation assigns verified ownership and ignores forged lifecycle fields", async () => {
  const db = database();
  const created = await createCompany(db.client, fixtureUserId, {
    ...input,
    user_id: otherUser,
    state: "ARCHIVED",
    archived_at: "forged",
    id: otherId,
  });
  assert.equal(created.user_id, fixtureUserId);
  assert.equal(created.state, "EXPLORING");
  assert.equal(created.archived_at, null);
  assert.deepEqual(db.mutations[0].body, {
    name: input.name,
    user_id: fixtureUserId,
    ticker: null,
    exchange: null,
    sector: null,
    short_note: null,
    state: "EXPLORING",
  });
});
test("listing filters owned active/archive records and never returns another owner", async () => {
  const db = database();
  assert.deepEqual(
    (await getCompanies(db.client, fixtureUserId)).map((item) => item.id),
    [ownId],
  );
  await archiveCompany(db.client, fixtureUserId, ownId);
  assert.equal((await getCompanies(db.client, fixtureUserId)).length, 0);
  assert.deepEqual(
    (await getCompanies(db.client, fixtureUserId, true)).map((item) => item.id),
    [ownId],
  );
});
test("workspace lookup treats foreign, nonexistent, and malformed IDs as unavailable", async () => {
  const db = database();
  assert.equal(
    (await getCompanyById(db.client, fixtureUserId, ownId))?.id,
    ownId,
  );
  assert.equal(await getCompanyById(db.client, fixtureUserId, otherId), null);
  assert.equal(
    await getCompanyById(
      db.client,
      fixtureUserId,
      "55555555-5555-4555-8555-555555555555",
    ),
    null,
  );
  const before = db.count();
  assert.equal(
    await getCompanyById(db.client, fixtureUserId, "malformed"),
    null,
  );
  assert.equal(db.count(), before);
});
test("editing is owner-scoped and cannot change ownership or archive via metadata", async () => {
  const db = database();
  const edited = await updateCompany(db.client, fixtureUserId, ownId, {
    ...input,
    name: "Updated",
    state: "REVIEWING",
    user_id: otherUser,
  });
  assert.equal(edited.name, "Updated");
  assert.equal(edited.user_id, fixtureUserId);
  assert.equal(edited.state, "REVIEWING");
  assert.ok(!("user_id" in db.mutations[0].body));
  await assert.rejects(
    updateCompany(db.client, fixtureUserId, otherId, input),
    /tidak tersedia/,
  );
  await assert.rejects(
    updateCompany(db.client, fixtureUserId, ownId, {
      ...input,
      state: "ARCHIVED",
    }),
    /tidak tersedia/,
  );
  assert.equal(db.rows.get(otherId)?.name, "Private company");
});
test("archive preserves data, is idempotent, denies foreign mutations, and stays archived on edit", async () => {
  const db = database();
  const archived = await archiveCompany(db.client, fixtureUserId, ownId);
  assert.equal(archived.state, "ARCHIVED");
  assert.ok(archived.archived_at);
  assert.equal(db.rows.size, 2);
  const before = db.mutations.length;
  assert.deepEqual(
    await archiveCompany(db.client, fixtureUserId, ownId),
    archived,
  );
  assert.equal(db.mutations.length, before);
  await assert.rejects(
    archiveCompany(db.client, fixtureUserId, otherId),
    /tidak tersedia/,
  );
  const edited = await updateCompany(db.client, fixtureUserId, ownId, {
    ...input,
    name: "Archived correction",
    state: "EXPLORING",
  });
  assert.equal(edited.state, "ARCHIVED");
  assert.equal(edited.archived_at, archived.archived_at);
});
test("provider failures do not expose database details or partial company data", async () => {
  const client = createClient(fixtureUrl, fixtureKey, {
    auth: { persistSession: false },
    global: {
      fetch: async () =>
        Response.json(
          { message: "other-user-private-name", code: "42501" },
          { status: 403 },
        ),
    },
  });
  for (const operation of [
    () => createCompany(client, fixtureUserId, input),
    () => getCompanies(client, fixtureUserId),
    () => getCompanyById(client, fixtureUserId, ownId),
  ])
    await assert.rejects(
      operation(),
      (error: Error) => !error.message.includes("other-user-private-name"),
    );
});
