import assert from "node:assert/strict";
import { test } from "node:test";
import { createClient } from "@supabase/supabase-js";
import {
  thoughtInputSchema,
  readThoughtForm,
  readThoughtCursor,
  thoughtCursor,
} from "../domain/thought/thought.ts";
import {
  createThought,
  getCompanyThoughts,
  getRecentThoughts,
  getCompanyOverviewThoughts,
} from "../server/db/thoughts.ts";
import { thoughtFailure } from "../features/thoughts/failure.ts";
import {
  fixtureKey,
  fixtureUrl,
  fixtureUserId,
} from "./helpers/auth-fixture.ts";

const companyId = "33333333-3333-4333-8333-333333333333";
const foreignId = "44444444-4444-4444-8444-444444444444";
const thoughtId = "55555555-5555-4555-8555-555555555555";
const original =
  "\n  aku belum yakin…\n\n\tMargin  turun.  <script>alert('x')</script>\r\n  ";
const thought = {
  id: thoughtId,
  user_id: fixtureUserId,
  company_id: companyId,
  raw_content: original,
  intent: null,
  created_at: "2026-10-08T00:00:00.123456+00:00",
};
function database(
  options: {
    archived?: boolean;
    fail?: boolean;
    badOwner?: boolean;
    badParent?: boolean;
    many?: boolean;
  } = {},
) {
  const requests: {
    url: URL;
    method: string;
    body?: Record<string, unknown>;
  }[] = [];
  const client = createClient(fixtureUrl, fixtureKey, {
    auth: { persistSession: false },
    global: {
      fetch: async (resource, init) => {
        const url = new URL(String(resource));
        const method = init?.method ?? "GET";
        const body = init?.body ? JSON.parse(String(init.body)) : undefined;
        requests.push({ url, method, body });
        if (url.pathname.endsWith("/companies")) {
          return Response.json(
            url.searchParams.get("id") === `eq.${companyId}`
              ? {
                  id: companyId,
                  user_id: fixtureUserId,
                  name: "Owned",
                  ticker: null,
                  exchange: null,
                  sector: null,
                  short_note: null,
                  state: options.archived ? "ARCHIVED" : "EXPLORING",
                  archived_at: options.archived ? "2026-10-08T01:00:00Z" : null,
                  created_at: "2026-10-08T00:00:00Z",
                  updated_at: "2026-10-08T00:00:00Z",
                }
              : null,
          );
        }
        if (options.fail)
          return Response.json(
            { message: "SECRET provider detail" },
            { status: 500 },
          );
        const row = {
          ...thought,
          ...(body ?? {}),
          ...(options.badOwner ? { user_id: foreignId } : {}),
          ...(options.badParent ? { company_id: foreignId } : {}),
          company: { name: "Owned" },
        };
        return Response.json(
          method === "POST"
            ? row
            : Array.from({ length: options.many ? 21 : 1 }, () => row),
        );
      },
    },
  });
  return { client, requests };
}
test("Thought validation preserves exact original bytes and ignores forged metadata", () => {
  const value = thoughtInputSchema.parse({
    company_id: companyId,
    raw_content: original,
    user_id: foreignId,
    intent: "EVIDENCE_UPDATE",
  });
  assert.equal(value.raw_content, original);
  assert.ok(!("user_id" in value));
  assert.ok(!("intent" in value));
  for (const raw_content of [
    "",
    " \t\r\n",
    "\u00a0\u3000\ufeff",
    "invalid\0text",
    "x".repeat(100001),
  ])
    assert.ok(
      !thoughtInputSchema.safeParse({ company_id: companyId, raw_content })
        .success,
    );
  assert.ok(
    thoughtInputSchema.safeParse({
      company_id: companyId,
      raw_content: "aku belum ngerti",
    }).success,
  );
  const form = new FormData();
  form.set("company_id", companyId);
  form.set("raw_content", original);
  form.set("user_id", foreignId);
  assert.deepEqual(readThoughtForm(form), {
    company_id: companyId,
    raw_content: original,
  });
  form.set("raw_content", new Blob(["invalid"]));
  assert.ok(!thoughtInputSchema.safeParse(readThoughtForm(form)).success);
});
test("capture derives ownership, verifies parent, preserves text, and keeps identical intentional thoughts", async () => {
  const db = database();
  for (let i = 0; i < 2; i++)
    assert.equal(
      (
        await createThought(db.client, fixtureUserId, {
          company_id: companyId,
          raw_content: original,
          user_id: foreignId,
          id: foreignId,
          created_at: "forged",
        })
      ).raw_content,
      original,
    );
  const writes = db.requests.filter(({ method }) => method === "POST");
  assert.equal(writes.length, 2);
  assert.deepEqual(writes[0].body, {
    user_id: fixtureUserId,
    company_id: companyId,
    raw_content: original,
  });
  assert.ok(
    db.requests.some(
      ({ url }) =>
        url.pathname.endsWith("/companies") &&
        url.searchParams.get("user_id") === `eq.${fixtureUserId}`,
    ),
  );
});
test("foreign, missing, malformed, and archived parent capture fails without a write", async () => {
  for (const id of [foreignId, thoughtId, "bad-id", ""]) {
    const db = database();
    await assert.rejects(
      createThought(db.client, fixtureUserId, {
        company_id: id,
        raw_content: original,
      }),
    );
    assert.ok(db.requests.every(({ method }) => method === "GET"));
  }
  const db = database({ archived: true });
  await assert.rejects(
    createThought(db.client, fixtureUserId, {
      company_id: companyId,
      raw_content: original,
    }),
    /diarsipkan/,
  );
  assert.ok(db.requests.every(({ method }) => method === "GET"));
});
test("history is company/owner scoped with stable timestamp/id ordering and validated keyset pagination", async () => {
  const db = database({ many: true });
  const cursor = readThoughtCursor(thoughtCursor(thought));
  assert.deepEqual(cursor, { created_at: thought.created_at, id: thought.id });
  const page = await getCompanyThoughts(
    db.client,
    fixtureUserId,
    companyId,
    cursor,
  );
  assert.equal(page.thoughts.length, 20);
  assert.equal(page.hasMore, true);
  const query = db.requests.at(-1)!.url.searchParams;
  assert.equal(query.get("user_id"), `eq.${fixtureUserId}`);
  assert.equal(query.get("company_id"), `eq.${companyId}`);
  assert.equal(query.get("order"), "created_at.desc,id.asc");
  assert.ok(query.get("or")?.includes(`id.gt.${thoughtId}`));
  assert.ok(query.get("or")?.includes(thought.created_at));
  assert.equal(readThoughtCursor("invalid|forged,filter"), undefined);
  assert.equal(
    readThoughtCursor([thoughtCursor(thought), "repeated-query"]),
    undefined,
  );
  await assert.rejects(getCompanyThoughts(db.client, fixtureUserId, foreignId));
});
test("retrieval rejects inconsistent owners/parents and preserves archived history", async () => {
  assert.equal(
    (
      await getCompanyThoughts(
        database({ archived: true }).client,
        fixtureUserId,
        companyId,
      )
    ).thoughts[0].raw_content,
    original,
  );
  for (const options of [{ badOwner: true }, { badParent: true }])
    await assert.rejects(
      getCompanyThoughts(database(options).client, fixtureUserId, companyId),
    );
  const db = database();
  assert.equal(
    (await getRecentThoughts(db.client, fixtureUserId))[0].companyName,
    "Owned",
  );
  assert.equal(
    db.requests[0].url.searchParams.get("user_id"),
    `eq.${fixtureUserId}`,
  );
});
test("Overview query is bounded, owner-scoped and uses the unchanged creation ordering", async () => {
  const db = database();
  const rows = await getCompanyOverviewThoughts(
    db.client,
    fixtureUserId,
    companyId,
  );
  assert.equal(rows[0].raw_content, original);
  const query = db.requests.at(-1)!.url.searchParams;
  assert.equal(query.get("limit"), "4");
  assert.equal(query.get("user_id"), `eq.${fixtureUserId}`);
  assert.equal(query.get("company_id"), `eq.${companyId}`);
  assert.equal(query.get("order"), "created_at.desc,id.asc");
  const foreign = database();
  await assert.rejects(
    getCompanyOverviewThoughts(foreign.client, fixtureUserId, foreignId),
  );
  assert.ok(
    foreign.requests.every(({ url }) => !url.pathname.endsWith("/thoughts")),
  );
});
test("failed save retains the unmodified draft and never exposes database error details", async () => {
  const db = database({ fail: true });
  const form = new FormData();
  form.set("raw_content", original);
  let failure: unknown;
  try {
    await createThought(db.client, fixtureUserId, {
      company_id: companyId,
      raw_content: original,
    });
  } catch (error) {
    failure = error;
  }
  assert.ok(failure instanceof Error);
  assert.ok(!failure.message.includes("SECRET"));
  const state = thoughtFailure(failure, form);
  assert.equal(state.raw_content, original);
  assert.match(state.error!, /belum tersimpan/);
  assert.ok(!state.error!.includes("SECRET"));
});
