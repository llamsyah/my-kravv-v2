import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import {
  buildCompanyAcceptancePlan,
  companyAcceptanceState,
  resolveCompanyAcceptanceStep,
  observeCompanyAcceptance,
} from "../../scripts/v3/company-acceptance-plan.ts";
import {
  companyAcceptanceMain,
  companyAcceptanceBudget,
  companyAcceptancePlanDigest,
  simulateCompanyAcceptanceRun,
  type SyntheticReply,
} from "../../scripts/v3/company-acceptance-runner.ts";

const at = Date.parse("2026-10-23T00:00:00Z");
const spec = {
  profile: "my-kravv-v3-cloud-dev",
  projectRef: "kjcvgjfwlmyfroiqlbmw",
  apiOrigin: "https://kjcvgjfwlmyfroiqlbmw.supabase.co",
  runId: "10000000-0000-4000-8000-000000000021",
  users: {
    A: "20000000-0000-4000-8000-000000000001",
    B: "20000000-0000-4000-8000-000000000002",
  },
};
const sha = (v: string | Buffer) =>
  createHash("sha256").update(v).digest("hex");
const clone = <T>(v: T): T => structuredClone(v);
function fixture(existing = true, tied = false) {
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), "kravv-v3-company-offline-"),
  );
  if (process.platform !== "win32") fs.chmodSync(root, 0o700);
  const plan = buildCompanyAcceptancePlan(spec),
    state = companyAcceptanceState();
  const credentials = {
    projectRef: spec.projectRef,
    apiOrigin: spec.apiOrigin,
    publishableKey: "sb_publishable_offline_synthetic_only",
    users: {
      A: {
        id: spec.users.A,
        email: "offline-a@example.invalid",
        password: "offline-password-a",
      },
      B: {
        id: spec.users.B,
        email: "offline-b@example.invalid",
        password: "offline-password-b",
      },
    },
  };
  const grant = {
    purpose: "slice1-company-api-only",
    projectRef: spec.projectRef,
    apiOrigin: spec.apiOrigin,
    runId: spec.runId,
    users: { ...spec.users },
    issuedAt: new Date(at).toISOString(),
    expiresAt: new Date(at + 600000).toISOString(),
    maxRequests: 100,
    overallMs: 300000,
    retries: 0,
    planSha256: companyAcceptancePlanDigest(spec),
    credentialSha256: "",
  };
  const write = (name: string, data: string) =>
    fs.writeFileSync(path.join(root, name), data, { mode: 0o600 });
  write(".gitignore", "*\n");
  const save = () => {
    const raw = JSON.stringify(credentials);
    grant.credentialSha256 = sha(raw);
    write("credentials.json", raw);
    write("slice1-run-approval.json", JSON.stringify(grant));
  };
  save();
  const replies: SyntheticReply[] = [];
  let sequence = 0;
  const previous = {
    ticker: null,
    exchange: null,
    sector: null,
    short_note: null,
    created_at: new Date(at - 10000).toISOString(),
    updated_at: new Date(at - 10000).toISOString(),
  };
  for (const template of plan.steps) {
    const step = resolveCompanyAcceptanceStep(template, state),
      actor = step.actor === "anonymous" ? "A" : step.actor;
    let reply: SyntheticReply;
    switch (step.check) {
      case "identity":
        reply = { status: 200, body: step.expected };
        break;
      case "login":
        reply = {
          status: 200,
          body: {
            access_token: `header.${Buffer.from(JSON.stringify({ sub: spec.users[actor], role: "authenticated", iss: spec.apiOrigin + "/auth/v1", exp: at / 1000 + 3600 })).toString("base64url")}.offline_signature`,
            user: {
              id: spec.users[actor],
              email: credentials.users[actor].email,
              email_confirmed_at: new Date(at).toISOString(),
            },
          },
        };
        break;
      case "user":
        reply = {
          status: 200,
          body: {
            id: spec.users[actor],
            email: credentials.users[actor].email,
            email_confirmed_at: new Date(at).toISOString(),
          },
        };
        break;
      case "empty":
        reply = { status: 200, body: [] };
        break;
      case "rls-denied":
      case "anonymous-denied":
        reply = { status: 403, body: { code: "42501" } };
        break;
      case "logout":
        reply = { status: 204 };
        break;
      case "unauthenticated":
        reply = { status: 401 };
        break;
      case "management":
        switch (step.assertion) {
          case "capability":
            reply = { status: 200, body: 1 };
            break;
          case "baseline": {
            const rows = existing
              ? [
                  {
                    ...previous,
                    id:
                      actor === "A"
                        ? "50000000-0000-4000-8000-000000000001"
                        : "50000000-0000-4000-8000-000000000002",
                    user_id: spec.users[actor],
                    name: "historical-synthetic-preserve",
                  },
                ]
              : [];
            state.baselines[actor] = rows;
            reply = { status: 200, body: clone(rows) };
            break;
          }
          case "settings-baseline": {
            const value = existing
              ? { user_id: spec.users[actor], theme: "light" as const }
              : null;
            state.settings[actor] = value;
            reply = { status: 200, body: value ? [value] : [] };
            break;
          }
          case "create": {
            sequence++;
            const row = {
              ...step.expected!,
              id: `40000000-0000-4000-8000-${String(tied ? 100 - sequence : sequence).padStart(12, "0")}`,
              created_at: new Date(at + (tied ? 1 : sequence)).toISOString(),
              updated_at: new Date(at + (tied ? 1 : sequence)).toISOString(),
            };
            // The fake server assigns IDs, not the client; PostgREST returns all selected fields.
            state.rows[step.key!] = row as (typeof state.rows)[string];
            reply = { status: 201, body: [clone(row)] };
            break;
          }
          case "update": {
            const row = {
              ...state.rows[step.key!],
              ...step.body,
              updated_at: new Date(at + 1000 + replies.length).toISOString(),
            };
            state.rows[step.key!] = row;
            reply = { status: 200, body: [clone(row)] };
            break;
          }
          case "row":
            reply = { status: 200, body: [clone(state.rows[step.key!])] };
            break;
          case "constraint":
            reply = { status: 400, body: { code: "23514" } };
            break;
          case "privilege":
            reply = { status: 403, body: { code: "42501" } };
            break;
          case "page": {
            const q = String(step.body!.p_query).toLowerCase(),
              page = Number(step.body!.p_page);
            const rows = Object.values(state.rows)
              .filter(
                (r) =>
                  r.user_id === spec.users[actor] &&
                  (r.name.toLowerCase().includes(q) ||
                    r.ticker?.toLowerCase().includes(q)),
              )
              .sort(
                (a, b) =>
                  Date.parse(a.created_at) - Date.parse(b.created_at) ||
                  a.id.localeCompare(b.id),
              );
            reply = {
              status: 200,
              body: clone(rows.slice(page * 24, page * 24 + 25)),
            };
            break;
          }
          case "settings-save":
            reply = {
              status: step.method === "POST" ? 201 : 200,
              body: [{ user_id: spec.users[actor], theme: step.theme }],
            };
            break;
          case "settings-read":
            reply = {
              status: 200,
              body: [
                {
                  user_id: spec.users[actor],
                  theme: actor === "A" ? "dark" : "light",
                },
              ],
            };
            break;
          case "preserved":
            reply = { status: 200, body: clone(state.baselines[actor]) };
            break;
          default:
            throw Error("Unhandled synthetic assertion");
        }
        break;
      default:
        throw Error("Unhandled synthetic request");
    }
    replies.push(reply);
  }
  return {
    root,
    plan,
    replies,
    grant,
    credentials,
    save,
    write,
    index: (label: string) => plan.steps.findIndex((s) => s.label === label),
    manifest: () =>
      fs.readFileSync(
        path.join(root, `run-${spec.runId}.manifest.jsonl`),
        "utf8",
      ),
    close: () => fs.rmSync(root, { recursive: true }),
  };
}

