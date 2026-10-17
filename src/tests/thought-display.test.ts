import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { createClient } from "@supabase/supabase-js";
import type { Thought } from "../domain/thought/thought.ts";
import type { Refinement } from "../domain/refinement/refinement.ts";
import {
  projectThoughtDisplay,
  displayInputSchema,
} from "../domain/thought/display.ts";
import {
  projectThoughts,
  setThoughtDisplay,
  getApprovedDisplayVersions,
} from "../server/db/thought-display.ts";
import {
  fixtureUrl,
  fixtureKey,
  fixtureUserId,
} from "./helpers/auth-fixture.ts";
import { fixtureCompanyId, fixtureThoughtId } from "./helpers/ai-fixture.ts";
const date = "2026-10-09T00:00:00.000Z";
const thought: Thought = {
  id: fixtureThoughtId,
  user_id: fixtureUserId,
  company_id: fixtureCompanyId,
  raw_content: "  aku belum baca.\n\nmasih belum tahu.  ",
  created_at: date,
  intent: null,
};
const approved: Refinement = {
  id: randomUUID(),
  user_id: fixtureUserId,
  company_id: fixtureCompanyId,
  thought_id: fixtureThoughtId,
  status: "ACCEPTED",
  ai_content: "Aku belum membaca, jadi belum tahu.",
  user_final_content: "  aku belum baca laporannya.\n\nmasih belum tahu.  ",
  generation_request_id: randomUUID(),
  ai_run_id: null,
  provider: "groq",
  model: "openai/gpt-oss-20b",
  prompt_version: "refine-v1",
  output_schema_version: "refine-schema-v1",
  warnings: [],
  created_at: date,
  resolved_at: date,
};
const preference = {
  thought_id: thought.id,
  user_id: thought.user_id,
  company_id: thought.company_id,
  source: "REFINEMENT",
  refinement_id: approved.id,
  revision: 1,
  updated_at: date,
};
const result = {
  thought_id: thought.id,
  user_id: thought.user_id,
  company_id: thought.company_id,
  preference,
  selected_refinement: approved,
  has_approved: true,
};
test("no stored preference defaults to exact original even with an accepted alternative", () => {
  const display = projectThoughtDisplay(thought, {
    ...result,
    preference: null,
    selected_refinement: null,
  });
  assert.equal(display.source, "ORIGINAL");
  assert.equal(display.text, thought.raw_content);
  assert.equal(display.hasApproved, true);
});
test("explicit acceptance selection uses exact user edits and survives supersession; ORIGINAL is independent", () => {
  for (const status of ["ACCEPTED", "SUPERSEDED"]) {
    const d = projectThoughtDisplay(thought, {
      ...result,
      selected_refinement: { ...approved, status },
    });
    assert.equal(d.source, "REFINEMENT");
    assert.equal(d.text, approved.user_final_content);
  }
  const original = projectThoughtDisplay(thought, {
    ...result,
    preference: { ...preference, source: "ORIGINAL", refinement_id: null },
    selected_refinement: null,
  });
  assert.equal(original.text, thought.raw_content);
  assert.equal(
    projectThoughtDisplay(thought, {
      ...result,
      selected_refinement: { ...approved, user_final_content: null },
    }).text,
    approved.ai_content,
  );
});
test("missing, suggested, rejected, unrelated and malformed display references produce honest raw recovery", () => {
  for (const patch of [
    { selected_refinement: null },
    {
      selected_refinement: {
        ...approved,
        status: "SUGGESTED",
        resolved_at: null,
      },
    },
    { selected_refinement: { ...approved, status: "REJECTED" } },
    { selected_refinement: { ...approved, user_id: randomUUID() } },
    { selected_refinement: { ...approved, company_id: randomUUID() } },
    { selected_refinement: { ...approved, thought_id: randomUUID() } },
    { preference: { ...preference, refinement_id: randomUUID() } },
    { preference: { ...preference, user_id: randomUUID() } },
    { has_approved: false },
  ]) {
    const d = projectThoughtDisplay(thought, { ...result, ...patch });
    assert.equal(d.source, "UNAVAILABLE");
    assert.equal(d.text, thought.raw_content);
    assert.match(d.label, /belum tersedia/);
  }
});
test("display input enforces source/id pairing and explicit safe revision", () => {
  const input = {
    company_id: thought.company_id,
    thought_id: thought.id,
    source: "ORIGINAL",
    refinement_id: null,
    expected_revision: 0,
  };
  assert.ok(displayInputSchema.safeParse(input).success);
  for (const patch of [
    { source: "REFINEMENT" },
    { refinement_id: approved.id },
    { expected_revision: -1 },
    { expected_revision: Number.MAX_SAFE_INTEGER },
    { expected_revision: undefined },
  ])
    assert.ok(!displayInputSchema.safeParse({ ...input, ...patch }).success);
});
test("twenty Thought projections use one bounded owned RPC, retain order, and resolve exact off-page version", async () => {
  const thoughts = Array.from({ length: 20 }, () => ({
    ...thought,
    id: randomUUID(),
  }));
  let calls = 0;
  const client = createClient(fixtureUrl, fixtureKey, {
    global: {
      fetch: async (input, init) => {
        calls++;
        assert.ok(String(input).endsWith("read_thought_displays"));
        const body = JSON.parse(String(init?.body));
        assert.deepEqual(Object.keys(body), ["p_thought_ids"]);
        assert.deepEqual(
          body.p_thought_ids,
          thoughts.map((t) => t.id),
        );
        return Response.json(
          thoughts.toReversed().map((t) => ({
            ...result,
            thought_id: t.id,
            preference: { ...preference, thought_id: t.id },
            selected_refinement: {
              ...approved,
              thought_id: t.id,
              status: "SUPERSEDED",
            },
          })),
        );
      },
    },
  });
  const projected = await projectThoughts(client, fixtureUserId, thoughts);
  assert.equal(calls, 1);
  assert.deepEqual(
    projected.map((t) => t.id),
    thoughts.map((t) => t.id),
  );
  assert.ok(
    projected.every(
      (t) =>
        t.display.text === approved.user_final_content &&
        t.raw_content === thought.raw_content,
    ),
  );
});
test("failed or poisoned batch cannot present raw as a confirmed selection", async () => {
  for (const response of [
    null,
    [],
    [{ ...result, user_id: randomUUID() }],
    [result, result],
  ]) {
    const client = createClient(fixtureUrl, fixtureKey, {
      global: { fetch: async () => Response.json(response) },
    });
    assert.equal(
      (await projectThoughts(client, fixtureUserId, [thought]))[0].display
        .source,
      "UNAVAILABLE",
    );
  }
});
test("display mutation derives auth in RPC and validates its ownership receipt and conflict", async () => {
  let fail = false;
  const client = createClient(fixtureUrl, fixtureKey, {
    global: {
      fetch: async (_input, init) => {
        const body = JSON.parse(String(init?.body));
        assert.equal(body.p_expected_revision, 0);
        assert.ok(!("p_user_id" in body));
        return fail
          ? Response.json(
              { code: "PT409", message: "DISPLAY_CONFLICT" },
              { status: 409 },
            )
          : Response.json(preference);
      },
    },
  });
  const input = {
    company_id: thought.company_id,
    thought_id: thought.id,
    source: "REFINEMENT",
    refinement_id: approved.id,
    expected_revision: 0,
  };
  assert.equal(
    (await setThoughtDisplay(client, fixtureUserId, input)).revision,
    1,
  );
  fail = true;
  await assert.rejects(
    () => setThoughtDisplay(client, fixtureUserId, input),
    /Pilihan sudah berubah/,
  );
});
test("approved choices filter both deliberate acceptance states with owned stable pagination", async () => {
  const client = createClient(fixtureUrl, fixtureKey, {
    global: {
      fetch: async (input) => {
        const url = new URL(String(input));
        assert.equal(
          url.searchParams.get("status"),
          "in.(ACCEPTED,SUPERSEDED)",
        );
        assert.equal(url.searchParams.get("user_id"), `eq.${fixtureUserId}`);
        assert.equal(url.searchParams.get("limit"), "21");
        assert.match(url.searchParams.get("or")!, /created_at.lt/);
        return Response.json([{ ...approved, status: "SUPERSEDED" }]);
      },
    },
  });
  assert.equal(
    (
      await getApprovedDisplayVersions(
        client,
        fixtureUserId,
        thought.company_id,
        thought.id,
        { created_at: date, id: approved.id },
      )
    ).versions[0].id,
    approved.id,
  );
});

test("terminal display conflict and transport failure make one bounded request without retry", async () => {
  for (const response of ["conflict", "transport"] as const) {
    let calls = 0;
    const client = createClient(fixtureUrl, fixtureKey, {
      global: {
        fetch: async (_input, init) => {
          calls++;
          assert.ok(init?.signal);
          if (response === "transport")
            throw new TypeError("Synthetic transport loss");
          return Response.json(
            { code: "PT409", message: "DISPLAY_CONFLICT" },
            { status: 409 },
          );
        },
      },
    });
    await assert.rejects(
      setThoughtDisplay(client, fixtureUserId, {
        company_id: thought.company_id,
        thought_id: thought.id,
        source: "ORIGINAL",
        refinement_id: null,
        expected_revision: 1,
      }),
      response === "conflict" ? /Pilihan sudah berubah/ : /Muat ulang/,
    );
    assert.equal(calls, 1);
  }
});
