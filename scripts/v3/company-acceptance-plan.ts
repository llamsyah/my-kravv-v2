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

const specification = z
  .object({
    profile: z.literal(v3CloudProfile),
    projectRef: z.string(),
    apiOrigin: z.string(),
    runId: z.uuid(),
    users: z.object({ A: z.uuid(), B: z.uuid() }).strict(),
  })
  .strict();
type Actor = "A" | "B";
type Assertion =
  | "baseline"
  | "preserved"
  | "settings-baseline"
  | "settings-save"
  | "settings-read"
  | "create"
  | "row"
  | "update"
  | "page"
  | "constraint"
  | "privilege"
  | "capability";
export type CompanyAcceptanceStep = Omit<CloudTestStep, "check"> & {
  check: CloudTestStep["check"] | "management";
  assertion?: Assertion;
  key?: string;
  keys?: string[];
  // Only a settings write may be resolved from its already-verified baseline.
  theme?: "light" | "dark";
};
const fields =
  "id,user_id,name,ticker,exchange,sector,short_note,created_at,updated_at";
const nullMetadata = {
  ticker: null,
  exchange: null,
  sector: null,
  short_note: null,
};
const refused = () =>
  Error("Company acceptance contract failed; inspect private evidence.");
const timestamp = z.iso
  .datetime({ offset: true })
  .refine((v) => Number.isFinite(Date.parse(v)));
// PostgreSQL timestamps retain microseconds; Date.parse alone loses ordering
// inside one millisecond and can select the wrong continuation company.
const instant = (value: string) =>
  BigInt(Date.parse(value)) * 1000n +
  BigInt(
    (value.match(/\.(\d+)(?:Z|[+-]\d\d:\d\d)$/)?.[1] ?? "")
      .padEnd(6, "0")
      .slice(3, 6) || "0",
  );
const compareRows = (
  a: { created_at: string; id: string },
  b: { created_at: string; id: string },
) =>
  instant(a.created_at) < instant(b.created_at)
    ? -1
    : instant(a.created_at) > instant(b.created_at)
      ? 1
      : a.id.localeCompare(b.id);
const rowSchema = z
  .object({
    id: z.uuid(),
    user_id: z.uuid(),
    name: z.string().min(1).max(200),
    ticker: z.string().max(32).nullable(),
    exchange: z.string().max(80).nullable(),
    sector: z.string().max(120).nullable(),
    short_note: z.string().max(2000).nullable(),
    created_at: timestamp,
    updated_at: timestamp,
  })
  .strict();
type Row = z.infer<typeof rowSchema>;
type Settings = { user_id: string; theme: "light" | "dark" };
export type CompanyAcceptanceState = {
  rows: Record<string, Row>;
  baselines: Partial<Record<Actor, Row[]>>;
  settings: Partial<Record<Actor, Settings | null>>;
};
export const companyAcceptanceState = (): CompanyAcceptanceState => ({
  rows: {},
  baselines: {},
  settings: {},
});
const same = (a: unknown, b: unknown): boolean => {
  const canonical = (v: unknown): string =>
    JSON.stringify(v, (_k, item) =>
      item && typeof item === "object" && !Array.isArray(item)
        ? Object.fromEntries(
            Object.entries(item).sort(([a], [b]) => a.localeCompare(b)),
          )
        : item,
    );
  return canonical(a) === canonical(b);
};
const digest = (v: unknown) =>
  createHash("sha256").update(JSON.stringify(v)).digest("hex");
const slot = (key: string) => `__id_${key}__`;
const keyFor = (actor: Actor, index: number) =>
  `${actor}${String(index).padStart(2, "0")}`;

