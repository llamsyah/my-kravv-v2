import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import {
  buildCloudTwoUserPlan,
  capturedCloudCompany,
  resolveCloudCompanyStep,
  assertCloudFixtureWrite,
  checkCloudTestObservation,
  prepareAuthorizedCloudTwoUserRun,
} from "../../scripts/v3/cloud-two-user-plan.ts";

const input = {
  profile: "my-kravv-v3-cloud-dev",
  projectRef: "kjcvgjfwlmyfroiqlbmw",
  apiOrigin: "https://kjcvgjfwlmyfroiqlbmw.supabase.co",
  runId: "10000000-0000-4000-8000-000000000001",
  users: {
    A: "20000000-0000-4000-8000-000000000001",
    B: "20000000-0000-4000-8000-000000000002",
  },
};

const generated = {
  A: "30000000-0000-4000-8000-000000000001",
  B: "30000000-0000-4000-8000-000000000002",
};

test("Cloud two-user plan is deterministic, exact-target, bounded and credential/admin free", () => {
  const plan = buildCloudTwoUserPlan(input);
  assert.deepEqual(buildCloudTwoUserPlan(input), plan);
  const other = buildCloudTwoUserPlan({
    ...input,
    runId: "10000000-0000-4000-8000-000000000002",
  });
  assert.notEqual(
    plan.fixtures.companies.A.name,
    other.fixtures.companies.A.name,
  );
  assert.notEqual(
    plan.fixtures.companies.A.name,
    plan.fixtures.companies.B.name,
  );
  assert.ok(plan.steps.length <= plan.limits.maxRequests);
  for (const step of plan.steps) {
    assert.equal(new URL(step.url).origin, input.apiOrigin);
    assert.ok(!step.url.includes("/admin") && !step.url.includes("/signup"));
    assert.notEqual(step.method as string, "DELETE");
  }
  assert.equal(plan.limits.retries, 0);
  assert.ok(!JSON.stringify(plan).includes("sb_secret_"));
  const firstWrite = plan.steps.findIndex((s) => s.check === "company-create");
  assert.equal(
    plan.steps.slice(0, firstWrite).filter((s) => s.check === "user").length,
    2,
  );
  assert.equal(
    plan.steps.slice(0, firstWrite).filter((s) => s.check === "empty").length,
    4,
  );
});

test("Missing/foreign/ambiguous Cloud specifications and duplicate users fail without leaking inputs", () => {
  for (const changed of [
    {},
    { ...input, projectRef: "b".repeat(20) },
    { ...input, apiOrigin: "https://my-kravv-dev.supabase.co" },
    { ...input, apiOrigin: input.apiOrigin + "/" },
    { ...input, profile: "my-kravv-v3-local-01a14897" },
    { ...input, users: { A: input.users.A, B: input.users.A } },
    { ...input, SUPABASE_SECRET_KEY: "never-echo" },
    { ...input, NEXT_PUBLIC_SUPABASE_URL: "never-echo" },
    { ...input, users: { ...input.users, password: "never-echo" } },
  ]) {
    assert.throws(
      () => buildCloudTwoUserPlan(changed),
      (e) => e instanceof Error && !e.message.includes("never-echo"),
    );
  }
});

test("Prepared API assertions accept synthetic observations for all planned cases only", () => {
  const plan = buildCloudTwoUserPlan(input);
  const checks = new Set<string>();
  for (const template of plan.steps) {
    const step = resolveCloudCompanyStep(template, generated);
    checks.add(step.check);
    let status = 200;
    let body: unknown;
    switch (step.check) {
      case "identity":
        body = step.expected;
        break;
      case "login":
        body = {
          access_token: "synthetic-only",
          user: {
            id: step.expected!.id,
            email_confirmed_at: "2026-10-22T00:00:00Z",
          },
        };
        break;
      case "user":
        body = {
          id: step.expected!.id,
          email_confirmed_at: "2026-10-22T00:00:00Z",
        };
        break;
      case "empty":
        body = [];
        break;
      case "company-create":
        status = 201;
        body = [{ id: generated[step.actor as "A" | "B"], ...step.expected }];
        break;
      case "company":
      case "settings":
        body = [step.expected];
        break;
      case "rls-denied":
      case "anonymous-denied":
        status = 403;
        body = { code: "42501" };
        break;
      case "logout":
        status = 204;
        break;
      case "unauthenticated":
        status = 401;
        break;
    }
    checkCloudTestObservation(step, status, body);
    assert.throws(
      () => checkCloudTestObservation(step, 500, { secret: "never-echo" }),
      /Cloud test observation failed/,
    );
  }
  assert.deepEqual([...checks].sort(), [
    "anonymous-denied",
    "company",
    "company-create",
    "empty",
    "identity",
    "login",
    "logout",
    "rls-denied",
    "settings",
    "unauthenticated",
    "user",
  ]);
});

