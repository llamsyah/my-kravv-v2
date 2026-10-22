import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { test, type TestContext } from "node:test";
import {
  buildCloudTwoUserPlan,
  resolveCloudCompanyStep,
} from "../../scripts/v3/cloud-two-user-plan.ts";
import {
  cloudTwoUserMain,
  assertCloudPrivateAcl,
  cloudTwoUserPlanDigest,
  cloudTwoUserBudget,
  simulateCloudTwoUserRun,
  type SyntheticReply,
} from "../../scripts/v3/cloud-two-user-runner.ts";

const at = Date.parse("2026-10-22T00:00:00Z");
const spec = {
  profile: "my-kravv-v3-cloud-dev",
  projectRef: "kjcvgjfwlmyfroiqlbmw",
  apiOrigin: "https://kjcvgjfwlmyfroiqlbmw.supabase.co",
  runId: "10000000-0000-4000-8000-000000000011",
  users: {
    A: "20000000-0000-4000-8000-000000000001",
    B: "20000000-0000-4000-8000-000000000002",
  },
};
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
function fixture() {
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), "kravv-v3-offline-"),
  );
  if (process.platform !== "win32") fs.chmodSync(root, 0o700);
  const creds = {
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
    purpose: "two-user-api-only",
    projectRef: spec.projectRef,
    apiOrigin: spec.apiOrigin,
    runId: spec.runId,
    users: { ...spec.users },
    issuedAt: new Date(at).toISOString(),
    expiresAt: new Date(at + 240000).toISOString(),
    maxRequests: 48,
    overallMs: 180000,
    retries: 0,
    planSha256: cloudTwoUserPlanDigest(spec),
    credentialSha256: "",
  };
  const write = (name: string, data: string) =>
    fs.writeFileSync(path.join(root, name), data, { mode: 0o600 });
  write(".gitignore", "*\n");
  const save = () => {
    const raw = JSON.stringify(creds);
    grant.credentialSha256 = sha(raw);
    write("credentials.json", raw);
    write("run-approval.json", JSON.stringify(grant));
  };
  save();
  const plan = buildCloudTwoUserPlan(spec);
  const ids = {
    A: "40000000-0000-4000-8000-000000000001",
    B: "40000000-0000-4000-8000-000000000002",
  };
  const replies: SyntheticReply[] = plan.steps.map((template) => {
    const step = resolveCloudCompanyStep(template, ids);
    switch (step.check) {
      case "identity":
        return { status: 200, body: step.expected };
      case "login": {
        const actor = step.actor as "A" | "B";
        const payload = {
          sub: spec.users[actor],
          role: "authenticated",
          iss: `${spec.apiOrigin}/auth/v1`,
          exp: at / 1000 + 3600,
        };
        return {
          status: 200,
          body: {
            access_token: `header.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.offline_signature`,
            user: {
              id: spec.users[actor],
              email: creds.users[actor].email,
              email_confirmed_at: new Date(at).toISOString(),
            },
          },
        };
      }
      case "user":
        return {
          status: 200,
          body: {
            id: step.expected!.id,
            email: creds.users[step.actor as "A" | "B"].email,
            email_confirmed_at: new Date(at).toISOString(),
          },
        };
      case "company-create":
        return {
          status: 201,
          body: [{ id: ids[step.actor as "A" | "B"], ...step.expected }],
        };
      case "company":
      case "settings":
        return {
          status: step.method === "POST" ? 201 : 200,
          body: [step.expected],
        };
      case "empty":
        return { status: 200, body: [] };
      case "rls-denied":
      case "anonymous-denied":
        return { status: 403, body: { code: "42501" } };
      case "logout":
        return { status: 204 };
      case "unauthenticated":
        return { status: 401, body: { code: "no_authorization" } };
    }
  });
  return {
    root,
    ids,
    creds,
    grant,
    save,
    write,
    plan,
    replies,
    manifest: () =>
      fs.readFileSync(
        path.join(root, `run-${spec.runId}.manifest.jsonl`),
        "utf8",
      ),
    close: () => fs.rmSync(root, { recursive: true }),
  };
}

