// Node-only application authority. Imported only by the launcher, preload and
// server-only target adapter. Browser/shared target resolution is unchanged.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import { setTimeout as pause } from "node:timers/promises";
import { z } from "zod";
import { privatePath, readPrivateBytes } from "./private-files.ts";
import {
  validateCloudTarget,
  v3CloudProfile,
  v3CloudCookieName,
  matchesCloudMarker,
} from "../../src/lib/env/v3-cloud.ts";
import { companyMetadataInput } from "../../src/features/v3-workspace/management-contract.ts";

const approvedApplicationGrantSha256: string | null = null;
export function applicationPinMatchesSource(source: string) {
  return (
    applicationSourceApproved() &&
    source.includes(
      `const approvedApplicationGrantSha256: string | null = "${approvedApplicationGrantSha256}";`,
    )
  );
}
const sha = (bytes: string | Buffer) =>
  createHash("sha256").update(bytes).digest("hex");
const refused = () =>
  Error("V3 application window refused; inspect private evidence.");
export const applicationOrigin = "http://127.0.0.1:3103";
export function applicationSourceApproved() {
  return (
    approvedApplicationGrantSha256 !== null &&
    /^[a-f0-9]{64}$/.test(approvedApplicationGrantSha256)
  );
}
const account = z
  .object({
    id: z.uuid(),
    email: z.email(),
    password: z
      .string()
      .min(1)
      .max(1024)
      .refine((v) => v.trim().length > 0),
  })
  .strict();
const credentials = z
  .object({
    projectRef: z.literal("kjcvgjfwlmyfroiqlbmw"),
    apiOrigin: z.literal("https://kjcvgjfwlmyfroiqlbmw.supabase.co"),
    publishableKey: z.string().regex(/^sb_publishable_[A-Za-z0-9_-]{5,}$/),
    users: z.object({ A: account, B: account }).strict(),
  })
  .strict();
