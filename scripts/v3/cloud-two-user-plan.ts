import { z } from "zod";
import {
  validateCloudTarget,
  v3CloudProfile,
  matchesCloudMarker,
} from "../../src/lib/env/v3-cloud.ts";
import { assertCloudExecutionReady } from "../../src/lib/env/v3-cloud-execution.ts";

// Public inputs only. No credentials, environment loading, SDK, fetch or SQL.
const specification = z
  .object({
    profile: z.literal(v3CloudProfile),
    projectRef: z.string(),
    apiOrigin: z.string(),
    runId: z.uuid(),
    users: z.object({ A: z.uuid(), B: z.uuid() }).strict(),
  })
  .strict();
type Actor = "A" | "B" | "anonymous";
type Check =
  | "login"
  | "user"
  | "identity"
  | "empty"
  | "company-create"
  | "company"
  | "settings"
  | "rls-denied"
  | "anonymous-denied"
  | "logout"
  | "unauthenticated";
export type CloudTestStep = {
  label: string;
  actor: Actor;
  method: "GET" | "POST" | "PATCH";
  url: string;
  body?: Record<string, unknown>;
  credentialSlot?: "A" | "B";
  check: Check;
  expected?: Record<string, unknown>;
};

/** Reproducible public fixture names and ID slots, never an execution grant. */
export function buildCloudTwoUserPlan(value: unknown) {
  const parsed = specification.safeParse(value);
  if (!parsed.success) throw Error("Invalid public Cloud test specification.");
  const spec = parsed.data;
  const target = validateCloudTarget(spec);
  if (spec.users.A === spec.users.B)
    throw Error("Two distinct approved users required.");
  const steps: CloudTestStep[] = [];
  const companies = {
    A: { user_id: spec.users.A, name: `v3-slice0-cloud:${spec.runId}:A` },
    B: { user_id: spec.users.B, name: `v3-slice0-cloud:${spec.runId}:B` },
  };
  // Templates bind only to IDs from a validated creation response, never a client UUID.
  const companyIds = { A: "__company_A__", B: "__company_B__" };
  const add = (step: Omit<CloudTestStep, "url"> & { path: string }) => {
    const { path, ...rest } = step;
    const url = new URL(path, target.apiOrigin);
    if (url.origin !== target.apiOrigin)
      throw Error("Foreign test endpoint refused.");
    steps.push({ ...rest, url: url.href });
  };
  add({
    label: "exact identity before authentication",
    actor: "anonymous",
    method: "POST",
    path: "/rest/v1/rpc/v3_target_identity",
    body: {},
    check: "identity",
    expected: target.marker,
  });
  for (const actor of ["A", "B"] as const) {
    add({
      label: `${actor} login`,
      actor,
      method: "POST",
      path: "/auth/v1/token?grant_type=password",
      credentialSlot: actor,
      check: "login",
      expected: { id: spec.users[actor] },
    });
    add({
      label: `${actor} verified confirmed user`,
      actor,
      method: "GET",
      path: "/auth/v1/user",
      check: "user",
      expected: { id: spec.users[actor] },
    });
    add({
      label: `${actor} settings baseline must be empty`,
      actor,
      method: "GET",
      path: `/rest/v1/user_settings?select=user_id&user_id=eq.${spec.users[actor]}`,
      check: "empty",
    });
    add({
      label: `${actor} fixture baseline must be empty`,
      actor,
      method: "GET",
      path: `/rest/v1/companies?select=id&name=eq.${encodeURIComponent(companies[actor].name)}`,
      check: "empty",
    });
  }
  // All identity/confirmation/baseline reads must pass before the first write.
  for (const actor of ["A", "B"] as const) {
    add({
      label: `${actor} create own company`,
      actor,
      method: "POST",
      path: "/rest/v1/companies?select=id,user_id,name",
      body: companies[actor],
      check: "company-create",
      expected: companies[actor],
    });
    add({
      label: `${actor} create own settings`,
      actor,
      method: "POST",
      path: "/rest/v1/user_settings?select=user_id",
      body: { user_id: spec.users[actor] },
      check: "settings",
      expected: { user_id: spec.users[actor] },
    });
  }
  for (const actor of ["A", "B"] as const) {
    const other = actor === "A" ? "B" : "A";
    add({
      label: `${actor} visible fixture set is exactly own row`,
      actor,
      method: "GET",
      path: `/rest/v1/companies?select=id,user_id,name&id=in.(${companyIds.A},${companyIds.B})`,
      check: "company",
      expected: { id: companyIds[actor], ...companies[actor] },
    });
    add({
      label: `${actor} foreign read empty`,
      actor,
      method: "GET",
      path: `/rest/v1/companies?select=id&id=eq.${companyIds[other]}`,
      check: "empty",
    });
    add({
      label: `${actor} foreign update empty`,
      actor,
      method: "PATCH",
      path: `/rest/v1/companies?select=id&id=eq.${companyIds[other]}`,
      body: { name: `v3-slice0-cloud:${spec.runId}:forbidden` },
      check: "empty",
    });
    add({
      label: `${actor} forged company owner rejected`,
      actor,
      method: "POST",
      path: "/rest/v1/companies",
      body: {
        user_id: spec.users[other],
        name: `v3-slice0-cloud:${spec.runId}:forged`,
      },
      check: "rls-denied",
    });
    add({
      label: `${actor} foreign settings read empty`,
      actor,
      method: "GET",
      path: `/rest/v1/user_settings?select=user_id&user_id=eq.${spec.users[other]}`,
      check: "empty",
    });
    add({
      label: `${actor} forged settings owner rejected`,
      actor,
      method: "POST",
      path: "/rest/v1/user_settings",
      body: { user_id: spec.users[other] },
      check: "rls-denied",
    });
  }
  for (const actor of ["A", "B"] as const) {
    add({
      label: `${actor} company unchanged after attacks`,
      actor,
      method: "GET",
      path: `/rest/v1/companies?select=id,user_id,name&id=eq.${companyIds[actor]}`,
      check: "company",
      expected: { id: companyIds[actor], ...companies[actor] },
    });
    add({
      label: `${actor} own settings visible`,
      actor,
      method: "GET",
      path: `/rest/v1/user_settings?select=user_id&user_id=eq.${spec.users[actor]}`,
      check: "settings",
      expected: { user_id: spec.users[actor] },
    });
  }
  for (const table of ["companies", "user_settings"]) {
    add({
      label: `anonymous ${table} read denied`,
      actor: "anonymous",
      method: "GET",
      path: `/rest/v1/${table}?select=user_id&user_id=eq.${spec.users.A}`,
      check: "anonymous-denied",
    });
    add({
      label: `anonymous ${table} write denied`,
      actor: "anonymous",
      method: "POST",
      path: `/rest/v1/${table}`,
      body:
        table === "companies"
          ? {
              user_id: spec.users.A,
              name: `v3-slice0-cloud:${spec.runId}:anonymous`,
            }
          : { user_id: spec.users.A },
      check: "anonymous-denied",
    });
  }
  for (const actor of ["A", "B"] as const) {
    add({
      label: `${actor} logout current session`,
      actor,
      method: "POST",
      path: "/auth/v1/logout?scope=local",
      check: "logout",
    });
    add({
      label: `${actor} cleared session rejected`,
      actor,
      method: "GET",
      path: "/auth/v1/user",
      check: "unauthenticated",
    });
  }
  return {
    projectRef: target.projectRef,
    apiOrigin: target.apiOrigin,
    runId: spec.runId,
    steps,
    fixtures: { companies, settings: [spec.users.A, spec.users.B] },
    limits: {
      overallMs: 180000,
      requestMs: 10000,
      maxRequests: 48,
      retries: 0,
    },
    cleanup:
      "report-exact-manifest-only; no delete, reset or user administration",
    http: "pending separate loopback app launch and activation review",
  } as const;
}