test("Production runner remains closed before file/network access, even with apparent authorization", async (t) => {
  assert.match(
    fs.readFileSync("scripts/v3/cloud-two-user-runner.ts", "utf8"),
    /const approvedGrantSha256: string \| null = null;/,
  );
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    throw Error("Unexpected network");
  });
  await assert.rejects(
    () => cloudTwoUserMain([]),
    /Cloud execution is blocked/,
  );
  assert.equal(calls, 0);
  const child = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    import fs from 'node:fs';
    import {cloudTwoUserMain} from './scripts/v3/cloud-two-user-runner.ts';
    let reads=0,requests=0;
    fs.readFileSync=()=>{reads++;throw Error('forbidden')};
    globalThis.fetch=async()=>{requests++;throw Error('forbidden')};
    process.env.MY_KRAVV_V3_CLOUD_EXECUTION='approved';
    try {await cloudTwoUserMain([]);process.exitCode=2} catch(e) {
      if(!e.message.includes('Cloud execution is blocked'))process.exitCode=3;
    }
    console.log(JSON.stringify({reads,requests}));
  `,
    ],
    {
      env: { NODE_ENV: "test", PATH: "", Path: "" },
      encoding: "utf8",
      timeout: 10000,
      windowsHide: true,
    },
  );
  assert.equal(child.status, 0, child.stderr);
  assert.deepEqual(JSON.parse(child.stdout), { reads: 0, requests: 0 });
});

// Fresh child module graph; only its in-memory source constant is replaced.
// Actual runner source, private setup, application interlock and transport stay untouched.
function pinnedGrantProbe(f: ReturnType<typeof fixture>, pin: string) {
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
    const [root,pin,replies,at]=process.argv.slice(1);
    if(!/^[a-f0-9]{64}$/.test(pin))throw Error('Invalid synthetic pin');
    const filename=path.resolve('scripts/v3/cloud-two-user-runner.ts');
    const url=pathToFileURL(filename).href;
    const source=fs.readFileSync(filename,'utf8');
    const declaration='const approvedGrantSha256: string | null = null;';
    if(!source.includes(declaration))throw Error('Source null pin missing');
    const copy=source.replace(declaration,'const approvedGrantSha256: string | null = '+JSON.stringify(pin)+';');
    const hooks=registerHooks({load(address,context,next){
      if(address===url)return {format:'module',source:stripTypeScriptTypes(copy),shortCircuit:true};
      return next(address,context);
    }});
    const {simulateCloudTwoUserRun}=await import(url);
    hooks.deregister();
    const raw=fs.readFileSync(path.join(root,'run-approval.json'),'utf8');
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
    const result=await simulateCloudTwoUserRun(root,parse(replies),Number(at));
    JSON.parse=parse;fs.openSync=open;fs.lstatSync=stat;
    if(fs.readFileSync(filename,'utf8')!==source)throw Error('Source file changed');
    console.log(JSON.stringify({outcome:result.outcome,sent:result.sent.length,
      grantParses,credentialOpens,credentialMetadata,claimAttempts,network}));
  `,
      f.root,
      pin,
      JSON.stringify(f.replies),
      String(at),
    ],
    {
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

test("Synthetic source pin rejects changed invalid grant bytes before parsing, credential access or claim", () => {
  const f = fixture();
  try {
    const pin = sha(
      fs.readFileSync(path.join(f.root, "run-approval.json"), "utf8"),
    );
    f.write("run-approval.json", "not valid JSON");
    assert.deepEqual(pinnedGrantProbe(f, pin), {
      outcome: "failed",
      sent: 0,
      grantParses: 0,
      credentialOpens: 0,
      credentialMetadata: 0,
      claimAttempts: 0,
      network: 0,
    });
    assert.ok(
      !fs.existsSync(path.join(f.root, `run-${spec.runId}.consumed.json`)),
    );
  } finally {
    f.close();
  }
});

test("Synthetic source pin binds exact grant bytes, including whitespace-only changes", () => {
  const f = fixture();
  try {
    const original = fs.readFileSync(
      path.join(f.root, "run-approval.json"),
      "utf8",
    );
    const pin = sha(original);
    f.write("run-approval.json", original + "\n");
    assert.deepEqual(pinnedGrantProbe(f, pin), {
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
});

test("Matching synthetic source pin still enforces grant scope/expiry/plan and existing one-run checks", () => {
  for (const mode of ["invalid-scope", "expired", "wrong-plan", "valid"]) {
    const f = fixture();
    try {
      if (mode === "invalid-scope") f.grant.purpose = "wrong-purpose";
      if (mode === "expired") f.grant.expiresAt = new Date(at).toISOString();
      if (mode === "wrong-plan") f.grant.planSha256 = "0".repeat(64);
      f.save();
      const pin = sha(
        fs.readFileSync(path.join(f.root, "run-approval.json"), "utf8"),
      );
      const result = pinnedGrantProbe(f, pin);
      assert.equal(result.grantParses, 1);
      assert.equal(result.network, 0);
      if (mode === "valid") {
        assert.equal(result.outcome, "passed");
        assert.equal(result.sent, f.plan.steps.length);
        assert.equal(result.credentialOpens, 1);
        assert.equal(result.claimAttempts, 1);
        const replay = pinnedGrantProbe(f, pin);
        assert.equal(replay.outcome, "failed");
        assert.equal(replay.sent, 0);
      } else {
        assert.equal(result.outcome, "failed");
        assert.equal(result.sent, 0);
        assert.equal(result.credentialOpens, 0);
        assert.equal(result.credentialMetadata, 0);
        assert.equal(result.claimAttempts, 0);
      }
    } finally {
      f.close();
    }
  }
});

test("Dormant engine completes every assertion using canned transport, real file loader and one-run claim", async () => {
  const f = fixture();
  try {
    const result = await simulateCloudTwoUserRun(f.root, f.replies, at);
    assert.equal(result.outcome, "passed");
    assert.equal(result.completed, f.plan.steps.length);
    assert.equal(result.requests, f.plan.steps.length);
    for (const [index, sent] of result.sent.entries()) {
      const step = f.plan.steps[index];
      assert.equal(
        sent.actorAuthorization,
        step.actor !== "anonymous" &&
          !step.credentialSlot &&
          step.check !== "unauthenticated",
      );
      assert.equal(new URL(sent.url).origin, spec.apiOrigin);
    }
    const report = f.manifest();
    for (const secret of [
      f.creds.publishableKey,
      f.creds.users.A.email,
      f.creds.users.A.password,
      "offline_signature",
    ])
      assert.ok(!report.includes(secret));
    assert.ok(report.includes(f.ids.A));
    const events = report
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    assert.ok(!("id" in events[0].fixtures.companies.A));
    const verifiedIds = events.filter(
      (event) => event.state === "company-id-verified",
    );
    assert.equal(verifiedIds.length, 2);
    assert.equal(verifiedIds[0].company.id, f.ids.A);
    assert.equal(verifiedIds[1].company.id, f.ids.B);
    for (const actor of ["A", "B"] as const) {
      const createIndex = f.plan.steps.findIndex(
        (step) => step.label === `${actor} create own company`,
      );
      assert.deepEqual(result.sent[createIndex].fixtureColumns?.sort(), [
        "name",
        "user_id",
      ]);
      assert.equal(result.sent[createIndex].returnedRepresentation, true);
      const sendingIndex = events.findIndex(
        (event) =>
          event.state === "sending" &&
          event.label === `${actor} create own company`,
      );
      const idIndex = events.findIndex(
        (event) =>
          event.state === "company-id-verified" && event.actor === actor,
      );
      assert.ok(sendingIndex < idIndex);
      assert.ok(!("id" in events[sendingIndex].fixtureBody));
    }
    const foreignRead = f.plan.steps.findIndex(
      (step) => step.label === "A foreign read empty",
    );
    const foreignUpdate = f.plan.steps.findIndex(
      (step) => step.label === "A foreign update empty",
    );
    assert.equal(
      new URL(result.sent[foreignRead].url).searchParams.get("id"),
      `eq.${f.ids.B}`,
    );
    assert.equal(
      new URL(result.sent[foreignUpdate].url).searchParams.get("id"),
      `eq.${f.ids.B}`,
    );
    assert.ok(result.sent.every((sent) => !sent.url.includes("__company_")));
    assert.ok(report.includes('"state":"passed"'));
    const repeated = await simulateCloudTwoUserRun(f.root, f.replies, at);
    assert.equal(repeated.outcome, "failed");
    assert.equal(repeated.sent.length, 0);
    assert.equal(f.manifest(), report);
    const child = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `
      import {simulateCloudTwoUserRun} from './scripts/v3/cloud-two-user-runner.ts';
      const r=await simulateCloudTwoUserRun(process.argv[1],JSON.parse(process.argv[2]),Number(process.argv[3]));
      console.log(JSON.stringify({outcome:r.outcome,requests:r.requests}));
    `,
        f.root,
        JSON.stringify(f.replies),
        String(at),
      ],
      {
        env: { NODE_ENV: "test", PATH: "", Path: "" },
        encoding: "utf8",
        timeout: 10000,
        windowsHide: true,
      },
    );
    assert.equal(child.status, 0, child.stderr);
    assert.deepEqual(JSON.parse(child.stdout), {
      outcome: "failed",
      requests: 0,
    });
  } finally {
    f.close();
  }
});

test("Private ACL policy rejects shared/null-DACL ownership; linked credential metadata fails closed", async (t) => {
  const acl = {
    owner: "owner-sid",
    current: "owner-sid",
    allowed: ["owner-sid", "S-1-5-18", "S-1-5-32-544"],
    nonNullDacl: true,
  };
  assert.doesNotThrow(() => assertCloudPrivateAcl(acl));
  for (const changed of [
    null,
    { ...acl, owner: "other" },
    { ...acl, allowed: ["Everyone"] },
    { ...acl, nonNullDacl: false },
    { ...acl, allowed: [] },
  ])
    assert.throws(() => assertCloudPrivateAcl(changed));
  const f = fixture();
  try {
    // Windows sandbox does not permit hard-link creation; inject only stat metadata.
    const original = fs.lstatSync;
    t.mock.method(fs, "lstatSync", (file: fs.PathLike) => {
      const stat = original(file);
      if (String(file) === path.join(f.root, "credentials.json"))
        Object.defineProperty(stat, "nlink", { value: 2 });
      return stat;
    });
    assert.equal(
      (await simulateCloudTwoUserRun(f.root, f.replies, at)).requests,
      0,
    );
  } finally {
    f.close();
  }
});

test("Existing settings or confirmed-user mismatch stops before writes; engine never logs private observations", async (t) => {
  const logs: unknown[] = [];
  t.mock.method(console, "log", (...values: unknown[]) => {
    logs.push(values);
  });
  t.mock.method(console, "error", (...values: unknown[]) => {
    logs.push(values);
  });
  for (const index of [2, 3]) {
    const f = fixture();
    try {
      f.replies[index] =
        index === 3
          ? { status: 200, body: [{ user_id: spec.users.A }] }
          : {
              status: 200,
              body: {
                id: spec.users.A,
                email: f.creds.users.A.email,
                email_confirmed_at: null,
              },
            };
      const r = await simulateCloudTwoUserRun(f.root, f.replies, at);
      assert.equal(r.outcome, "failed");
      assert.equal(r.requests, index + 1);
      assert.ok(!f.manifest().includes("create own company"));
    } finally {
      f.close();
    }
  }
  assert.deepEqual(logs, []);
});

test("Missing/expired/ambiguous/wrong-target grants fail before transport", async () => {
  for (const change of [
    (f: ReturnType<typeof fixture>) =>
      fs.unlinkSync(path.join(f.root, "run-approval.json")),
    (f: ReturnType<typeof fixture>) => {
      f.grant.projectRef = "b".repeat(20);
      f.save();
    },
    (f: ReturnType<typeof fixture>) => {
      f.grant.apiOrigin = "https://other.invalid";
      f.save();
    },
    (f: ReturnType<typeof fixture>) => {
      f.grant.expiresAt = new Date(at).toISOString();
      f.save();
    },
    (f: ReturnType<typeof fixture>) => {
      f.grant.issuedAt = new Date(at + 1).toISOString();
      f.save();
    },
    (f: ReturnType<typeof fixture>) => {
      f.grant.planSha256 = "0".repeat(64);
      f.save();
    },
    (f: ReturnType<typeof fixture>) =>
      f.write(
        "run-approval.json",
        JSON.stringify({ ...f.grant, override: true }),
      ),
  ]) {
    const f = fixture();
    try {
      change(f);
      const r = await simulateCloudTwoUserRun(f.root, f.replies, at);
      assert.equal(r.outcome, "failed");
      assert.equal(r.sent.length, 0);
    } finally {
      f.close();
    }
  }
});

test("Wrong credentials/users, private-file provenance and inherited V2 variables fail closed", async () => {
  for (const change of [
    (f: ReturnType<typeof fixture>) => {
      f.creds.publishableKey = "sb_secret_offline_forbidden";
      f.save();
    },
    (f: ReturnType<typeof fixture>) => {
      f.creds.users.A.id = f.creds.users.B.id;
      f.save();
    },
    (f: ReturnType<typeof fixture>) => {
      f.creds.users.A.email = f.creds.users.B.email;
      f.save();
    },
    (f: ReturnType<typeof fixture>) => f.write("credentials.json", "{}"),
    (f: ReturnType<typeof fixture>) => f.write(".gitignore", ""),
    (f: ReturnType<typeof fixture>) => fs.mkdirSync(path.join(f.root, ".git")),
  ]) {
    const f = fixture();
    try {
      change(f);
      const r = await simulateCloudTwoUserRun(f.root, f.replies, at);
      assert.equal(r.outcome, "failed");
      assert.equal(r.sent.length, 0);
    } finally {
      f.close();
    }
  }
  for (const key of [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SECRET_KEY",
    "MY_KRAVV_V3_CLOUD_SECRET_KEY",
    "NODE_OPTIONS",
    "HTTPS_PROXY",
  ]) {
    const f = fixture();
    try {
      assert.equal(
        (
          await simulateCloudTwoUserRun(f.root, f.replies, at, {
            [key]: "never-echo",
          })
        ).sent.length,
        0,
      );
    } finally {
      f.close();
    }
  }
});

test("Wrong live marker, account/confirmation or service-role token stops before fixture writes", async () => {
  for (const index of [0, 1, 2]) {
    const f = fixture();
    try {
      f.replies[index] = {
        status: 200,
        body: { project_id: "wrong", user: { id: "wrong" } },
      };
      const r = await simulateCloudTwoUserRun(f.root, f.replies, at);
      assert.equal(r.outcome, "failed");
      assert.equal(r.requests, index + 1);
      assert.ok(!f.manifest().includes('"method":"PATCH"'));
      assert.ok(!f.manifest().includes("create own company"));
    } finally {
      f.close();
    }
  }
  const f = fixture();
  try {
    const login = f.replies[1].body as { access_token: string };
    login.access_token = `header.${Buffer.from(JSON.stringify({ sub: spec.users.A, iss: spec.apiOrigin + "/auth/v1", role: "service_role", exp: at / 1000 + 3600 })).toString("base64url")}.offline`;
    assert.equal(
      (await simulateCloudTwoUserRun(f.root, f.replies, at)).requests,
      2,
    );
  } finally {
    f.close();
  }
});

test("Transport rejects redirects, malformed/oversized bodies and failures, with no retries or secret logs", async () => {
  for (const reply of [
    { status: 302 },
    { status: 200, body: {}, redirected: true },
    { status: 200, body: {}, url: "https://other.invalid" },
    { status: 200, rawBody: "not JSON" },
    { status: 200, rawBody: "x".repeat(262145) },
    { status: 500, body: { password: "never-echo" } },
    { status: 200, transportFailure: true },
    { status: 200, elapsedMs: 10000 },
  ]) {
    const f = fixture();
    try {
      f.replies[0] = reply;
      const r = await simulateCloudTwoUserRun(f.root, f.replies, at);
      assert.equal(r.outcome, "failed");
      assert.equal(r.requests, 1);
      assert.equal(r.sent.length, 1);
      assert.ok(!f.manifest().includes("never-echo"));
    } finally {
      f.close();
    }
  }
});

test("Actual response-body timeout rejects stalled streams and consumes the run", async () => {
  const f = fixture();
  try {
    f.grant.expiresAt = new Date(at + 5).toISOString();
    f.save();
    f.replies[0] = { status: 200, stallBody: true };
    const r = await simulateCloudTwoUserRun(f.root, f.replies, at);
    assert.equal(r.outcome, "failed");
    assert.equal(r.requests, 1);
    assert.equal(
      (await simulateCloudTwoUserRun(f.root, f.replies, at)).sent.length,
      0,
    );
  } finally {
    f.close();
  }
});

test("All-request cap, total deadline and grant expiry budgets reject further sends", async () => {
  let clock = at;
  const b = cloudTwoUserBudget(at, at + 240000, () => clock);
  for (let i = 0; i < 48; i++) assert.equal(b.begin(), 10000);
  assert.throws(() => b.begin());
  assert.equal(b.count, 48);
  clock = at + 180000;
  assert.throws(b.check);
  const expiry = cloudTwoUserBudget(at, at + 1000, () => clock);
  clock = at + 1000;
  assert.throws(() => expiry.begin());
  const f = fixture();
  try {
    // 9 seconds each is within the per-request cap but exceeds the overall budget.
    f.replies.forEach((reply) => {
      reply.elapsedMs = 9000;
    });
    const r = await simulateCloudTwoUserRun(f.root, f.replies, at);
    assert.equal(r.outcome, "failed");
    assert.ok(r.requests < f.plan.steps.length);
  } finally {
    f.close();
  }
});

test("Failure after a fixture transmission retains exact uncertain mutation evidence and never cleans up", async () => {
  const f = fixture();
  try {
    const index = f.plan.steps.findIndex(
      (s) => s.label === "A create own company",
    );
    f.replies[index] = { status: 200, transportFailure: true };
    const r = await simulateCloudTwoUserRun(f.root, f.replies, at);
    assert.equal(r.outcome, "failed");
    assert.equal(r.requests, index + 1);
    assert.ok(f.manifest().includes(f.plan.fixtures.companies.A.name));
    assert.ok(!f.manifest().includes(f.ids.A));
    assert.ok(!f.manifest().includes("company-id-verified"));
    assert.ok(f.manifest().includes('"state":"failed"'));
    assert.ok(r.sent.every((s) => s.method !== "DELETE"));
  } finally {
    f.close();
  }
});

test("Invalid/missing/ambiguous generated IDs leave uncertain writes; duplicate A/B IDs stop before isolation", async () => {
  for (const kind of [
    "missing",
    "invalid",
    "multiple",
    "wrong-owner",
    "wrong-name",
    "null",
    "duplicate",
  ]) {
    const f = fixture();
    try {
      const actor = kind === "duplicate" ? "B" : "A";
      const index = f.plan.steps.findIndex(
        (step) => step.label === `${actor} create own company`,
      );
      const row = { id: f.ids[actor], ...f.plan.fixtures.companies[actor] };
      let body: unknown = [row];
      if (kind === "missing") body = [f.plan.fixtures.companies.A];
      if (kind === "invalid") body = [{ ...row, id: "not-a-uuid" }];
      if (kind === "multiple") body = [row, row];
      if (kind === "wrong-owner") body = [{ ...row, user_id: spec.users.B }];
      if (kind === "wrong-name") body = [{ ...row, name: "not-this-run" }];
      if (kind === "null") body = [{ ...row, id: null }];
      if (kind === "duplicate") body = [{ ...row, id: f.ids.A }];
      f.replies[index] = { status: 201, body };
      const result = await simulateCloudTwoUserRun(f.root, f.replies, at);
      assert.equal(result.outcome, "failed");
      assert.equal(result.requests, index + 1);
      const events = f
        .manifest()
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line));
      assert.equal(
        events.filter(
          (event) =>
            event.state === "company-id-verified" && event.actor === actor,
        ).length,
        0,
      );
      assert.ok(
        events.some(
          (event) =>
            event.state === "sending" &&
            event.label === `${actor} create own company`,
        ),
      );
      assert.ok(
        !events.some(
          (event) =>
            event.state === "verified" &&
            event.label === `${actor} create own company`,
        ),
      );
      assert.ok(
        !result.sent.some((sent) =>
          new URL(sent.url).searchParams.get("id")?.startsWith("in."),
        ),
      );
      assert.ok(events.some((event) => event.state === "failed"));
    } finally {
      f.close();
    }
  }
});