const grantSchema = z
  .object({
    purpose: z.literal("slice1-application-only"),
    projectRef: z.literal("kjcvgjfwlmyfroiqlbmw"),
    apiOrigin: z.literal("https://kjcvgjfwlmyfroiqlbmw.supabase.co"),
    runId: z.uuid(),
    head: z.string().regex(/^[a-f0-9]{40}$/),
    users: z.object({ A: z.uuid(), B: z.uuid() }).strict(),
    issuedAt: z.iso.datetime(),
    expiresAt: z.iso.datetime(),
    maxCloudRequests: z.literal(600),
    maxHttpRequests: z.literal(300),
    overallMs: z.literal(600000),
    retries: z.literal(0),
    planSha256: z.string().regex(/^[a-f0-9]{64}$/),
    credentialSha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
export function applicationPlan(
  runId: string,
  users: { A: string; B: string },
) {
  z.uuid().parse(runId);
  z.uuid().parse(users.A);
  z.uuid().parse(users.B);
  if (users.A === users.B) throw refused();
  return {
    version: 1,
    purpose: "slice1-application-only",
    projectRef: "kjcvgjfwlmyfroiqlbmw",
    apiOrigin: "https://kjcvgjfwlmyfroiqlbmw.supabase.co",
    runId,
    users,
    origin: applicationOrigin,
    maxCloudRequests: 600,
    maxHttpRequests: 300,
    overallMs: 600000,
    retries: 0,
    fixturePrefix: `v3-slice1-app:${runId}:`,
    writes: {
      companiesPerUser: 1,
      renamesPerUser: 1,
      metadataPerUser: 1,
      themesPerUser: 2,
    },
    cleanup: "retain; never automatic",
    acceptance: "owner browser review required",
  };
}
export function applicationPlanDigest(
  runId: string,
  users: { A: string; B: string },
) {
  return sha(JSON.stringify(applicationPlan(runId, users)));
}
type Actor = "A" | "B";
const counts = z
  .object({
    create: z.number().int().min(0).max(1),
    rename: z.number().int().min(0).max(1),
    metadata: z.number().int().min(0).max(1),
    theme: z.number().int().min(0).max(2),
  })
  .strict();
const actorSchema = z.enum(["A", "B"]);
const stateSchema = z
  .object({
    phase: z.enum(["building", "serving", "closed"]),
    controllerPid: z.number().int().positive(),
    nextPid: z.number().int().positive().nullable(),
    heartbeat: z.number().finite(),
    cloud: z.number().int().min(0).max(600),
    http: z.number().int().min(0).max(300),
    identity: z.boolean(),
    csrfProbe: z.boolean(),
    tokens: z.record(z.string().regex(/^[a-f0-9]{64}$/), actorSchema),
    refresh: z.record(z.string().regex(/^[a-f0-9]{64}$/), actorSchema),
    ids: z.object({ A: z.uuid().optional(), B: z.uuid().optional() }).strict(),
    writes: z.object({ A: counts, B: counts }).strict(),
  })
  .strict();
function readEvidence(file: string) {
  const st = fs.lstatSync(file);
  if (!st.isFile() || st.isSymbolicLink() || st.nlink !== 1 || st.size > 262144)
    throw refused();
  const fd = fs.openSync(
    file,
    fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0),
  );
  try {
    const opened = fs.fstatSync(fd);
    if (st.ino !== opened.ino || st.dev !== opened.dev) throw refused();
    return JSON.parse(fs.readFileSync(fd, "utf8"));
  } finally {
    fs.closeSync(fd);
  }
}

type State = {
  phase: "building" | "serving" | "closed";
  controllerPid: number;
  nextPid: number | null;
  heartbeat: number;
  cloud: number;
  http: number;
  identity: boolean;
  csrfProbe: boolean;
  tokens: Record<string, Actor>;
  refresh: Record<string, Actor>;
  ids: Partial<Record<Actor, string>>;
  writes: Record<
    Actor,
    { create: number; rename: number; metadata: number; theme: number }
  >;
};
type Transport = (url: string, init: RequestInit) => Promise<Response>;
const nativeFetch: Transport = (url, init) => fetch(url, init);
function durable(fd: number, value: unknown) {
  const bytes = Buffer.from(JSON.stringify(value) + "\n");
  if (fs.writeSync(fd, bytes, 0, bytes.length, null) !== bytes.length)
    throw refused();
  fs.fsyncSync(fd);
}
class ScopeDenied extends Error {}

type Mutation = {
  actor: Actor;
  kind: "create" | "rename" | "metadata" | "theme";
  body: Record<string, unknown>;
};

class ApplicationAuthority {
  private config?: {
    g: z.infer<typeof grantSchema>;
    c: z.infer<typeof credentials>;
    expiry: number;
  };
  private root: string;
  private now: () => number;
  private wire: Transport;
  private synthetic: boolean;
  constructor(
    root = path.join(os.homedir(), ".my-kravv-v3-private"),
    now = Date.now,
    wire: Transport = nativeFetch,
    synthetic = false,
  ) {
    this.root = root;
    this.now = now;
    this.wire = wire;
    this.synthetic = synthetic;
  }
  load() {
    if (!applicationSourceApproved()) throw refused();
    if (this.config) {
      if (this.now() >= this.config.expiry) throw refused();
      return this.config;
    }
    if (
      this.synthetic &&
      (path.dirname(this.root) !== fs.realpathSync(os.tmpdir()) ||
        !path.basename(this.root).startsWith("kravv-app-offline-"))
    )
      throw refused();
    if (!path.isAbsolute(this.root) || fs.realpathSync(this.root) !== this.root)
      throw refused();
    for (let p = this.root; ; p = path.dirname(p)) {
      if (
        fs.lstatSync(p).isSymbolicLink() ||
        fs.existsSync(path.join(p, ".git"))
      )
        throw refused();
      if (p === path.dirname(p)) break;
    }
    privatePath(this.root, true, this.synthetic);
    if (
      readPrivateBytes(this.root, ".gitignore", this.synthetic)
        .toString()
        .trim() !== "*"
    )
      throw refused();
    const raw = readPrivateBytes(
      this.root,
      "application-run-approval.json",
      this.synthetic,
    );
    if (sha(raw) !== approvedApplicationGrantSha256) throw refused();
    const g = grantSchema.parse(
      JSON.parse(
        new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(raw),
      ),
    );
    const expiry = Date.parse(g.expiresAt),
      issued = Date.parse(g.issuedAt);
    if (
      issued > this.now() ||
      expiry <= this.now() ||
      expiry <= issued ||
      expiry - issued > 600000 ||
      g.planSha256 !== applicationPlanDigest(g.runId, g.users)
    )
      throw refused();
    const bytes = readPrivateBytes(
      this.root,
      "credentials.json",
      this.synthetic,
    );
    if (sha(bytes) !== g.credentialSha256) throw refused();
    const c = credentials.parse(
      JSON.parse(
        new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
          bytes,
        ),
      ),
    );
    if (
      c.users.A.id !== g.users.A ||
      c.users.B.id !== g.users.B ||
      c.users.A.email.toLowerCase() === c.users.B.email.toLowerCase()
    )
      throw refused();
    if (
      this.synthetic &&
      (!c.publishableKey.startsWith("sb_publishable_offline_") ||
        Object.values(c.users).some(
          (u) =>
            !u.email.endsWith("@example.invalid") ||
            !u.password.startsWith("offline-"),
        ))
    )
      throw refused();
    validateCloudTarget({
      profile: v3CloudProfile,
      projectRef: g.projectRef,
      apiOrigin: g.apiOrigin,
    });
    this.config = { g, c, expiry };
    return this.config;
  }
  file(suffix: string) {
    return path.join(
      this.root,
      `run-${(this.config ?? this.load()).g.runId}.${suffix}`,
    );
  }
  latch() {
    try {
      const fd = fs.openSync(this.file("application-stop"), "wx", 0o600);
      try {
        durable(fd, { state: "stopped" });
      } finally {
        fs.closeSync(fd);
      }
    } catch {
      /* Any existing stop or storage error remains terminal. */
    }
  }
  private terminal = false;
  private record(event: unknown) {
    const fd = fs.openSync(this.file("application.manifest.jsonl"), "a", 0o600);
    try {
      durable(fd, event);
    } catch {
      this.terminal = true;
      this.latch();
      throw refused();
    } finally {
      fs.closeSync(fd);
    }
  }
  private read() {
    const { expiry } = this.load();
    if (
      this.terminal ||
      this.now() >= expiry ||
      fs.existsSync(this.file("application-stop"))
    )
      throw refused();
    const claim = readEvidence(this.file("consumed.json"));
    if (
      claim.grantSha256 !== approvedApplicationGrantSha256 ||
      claim.purpose !== "slice1-application-only"
    )
      throw refused();
    const s = stateSchema.parse(
      readEvidence(this.file("application-state.json")),
    );
    if (
      !(
        process.pid === s.controllerPid ||
        process.pid === s.nextPid ||
        (s.nextPid !== null && process.ppid === s.nextPid)
      ) ||
      !["building", "serving"].includes(s.phase) ||
      !Number.isFinite(s.heartbeat) ||
      this.now() < s.heartbeat ||
      this.now() - s.heartbeat > 10000 ||
      s.cloud < 0 ||
      s.cloud > 600 ||
      s.http < 0 ||
      s.http > 300
    )
      throw refused();
    return s;
  }
  private save(s: State) {
    const temporary = this.file("application-state.next");
    const fd = fs.openSync(temporary, "wx", 0o600);
    try {
      durable(fd, s);
    } finally {
      fs.closeSync(fd);
    }
    fs.renameSync(temporary, this.file("application-state.json"));
  }
  async transaction<T>(
    action: (s: State) => T,
    allowStopped = false,
  ): Promise<T> {
    const lock = this.file("application-lock");
    const until = Date.now() + 2000;
    let fd: number | undefined;
    while (fd === undefined) {
      try {
        fd = fs.openSync(lock, "wx", 0o600);
      } catch (error) {
        if (
          (error as NodeJS.ErrnoException).code !== "EEXIST" ||
          Date.now() >= until
        ) {
          this.terminal = true;
          this.latch();
          throw refused();
        }
        await pause(10);
      }
    }
    try {
      const s = allowStopped
        ? stateSchema.parse(readEvidence(this.file("application-state.json")))
        : this.read();
      const result = action(s);
      this.save(s);
      return result;
    } catch (error) {
      if (error instanceof ScopeDenied) {
        this.record({ state: "scope-denied", kind: "company-mutation" });
        throw error;
      }
      this.terminal = true;
      this.latch();
      throw refused();
    } finally {
      fs.closeSync(fd);
      fs.unlinkSync(lock);
    }
  }
  initialize() {
    const { g } = this.load();
    const fd = fs.openSync(this.file("consumed.json"), "wx", 0o600);
    try {
      durable(fd, {
        purpose: g.purpose,
        grantSha256: approvedApplicationGrantSha256,
      });
    } finally {
      fs.closeSync(fd);
    }
    const manifest = fs.openSync(
      this.file("application.manifest.jsonl"),
      "wx",
      0o600,
    );
    try {
      durable(manifest, { state: "planned", planSha256: g.planSha256 });
    } finally {
      fs.closeSync(manifest);
    }
    const state: State = {
      phase: "building",
      controllerPid: process.pid,
      nextPid: null,
      heartbeat: this.now(),
      cloud: 0,
      http: 0,
      identity: false,
      csrfProbe: false,
      tokens: {},
      refresh: {},
      ids: {},
      writes: {
        A: { create: 0, rename: 0, metadata: 0, theme: 0 },
        B: { create: 0, rename: 0, metadata: 0, theme: 0 },
      },
    };
    const handle = fs.openSync(
      this.file("application-state.json"),
      "wx",
      0o600,
    );
    try {
      durable(handle, state);
    } finally {
      fs.closeSync(handle);
    }
  }
  async heartbeat() {
    await this.transaction((s) => {
      s.heartbeat = this.now();
    });
  }
  async launched(pid: number) {
    await this.transaction((s) => {
      if (
        !Number.isSafeInteger(pid) ||
        pid <= 0 ||
        s.phase !== "building" ||
        s.nextPid !== null ||
        process.pid !== s.controllerPid
      )
        throw refused();
      s.nextPid = pid;
      this.record({ state: "process-started", pid });
    });
  }
  async serve(pid?: number) {
    await this.transaction((s) => {
      if (!s.identity) throw refused();
      s.phase = "serving";
      if (
        !this.synthetic &&
        (!Number.isSafeInteger(pid) || (pid ?? 0) <= 0 || pid !== s.nextPid)
      )
        throw refused();
      this.record({ state: "serving", ...(pid ? { pid } : {}) });
    });
  }
  target() {
    const { g, c } = this.load();
    if (this.read().phase !== "serving") throw refused();
    return {
      kind: "cloud" as const,
      url: g.apiOrigin,
      publishableKey: c.publishableKey,
      cookieName: v3CloudCookieName,
      marker: {
        project_id: g.projectRef,
        purpose: "disposable-v3-slice0-cloud" as const,
        schema_version: 1 as const,
      },
    };
  }
  publicEnvironment() {
    const { g, c } = this.load();
    return {
      NEXT_PUBLIC_MY_KRAVV_ENV: v3CloudProfile,
      NEXT_PUBLIC_MY_KRAVV_CLOUD_PROJECT_REF: g.projectRef,
      NEXT_PUBLIC_SUPABASE_URL: g.apiOrigin,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: c.publishableKey,
    };
  }
  async http(
    method: string,
    host: string,
    origin: string | undefined,
    pathname: string,
  ) {
    await this.transaction((s) => {
      if (s.phase !== "serving" || s.http >= 300) throw refused();
      s.http++;
      const route =
        ["/", "/auth", "/foundation", "/icon.svg", "/favicon.ico"].includes(
          pathname,
        ) || pathname.startsWith("/_next/static/");
      const csrf =
        method === "POST" && origin === "https://csrf.invalid" && !s.csrfProbe;
      if (
        host !== "127.0.0.1:3103" ||
        !["GET", "HEAD", "POST"].includes(method) ||
        !route ||
        (method === "POST" && !["/auth", "/foundation"].includes(pathname)) ||
        (origin && origin !== applicationOrigin && !csrf)
      )
        throw refused();
      if (csrf) s.csrfProbe = true;
      this.record({
        state: "http",
        index: s.http,
        method,
        route: pathname.startsWith("/_next/") ? "asset" : pathname,
        csrf,
      });
    });
  }
  private claims(token: string) {
    const { g } = this.load();
    const parts = token.split(".");
    if (parts.length !== 3) throw refused();
    const p = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    const actor = (["A", "B"] as const).find((a) => g.users[a] === p.sub);
    if (
      !actor ||
      p.iss !== g.apiOrigin + "/auth/v1" ||
      p.role !== "authenticated" ||
      p.aud !== "authenticated" ||
      typeof p.exp !== "number" ||
      p.exp * 1000 <= this.now()
    )
      throw refused();
    return actor;
  }
  async fetch(
    input: string | URL | Request,
    init: RequestInit = {},
    origin?: string,
  ): Promise<Response> {
    const { g, c, expiry } = this.load();
    const request = new Request(input, init),
      url = new URL(request.url),
      method = request.method;
    const queryKeys = [...url.searchParams.keys()];
    if (new Set(queryKeys).size !== queryKeys.length) throw refused();
    const authQuery =
      url.pathname === "/auth/v1/token"
        ? ["grant_type"]
        : url.pathname === "/auth/v1/logout"
          ? ["scope"]
          : [];
    if (
      !["/rest/v1/companies", "/rest/v1/user_settings"].includes(
        url.pathname,
      ) &&
      queryKeys.some((key) => !authQuery.includes(key))
    )
      throw refused();
    let actor: Actor | undefined,
      mutation: Mutation | undefined,
      login: Actor | undefined,
      kind = "read",
      body: Record<string, unknown> | undefined;
    if (
      url.origin !== g.apiOrigin ||
      url.username ||
      url.password ||
      url.hash ||
      !["GET", "POST", "PATCH"].includes(method) ||
      request.headers.get("apikey") !== c.publishableKey
    )
      throw refused();
    if (method !== "GET")
      body = JSON.parse((await request.clone().text()) || "{}");
    const token = request.headers
      .get("authorization")
      ?.replace(/^Bearer /i, "");
    let index = 0;
    await this.transaction((s) => {
      if (s.cloud >= 600) throw refused();
      if (token && token !== c.publishableKey) {
        actor = this.claims(token);
        if (s.tokens[sha(token)] !== actor) throw refused();
      }
      if (
        url.pathname === "/rest/v1/rpc/v3_target_identity" &&
        method === "POST" &&
        Object.keys(body ?? {}).length === 0
      ) {
        kind = "identity";
      } else {
        if (s.phase !== "serving" || !s.identity) throw refused();
        if (
          url.pathname === "/auth/v1/token" &&
          method === "POST" &&
          url.searchParams.get("grant_type") === "password"
        ) {
          login = (["A", "B"] as const).find(
            (a) =>
              c.users[a].email.toLowerCase() ===
                String(body?.email).toLowerCase() &&
              c.users[a].password === body?.password,
          );
          if (
            !login ||
            origin !== applicationOrigin ||
            Object.keys(body ?? {}).some(
              (k) => !["email", "password", "gotrue_meta_security"].includes(k),
            )
          )
            throw refused();
          kind = "login";
        } else if (
          url.pathname === "/auth/v1/token" &&
          method === "POST" &&
          url.searchParams.get("grant_type") === "refresh_token"
        ) {
          login = s.refresh[sha(String(body?.refresh_token))];
          if (!login) throw refused();
          kind = "login";
        } else if (
          url.pathname === "/auth/v1/.well-known/jwks.json" &&
          method === "GET"
        )
          kind = "jwks";
        else {
          if (!actor) throw refused();
          if (url.pathname === "/auth/v1/user" && method === "GET")
            kind = "user";
          else if (
            url.pathname === "/auth/v1/logout" &&
            method === "POST" &&
            url.searchParams.get("scope") === "local" &&
            origin === applicationOrigin
          )
            kind = "logout";
          else if (
            url.pathname === "/rest/v1/rpc/v3_company_management_contract" &&
            method === "POST" &&
            Object.keys(body ?? {}).length === 0
          )
            kind = "capability";
          else if (
            url.pathname === "/rest/v1/rpc/v3_company_directory" &&
            method === "POST"
          ) {
            kind = "directory";
            z.object({
              p_query: z.string().max(200),
              p_page: z.number().int().min(0).max(10000),
            })
              .strict()
              .parse(body);
          } else if (
            ["/rest/v1/companies", "/rest/v1/user_settings"].includes(
              url.pathname,
            )
          ) {
            const table = url.pathname.endsWith("companies")
              ? "companies"
              : "settings";
            const allowed =
              table === "companies"
                ? [
                    "id",
                    "user_id",
                    "name",
                    "ticker",
                    "exchange",
                    "sector",
                    "short_note",
                    "created_at",
                    "updated_at",
                  ]
                : ["user_id", "theme"];
            for (const key of url.searchParams.keys())
              if (
                ![
                  "select",
                  "user_id",
                  "id",
                  "order",
                  "limit",
                  "offset",
                  "name",
                ].includes(key)
              )
                throw refused();
            const selected = (url.searchParams.get("select") ?? "").split(",");
            if (!selected.length || selected.some((k) => !allowed.includes(k)))
              throw refused();
            if (
              method !== "POST" &&
              url.searchParams.get("user_id") !== `eq.${g.users[actor]}`
            )
              throw refused();
            if (method === "GET") kind = table;
            else {
              if (origin !== applicationOrigin) throw refused();
              const payload = { ...body };
              if (table === "companies") {
                if (method === "POST") {
                  if (
                    payload.user_id !== g.users[actor] ||
                    s.writes[actor].create >= 1
                  )
                    throw refused();
                  delete payload.user_id;
                  const parsed = companyMetadataInput
                    .partial({
                      ticker: true,
                      exchange: true,
                      sector: true,
                      short_note: true,
                    })
                    .parse(payload);
                  if (
                    !new RegExp(
                      `^v3-slice1-app:${g.runId}:${actor}(?:[ :_-][A-Za-z0-9 _:-]{0,60})?$`,
                    ).test(parsed.name)
                  )
                    throw refused();
                  mutation = { actor, kind: "create", body: body! };
                } else {
                  if (
                    !s.ids[actor] ||
                    url.searchParams.get("id") !== `eq.${s.ids[actor]}`
                  )
                    throw new ScopeDenied(
                      "Company mutation outside this run refused.",
                    );
                  const parsed = companyMetadataInput
                    .partial({
                      ticker: true,
                      exchange: true,
                      sector: true,
                      short_note: true,
                    })
                    .parse(payload);
                  if (
                    !new RegExp(
                      `^v3-slice1-app:${g.runId}:${actor}(?:[ :_-][A-Za-z0-9 _:-]{0,60})?$`,
                    ).test(parsed.name)
                  )
                    throw refused();
                  const write = Object.keys(payload).some((k) => k !== "name")
                    ? "metadata"
                    : "rename";
                  if (s.writes[actor][write] >= 1) throw refused();
                  mutation = { actor, kind: write, body: body! };
                }
              } else {
                if (s.writes[actor].theme >= 2) throw refused();
                z.object({
                  ...(method === "POST"
                    ? { user_id: z.literal(g.users[actor]) }
                    : {}),
                  theme: z.enum(["light", "dark"]),
                })
                  .strict()
                  .parse(body);
                mutation = { actor, kind: "theme", body: body! };
              }
              s.writes[actor][mutation.kind]++;
              kind = "mutation";
            }
          } else throw refused();
        }
      }
      index = ++s.cloud;
      this.record({
        state: "sending",
        index,
        kind,
        method,
        ...(mutation
          ? {
              write: {
                actor: mutation.actor,
                kind: mutation.kind,
                payload: Object.fromEntries(
                  Object.entries(mutation.body).filter(
                    ([k]) => k !== "user_id",
                  ),
                ),
                ...(s.ids[mutation.actor] ? { id: s.ids[mutation.actor] } : {}),
              },
            }
          : {}),
        ...(kind === "logout" ? { actor } : {}),
      });
    });
    let httpStatus: number | undefined;
    try {
      const deadline = Math.min(this.now() + 10000, expiry);
      const timeout = deadline - this.now();
      if (timeout <= 0) throw refused();
      let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
      const timed = <T>(promise: Promise<T>) =>
        Promise.race([
          promise,
          new Promise<never>((_, reject) => {
            timeoutHandle = setTimeout(
              () => reject(refused()),
              Math.max(1, deadline - this.now()),
            );
          }),
        ]).finally(() => clearTimeout(timeoutHandle));
      const response = await timed(
        this.wire(url.href, {
          method,
          headers: request.headers,
          body: method === "GET" ? undefined : await request.text(),
          redirect: "error",
          cache: "no-store",
          signal: AbortSignal.any([
            AbortSignal.timeout(timeout),
            ...(request.signal ? [request.signal] : []),
          ]),
        }),
      );
      httpStatus = response.status;
      if (
        response.redirected ||
        (response.url && response.url !== url.href) ||
        !response.ok
      )
        throw refused();
      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];
      let length = 0;
      if (reader)
        try {
          for (;;) {
            const part = await timed(reader.read());
            if (part.done) break;
            length += part.value.length;
            if (length > 262144) throw refused();
            chunks.push(part.value);
          }
        } finally {
          void reader.cancel().catch(() => {});
        }
      const raw = Buffer.concat(chunks),
        value = raw.length
          ? JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw))
          : undefined;
      await this.transaction((s) => {
        if (kind === "identity") {
          if (
            response.status !== 200 ||
            !matchesCloudMarker(value, {
              project_id: g.projectRef,
              purpose: "disposable-v3-slice0-cloud",
              schema_version: 1,
            })
          )
            throw refused();
          s.identity = true;
        }
        if (kind === "login" || kind === "user") {
          const user = kind === "login" ? value?.user : value;
          const who = login ?? actor;
          if (
            !who ||
            response.status !== 200 ||
            user?.id !== g.users[who] ||
            user?.email?.toLowerCase() !== c.users[who].email.toLowerCase() ||
            !Number.isFinite(Date.parse(user?.email_confirmed_at))
          )
            throw refused();
          if (kind === "login") {
            if (
              typeof value.access_token !== "string" ||
              this.claims(value.access_token) !== who ||
              typeof value.refresh_token !== "string"
            )
              throw refused();
            s.tokens[sha(value.access_token)] = who;
            s.refresh[sha(value.refresh_token)] = who;
          }
        }
        if (["directory", "companies", "settings"].includes(kind)) {
          const rows = Array.isArray(value)
            ? value
            : request.headers.get("accept") ===
                  "application/vnd.pgrst.object+json" &&
                value &&
                typeof value === "object"
              ? [value]
              : undefined;
          if (
            !actor ||
            response.status !== 200 ||
            !rows ||
            rows.length > (kind === "settings" ? 1 : 25)
          )
            throw refused();
          for (const row of rows) {
            if (!row || row.user_id !== g.users[actor]) throw refused();
            if (kind !== "settings") {
              if (
                !z.uuid().safeParse(row.id).success ||
                typeof row.name !== "string" ||
                !row.name.trim() ||
                row.name.length > 200
              )
                throw refused();
              const id = url.searchParams.get("id");
              if (id && id !== `eq.${row.id}`) throw refused();
            } else if (
              url.searchParams.get("select")?.split(",").includes("theme") &&
              !["light", "dark"].includes(row.theme)
            )
              throw refused();
          }
        }
        if (kind === "capability" && value !== 1) throw refused();
        if (kind === "logout") {
          if (response.status !== 204) throw refused();
          if (!actor) throw refused();
          for (const [hash, owner] of Object.entries(s.tokens))
            if (owner === actor) delete s.tokens[hash];
          for (const [hash, owner] of Object.entries(s.refresh))
            if (owner === actor) delete s.refresh[hash];
        }
        if (mutation) {
          const rows = Array.isArray(value)
            ? value
            : request.headers.get("accept") ===
                  "application/vnd.pgrst.object+json" &&
                value &&
                typeof value === "object"
              ? [value]
              : [];
          if (
            response.status !== (method === "POST" ? 201 : 200) ||
            rows.length !== 1 ||
            rows[0]?.user_id !== g.users[mutation.actor]
          )
            throw refused();
          for (const [key, v] of Object.entries(mutation.body))
            if (rows[0][key] !== v) throw refused();
          if (mutation.kind === "create") {
            const id = z.uuid().parse(rows[0].id);
            if (Object.values(s.ids).includes(id)) throw refused();
            s.ids[mutation.actor] = id;
          } else if (
            mutation.kind !== "theme" &&
            rows[0].id !== s.ids[mutation.actor]
          )
            throw refused();
          this.record({
            state: "write-verified",
            index,
            kind: mutation.kind,
            actor: mutation.actor,
            ...(mutation.kind !== "theme" ? { id: rows[0].id } : {}),
          });
        }
        this.record({
          state: "verified",
          index,
          kind,
          httpStatus: response.status,
        });
      });
      return new Response(raw.length ? raw : null, {
        status: response.status,
        headers: response.headers,
      });
    } catch {
      this.terminal = true;
      this.latch();
      try {
        this.record({
          state: "failed",
          index,
          category: "transport-or-response",
          ...(httpStatus === undefined ? {} : { httpStatus }),
          ...(mutation ? { uncertainWrite: true } : {}),
        });
      } catch {
        /* Fail closed even without final evidence. */
      }
      throw refused();
    }
  }
  replayRestorationAllowed() {
    if (!this.config || !fs.existsSync(this.file("consumed.json"))) return true;
    try {
      return (
        stateSchema.parse(readEvidence(this.file("application-state.json")))
          .phase === "closed"
      );
    } catch {
      return false;
    }
  }
  isStopped() {
    return this.terminal || fs.existsSync(this.file("application-stop"));
  }
  async close() {
    this.latch();
    await this.transaction((s) => {
      s.phase = "closed";
      this.record({
        state: "closed",
        cloud: s.cloud,
        http: s.http,
        acceptance: "owner review required",
      });
    }, true);
  }
}

let singleton: ApplicationAuthority | undefined;
export function applicationAuthority() {
  if (!applicationSourceApproved()) throw refused();
  return (singleton ??= new ApplicationAuthority());
}