/** Public deterministic request plan only. No environment, file access or transport. */
export function buildCompanyAcceptancePlan(value: unknown) {
  const parsed = specification.safeParse(value);
  if (!parsed.success) throw refused();
  const spec = parsed.data,
    target = validateCloudTarget(spec);
  if (spec.users.A === spec.users.B) throw refused();
  const prefix = `v3-slice1:${spec.runId}:`;
  const aKeys = Array.from({ length: 25 }, (_, i) => keyFor("A", i));
  const keys = [...aKeys, "B00"];
  const fixtures = Object.fromEntries(
    keys.map((key) => [
      key,
      {
        user_id: spec.users[key[0] as Actor],
        name: `${prefix}${key}`,
        ...nullMetadata,
        ...(key === "A00"
          ? {
              ticker: "X".repeat(32),
              exchange: "E".repeat(80),
              sector: "S".repeat(120),
              short_note: "N".repeat(2000),
            }
          : {}),
        ...(key === "A24"
          ? { ticker: `T${spec.runId.replaceAll("-", "").slice(0, 26)}%_` }
          : {}),
      },
    ]),
  );
  const steps: CompanyAcceptanceStep[] = [];
  const add = (s: Omit<CompanyAcceptanceStep, "url"> & { path: string }) => {
    const { path, ...rest } = s;
    const url = new URL(path, target.apiOrigin);
    if (url.origin !== target.apiOrigin) throw refused();
    steps.push({ ...rest, url: url.href });
  };
  const companyPath = (filter: string) =>
    `/rest/v1/companies?select=${fields}&${filter}`;
  const settingsPath = (actor: Actor) =>
    `/rest/v1/user_settings?select=user_id,theme&user_id=eq.${spec.users[actor]}`;
  const rpc = (
    actor: Actor,
    label: string,
    query: string,
    page: number,
    expectedKeys: string[],
  ) =>
    add({
      actor,
      label,
      method: "POST",
      path: "/rest/v1/rpc/v3_company_directory",
      body: { p_query: query, p_page: page },
      check: "management",
      assertion: "page",
      keys: expectedKeys,
    });
  add({
    actor: "anonymous",
    label: "V3 identity",
    method: "POST",
    path: "/rest/v1/rpc/v3_target_identity",
    body: {},
    check: "identity",
    expected: target.marker,
  });
  for (const actor of ["A", "B"] as const) {
    add({
      actor,
      label: `${actor} login`,
      method: "POST",
      path: "/auth/v1/token?grant_type=password",
      credentialSlot: actor,
      check: "login",
      expected: { id: spec.users[actor] },
    });
    add({
      actor,
      label: `${actor} confirmed identity`,
      method: "GET",
      path: "/auth/v1/user",
      check: "user",
      expected: { id: spec.users[actor] },
    });
    add({
      actor,
      label: `${actor} capability`,
      method: "POST",
      path: "/rest/v1/rpc/v3_company_management_contract",
      body: {},
      check: "management",
      assertion: "capability",
    });
    add({
      actor,
      label: `${actor} retained companies baseline`,
      method: "GET",
      path: companyPath(
        `user_id=eq.${spec.users[actor]}&order=created_at.asc,id.asc&limit=101`,
      ),
      check: "management",
      assertion: "baseline",
    });
    add({
      actor,
      label: `${actor} theme baseline`,
      method: "GET",
      path: settingsPath(actor),
      check: "management",
      assertion: "settings-baseline",
    });
    add({
      actor,
      label: `${actor} fresh namespace`,
      method: "GET",
      path: companyPath(`name=like.${encodeURIComponent(prefix + "*")}`),
      check: "empty",
    });
  }
  for (const key of keys) {
    const actor = key[0] as Actor;
    // A01 deliberately exercises the still-supported name-only insert.
    const body =
      key === "A01"
        ? { user_id: spec.users.A, name: fixtures[key].name }
        : fixtures[key];
    add({
      actor,
      label: `create ${key}`,
      method: "POST",
      path: companyPath(""),
      body,
      check: "management",
      assertion: "create",
      key,
      expected: fixtures[key],
    });
  }
  add({
    actor: "A",
    label: "minimum metadata update",
    method: "PATCH",
    path: companyPath(`id=eq.${slot("A00")}&user_id=eq.${spec.users.A}`),
    body: { ticker: "X", exchange: "E", sector: "S", short_note: "N" },
    check: "management",
    assertion: "update",
    key: "A00",
  });
  add({
    actor: "A",
    label: "nullable metadata update",
    method: "PATCH",
    path: companyPath(`id=eq.${slot("A00")}&user_id=eq.${spec.users.A}`),
    body: nullMetadata,
    check: "management",
    assertion: "update",
    key: "A00",
  });
  for (const actor of ["A", "B"] as const) {
    const key = actor === "A" ? "B00" : "A00",
      other = actor === "A" ? "B" : "A";
    add({
      actor,
      label: `${actor} foreign read`,
      method: "GET",
      path: companyPath(`id=eq.${slot(key)}`),
      check: "empty",
    });
    add({
      actor,
      label: `${actor} foreign update`,
      method: "PATCH",
      path: companyPath(`id=eq.${slot(key)}`),
      body: { sector: "unauthorized" },
      check: "empty",
    });
    add({
      actor,
      label: `${actor} forged owner`,
      method: "POST",
      path: companyPath(""),
      body: { user_id: spec.users[other], name: `${prefix}forged-${actor}` },
      check: "rls-denied",
    });
  }
  for (const [field, n] of [
    ["ticker", 33],
    ["exchange", 81],
    ["sector", 121],
    ["short_note", 2001],
  ] as const) {
    add({
      actor: "A",
      label: `reject oversized ${field}`,
      method: "PATCH",
      path: companyPath(`id=eq.${slot("A00")}`),
      body: { [field]: "x".repeat(n) },
      check: "management",
      assertion: "constraint",
    });
  }
  for (const body of [{ ticker: "" }, { ticker: "bad\nline" }, { name: "" }])
    add({
      actor: "A",
      label: `reject invalid ${Object.keys(body)[0]}`,
      method: "PATCH",
      path: companyPath(`id=eq.${slot("A00")}`),
      body,
      check: "management",
      assertion: "constraint",
    });
  // Same-value protected-column mutations are harmless even under unexpected drift,
  // but must still be denied by the reviewed column grants.
  for (const field of ["id", "user_id", "created_at", "updated_at"]) {
    add({
      actor: "A",
      label: `reject protected ${field}`,
      method: "PATCH",
      path: companyPath(`id=eq.${slot("A00")}`),
      body: { [field]: `__protected_${field}__` },
      check: "management",
      assertion: "privilege",
      key: "A00",
    });
  }
  for (const actor of ["A", "B"] as const)
    add({
      actor,
      label: `${actor} unchanged after rejected writes`,
      method: "GET",
      path: companyPath(
        `id=eq.${slot(actor + "00")}&user_id=eq.${spec.users[actor]}`,
      ),
      check: "management",
      assertion: "row",
      key: actor + "00",
    });
  rpc("A", "page zero", prefix.toUpperCase(), 0, aKeys);
  rpc("A", "page one", prefix, 1, aKeys);
  rpc("A", "stable repeated page", prefix, 0, aKeys);
  rpc("A", "literal ticker search", fixtures.A24.ticker!.toLowerCase(), 0, [
    "A24",
  ]);
  rpc("B", "foreign directory prefix", prefix + "A", 0, []);
  add({
    actor: "A",
    label: "switch selected company outside search page",
    method: "GET",
    path: companyPath(`id=eq.__last_owned__&user_id=eq.${spec.users.A}`),
    check: "management",
    assertion: "row",
    key: "last-owned",
  });
  for (const actor of ["A", "B"] as const) {
    const other = actor === "A" ? "B" : "A",
      theme = actor === "A" ? "dark" : "light";
    add({
      actor,
      label: `${actor} persist theme`,
      method: "PATCH",
      path: settingsPath(actor),
      body: { theme },
      theme,
      check: "management",
      assertion: "settings-save",
    });
    add({
      actor,
      label: `${actor} reject invalid theme`,
      method: "PATCH",
      path: settingsPath(actor),
      body: { theme: "invalid" },
      check: "management",
      assertion: "constraint",
    });
    add({
      actor,
      label: `${actor} foreign settings read`,
      method: "GET",
      path: settingsPath(other),
      check: "empty",
    });
    add({
      actor,
      label: `${actor} foreign settings update`,
      method: "PATCH",
      path: settingsPath(other),
      body: { theme: actor === "A" ? "dark" : "light" },
      check: "empty",
    });
  }
  for (const table of ["companies", "user_settings"]) {
    add({
      actor: "anonymous",
      label: `anonymous ${table} read`,
      method: "GET",
      path: `/rest/v1/${table}?select=user_id&user_id=eq.${spec.users.A}`,
      check: "anonymous-denied",
    });
  }
  for (const actor of ["A", "B"] as const) {
    add({
      actor,
      label: `${actor} logout`,
      method: "POST",
      path: "/auth/v1/logout?scope=local",
      check: "logout",
    });
    add({
      actor,
      label: `${actor} cleared session`,
      method: "GET",
      path: "/auth/v1/user",
      check: "unauthenticated",
    });
    add({
      actor,
      label: `${actor} new login`,
      method: "POST",
      path: "/auth/v1/token?grant_type=password",
      credentialSlot: actor,
      check: "login",
      expected: { id: spec.users[actor] },
    });
    add({
      actor,
      label: `${actor} reverified identity`,
      method: "GET",
      path: "/auth/v1/user",
      check: "user",
      expected: { id: spec.users[actor] },
    });
    add({
      actor,
      label: `${actor} theme survives new session`,
      method: "GET",
      path: settingsPath(actor),
      theme: actor === "A" ? "dark" : "light",
      check: "management",
      assertion: "settings-read",
    });
    add({
      actor,
      label: `${actor} retained companies unchanged`,
      method: "GET",
      path: companyPath(
        `user_id=eq.${spec.users[actor]}&id=not.in.(${keys.map(slot).join(",")})&order=created_at.asc,id.asc&limit=101`,
      ),
      check: "management",
      assertion: "preserved",
    });
    add({
      actor,
      label: `${actor} final logout`,
      method: "POST",
      path: "/auth/v1/logout?scope=local",
      check: "logout",
    });
    add({
      actor,
      label: `${actor} final cleared session`,
      method: "GET",
      path: "/auth/v1/user",
      check: "unauthenticated",
    });
  }
  if (steps.length > 100) throw refused();
  return {
    projectRef: target.projectRef,
    apiOrigin: target.apiOrigin,
    runId: spec.runId,
    users: spec.users,
    steps,
    fixtures,
    limits: {
      maxRequests: 100,
      overallMs: 300000,
      requestMs: 10000,
      retries: 0,
    },
    cleanup: "retain all fixtures and evidence; no automatic cleanup",
    http: "separate application acceptance required",
  } as const;
}