test("Prepared isolation assertions reject foreign owners, changed rows, false denial and wrong identity", () => {
  const plan = buildCloudTwoUserPlan(input);
  const company = resolveCloudCompanyStep(
    plan.steps.find((s) => s.check === "company")!,
    generated,
  );
  for (const body of [
    [],
    [{ ...company.expected, user_id: input.users.B }],
    [{ ...company.expected, name: "changed" }],
    [company.expected, company.expected],
  ])
    assert.throws(() => checkCloudTestObservation(company, 200, body));
  const empty = plan.steps.find((s) => s.label === "A foreign update empty")!;
  assert.throws(() =>
    checkCloudTestObservation(empty, 200, [{ id: "foreign" }]),
  );
  const denied = plan.steps.find((s) => s.check === "rls-denied")!;
  for (const [status, body] of [
    [201, {}],
    [404, {}],
    [409, { code: "23505" }],
    [403, { code: "unexpected" }],
  ] as const)
    assert.throws(() => checkCloudTestObservation(denied, status, body));
  const identity = plan.steps[0];
  assert.throws(() =>
    checkCloudTestObservation(identity, 200, {
      ...identity.expected,
      purpose: "disposable-v3-slice0",
    }),
  );
});

test("Login/user checks require pinned account and confirmed email, without exposing response secrets", () => {
  const login = buildCloudTwoUserPlan(input).steps.find(
    (s) => s.check === "login",
  )!;
  for (const user of [
    { id: input.users.B, email_confirmed_at: "2026-10-22T00:00:00Z" },
    { id: input.users.A, email_confirmed_at: null },
    { id: input.users.A, email_confirmed_at: "invalid" },
  ])
    assert.throws(
      () =>
        checkCloudTestObservation(login, 200, {
          access_token: "never-echo",
          user,
        }),
      (e) => e instanceof Error && !e.message.includes("never-echo"),
    );
});

test("Even a valid prepared two-user plan cannot authorize execution or reach transport", (t) => {
  let requests = 0;
  t.mock.method(globalThis, "fetch", async () => {
    requests++;
    throw Error("Unexpected network");
  });
  assert.throws(
    () => prepareAuthorizedCloudTwoUserRun(input),
    /Cloud execution is blocked/,
  );
  assert.equal(requests, 0);
});

test("Company INSERT/RETURNING contract matches the unchanged approved authenticated grants", () => {
  const sql = fs.readFileSync("supabase/v3-cloud/bootstrap.sql", "utf8");
  const columns = sql
    .match(
      /grant insert \(([^)]+)\) on public\.companies to authenticated;/,
    )![1]
    .split(",")
    .map((s) => s.trim())
    .sort();
  assert.deepEqual(columns, ["name", "user_id"]);
  assert.match(
    sql,
    /grant select on public.user_settings, public.companies to authenticated;/,
  );
  assert.match(
    sql,
    /grant insert \(user_id\) on public.user_settings to authenticated;/,
  );
  assert.match(
    sql,
    /grant update \(name\) on public.companies to authenticated;/,
  );
  assert.match(sql, /id uuid primary key default gen_random_uuid\(\)/);
  const plan = buildCloudTwoUserPlan(input);
  for (const step of plan.steps) {
    assertCloudFixtureWrite(step);
    if (
      step.method === "POST" &&
      new URL(step.url).pathname === "/rest/v1/companies"
    )
      assert.deepEqual(Object.keys(step.body!).sort(), columns);
    if (step.check === "company-create") {
      assert.equal(
        new URL(step.url).searchParams.get("select"),
        "id,user_id,name",
      );
      assert.ok(!("id" in step.body!));
      assert.throws(
        () =>
          assertCloudFixtureWrite({
            ...step,
            body: { ...step.body, id: generated.A },
          }),
        /column grants/,
      );
    }
  }
});

test("Generated IDs require a single exact server representation; unresolved IDs never enter requests", () => {
  const plan = buildCloudTwoUserPlan(input);
  const create = plan.steps.find((s) => s.check === "company-create")!;
  const valid = { id: generated.A, ...create.expected };
  assert.equal(capturedCloudCompany(create, 201, [valid]).id, generated.A);
  for (const bad of [
    [],
    [create.expected],
    [{ ...valid, id: null }],
    [{ ...valid, id: "not-a-uuid" }],
    [valid, valid],
    [{ ...valid, user_id: input.users.B }],
    [{ ...valid, name: "wrong" }],
    [{ ...valid, extra: "ambiguous" }],
    valid,
  ])
    assert.throws(() => capturedCloudCompany(create, 201, bad));
  assert.throws(() => capturedCloudCompany(create, 200, [valid]));
  const read = plan.steps.find((s) => s.label === "A foreign read empty")!;
  assert.throws(() => resolveCloudCompanyStep(read, {}));
  const resolved = resolveCloudCompanyStep(read, generated);
  assert.equal(
    new URL(resolved.url).searchParams.get("id"),
    `eq.${generated.B}`,
  );
  assert.throws(() =>
    resolveCloudCompanyStep(read, { A: generated.A, B: generated.A }),
  );
});