async function assertManifestPersistenceFailures(
  t: TestContext,
  stage: "planned" | "sending" | "company-id-verified",
) {
  for (const mode of ["partial", "zero", "exception", "interrupted", "fsync"]) {
    const f = fixture();
    const originalWrite = fs.writeSync;
    const originalSync = fs.fsyncSync;
    let targetFd: number | undefined;
    let faultTriggered = false;
    let writesAfterFault = 0;
    let syncAttemptsAfterFault = 0;
    const write = t.mock.method(
      fs,
      "writeSync",
      (
        fd: number,
        bytes: Buffer,
        offset: number,
        length: number,
        position: null,
      ) => {
        if (faultTriggered && fd === targetFd) writesAfterFault++;
        let event: { state?: string; label?: string; actor?: string } = {};
        try {
          event = JSON.parse(bytes.toString("utf8"));
        } catch {
          /* Claim/internal writes are not manifest events. */
        }
        const match =
          event.state === stage &&
          (stage === "planned" ||
            (stage === "sending" && event.label === "A create own company") ||
            (stage === "company-id-verified" && event.actor === "A"));
        if (!match) return originalWrite(fd, bytes, offset, length, position);
        targetFd = fd;
        faultTriggered = true;
        if (mode === "zero") return 0;
        if (mode === "exception") throw Error("Synthetic write failure");
        if (mode === "partial" || mode === "interrupted") {
          const count = originalWrite(fd, bytes, offset, 7, position);
          if (mode === "interrupted")
            throw Error("Synthetic interruption after partial persistence");
          return count;
        }
        return originalWrite(fd, bytes, offset, length, position);
      },
    );
    const sync = t.mock.method(fs, "fsyncSync", (fd: number) => {
      if (faultTriggered && fd === targetFd) {
        syncAttemptsAfterFault++;
        if (mode === "fsync") throw Error("Synthetic durability failure");
      }
      return originalSync(fd);
    });
    try {
      const createIndex = f.plan.steps.findIndex(
        (step) => step.label === "A create own company",
      );
      const expectedSent =
        stage === "planned"
          ? 0
          : createIndex + (stage === "company-id-verified" ? 1 : 0);
      const result = await simulateCloudTwoUserRun(f.root, f.replies, at);
      assert.equal(faultTriggered, true);
      assert.equal(result.outcome, "failed");
      assert.equal(
        result.sent.length,
        expectedSent,
        "Required manifest failure must prevent the next send",
      );
      assert.equal(
        writesAfterFault,
        0,
        "Never append failure JSON onto an incomplete/untrusted record",
      );
      assert.equal(syncAttemptsAfterFault, mode === "fsync" ? 1 : 0);
      const report = f.manifest();
      assert.ok(!report.includes('"state":"passed"'));
      assert.ok(!report.includes('"state":"failed"'));
      if (stage === "company-id-verified") {
        assert.ok(report.includes('"label":"A create own company"'));
        // A server response is not acceptance without the durable ID record.
        assert.ok(
          !report.includes('"state":"verified","index":' + createIndex + ","),
        );
      }
      assert.ok(
        fs.existsSync(path.join(f.root, `run-${spec.runId}.consumed.json`)),
      );
      const replay = await simulateCloudTwoUserRun(f.root, f.replies, at);
      assert.equal(replay.outcome, "failed");
      assert.equal(replay.sent.length, 0);
      assert.equal(f.manifest(), report);
    } finally {
      write.mock.restore();
      sync.mock.restore();
      f.close();
    }
  }
}