export function resolveCompanyAcceptanceStep(
  template: CompanyAcceptanceStep,
  state: CompanyAcceptanceState,
): CompanyAcceptanceStep {
  let url = template.url;
  let key = template.key;
  if (key === "last-owned") {
    const entries = Object.entries(state.rows)
      .filter(([k]) => k.startsWith("A"))
      .sort(([, a], [, b]) => compareRows(a, b));
    if (entries.length !== 25) throw refused();
    key = entries[24][0];
    url = url.replace("__last_owned__", entries[24][1].id);
  }
  for (const token of url.match(/__id_[AB][0-9]{2}__/g) ?? []) {
    const key = token.slice(5, -2),
      id = state.rows[key]?.id;
    if (!z.uuid().safeParse(id).success) throw refused();
    url = url.replaceAll(token, id!);
  }
  if (url.includes("__id_")) throw refused();
  let body = template.body ? { ...template.body } : undefined;
  if (template.assertion === "privilege") {
    const row = state.rows[template.key!];
    if (!row) throw refused();
    const field = Object.keys(body!)[0] as keyof Row;
    body = { [field]: row[field] };
  }
  if (template.assertion === "settings-save") {
    if (template.actor === "anonymous" || !(template.actor in state.settings))
      throw refused();
    if (state.settings[template.actor] === null) {
      const owner = state.rows[template.actor + "00"]?.user_id;
      if (!owner) throw refused();
      return {
        ...template,
        url,
        method: "POST",
        body: { user_id: owner, theme: template.theme },
      };
    }
  }
  return { ...template, url, key, ...(body ? { body } : {}) };
}

