import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import ts from "typescript";
const file = path.resolve("scripts/v3/application-authority.ts");
const require = createRequire(file);
export const sha = (value) => createHash("sha256").update(value).digest("hex");
// The actual source is never edited. Synthetic pins exist only in this module copy.
export function authorityCopy(pin = null) {
  let source = fs.readFileSync(file, "utf8");
  const literal = "const approvedApplicationGrantSha256: string | null = null;";
  if (!source.includes(literal)) throw Error("Actual source must be dormant.");
  source =
    source.replace(
      literal,
      `const approvedApplicationGrantSha256: string | null = ${JSON.stringify(pin)};`,
    ) + "\nexport {ApplicationAuthority};";
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", code)(
    require,
    loaded,
    loaded.exports,
  );
  return loaded.exports;
}
export function fixture(edit = () => {}) {
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), "kravv-app-offline-"),
  );
  if (process.platform !== "win32") fs.chmodSync(root, 0o700);
  let now = Date.parse("2026-10-24T00:00:00Z"),
    requests = 0;
  const users = {
    A: "20000000-0000-4000-8000-000000000001",
    B: "20000000-0000-4000-8000-000000000002",
  };
  const c = {
    projectRef: "kjcvgjfwlmyfroiqlbmw",
    apiOrigin: "https://kjcvgjfwlmyfroiqlbmw.supabase.co",
    publishableKey: "sb_publishable_offline_synthetic_only",
    users: Object.fromEntries(
      Object.entries(users).map(([a, id]) => [
        a,
        {
          id,
          email: `offline-${a.toLowerCase()}@example.invalid`,
          password: `offline-${a}`,
        },
      ]),
    ),
  };
  const api = authorityCopy();
  const g = {
    purpose: "slice1-application-only",
    projectRef: c.projectRef,
    apiOrigin: c.apiOrigin,
    runId: "10000000-0000-4000-8000-000000000011",
    head: "a".repeat(40),
    users,
    issuedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 600000).toISOString(),
    maxCloudRequests: 600,
    maxHttpRequests: 300,
    overallMs: 600000,
    retries: 0,
    planSha256: "",
    credentialSha256: "",
  };
  g.planSha256 = api.applicationPlanDigest(g.runId, users);
  g.credentialSha256 = sha(JSON.stringify(c));
  edit(g, c);
  const write = (name, value) =>
    fs.writeFileSync(path.join(root, name), value, { mode: 0o600 });
  write(".gitignore", "*\n");
  write("credentials.json", JSON.stringify(c));
  write("application-run-approval.json", JSON.stringify(g));
  const active = authorityCopy(sha(JSON.stringify(g)));
  let responder = async (url, init) => {
    if (url.endsWith("v3_target_identity"))
      return Response.json({
        project_id: c.projectRef,
        purpose: "disposable-v3-slice0-cloud",
        schema_version: 1,
      });
    if (url.includes("grant_type=password")) {
      const body = JSON.parse(init.body),
        actor = Object.keys(users).find((a) => c.users[a].email === body.email);
      return Response.json({
        user: {
          id: users[actor],
          email: c.users[actor].email,
          email_confirmed_at: new Date(now).toISOString(),
        },
        access_token: jwt(actor),
        refresh_token: `offline-refresh-${actor}`,
      });
    }
    throw Error("Synthetic unexpected request.");
  };
  function jwt(actor) {
    return (
      "offline." +
      Buffer.from(
        JSON.stringify({
          sub: users[actor],
          iss: c.apiOrigin + "/auth/v1",
          role: "authenticated",
          aud: "authenticated",
          exp: Math.floor((now + 600000) / 1000),
        }),
      ).toString("base64url") +
      ".offline"
    );
  }
  const wire = async (...args) => {
    requests++;
    return responder(...args);
  };
  const instance = () =>
    new active.ApplicationAuthority(root, () => now, wire, true);
  const a = instance();
  const headers = {
    apikey: c.publishableKey,
    "Content-Type": "application/json",
  };
  const identity = () =>
    a.fetch(c.apiOrigin + "/rest/v1/rpc/v3_target_identity", {
      method: "POST",
      headers,
      body: "{}",
    });
  const start = async () => {
    a.initialize();
    await identity();
    await a.serve();
  };
  const login = async (actor = "A") =>
    a.fetch(
      c.apiOrigin + "/auth/v1/token?grant_type=password",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: c.users[actor].email,
          password: c.users[actor].password,
        }),
      },
      "http://127.0.0.1:3103",
    );
  const call = (route, method = "GET", body, actor = "A", extra = {}) =>
    a.fetch(
      c.apiOrigin + route,
      {
        method,
        headers: {
          ...headers,
          authorization: `Bearer ${jwt(actor)}`,
          ...extra,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      },
      "http://127.0.0.1:3103",
    );
  const stateFile = path.join(root, `run-${g.runId}.application-state.json`);
  const manifestFile = path.join(
    root,
    `run-${g.runId}.application.manifest.jsonl`,
  );
  return {
    root,
    g,
    c,
    a,
    active,
    instance,
    start,
    identity,
    login,
    call,
    jwt,
    headers,
    write,
    get requests() {
      return requests;
    },
    advance: (n) => {
      now += n;
    },
    respond: (f) => {
      responder = f;
    },
    state: () => JSON.parse(fs.readFileSync(stateFile, "utf8")),
    setState: (edit) => {
      const s = JSON.parse(fs.readFileSync(stateFile, "utf8"));
      edit(s);
      write(path.basename(stateFile), JSON.stringify(s));
    },
    manifest: () => fs.readFileSync(manifestFile, "utf8"),
    dispose: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}