test("Initial manifest partial/zero/exception/interruption/fsync failure prevents every request", async (t) => {
  await assertManifestPersistenceFailures(t, "planned");
});

test("Intended-write manifest partial/zero/exception/interruption/fsync failure prevents fixture transmission", async (t) => {
  await assertManifestPersistenceFailures(t, "sending");
});

test("Verified-ID manifest partial/zero/exception/interruption/fsync failure prevents every dependent request", async (t) => {
  await assertManifestPersistenceFailures(t, "company-id-verified");
});

test("Login failures retain only bounded stage/category/status diagnostics and stop before writes", async () => {
  const cases: {
    reply: (f: ReturnType<typeof fixture>) => SyntheticReply;
    category: string;
    stage: string;
    status?: number;
  }[] = [
    {
      reply: () => ({ status: 200, transportFailure: true }),
      category: "transport",
      stage: "transport",
    },
    {
      reply: () => ({
        status: 400,
        body: { message: "never-persist-private-server-message" },
      }),
      category: "http-status",
      stage: "observation",
      status: 400,
    },
    {
      reply: () => ({
        status: 200,
        rawBody: "never-persist-private-invalid-json",
      }),
      category: "response-json",
      stage: "response",
      status: 200,
    },
    {
      reply: () => ({ status: 200, body: {} }),
      category: "response-shape",
      stage: "observation",
      status: 200,
    },
    {
      reply: (f) => ({
        status: 200,
        body: { ...(f.replies[1].body as object), user: { id: spec.users.B } },
      }),
      category: "user-identity",
      stage: "observation",
      status: 200,
    },
    {
      reply: (f) => {
        const body = structuredClone(f.replies[1].body) as {
          user: { email: string };
        };
        body.user.email = "never-persist-private@example.invalid";
        return { status: 200, body };
      },
      category: "user-identity",
      stage: "user",
      status: 200,
    },
    {
      reply: (f) => ({
        status: 200,
        body: {
          ...(f.replies[1].body as object),
          access_token: "never-persist-private-token",
        },
      }),
      category: "jwt-claims",
      stage: "jwt",
      status: 200,
    },
    {
      reply: (f) => ({
        status: 200,
        body: {
          ...(f.replies[1].body as object),
          access_token:
            "header." +
            Buffer.from(
              JSON.stringify({
                sub: spec.users.A,
                iss: spec.apiOrigin + "/auth/v1",
                role: "service_role",
                exp: at / 1000 + 3600,
              }),
            ).toString("base64url") +
            ".signature",
        },
      }),
      category: "jwt-claims",
      stage: "jwt",
      status: 200,
    },
    {
      reply: () => ({ status: 200, elapsedMs: 10000 }),
      category: "deadline",
      stage: "budget",
    },
    {
      reply: () => ({ status: 200, stallBody: true }),
      category: "deadline",
      stage: "budget",
      status: 200,
    },
  ];
  for (const c of cases) {
    const f = fixture();
    try {
      f.replies[1] = c.reply(f);
      // Exercise the actual response-body timeout quickly with a synthetic grant.
      if (f.replies[1].stallBody) {
        f.grant.expiresAt = new Date(at + 5).toISOString();
        f.save();
      }
      const r = await simulateCloudTwoUserRun(f.root, f.replies, at);
      assert.equal(r.outcome, "failed");
      assert.equal(r.sent.length, 2);
      const events = f
        .manifest()
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line));
      const final = events.at(-1);
      assert.deepEqual(final.diagnostic, {
        requestIndex: 1,
        stage: c.stage,
        category: c.category,
        ...(c.status === undefined ? {} : { httpStatus: c.status }),
        ...(c.category === "http-status" ? { authReason: "unknown" } : {}),
      });
      assert.deepEqual(Object.keys(final).sort(), [
        "cleanup",
        "completed",
        "diagnostic",
        "requests",
        "state",
      ]);
      const failed = JSON.stringify(final);
      for (const secret of [
        "never-persist",
        f.creds.publishableKey,
        f.creds.users.A.password,
        f.creds.users.A.email,
        spec.users.A,
      ])
        assert.ok(!failed.includes(secret));
      assert.ok(!events.some((e) => e.state === "company-id-verified"));
    } finally {
      f.close();
    }
  }
});