/** Validate the single returned representation; SELECT covers all three columns. */
export function capturedCloudCompany(
  step: CloudTestStep,
  status: number,
  body: unknown,
) {
  const parsed = z
    .array(
      z
        .object({
          id: z.uuid(),
          user_id: z.uuid(),
          name: z.string().min(1).max(200),
        })
        .strict(),
    )
    .length(1)
    .safeParse(body);
  if (
    step.check !== "company-create" ||
    status !== 201 ||
    !parsed.success ||
    parsed.data[0].user_id !== step.expected?.user_id ||
    parsed.data[0].name !== step.expected?.name
  )
    throw Error(
      "Cloud test observation failed; generated Company representation invalid.",
    );
  return parsed.data[0];
}

/** Resolve only reviewed ID slots. Missing/duplicate bindings never reach transport. */
export function resolveCloudCompanyStep(
  template: CloudTestStep,
  ids: Partial<Record<"A" | "B", string>>,
) {
  let url = template.url;
  const expected = template.expected ? { ...template.expected } : undefined;
  if (ids.A && ids.B && ids.A === ids.B)
    throw Error("Ambiguous Company identities refused.");
  for (const actor of ["A", "B"] as const) {
    const token = `__company_${actor}__`;
    if (url.includes(token) || expected?.id === token) {
      const id = z.uuid().safeParse(ids[actor]);
      if (!id.success) throw Error("Verified Company identity unavailable.");
      url = url.replaceAll(token, id.data);
      if (expected?.id === token) expected.id = id.data;
    }
  }
  return { ...template, url, ...(expected ? { expected } : {}) };
}

