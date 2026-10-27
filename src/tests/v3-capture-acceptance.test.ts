import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import {
  buildCaptureAcceptancePlan,
  captureAcceptanceState,
  resolveCaptureAcceptanceStep,
  assertCaptureAcceptanceWrite,
  observeCaptureAcceptance,
} from "../../scripts/v3/capture-acceptance-plan.ts";
import {
  captureAcceptanceMain,
  captureAcceptanceBudget,
  captureAcceptancePlanDigest,
  simulateCaptureAcceptanceRun,
  type SyntheticReply,
} from "../../scripts/v3/capture-acceptance-runner.ts";
const at = Date.parse("2026-10-27T01:00:00Z");
const spec = {
  profile: "my-kravv-v3-cloud-dev",
  projectRef: "kjcvgjfwlmyfroiqlbmw",
  apiOrigin: "https://kjcvgjfwlmyfroiqlbmw.supabase.co",
  runId: "10000000-0000-4000-8000-000000000023",
  users: {
    A: "20000000-0000-4000-8000-000000000001",
    B: "20000000-0000-4000-8000-000000000002",
  },
};
const sha = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");
function fixture() {
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), "kravv-v3-capture-offline-"),
  );
  if (process.platform !== "win32") fs.chmodSync(root, 0o700);
  const credentials = {
    projectRef: spec.projectRef,
    apiOrigin: spec.apiOrigin,
    publishableKey: "sb_publishable_offline_synthetic_only",
    users: {
      A: {
        id: spec.users.A,
        email: "offline-a@example.invalid",
        password: "offline-password-A",
      },
      B: {
        id: spec.users.B,
        email: "offline-b@example.invalid",
        password: "offline-password-B",
      },
    },
  };
  const grant = {
    purpose: "slice2-capture-api-only",
    projectRef: spec.projectRef,
    apiOrigin: spec.apiOrigin,
    runId: spec.runId,
    users: { ...spec.users },
    issuedAt: new Date(at).toISOString(),
    expiresAt: new Date(at + 600000).toISOString(),
    maxRequests: 36,
    overallMs: 180000,
    retries: 0,
    planSha256: captureAcceptancePlanDigest(spec),
    credentialSha256: "",
  };
  const write = (name: string, value: string) =>
    fs.writeFileSync(path.join(root, name), value, { mode: 0o600 });
  const save = () => {
    const bytes = JSON.stringify(credentials);
    grant.credentialSha256 = sha(bytes);
    write("credentials.json", bytes);
    write("slice2-capture-run-approval.json", JSON.stringify(grant));
  };
  write(".gitignore", "*\n");
  save();
  const plan = buildCaptureAcceptancePlan(spec),
    state = captureAcceptanceState(),
    replies: SyntheticReply[] = [];
  for (const template of plan.steps) {
    const step = resolveCaptureAcceptanceStep(template, state),
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
        reply = { status: 403, body: { code: "42501" } };
        break;
      case "anonymous-denied":
        reply = { status: 401, body: { code: "42501" } };
        break;
      case "logout":
        reply = { status: 204 };
        break;
      case "unauthenticated":
        reply = { status: 401, body: {} };
        break;
      case "capture": {
        if (step.assertion === "capability") reply = { status: 200, body: 1 };
        else if (step.assertion === "company")
          reply = {
            status: 200,
            body: [
              {
                id: "30000000-0000-4000-8000-000000000001",
                user_id: spec.users.A,
                name: "Existing synthetic",
              },
            ],
          };
        else if (step.assertion === "fresh") reply = { status: 200, body: [] };
        else if (step.assertion === "create")
          reply = {
            status: 200,
            body: [
              {
                ...step.expected,
                id: `40000000-0000-4000-8000-00000000000${actor === "A" ? "1" : "2"}`,
                created_at: new Date(at + 1000).toISOString(),
              },
            ],
          };
        else if (["row", "retry"].includes(step.assertion!))
          reply = { status: 200, body: [state.rows[step.key!]] };
        else if (step.assertion === "privilege")
          reply = { status: 403, body: { code: "42501" } };
        else
          reply = {
            status: 400,
            body: {
              code: "P0001",
              message:
                step.assertion === "conflict"
                  ? "Capture request conflicts with existing payload"
                  : "Company unavailable",
            },
          };
        break;
      }
      default:
        throw Error("Unexpected synthetic step");
    }
    observeCaptureAcceptance(step, reply.status, reply.body, state);
    replies.push(structuredClone(reply));
  }
  return {
    root,
    credentials,
    grant,
    write,
    save,
    plan,
    replies,
    index: (label: string) => plan.steps.findIndex((s) => s.label === label),
    manifest: () =>
      fs.readFileSync(
        path.join(root, `run-${spec.runId}.manifest.jsonl`),
        "utf8",
      ),
    close: () => {
      if (
        path.dirname(root) !== fs.realpathSync(os.tmpdir()) ||
        !path.basename(root).startsWith("kravv-v3-capture-offline-")
      )
        throw Error("Unsafe test cleanup");
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}
test("Capture plan is fixed at 31 requests, two keys, existing-company reads and safe nonmatching privilege probes", () => {
  const plan = buildCaptureAcceptancePlan(spec);
  assert.equal(plan.steps.length, 31);
  assert.deepEqual(plan.limits, {
    maxRequests: 36,
    overallMs: 180000,
    requestMs: 10000,
    retries: 0,
  });
  assert.equal(plan.steps.filter((s) => s.assertion === "create").length, 2);
  assert.notEqual(plan.fixtures.A.request_id, plan.fixtures.B.request_id);
  assert.equal(plan.fixtures.B.company_id, null);
  assert.ok(
    plan.steps
      .filter((s) => s.method === "DELETE" || s.method === "PATCH")
      .every((s) => s.url.includes("id.eq.__capture_A__,id.eq.__capture_B__")),
  );
  assert.ok(plan.steps.every((s) => new URL(s.url).origin === spec.apiOrigin));
  assert.throws(() =>
    buildCaptureAcceptancePlan({
      ...spec,
      users: { A: spec.users.A, B: spec.users.A },
    }),
  );
  assert.throws(() =>
    buildCaptureAcceptancePlan({ ...spec, apiOrigin: "https://other.invalid" }),
  );
});
test("Null capture pin denies before private reads or network without CLI/environment override", async (t) => {
  let reads = 0,
    network = 0;
  const read = t.mock.method(fs, "lstatSync", () => {
    reads++;
    throw Error("No private access");
  });
  const net = t.mock.method(globalThis, "fetch", async () => {
    network++;
    throw Error("No network");
  });
  try {
    await assert.rejects(() => captureAcceptanceMain([]), /blocked/);
    assert.equal(reads, 0);
    assert.equal(network, 0);
  } finally {
    read.mock.restore();
    net.mock.restore();
  }
});
test("Passing offline capture run verifies all 31 stages, retains two IDs and consumes the run atomically", async () => {
  const f = fixture();
  try {
    const [a, b] = await Promise.all([
      simulateCaptureAcceptanceRun(f.root, f.replies, at),
      simulateCaptureAcceptanceRun(f.root, f.replies, at),
    ]);
    const passed = [a, b].find((r) => r.outcome === "passed")!;
    assert.ok(passed);
    assert.equal(passed.requests, 31);
    assert.equal(passed.completed, 31);
    assert.equal(
      [a, b].filter((r) => r.outcome === "failed")[0].sent.length,
      0,
    );
    const lines = f
      .manifest()
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    assert.equal(
      lines.filter((e) => e.evidence?.kind === "capture-id-verified").length,
      2,
    );
    assert.equal(lines.at(-1).state, "passed");
    for (const secret of [
      f.credentials.publishableKey,
      f.credentials.users.A.password,
      f.credentials.users.B.email,
      "offline_signature",
    ])
      assert.ok(!f.manifest().includes(secret));
    assert.equal(
      (await simulateCaptureAcceptanceRun(f.root, f.replies, at)).sent.length,
      0,
    );
  } finally {
    f.close();
  }
});
test("Grant scope, target, identity, digest, expiry and credential drift fail before transmission", async () => {
  const changes: Array<(f: ReturnType<typeof fixture>) => void> = [
    (f) => {
      f.grant.purpose = "wrong";
    },
    (f) => {
      f.grant.expiresAt = new Date(at).toISOString();
    },
    (f) => {
      f.grant.planSha256 = "0".repeat(64);
    },
    (f) => {
      f.grant.maxRequests = 37;
    },
    (f) => {
      f.grant.users.B = spec.users.A;
    },
    (f) => {
      f.credentials.apiOrigin = "https://other.invalid";
    },
    (f) => {
      f.credentials.publishableKey = "service_role_forbidden";
    },
    (f) => {
      f.credentials.users.B.email = f.credentials.users.A.email;
    },
  ];
  for (const change of changes) {
    const f = fixture();
    try {
      change(f);
      f.save();
      assert.equal(
        (await simulateCaptureAcceptanceRun(f.root, f.replies, at)).sent.length,
        0,
      );
    } finally {
      f.close();
    }
  }
  const f = fixture();
  try {
    f.write("credentials.json", JSON.stringify(f.credentials) + " ");
    assert.equal(
      (await simulateCaptureAcceptanceRun(f.root, f.replies, at)).sent.length,
      0,
    );
  } finally {
    f.close();
  }
});
test("Capture preflight rejects missing company, unconfirmed identities and request-key collisions before any writes", async () => {
  for (const [label, body] of [
    ["A existing owned company", []],
    ["B confirmed identity", { id: spec.users.B, email_confirmed_at: null }],
    ["B fresh request key", [{}]],
    ["A capture capability", 2],
  ] as const) {
    const f = fixture();
    try {
      const index = f.index(label);
      f.replies[index].body = body;
      const r = await simulateCaptureAcceptanceRun(f.root, f.replies, at);
      assert.equal(r.outcome, "failed");
      assert.equal(r.sent.length, index + 1);
      assert.ok(!r.sent.some((s) => s.url.endsWith("/v3_create_capture")));
    } finally {
      f.close();
    }
  }
});
test("Malformed IDs, wrong owner/text, false deduplication and mistaken rejection reasons fail closed", async () => {
  const cases: Array<[string, (r: SyntheticReply) => void]> = [
    [
      "A create capture",
      (r) => {
        r.body = [];
      },
    ],
    [
      "A create capture",
      (r) => {
        r.body = [...(r.body as unknown[]), ...(r.body as unknown[])];
      },
    ],
    [
      "A create capture",
      (r) => {
        (r.body as Record<string, unknown>[])[0].id = "bad";
      },
    ],
    [
      "A create capture",
      (r) => {
        (r.body as Record<string, unknown>[])[0].user_id = spec.users.B;
      },
    ],
    [
      "A deliberate same-key deduplication",
      (r) => {
        (r.body as Record<string, unknown>[])[0].raw_text = "rewritten";
      },
    ],
    [
      "B foreign company association rejected",
      (r) => {
        r.body = {
          code: "P0001",
          message: "Capture request conflicts with existing payload",
        };
      },
    ],
    [
      "B capture delete privilege denied",
      (r) => {
        r.status = 200;
        r.body = [];
      },
    ],
  ];
  for (const [label, change] of cases) {
    const f = fixture();
    try {
      const index = f.index(label);
      change(f.replies[index]);
      const r = await simulateCaptureAcceptanceRun(f.root, f.replies, at);
      assert.equal(r.outcome, "failed");
      assert.equal(r.sent.length, index + 1);
    } finally {
      f.close();
    }
  }
});
test("Transport, redirect, malformed JSON and budget failures stop without retry or invented capture IDs", async () => {
  for (const change of [
    (r: SyntheticReply) => {
      r.transportFailure = true;
    },
    (r: SyntheticReply) => {
      r.redirected = true;
    },
    (r: SyntheticReply) => {
      r.rawBody = "{invalid PRIVATE";
    },
    (r: SyntheticReply) => {
      r.elapsedMs = 10000;
    },
  ]) {
    const f = fixture();
    try {
      const index = f.index("A create capture");
      change(f.replies[index]);
      const r = await simulateCaptureAcceptanceRun(f.root, f.replies, at);
      assert.equal(r.sent.length, index + 1);
      assert.equal(r.outcome, "failed");
      assert.match(f.manifest(), /"state":"sending"/);
      assert.doesNotMatch(f.manifest(), /capture-id-verified|invalid PRIVATE/);
    } finally {
      f.close();
    }
  }
  let now = 0;
  const budget = captureAcceptanceBudget(0, 999999, () => now);
  for (let i = 0; i < 36; i++) budget.begin();
  assert.throws(() => budget.begin());
  now = 180000;
  assert.throws(() => budget.check());
});
test("Partial/zero writes and fsync failures prevent transmission; verified-ID persistence precedes dependents", async (t) => {
  for (const mode of ["short", "zero", "fsync", "verified"]) {
    const f = fixture(),
      write = fs.writeSync;
    let writes = 0;
    const mock =
      mode === "fsync"
        ? t.mock.method(fs, "fsyncSync", () => {
            throw Error("PRIVATE");
          })
        : t.mock.method(fs, "writeSync", ((
            ...args: Parameters<typeof fs.writeSync>
          ) => {
            writes++;
            const value = Buffer.isBuffer(args[1])
              ? args[1].toString()
              : String(args[1]);
            if (
              mode === "verified"
                ? !value.includes('"capture-id-verified"')
                : false
            )
              return write(...args);
            return mode === "zero" ? 0 : 1;
          }) as typeof fs.writeSync);
    try {
      const r = await simulateCaptureAcceptanceRun(f.root, f.replies, at);
      assert.equal(r.outcome, "failed");
      assert.equal(r.sent.length, mode === "verified" ? 11 : 0);
      if (mode !== "fsync") assert.ok(writes > 0);
    } finally {
      mock.mock.restore();
      f.close();
    }
  }
});
test("Privileged mutations cannot lose their contradictory-ID safety filter", () => {
  const state = captureAcceptanceState();
  state.rows.A = {
    id: "40000000-0000-4000-8000-000000000001",
    user_id: spec.users.A,
    request_id: spec.runId,
    raw_text: "A",
    company_id: null,
    created_at: new Date(at).toISOString(),
  };
  state.rows.B = {
    ...state.rows.A,
    id: "40000000-0000-4000-8000-000000000002",
    user_id: spec.users.B,
  };
  const template = buildCaptureAcceptancePlan(spec).steps.find(
    (s) => s.method === "DELETE",
  )!;
  const step = resolveCaptureAcceptanceStep(template, state);
  assertCaptureAcceptanceWrite(step);
  assert.throws(() =>
    assertCaptureAcceptanceWrite({ ...step, url: step.url.split("?")[0] }),
  );
  assert.throws(() => resolveCaptureAcceptanceStep(template, { rows: {} }));
});

function pinnedCaptureGrantProbe(f: ReturnType<typeof fixture>, pin: string) {
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
    const filename=path.resolve('scripts/v3/capture-acceptance-runner.ts');
    const url=pathToFileURL(filename).href;
    const source=fs.readFileSync(filename,'utf8');
    const declaration='const approvedGrantSha256: string | null = null;';
    if(!source.includes(declaration))throw Error('Source null pin missing');
    const copy=source.replace(declaration,'const approvedGrantSha256: string | null = '+JSON.stringify(pin)+';');
    const hooks=registerHooks({load(address,context,next){
      if(address===url)return {format:'module',source:stripTypeScriptTypes(copy),shortCircuit:true};
      return next(address,context);
    }});
    const {simulateCaptureAcceptanceRun}=await import(url);
    hooks.deregister();
    const raw=fs.readFileSync(path.join(root,'slice2-capture-run-approval.json'),'utf8');
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
    const result=await simulateCaptureAcceptanceRun(root,parse(replies),Number(at));
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

test("Capture exact-byte pin rejects changed/whitespace grant bytes before parsing, credentials or claim", () => {
  for (const mutation of [(s: string) => s + " ", () => "{invalid"]) {
    const f = fixture();
    try {
      const bytes = fs.readFileSync(
        path.join(f.root, "slice2-capture-run-approval.json"),
      );
      f.write("slice2-capture-run-approval.json", mutation(bytes.toString()));
      const result = pinnedCaptureGrantProbe(f, sha(bytes));
      assert.equal(result.outcome, "failed");
      assert.equal(result.sent, 0);
      assert.equal(result.grantParses, 0);
      assert.equal(result.credentialOpens, 0);
      assert.equal(result.claimAttempts, 0);
      assert.equal(result.network, 0);
    } finally {
      f.close();
    }
  }
});
test("Matching synthetic capture pin still enforces all plan assertions without real transport", () => {
  const f = fixture();
  try {
    const result = pinnedCaptureGrantProbe(
      f,
      sha(
        fs.readFileSync(path.join(f.root, "slice2-capture-run-approval.json")),
      ),
    );
    assert.equal(result.outcome, "passed");
    assert.equal(result.sent, 31);
    assert.equal(result.claimAttempts, 1);
    assert.equal(result.network, 0);
  } finally {
    f.close();
  }
});