test("Failed diagnostic short/zero/exception/interruption/fsync writes never permit another request or append", async (t) => {
  for (const mode of ["partial", "zero", "exception", "interrupted", "fsync"]) {
    const f = fixture();
    f.replies[1] = { status: 400, body: { message: "never-persist-private" } };
    const originalWrite = fs.writeSync,
      originalSync = fs.fsyncSync;
    let fault = false,
      after = 0,
      target: number | undefined;
    const write = t.mock.method(
      fs,
      "writeSync",
      (
        fd: number,
        bytes: Buffer,
        offset: number,
        length: number,
        position: null,
      ) => {
        if (fault && fd === target) after++;
        if (!bytes.toString("utf8").includes('"state":"failed"'))
          return originalWrite(fd, bytes, offset, length, position);
        fault = true;
        target = fd;
        if (mode === "zero") return 0;
        if (mode === "exception")
          throw Error("never-persist-private-exception");
        if (mode === "partial" || mode === "interrupted") {
          const count = originalWrite(fd, bytes, offset, 7, position);
          if (mode === "interrupted")
            throw Error("never-persist-private-interruption");
          return count;
        }
        return originalWrite(fd, bytes, offset, length, position);
      },
    );
    const sync = t.mock.method(fs, "fsyncSync", (fd: number) => {
      if (fault && fd === target && mode === "fsync")
        throw Error("never-persist-private-fsync");
      return originalSync(fd);
    });
    try {
      const r = await simulateCloudTwoUserRun(f.root, f.replies, at);
      assert.equal(r.outcome, "failed");
      assert.equal(r.sent.length, 2);
      assert.equal(fault, true);
      assert.equal(after, 0);
      assert.ok(!f.manifest().includes('"state":"passed"'));
      assert.ok(!f.manifest().includes("never-persist"));
      assert.ok(
        fs.existsSync(
          path.join(f.root, "run-" + spec.runId + ".consumed.json"),
        ),
      );
    } finally {
      write.mock.restore();
      sync.mock.restore();
      f.close();
    }
  }
});