/** Column-grant contract applies to positive AND negative fixture mutations. */
export function assertCloudFixtureWrite(step: CloudTestStep) {
  const table = new URL(step.url).pathname;
  if (
    step.method === "GET" ||
    !["/rest/v1/companies", "/rest/v1/user_settings"].includes(table)
  )
    return;
  const schema =
    table === "/rest/v1/user_settings"
      ? step.method === "POST"
        ? z.object({ user_id: z.uuid() }).strict()
        : null
      : step.method === "POST"
        ? z
            .object({ user_id: z.uuid(), name: z.string().min(1).max(200) })
            .strict()
        : step.method === "PATCH"
          ? z.object({ name: z.string().min(1).max(200) }).strict()
          : null;
  if (!schema?.safeParse(step.body).success)
    throw Error("Fixture mutation violates approved column grants.");
}

/** Pure response checks: generic errors never include bodies/tokens/passwords. */
export function checkCloudTestObservation(
  step: CloudTestStep,
  status: number,
  body: unknown,
) {
  const record =
    body !== null && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : undefined;
  const same = (actual: unknown, expected: unknown) =>
    JSON.stringify(actual) === JSON.stringify(expected);
  const projected = (row: unknown) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return undefined;
    return Object.fromEntries(
      Object.keys(step.expected ?? {}).map((key) => [
        key,
        (row as Record<string, unknown>)[key],
      ]),
    );
  };
  let ok = false;
  switch (step.check) {
    case "identity":
      ok = status === 200 && matchesCloudMarker(body, step.expected);
      break;
    case "login":
    case "user": {
      const user =
        step.check === "login"
          ? (record?.user as Record<string, unknown> | undefined)
          : record;
      ok =
        status === 200 &&
        user?.id === step.expected?.id &&
        typeof user?.email_confirmed_at === "string" &&
        Number.isFinite(Date.parse(user.email_confirmed_at));
      if (step.check === "login")
        ok =
          ok &&
          typeof record?.access_token === "string" &&
          record.access_token.length > 0;
      break;
    }
    case "empty":
      ok = status === 200 && Array.isArray(body) && body.length === 0;
      break;
    case "company-create":
      capturedCloudCompany(step, status, body);
      ok = true;
      break;
    case "company":
    case "settings":
      ok =
        [200, 201].includes(status) &&
        Array.isArray(body) &&
        body.length === 1 &&
        same(projected(body[0]), step.expected);
      break;
    case "rls-denied":
      ok = status === 403 && record?.code === "42501";
      break;
    case "anonymous-denied":
      ok = [401, 403].includes(status) && record?.code === "42501";
      break;
    case "logout":
      ok = status === 204;
      break;
    case "unauthenticated":
      ok = status === 401 || status === 403;
      break;
  }
  if (!ok)
    throw Error("Cloud test observation failed; stop and review privately.");
}

/** No live runner is activated by a plan, flag, credentials or populated metadata. */
export function prepareAuthorizedCloudTwoUserRun(value: unknown) {
  assertCloudExecutionReady();
  return buildCloudTwoUserPlan(value);
}
