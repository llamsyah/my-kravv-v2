import { createHash } from "node:crypto";
import { z } from "zod";
import {
  validateCloudTarget,
  v3CloudProfile,
} from "../../src/lib/env/v3-cloud.ts";
import {
  checkCloudTestObservation,
  type CloudTestStep,
} from "./cloud-two-user-plan.ts";
import { captureRow } from "../../src/features/captures/contract.ts";

type Actor = "A" | "B";
export type CaptureAcceptanceStep = Omit<CloudTestStep, "method" | "check"> & {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  check: CloudTestStep["check"] | "capture";
  assertion?:
    | "capability"
    | "company"
    | "fresh"
    | "create"
    | "row"
    | "retry"
    | "conflict"
    | "foreign-company"
    | "privilege";
  key?: Actor;
};
const specSchema = z
  .object({
    profile: z.literal(v3CloudProfile),
    projectRef: z.string(),
    apiOrigin: z.string(),
    runId: z.uuid(),
    users: z.object({ A: z.uuid(), B: z.uuid() }).strict(),
  })
  .strict();
const fail = () =>
  Error("Capture acceptance contract failed; inspect private evidence.");
const fields = "id,user_id,request_id,company_id,raw_text,created_at";
const equal = (a: unknown, b: unknown): boolean => {
  const canonical = (v: unknown) =>
    JSON.stringify(v, (_, item) =>
      item && typeof item === "object" && !Array.isArray(item)
        ? Object.fromEntries(
            Object.entries(item).sort(([a], [b]) => a.localeCompare(b)),
          )
        : item,
    );
  return canonical(a) === canonical(b);
};
const requestKey = (runId: string, actor: Actor) => {
  const bytes = createHash("sha256")
    .update(`capture:${runId}:${actor}`)
    .digest()
    .subarray(0, 16);
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const h = bytes.toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};
export function buildCaptureAcceptancePlan(value: unknown) {
  const spec = specSchema.parse(value),
    target = validateCloudTarget(spec);
  if (spec.users.A === spec.users.B) throw fail();
  const fixtures = {
    A: {
      request_id: requestKey(spec.runId, "A"),
      raw_text: `  v3-capture:${spec.runId}:A\nPertanyaan 😀: mengapa margin berubah?\n\n  `,
      company_id: "__company_A__" as string | null,
    },
    B: {
      request_id: requestKey(spec.runId, "B"),
      raw_text: `\tv3-capture:${spec.runId}:B\nHipotesis awal, bukan kesimpulan.  `,
      company_id: null as string | null,
    },
  };
  const steps: CaptureAcceptanceStep[] = [];
  const add = (step: Omit<CaptureAcceptanceStep, "url"> & { path: string }) => {
    const { path, ...s } = step;
    steps.push({ ...s, url: new URL(path, target.apiOrigin).href });
  };
  const rpcBody = (actor: Actor) => ({
    p_request_id: fixtures[actor].request_id,
    p_raw_text: fixtures[actor].raw_text,
    p_company_id: fixtures[actor].company_id,
  });
  add({
    label: "target identity",
    actor: "anonymous",
    method: "POST",
    path: "/rest/v1/rpc/v3_target_identity",
    check: "identity",
    expected: {
      project_id: target.projectRef,
      purpose: "disposable-v3-slice0-cloud",
      schema_version: 1,
    },
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
      label: `${actor} confirmed identity`,
      actor,
      method: "GET",
      path: "/auth/v1/user",
      check: "user",
      expected: { id: spec.users[actor] },
    });
    add({
      label: `${actor} capture capability`,
      actor,
      method: "POST",
      path: "/rest/v1/rpc/v3_capture_contract",
      check: "capture",
      assertion: "capability",
    });
  }
  add({
    label: "A existing owned company",
    actor: "A",
    method: "GET",
    path: `/rest/v1/companies?select=id,user_id,name&user_id=eq.${spec.users.A}&order=created_at.asc,id.asc&limit=1`,
    check: "capture",
    assertion: "company",
    expected: { user_id: spec.users.A },
  });
  for (const actor of ["A", "B"] as const)
    add({
      label: `${actor} fresh request key`,
      actor,
      method: "GET",
      path: `/rest/v1/captures?select=${fields}&user_id=eq.${spec.users[actor]}&request_id=eq.${fixtures[actor].request_id}`,
      check: "capture",
      assertion: "fresh",
      key: actor,
    });
  for (const actor of ["A", "B"] as const)
    add({
      label: `${actor} create capture`,
      actor,
      method: "POST",
      path: "/rest/v1/rpc/v3_create_capture",
      body: rpcBody(actor),
      check: "capture",
      assertion: "create",
      key: actor,
      expected: { user_id: spec.users[actor], ...fixtures[actor] },
    });
  const read = (actor: Actor, key: Actor, label: string) =>
    add({
      label,
      actor,
      method: "GET",
      path: `/rest/v1/captures?select=${fields}&id=eq.__capture_${key}__`,
      check: actor === key ? "capture" : "empty",
      ...(actor === key ? { assertion: "row" as const, key } : {}),
    });
  for (const actor of ["A", "B"] as const)
    read(actor, actor, `${actor} exact persisted capture`);
  for (const actor of ["A", "B"] as const)
    add({
      label: `${actor} deliberate same-key deduplication`,
      actor,
      method: "POST",
      path: "/rest/v1/rpc/v3_create_capture",
      body: rpcBody(actor),
      check: "capture",
      assertion: "retry",
      key: actor,
    });
  add({
    label: "A conflicting payload rejected",
    actor: "A",
    method: "POST",
    path: "/rest/v1/rpc/v3_create_capture",
    body: { ...rpcBody("A"), p_raw_text: fixtures.A.raw_text + "conflicting" },
    check: "capture",
    assertion: "conflict",
  });
  read("A", "B", "A cannot read B capture");
  read("B", "A", "B cannot read A capture");
  // Existing B key prevents a third row even if parent authorization were broken.
  add({
    label: "B foreign company association rejected",
    actor: "B",
    method: "POST",
    path: "/rest/v1/rpc/v3_create_capture",
    body: { ...rpcBody("B"), p_company_id: "__company_A__" },
    check: "capture",
    assertion: "foreign-company",
  });
  // Existing A owner/key prevents a third row even if RLS were unexpectedly permissive.
  add({
    label: "B forged owner insert rejected",
    actor: "B",
    method: "POST",
    path: "/rest/v1/captures",
    body: { user_id: spec.users.A, ...fixtures.A },
    check: "rls-denied",
  });
  // Contradictory generated-ID filters guarantee no match, independently of RLS.
  const neverMatches =
    "/rest/v1/captures?and=(id.eq.__capture_A__,id.eq.__capture_B__)";
  add({
    label: "B capture update privilege denied",
    actor: "B",
    method: "PATCH",
    path: neverMatches,
    body: { raw_text: fixtures.A.raw_text },
    check: "capture",
    assertion: "privilege",
  });
  add({
    label: "B capture delete privilege denied",
    actor: "B",
    method: "DELETE",
    path: neverMatches,
    check: "capture",
    assertion: "privilege",
  });
  add({
    label: "anonymous capture read denied",
    actor: "anonymous",
    method: "GET",
    path: `/rest/v1/captures?select=${fields}&id=eq.__capture_A__`,
    check: "anonymous-denied",
  });
  add({
    label: "anonymous create RPC denied",
    actor: "anonymous",
    method: "POST",
    path: "/rest/v1/rpc/v3_create_capture",
    body: rpcBody("A"),
    check: "anonymous-denied",
  });
  for (const actor of ["A", "B"] as const)
    read(actor, actor, `${actor} final unchanged retained fixture`);
  for (const actor of ["A", "B"] as const) {
    add({
      label: `${actor} logout local session`,
      actor,
      method: "POST",
      path: "/auth/v1/logout?scope=local",
      check: "logout",
    });
    add({
      label: `${actor} cleared local session denied`,
      actor,
      method: "GET",
      path: "/auth/v1/user",
      check: "unauthenticated",
    });
  }
  if (steps.length !== 31) throw fail();
  return {
    projectRef: target.projectRef,
    apiOrigin: target.apiOrigin,
    runId: spec.runId,
    steps,
    fixtures,
    limits: {
      maxRequests: 36,
      overallMs: 180000,
      requestMs: 10000,
      retries: 0,
    },
    cleanup: "retain exactly verified/uncertain fixtures; no cleanup",
    http: "not tested; API only",
  } as const;
}
export type CaptureAcceptanceState = {
  company?: { id: string; user_id: string; name: string };
  rows: Partial<Record<Actor, z.infer<typeof captureRow>>>;
};
export const captureAcceptanceState = (): CaptureAcceptanceState => ({
  rows: {},
});
export function resolveCaptureAcceptanceStep(
  template: CaptureAcceptanceStep,
  state: CaptureAcceptanceState,
) {
  if (state.rows.A && state.rows.B && state.rows.A.id === state.rows.B.id)
    throw fail();
  let value = JSON.stringify(template);
  for (const [slot, id] of [
    ["__company_A__", state.company?.id],
    ["__capture_A__", state.rows.A?.id],
    ["__capture_B__", state.rows.B?.id],
  ]) {
    if (value.includes(slot!)) {
      if (!z.uuid().safeParse(id).success) throw fail();
      value = value.replaceAll(slot!, id!);
    }
  }
  return JSON.parse(value) as CaptureAcceptanceStep;
}
export function assertCaptureAcceptanceWrite(step: CaptureAcceptanceStep) {
  const url = new URL(step.url);
  if (["PATCH", "DELETE"].includes(step.method)) {
    const matched = url.searchParams
      .get("and")
      ?.match(/^\(id\.eq\.([a-f0-9-]+),id\.eq\.([a-f0-9-]+)\)$/);
    if (
      url.pathname !== "/rest/v1/captures" ||
      !matched ||
      matched[1] === matched[2] ||
      !z.uuid().safeParse(matched[1]).success ||
      !z.uuid().safeParse(matched[2]).success ||
      step.assertion !== "privilege"
    )
      throw fail();
    if (
      step.method === "DELETE"
        ? step.body !== undefined
        : !z.object({ raw_text: z.string() }).strict().safeParse(step.body)
            .success
    )
      throw fail();
  }
  if (
    url.pathname === "/rest/v1/rpc/v3_create_capture" &&
    !z
      .object({
        p_request_id: z.uuid(),
        p_raw_text: z.string().min(1).max(9000),
        p_company_id: z.uuid().nullable(),
      })
      .strict()
      .safeParse(step.body).success
  )
    throw fail();
  if (
    url.pathname === "/rest/v1/captures" &&
    step.method === "POST" &&
    !z
      .object({
        user_id: z.uuid(),
        request_id: z.uuid(),
        raw_text: z.string(),
        company_id: z.uuid(),
      })
      .strict()
      .safeParse(step.body).success
  )
    throw fail();
}
export function observeCaptureAcceptance(
  step: CaptureAcceptanceStep,
  status: number,
  body: unknown,
  state: CaptureAcceptanceState,
) {
  if (step.check !== "capture") {
    checkCloudTestObservation(step as CloudTestStep, status, body);
    return;
  }
  const requireStatus = (s: number) => {
    if (s !== status) throw fail();
  };
  if (step.assertion === "capability") {
    requireStatus(200);
    if (body !== 1) throw fail();
    return;
  }
  if (step.assertion === "company") {
    requireStatus(200);
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
    if (!parsed.success || parsed.data[0].user_id !== step.expected?.user_id)
      throw fail();
    state.company = parsed.data[0];
    return { kind: "owned-company-verified", companyId: state.company.id };
  }
  if (step.assertion === "fresh") {
    requireStatus(200);
    if (!Array.isArray(body) || body.length !== 0) throw fail();
    return;
  }
  if (
    ["conflict", "foreign-company", "privilege"].includes(step.assertion ?? "")
  ) {
    const b = body as { code?: unknown; message?: unknown } | null;
    if (step.assertion === "privilege") {
      requireStatus(403);
      if (b?.code !== "42501") throw fail();
    } else {
      requireStatus(400);
      if (
        b?.code !== "P0001" ||
        b.message !==
          (step.assertion === "conflict"
            ? "Capture request conflicts with existing payload"
            : "Company unavailable")
      )
        throw fail();
    }
    return;
  }
  requireStatus(200); // SETOF RPC returns 200; never confuse it with table INSERT's 201.
  const parsed = z.array(captureRow).length(1).safeParse(body);
  if (!parsed.success) throw fail();
  const row = parsed.data[0],
    key = step.key;
  if (!key) throw fail();
  if (step.assertion === "create") {
    if (
      !step.expected ||
      !equal(
        {
          user_id: row.user_id,
          request_id: row.request_id,
          raw_text: row.raw_text,
          company_id: row.company_id,
        },
        step.expected,
      ) ||
      Object.values(state.rows).some((r) => r.id === row.id)
    )
      throw fail();
    state.rows[key] = row;
    return { kind: "capture-id-verified", key, capture: row };
  }
  if (
    !["row", "retry"].includes(step.assertion ?? "") ||
    !state.rows[key] ||
    !equal(row, state.rows[key])
  )
    throw fail();
  return undefined;
}