test("User B Auth rejections persist only exact allowlisted reasons, never raw codes or private values", async (t) => {
  const logs: unknown[] = [];
  t.mock.method(console, "log", (...values: unknown[]) => {
    logs.push(values);
  });
  t.mock.method(console, "error", (...values: unknown[]) => {
    logs.push(values);
  });
  const cases: { body: unknown; reason: string }[] = [
    { body: { code: "invalid_credentials" }, reason: "invalid-credentials" },
    { body: { code: "email_not_confirmed" }, reason: "email-unconfirmed" },
    { body: { code: "user_banned" }, reason: "account-restricted" },
    { body: { code: "captcha_failed" }, reason: "captcha-required" },
    { body: { code: "never-persist-private-unknown-code" }, reason: "unknown" },
    { body: { code: "__proto__" }, reason: "unknown" },
    { body: { code: "INVALID_CREDENTIALS" }, reason: "unknown" },
    { body: { code: "invalid_credentials " }, reason: "unknown" },
    { body: { code: null }, reason: "unknown" },
    { body: { code: 400 }, reason: "unknown" },
    { body: { code: ["invalid_credentials"] }, reason: "unknown" },
    { body: { code: { message: "invalid_credentials" } }, reason: "unknown" },
    {
      body: {
        error_code: "invalid_credentials",
        message: "invalid_credentials",
      },
      reason: "unknown",
    },
    { body: null, reason: "unknown" },
    { body: [], reason: "unknown" },
    { body: "invalid_credentials", reason: "unknown" },
  ];
  for (const c of cases) {
    const f = fixture();
    try {
      const body =
        c.body && typeof c.body === "object" && !Array.isArray(c.body)
          ? {
              ...c.body,
              message: "never-persist-private-message",
              access_token: "never-persist-private-token",
              email: f.creds.users.B.email,
              password: f.creds.users.B.password,
            }
          : c.body;
      f.replies[5] = { status: 400, body };
      const r = await simulateCloudTwoUserRun(f.root, f.replies, at);
      assert.equal(r.outcome, "failed");
      assert.equal(r.sent.length, 6);
      const events = f
        .manifest()
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line));
      const final = events.at(-1);
      assert.deepEqual(final.diagnostic, {
        requestIndex: 5,
        stage: "observation",
        category: "http-status",
        httpStatus: 400,
        authReason: c.reason,
      });
      const evidence = JSON.stringify(final);
      for (const privateValue of [
        "never-persist",
        f.creds.users.B.email,
        f.creds.users.B.password,
        f.creds.publishableKey,
        spec.users.B,
      ])
        assert.ok(!evidence.includes(privateValue));
      if (
        c.body &&
        typeof c.body === "object" &&
        !Array.isArray(c.body) &&
        "code" in c.body &&
        typeof c.body.code === "string"
      )
        assert.ok(!evidence.includes(c.body.code));
      assert.ok(!events.some((event) => event.state === "company-id-verified"));
    } finally {
      f.close();
    }
  }
  assert.deepEqual(logs, []);
});