/** Reject any mutation not produced by the exact resolved plan (no runtime plan input). */
export function assertCompanyAcceptanceWrite(step: CompanyAcceptanceStep) {
  const url = new URL(step.url);
  if (!["GET", "POST", "PATCH"].includes(step.method)) throw refused();
  if (
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/rest/v1/rpc/")
  )
    return;
  if (!["/rest/v1/companies", "/rest/v1/user_settings"].includes(url.pathname))
    throw refused();
  if (step.method === "GET") return;
  if (
    !step.body ||
    Object.keys(step.body).some(
      (k) =>
        ![
          "user_id",
          "name",
          "ticker",
          "exchange",
          "sector",
          "short_note",
          "theme",
          ...(step.assertion === "privilege"
            ? ["id", "created_at", "updated_at"]
            : []),
        ].includes(k),
    )
  )
    throw refused();
  if (
    step.method === "PATCH" &&
    !url.searchParams.has(url.pathname.endsWith("companies") ? "id" : "user_id")
  )
    throw refused();
}

/** All non-Auth observations are exact and fail closed, without exposing raw responses. */
export function observeCompanyAcceptance(
  step: CompanyAcceptanceStep,
  status: number,
  body: unknown,
  state: CompanyAcceptanceState,
) {
  if (step.check !== "management") {
    checkCloudTestObservation(step as CloudTestStep, status, body);
    return undefined;
  }
  const actor = step.actor;
  if (actor === "anonymous") throw refused();
  const rows = () => {
    const parsed = z.array(rowSchema).safeParse(body);
    if (!parsed.success) throw refused();
    return parsed.data;
  };
  const one = () => {
    const r = rows();
    if (r.length !== 1) throw refused();
    return r[0];
  };
  const requireStatus = (n: number) => {
    if (status !== n) throw refused();
  };
  switch (step.assertion) {
    case "capability":
      requireStatus(200);
      if (body !== 1) throw refused();
      break;
    case "baseline":
    case "preserved": {
      requireStatus(200);
      const r = rows();
      const owner = new URL(step.url).searchParams.get("user_id")?.slice(3);
      if (
        r.length > 100 ||
        r.some((v) => v.user_id !== owner) ||
        new Set(r.map((v) => v.id)).size !== r.length
      )
        throw refused();
      if (step.assertion === "baseline") state.baselines[actor] = r;
      else if (!same(r, state.baselines[actor])) throw refused();
      return {
        kind: step.assertion,
        count: r.length,
        snapshotSha256: digest(r),
      };
    }
    case "settings-baseline":
    case "settings-save":
    case "settings-read": {
      requireStatus(
        step.assertion === "settings-save" && step.method === "POST"
          ? 201
          : 200,
      );
      const r = z
        .array(
          z
            .object({ user_id: z.uuid(), theme: z.enum(["light", "dark"]) })
            .strict(),
        )
        .max(1)
        .safeParse(body);
      const owner = new URL(step.url).searchParams.get("user_id")?.slice(3);
      if (!r.success || r.data.some((v) => v.user_id !== owner))
        throw refused();
      if (step.assertion === "settings-baseline") {
        state.settings[actor] = r.data[0] ?? null;
        return {
          kind: "theme-baseline",
          actor,
          previousTheme: r.data[0]?.theme ?? null,
        };
      }
      if (r.data.length !== 1 || r.data[0].theme !== step.theme)
        throw refused();
      break;
    }
    case "create": {
      requireStatus(201);
      const row = one();
      if (
        !same(
          Object.fromEntries(
            Object.keys(step.expected!).map((k) => [k, row[k as keyof Row]]),
          ),
          step.expected,
        ) ||
        Object.values(state.rows).some((v) => v.id === row.id) ||
        Object.values(state.baselines).some((v) =>
          v?.some((old) => old.id === row.id),
        )
      )
        throw refused();
      state.rows[step.key!] = row;
      return { kind: "company-id-verified", key: step.key, company: row };
    }
    case "update": {
      requireStatus(200);
      const row = one(),
        before = state.rows[step.key!];
      if (
        !before ||
        !same(
          { ...row, updated_at: before.updated_at },
          { ...before, ...step.body },
        ) ||
        instant(row.updated_at) <= instant(before.updated_at)
      )
        throw refused();
      state.rows[step.key!] = row;
      return { kind: "metadata-verified", key: step.key, company: row };
    }
    case "row":
      requireStatus(200);
      if (!same(one(), state.rows[step.key!])) throw refused();
      break;
    case "page": {
      requireStatus(200);
      let expected = step.keys!.map((k) => state.rows[k]);
      if (expected.some((v) => !v)) throw refused();
      expected = expected.sort(compareRows);
      const page = Number(step.body?.p_page);
      expected = expected.slice(page * 24, page * 24 + 25);
      const r = rows();
      if (!same(r, expected)) throw refused();
      for (let i = 1; i < r.length; i++) {
        if (compareRows(r[i - 1], r[i]) >= 0) throw refused();
      }
      break;
    }
    case "constraint":
    case "privilege": {
      const code =
        body && typeof body === "object" && !Array.isArray(body)
          ? (body as { code?: unknown }).code
          : undefined;
      if (
        step.assertion === "constraint"
          ? status !== 400 || code !== "23514"
          : status !== 403 || code !== "42501"
      )
        throw refused();
      break;
    }
    default:
      throw refused();
  }
  return undefined;
}