test("Slice 1 production entry rejects null pin before any file reads or network, with no runtime override", async () => {
  await assert.rejects(
    () => companyAcceptanceMain([]),
    /Cloud execution is blocked/,
  );
  const child = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    import fs from 'node:fs';import {companyAcceptanceMain} from './scripts/v3/company-acceptance-runner.ts';
    let reads=0,network=0;fs.readFileSync=()=>{reads++;throw Error('forbidden')};globalThis.fetch=async()=>{network++;throw Error('forbidden')};
    process.env.MY_KRAVV_V3_EXECUTION='approved';try{await companyAcceptanceMain(['approved']);process.exitCode=2}catch{}
    console.log(JSON.stringify({reads,network}));`,
    ],
    {
      encoding: "utf8",
      timeout: 10000,
      env: { NODE_ENV: "test", PATH: "", Path: "" },
      windowsHide: true,
    },
  );
  assert.equal(child.status, 0, child.stderr);
  assert.deepEqual(JSON.parse(child.stdout), { reads: 0, network: 0 });
});

test("Slice 1 plan has exactly 92 bounded requests and 26 fresh server-ID fixtures; no deletion/admin/SQL", () => {
  const p = buildCompanyAcceptancePlan(spec);
  assert.equal(p.steps.length, 92);
  assert.equal(Object.keys(p.fixtures).length, 26);
  assert.deepEqual(p.limits, {
    maxRequests: 100,
    overallMs: 300000,
    requestMs: 10000,
    retries: 0,
  });
  assert.equal(companyAcceptancePlanDigest(spec), sha(JSON.stringify(p)));
  for (const s of p.steps) {
    assert.equal(new URL(s.url).origin, spec.apiOrigin);
    assert.ok(["GET", "POST", "PATCH"].includes(s.method));
    assert.ok(!s.url.includes("/admin/"));
    if (s.assertion === "create") assert.ok(!("id" in s.body!));
  }
  const boundary = p.steps.find(
    (s) => s.key === "A00" && s.assertion === "create",
  )!;
  assert.equal(String(boundary.body!.ticker).length, 32);
  assert.equal(String(boundary.body!.short_note).length, 2000);
  for (const bad of [
    { ...spec, users: { A: spec.users.A, B: spec.users.A } },
    { ...spec, projectRef: "aaaaaaaaaaaaaaaaaaaa" },
    { ...spec, apiOrigin: "http://127.0.0.1" },
  ])
    assert.throws(() => buildCompanyAcceptancePlan(bad));
});

test("Slice 1 canned acceptance passes with retained records or absent settings, including timestamp ties", async () => {
  for (const [existing, tied] of [
    [true, false],
    [false, false],
    [true, true],
  ]) {
    const f = fixture(existing, tied);
    try {
      const result = await simulateCompanyAcceptanceRun(f.root, f.replies, at);
      assert.equal(result.outcome, "passed");
      assert.equal(result.requests, 92);
      assert.equal(result.completed, 92);
      assert.equal(result.sent.length, 92);
      const create = result.sent.find(
        (s) =>
          s.method === "POST" &&
          new URL(s.url).pathname === "/rest/v1/companies",
      )!;
      assert.ok(create.actorAuthorization);
      assert.ok(!create.fixtureColumns!.includes("id"));
      const themes = result.sent.filter(
        (s) =>
          new URL(s.url).pathname === "/rest/v1/user_settings" &&
          s.fixtureColumns?.includes("theme") &&
          s.method === "POST",
      );
      assert.equal(themes.length, existing ? 0 : 2);
      const text = f.manifest();
      assert.match(text, /"state":"passed"/);
      assert.equal((text.match(/company-id-verified/g) ?? []).length, 26);
      for (const secret of [
        f.credentials.publishableKey,
        f.credentials.users.A.password,
        f.credentials.users.B.email,
        "offline_signature",
        "historical-synthetic-preserve",
      ])
        assert.ok(!text.includes(secret));
      assert.ok(
        fs.existsSync(path.join(f.root, `run-${spec.runId}.consumed.json`)),
      );
      const replay = await simulateCompanyAcceptanceRun(f.root, f.replies, at);
      assert.equal(replay.sent.length, 0);
      assert.equal(replay.outcome, "failed");
    } finally {
      f.close();
    }
  }
});

test("Slice 1 preflight rejects grants, target, identity and credential drift before transport", async () => {
  const cases: Array<(f: ReturnType<typeof fixture>) => void> = [
    (f: ReturnType<typeof fixture>) => {
      f.grant.purpose = "two-user-api-only";
    },
    (f) => {
      f.grant.users.B = f.grant.users.A;
    },
    (f) => {
      f.grant.planSha256 = "0".repeat(64);
    },
    (f) => {
      f.grant.expiresAt = new Date(at).toISOString();
    },
    (f) => {
      f.grant.maxRequests = 101;
    },
    (f) => {
      f.grant.retries = 1;
    },
    (f) => {
      f.credentials.projectRef = "aaaaaaaaaaaaaaaaaaaa";
    },
    (f) => {
      f.credentials.publishableKey = "service_role_forbidden";
    },
    (f) => {
      f.credentials.users.B.email = f.credentials.users.A.email;
    },
    (f) => {
      f.credentials.users.B.id = f.credentials.users.A.id;
    },
  ];
  for (const change of cases) {
    const f = fixture();
    try {
      change(f);
      f.save();
      const r = await simulateCompanyAcceptanceRun(f.root, f.replies, at);
      assert.equal(r.outcome, "failed");
      assert.equal(r.sent.length, 0);
    } finally {
      f.close();
    }
  }
  const f = fixture();
  try {
    f.write("credentials.json", JSON.stringify(f.credentials) + " ");
    assert.equal(
      (await simulateCompanyAcceptanceRun(f.root, f.replies, at)).sent.length,
      0,
    );
  } finally {
    f.close();
  }
});

test("Slice 1 stops on identity/capability/baseline drift before any fixture writes", async () => {
  const fns: [string, (reply: SyntheticReply) => void][] = [
    [
      "V3 identity",
      (r) => {
        r.body = { project_id: "wrong" };
      },
    ],
    [
      "A confirmed identity",
      (r) => {
        (r.body as Record<string, unknown>).email_confirmed_at = null;
      },
    ],
    [
      "B login",
      (r) => {
        r.status = 400;
        r.body = { code: "invalid_credentials", msg: "PRIVATE SERVER MESSAGE" };
      },
    ],
    [
      "A capability",
      (r) => {
        r.body = 2;
      },
    ],
    [
      "A retained companies baseline",
      (r) => {
        r.body = Array(101).fill((r.body as unknown[])[0]);
      },
    ],
    [
      "B fresh namespace",
      (r) => {
        r.body = [{ id: "unexpected" }];
      },
    ],
  ];
  for (const [label, change] of fns) {
    const f = fixture();
    try {
      const i = f.index(label);
      change(f.replies[i]);
      const r = await simulateCompanyAcceptanceRun(f.root, f.replies, at);
      assert.equal(r.outcome, "failed");
      assert.equal(r.sent.length, i + 1);
      assert.ok(!r.sent.some((s) => s.fixtureColumns));
      assert.ok(!f.manifest().includes("PRIVATE SERVER MESSAGE"));
    } finally {
      f.close();
    }
  }
});

test("Slice 1 rejects ambiguous generated IDs, wrong owner/fields and any failed ownership/persistence assertion", async () => {
  const cases: [string, (r: SyntheticReply) => void][] = [
    [
      "create A00",
      (r) => {
        r.body = [];
      },
    ],
    [
      "create A00",
      (r) => {
        r.body = [...(r.body as unknown[]), ...(r.body as unknown[])];
      },
    ],
    [
      "create A00",
      (r) => {
        (r.body as Record<string, unknown>[])[0].id = "bad";
      },
    ],
    [
      "create A00",
      (r) => {
        (r.body as Record<string, unknown>[])[0].user_id = spec.users.B;
      },
    ],
    [
      "create A01",
      (r) => {
        (r.body as Record<string, unknown>[])[0].id =
          "40000000-0000-4000-8000-000000000001";
      },
    ],
    [
      "nullable metadata update",
      (r) => {
        (r.body as Record<string, unknown>[])[0].ticker = "wrong";
      },
    ],
    [
      "A foreign read",
      (r) => {
        r.body = [{ private: "unexpected" }];
      },
    ],
    [
      "B foreign update",
      (r) => {
        r.body = [{ private: "unexpected" }];
      },
    ],
    [
      "A forged owner",
      (r) => {
        r.status = 201;
        r.body = [];
      },
    ],
    [
      "A unchanged after rejected writes",
      (r) => {
        (r.body as Record<string, unknown>[])[0].name = "changed";
      },
    ],
    [
      "page zero",
      (r) => {
        (r.body as unknown[]).reverse();
      },
    ],
    [
      "page one",
      (r) => {
        r.body = [];
      },
    ],
    [
      "literal ticker search",
      (r) => {
        r.body = [];
      },
    ],
    [
      "A theme survives new session",
      (r) => {
        (r.body as Record<string, unknown>[])[0].theme = "light";
      },
    ],
    [
      "B retained companies unchanged",
      (r) => {
        (r.body as Record<string, unknown>[])[0].name = "changed";
      },
    ],
  ];
  for (const [label, change] of cases) {
    const f = fixture();
    try {
      const i = f.index(label);
      change(f.replies[i]);
      const r = await simulateCompanyAcceptanceRun(f.root, f.replies, at);
      assert.equal(r.outcome, "failed", label);
      assert.equal(r.sent.length, i + 1, label);
      assert.match(f.manifest(), /"state":"failed"/);
    } finally {
      f.close();
    }
  }
});

test("Slice 1 transport and deadlines fail once, retaining sanitized uncertain-write evidence", async () => {
  for (const mutation of [
    { transportFailure: true },
    { rawBody: "secret malformed JSON" },
    { redirected: true },
    { url: "https://foreign.invalid" },
    { elapsedMs: 10001 },
    { rawBody: '"' + "x".repeat(262145) + '"' },
  ]) {
    const f = fixture();
    try {
      const i = f.index("create A00");
      Object.assign(f.replies[i], mutation);
      const r = await simulateCompanyAcceptanceRun(f.root, f.replies, at);
      assert.equal(r.outcome, "failed");
      assert.equal(r.sent.length, i + 1);
      const evidence = f.manifest();
      assert.match(evidence, /"label":"create A00"/);
      assert.ok(!evidence.includes("company-id-verified"));
      assert.ok(!evidence.includes("secret malformed JSON"));
    } finally {
      f.close();
    }
  }
  let clock = 0;
  const budget = companyAcceptanceBudget(0, 600000, () => clock);
  for (let i = 0; i < 100; i++) budget.begin();
  assert.throws(() => budget.begin());
  clock = 300000;
  assert.throws(() => budget.check());
  const expired = companyAcceptanceBudget(0, 1, () => clock);
  assert.throws(() => expired.begin());
});

test("Slice 1 complete-byte/fsync persistence is required before first request, writes and dependent requests", async (t) => {
  for (const target of ["planned", "sending", "observation-verified"]) {
    for (const mode of ["short", "zero", "throw", "fsync"]) {
      const f = fixture();
      const original = fs.writeSync;
      let armed = false,
        hit = false;
      const mock = t.mock.method(fs, "writeSync", ((...args: unknown[]) => {
        const raw = Buffer.isBuffer(args[1]) ? args[1].toString() : "";
        const event = raw ? JSON.parse(raw) : {};
        const selected =
          event.state === target &&
          (target === "planned" || event.index === f.index("create A00"));
        if (selected && !hit) {
          hit = true;
          armed = true;
          if (mode === "throw") throw Error("PRIVATE WRITE ERROR");
          if (mode === "zero") return 0;
          if (mode === "short")
            return original(
              args[0] as number,
              args[1] as Buffer,
              0,
              Math.floor((args[1] as Buffer).length / 2),
              null,
            );
        }
        return Reflect.apply(original, fs, args);
      }) as typeof fs.writeSync);
      const sync = fs.fsyncSync;
      const syncMock = t.mock.method(fs, "fsyncSync", (fd: number) => {
        if (armed && mode === "fsync") {
          armed = false;
          throw Error("PRIVATE SYNC ERROR");
        }
        return sync(fd);
      });
      try {
        const r = await simulateCompanyAcceptanceRun(f.root, f.replies, at);
        assert.ok(hit);
        assert.equal(r.outcome, "failed");
        assert.equal(
          r.sent.length,
          target === "planned"
            ? 0
            : f.index("create A00") +
                (target === "observation-verified" ? 1 : 0),
        );
        assert.ok(!f.manifest().includes('"state":"passed"'));
        assert.ok(
          fs.existsSync(path.join(f.root, `run-${spec.runId}.consumed.json`)),
        );
      } finally {
        mock.mock.restore();
        syncMock.mock.restore();
        f.close();
      }
    }
  }
});

test("Slice 1 missing or unverified ID cannot resolve a dependent request", () => {
  const p = buildCompanyAcceptancePlan(spec),
    step = p.steps.find((s) => s.assertion === "update")!;
  assert.throws(() =>
    resolveCompanyAcceptanceStep(step, companyAcceptanceState()),
  );
  assert.throws(() =>
    observeCompanyAcceptance(
      p.steps.find((s) => s.assertion === "create")!,
      201,
      [{ id: "fabricated" }],
      companyAcceptanceState(),
    ),
  );
});

// Fresh child module graph; only its in-memory source constant is replaced.
// Actual runner source, private setup, application interlock and transport stay untouched.
function pinnedCompanyGrantProbe(f: ReturnType<typeof fixture>, pin: string) {
  const child = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      String.raw`
    import fs from 'node:fs';
    import path from 'node:path';
    import {pathToFileURL} from 'node:url';
    import {registerHooks,stripTypeScriptTypes} from 'node:module';
    const [root,pin,at]=process.argv.slice(1);
    const replies=fs.readFileSync(0,"utf8");
    if(!/^[a-f0-9]{64}$/.test(pin))throw Error('Invalid synthetic pin');
    const filename=path.resolve('scripts/v3/company-acceptance-runner.ts');
    const url=pathToFileURL(filename).href;
    const source=fs.readFileSync(filename,'utf8');
    const declaration='const approvedGrantSha256: string | null = null;';
    if(!source.includes(declaration))throw Error('Source null pin missing');
    const copy=source.replace(declaration,'const approvedGrantSha256: string | null = '+JSON.stringify(pin)+';');
    const hooks=registerHooks({load(address,context,next){
      if(address===url)return {format:'module',source:stripTypeScriptTypes(copy),shortCircuit:true};
      return next(address,context);
    }});
    const {simulateCompanyAcceptanceRun}=await import(url);
    hooks.deregister();
    const raw=fs.readFileSync(path.join(root,'slice1-run-approval.json'),'utf8');
    const parse=JSON.parse,open=fs.openSync,stat=fs.lstatSync;
    let grantParses=0,credentialOpens=0,credentialMetadata=0,claimAttempts=0,network=0;
    JSON.parse=function(value,...args){if(value===raw)grantParses++;return parse(value,...args)};
    fs.openSync=function(file,...args){
      if(path.basename(String(file))==='credentials.json')credentialOpens++;
      if(String(file).endsWith('.consumed.json'))claimAttempts++;
      return open(file,...args);
    };
    fs.lstatSync=function(file,...args){
      if(path.basename(String(file))==='credentials.json')credentialMetadata++;
      return stat(file,...args);
    };
    globalThis.fetch=async()=>{network++;throw Error('Offline probe forbids network')};
    const result=await simulateCompanyAcceptanceRun(root,parse(replies),Number(at));
    JSON.parse=parse;fs.openSync=open;fs.lstatSync=stat;
    if(fs.readFileSync(filename,'utf8')!==source)throw Error('Source file changed');
    console.log(JSON.stringify({outcome:result.outcome,sent:result.sent.length,
      grantParses,credentialOpens,credentialMetadata,claimAttempts,network}));
  `,
      f.root,
      pin,
      String(at),
    ],
    {
      input: JSON.stringify(f.replies),
      env: { NODE_ENV: "test", PATH: "", Path: "" },
      encoding: "utf8",
      timeout: 15000,
      windowsHide: true,
    },
  );
  assert.equal(child.error, undefined);
  assert.equal(child.status, 0, child.stderr);
  return JSON.parse(child.stdout.trim()) as {
    outcome: string;
    sent: number;
    grantParses: number;
    credentialOpens: number;
    credentialMetadata: number;
    claimAttempts: number;
    network: number;
  };
}

test("Slice 1 exact-byte source pin rejects mismatches before parsing, credentials or claims", () => {
  for (const mutation of [" ", "malformed"]) {
    const f = fixture();
    try {
      const bytes = fs.readFileSync(
        path.join(f.root, "slice1-run-approval.json"),
      );
      const pin = sha(bytes);
      f.write(
        "slice1-run-approval.json",
        mutation === " " ? bytes.toString() + " " : "not JSON",
      );
      const r = pinnedCompanyGrantProbe(f, pin);
      assert.deepEqual(r, {
        outcome: "failed",
        sent: 0,
        grantParses: 0,
        credentialOpens: 0,
        credentialMetadata: 0,
        claimAttempts: 0,
        network: 0,
      });
    } finally {
      f.close();
    }
  }
  const f = fixture();
  try {
    f.grant.expiresAt = new Date(at).toISOString();
    f.save();
    const r = pinnedCompanyGrantProbe(
      f,
      sha(fs.readFileSync(path.join(f.root, "slice1-run-approval.json"))),
    );
    assert.equal(r.outcome, "failed");
    assert.equal(r.grantParses, 1);
    assert.equal(r.credentialOpens, 0);
    assert.equal(r.claimAttempts, 0);
    assert.equal(r.network, 0);
  } finally {
    f.close();
  }
});

test("Slice 1 protected credentials, inherited configuration and persistent claims fail closed", async (t) => {
  const f = fixture();
  try {
    assert.equal(
      (
        await simulateCompanyAcceptanceRun(f.root, f.replies, at, {
          SUPABASE_URL: "forbidden",
        })
      ).sent.length,
      0,
    );
    fs.mkdirSync(path.join(f.root, `run-${spec.runId}.consumed.json`));
    const r = await simulateCompanyAcceptanceRun(f.root, f.replies, at);
    assert.equal(r.sent.length, 0);
    assert.equal(r.outcome, "failed");
  } finally {
    f.close();
  }
  const linked = fixture(),
    stat = fs.lstatSync;
  const metadata = t.mock.method(fs, "lstatSync", ((
    file: fs.PathLike,
    ...args: unknown[]
  ) => {
    const value = Reflect.apply(stat, fs, [file, ...args]);
    return path.basename(String(file)) === "credentials.json"
      ? Object.assign(Object.create(value), { nlink: 2 })
      : value;
  }) as typeof fs.lstatSync);
  try {
    assert.equal(
      (await simulateCompanyAcceptanceRun(linked.root, linked.replies, at)).sent
        .length,
      0,
    );
  } finally {
    metadata.mock.restore();
    linked.close();
  }
});

test("Slice 1 valid synthetic source pin still requires all 92 assertions without real transport", () => {
  const f = fixture();
  try {
    const result = pinnedCompanyGrantProbe(
      f,
      sha(fs.readFileSync(path.join(f.root, "slice1-run-approval.json"))),
    );
    assert.equal(result.outcome, "passed");
    assert.equal(result.sent, 92);
    assert.equal(result.network, 0);
    assert.equal(result.claimAttempts, 1);
  } finally {
    f.close();
  }
});

test("Slice 1 concurrent executions cannot share a claim and unwritable claim storage sends nothing", async (t) => {
  const f = fixture();
  try {
    const [a, b] = await Promise.all([
      simulateCompanyAcceptanceRun(f.root, f.replies, at),
      simulateCompanyAcceptanceRun(f.root, f.replies, at),
    ]);
    assert.deepEqual([a.outcome, b.outcome].sort(), ["failed", "passed"]);
    assert.equal(a.sent.length + b.sent.length, 92);
  } finally {
    f.close();
  }
  const blocked = fixture(),
    open = fs.openSync;
  const mock = t.mock.method(fs, "openSync", ((
    file: fs.PathLike,
    ...args: unknown[]
  ) => {
    if (String(file).endsWith(".consumed.json"))
      throw Error("PRIVATE FILE ERROR");
    return Reflect.apply(open, fs, [file, ...args]);
  }) as typeof fs.openSync);
  try {
    const r = await simulateCompanyAcceptanceRun(
      blocked.root,
      blocked.replies,
      at,
    );
    assert.equal(r.outcome, "failed");
    assert.equal(r.sent.length, 0);
  } finally {
    mock.mock.restore();
    blocked.close();
  }
});

test("Slice 1 total deadline and unexpected JWT claims stop without retries or fixtures", async () => {
  const f = fixture();
  try {
    for (const r of f.replies) r.elapsedMs = 4000;
    const r = await simulateCompanyAcceptanceRun(f.root, f.replies, at);
    assert.equal(r.outcome, "failed");
    assert.equal(r.sent.length, 75);
    assert.ok(!f.manifest().includes('"state":"passed"'));
  } finally {
    f.close();
  }
  for (const field of ["iss", "sub", "role", "exp"]) {
    const f = fixture();
    try {
      const r = f.replies[f.index("A login")].body as { access_token: string };
      const claims = JSON.parse(
        Buffer.from(r.access_token.split(".")[1], "base64url").toString(),
      );
      claims[field] = field === "exp" ? 0 : "wrong";
      r.access_token = `header.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.secret_signature`;
      const result = await simulateCompanyAcceptanceRun(f.root, f.replies, at);
      assert.equal(result.outcome, "failed");
      assert.equal(result.sent.length, 2);
      assert.ok(!f.manifest().includes("secret_signature"));
    } finally {
      f.close();
    }
  }
});

test("Slice 1 pagination retains PostgreSQL microsecond ordering rather than millisecond/UUID order", () => {
  const f = fixture(false);
  try {
    const state = companyAcceptanceState();
    const base = (
      f.replies[f.index("create A00")].body as Record<string, unknown>[]
    )[0];
    const early = {
      ...base,
      id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      created_at: "2026-10-23T00:00:00.000001+00:00",
    };
    const late = {
      ...base,
      id: "00000000-0000-4000-8000-000000000001",
      created_at: "2026-10-23T00:00:00.000002+00:00",
    };
    state.rows.A00 = early as (typeof state.rows)[string];
    state.rows.A01 = late as (typeof state.rows)[string];
    const page = {
      ...f.plan.steps.find((s) => s.label === "page zero")!,
      keys: ["A00", "A01"],
    };
    assert.doesNotThrow(() =>
      observeCompanyAcceptance(page, 200, [early, late], state),
    );
    assert.throws(() =>
      observeCompanyAcceptance(page, 200, [late, early], state),
    );
  } finally {
    f.close();
  }
});

test("Slice 1 final manifest fsync failure never returns PASS even after all assertions complete", async (t) => {
  const f = fixture(),
    write = fs.writeSync,
    sync = fs.fsyncSync;
  let final = false;
  const writing = t.mock.method(fs, "writeSync", ((...args: unknown[]) => {
    if (
      Buffer.isBuffer(args[1]) &&
      JSON.parse(args[1].toString()).state === "passed"
    )
      final = true;
    return Reflect.apply(write, fs, args);
  }) as typeof fs.writeSync);
  const syncing = t.mock.method(fs, "fsyncSync", (fd: number) => {
    if (final) throw Error("PRIVATE FINAL SYNC ERROR");
    return sync(fd);
  });
  try {
    const result = await simulateCompanyAcceptanceRun(f.root, f.replies, at);
    assert.equal(result.outcome, "failed");
    assert.equal(result.sent.length, 92);
    assert.equal(result.completed, 92);
    assert.ok(!f.manifest().includes("PRIVATE FINAL SYNC ERROR"));
  } finally {
    writing.mock.restore();
    syncing.mock.restore();
    f.close();
  }
});
