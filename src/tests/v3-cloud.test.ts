import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import {
  validateCloudTarget,
  matchesCloudMarker,
  v3CloudProfile,
  v3CloudCookieName,
} from "../lib/env/v3-cloud.ts";
import { resolveV3Target } from "../lib/env/v3-target.ts";
import { v3ApiUrl, v3ProjectId, v3CookieName } from "../lib/env/v3.ts";
import { getPublicSupabaseConfig } from "../lib/env/public.ts";
import { verifyV3DatabaseTarget } from "../server/auth/v3-target.ts";
import {
  configuredCloudTarget,
  prepareCloudEnvironment,
  validateCloudAction,
  assertCloudExecutionReady,
} from "../../scripts/v3/cloud-guards.ts";
import { assertCreationPublisherReady } from "../../scripts/v3/startup-safety.ts";
import { runPortableFoundationTests } from "./helpers/v3-portable.ts";
import { assertCloudExecutionReady as applicationExecutionGate } from "../lib/env/v3-cloud-execution.ts";

// Synthetic identities only. Never written into the real approval record.
const ref = "a".repeat(20);
const origin = `https://${ref}.supabase.co`;
const marker = {
  project_id: ref,
  purpose: "disposable-v3-slice0-cloud",
  schema_version: 1,
};
const evidence = {
  status: "owner-approved",
  projectRef: ref,
  apiOrigin: origin,
  marker,
};
const input = { profile: v3CloudProfile, projectRef: ref, apiOrigin: origin };
const source = {
  NODE_ENV: "test" as const,
  MY_KRAVV_V3_CLOUD_PROFILE: v3CloudProfile,
  MY_KRAVV_V3_CLOUD_PROJECT_REF: ref,
  MY_KRAVV_V3_CLOUD_API_ORIGIN: origin,
  MY_KRAVV_V3_CLOUD_PUBLISHABLE_KEY: "sb_publishable_offline_fixture_only",
  MY_KRAVV_V3_CLOUD_SECRET_KEY: "sb_secret_offline_fixture_only",
};

test("Checked-in target approval cannot be replaced by environment values or missing evidence", () => {
  for (const candidate of [input, {}, { ...input, profile: v3ProjectId }])
    assert.throws(() => validateCloudTarget(candidate as typeof input));
  for (const unapproved of [null, {}, { ...evidence, status: "unprovisioned" }])
    assert.throws(() => validateCloudTarget(input, unapproved));
  assert.throws(() => configuredCloudTarget(source), /conflicts/);
});

test("Cloud identity requires exact reference, HTTPS origin and distinct strict marker", () => {
  assert.deepEqual(validateCloudTarget(input, evidence), evidence);
  assert.equal(matchesCloudMarker(marker, marker), true);
  for (const changed of [
    { ...marker, project_id: v3ProjectId },
    { ...marker, purpose: "disposable-v3-slice0" },
    { ...marker, schema_version: 2 },
    { ...marker, private_data: "must-not-be-exposed" },
    null,
  ])
    assert.equal(matchesCloudMarker(changed, marker), false);
  for (const changed of [
    { ...evidence, projectRef: "b".repeat(20) },
    { ...evidence, marker: { ...marker, project_id: "b".repeat(20) } },
    { ...evidence, marker: { ...marker, purpose: "disposable-v3-slice0" } },
    { ...evidence, apiOrigin: "https://unexpected.invalid" },
    { ...evidence, secret: "not-public-metadata" },
  ])
    assert.throws(() => validateCloudTarget(input, changed));
});

test("Cloud rejects missing/mismatched identity, local/V2 URLs, userinfo, paths and protocol tricks", () => {
  for (const apiOrigin of [
    undefined,
    v3ApiUrl,
    "http://127.0.0.1:54321",
    "https://v2-project.supabase.co",
    origin + "/",
    origin + "/rest/v1",
    origin + "?target=other",
    origin + "#other",
    origin.replace("https:", "http:"),
    origin.replace("https:", "ftp:"),
    `https://user:password@${ref}.supabase.co`,
    `https://${ref}.supabase.co:443`,
    origin + ".invalid",
    "https://custom.invalid",
  ])
    assert.throws(() => validateCloudTarget({ ...input, apiOrigin }, evidence));
  for (const projectRef of [undefined, "", v3ProjectId, "b".repeat(20)])
    assert.throws(() =>
      validateCloudTarget({ ...input, projectRef }, evidence),
    );
  for (const profile of [undefined, "", v3ProjectId, "my-kravv-dev"])
    assert.throws(() => validateCloudTarget({ ...input, profile }, evidence));
});

test("Local guard effects and cookie namespace remain independent of Cloud", () => {
  const local = {
    profile: v3ProjectId,
    url: v3ApiUrl,
    cloudProjectRef: undefined,
  };
  assert.equal(resolveV3Target(local).cookieName, v3CookieName);
  for (const url of [
    origin,
    "https://v2-project.supabase.co",
    "http://localhost:55321",
  ])
    assert.throws(() => resolveV3Target({ ...local, url }));
  assert.throws(
    () => resolveV3Target({ ...local, cloudProjectRef: ref }),
    /Conflicting/,
  );
  assert.throws(
    () =>
      resolveV3Target(
        { profile: v3CloudProfile, url: origin, cloudProjectRef: ref },
        evidence,
      ),
    /Cloud execution is blocked/,
  );
  assert.notEqual(v3CloudCookieName, v3CookieName);
  assert.throws(assertCreationPublisherReady, /publisher is unapproved/);
});

test("Cloud environment refuses inherited generic/local/V2 selectors and credentials", () => {
  assert.deepEqual(configuredCloudTarget(source, evidence), evidence);
  for (const key of [
    "NEXT_PUBLIC_MY_KRAVV_ENV",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_MY_KRAVV_CLOUD_PROJECT_REF",
    "SUPABASE_SECRET_KEY",
    "MY_KRAVV_V3_INTEGRATION",
    "SUPABASE_NETWORK_ID",
  ])
    assert.throws(
      () =>
        configuredCloudTarget(
          { ...source, [key]: "conflicting-value" },
          evidence,
        ),
      /Ambiguous/,
    );
});

test("Cloud child sanitization uses only explicit inputs; privileged key enters fixture child only", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kravv-cloud-env-"));
  try {
    const dotenv =
      "FUTURE_PRIVATE_TOKEN=never-copy\nOPENAI_API_KEY=never-call\n";
    fs.writeFileSync(path.join(root, ".env.local"), dotenv);
    const inherited = {
      ...source,
      FUTURE_PRIVATE_TOKEN: "never-copy",
      OPENAI_API_KEY: "never-call",
      SUPABASE_ACCESS_TOKEN: "never-copy",
      DOCKER_HOST: "remote-host",
      NODE_OPTIONS: "never-execute",
    };
    const before = { ...inherited };
    for (const action of ["dev", "build", "serve", "test"]) {
      const env = prepareCloudEnvironment(action, inherited, evidence, root);
      assert.equal(env.NEXT_PUBLIC_SUPABASE_URL, origin);
      assert.equal(env.NEXT_PUBLIC_MY_KRAVV_CLOUD_PROJECT_REF, ref);
      assert.equal(
        env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        source.MY_KRAVV_V3_CLOUD_PUBLISHABLE_KEY,
      );
      assert.equal(
        env.SUPABASE_SECRET_KEY,
        action === "test" ? source.MY_KRAVV_V3_CLOUD_SECRET_KEY : "",
      );
      assert.equal(env.MY_KRAVV_V3_CLOUD_SECRET_KEY, "");
      for (const key of [
        "FUTURE_PRIVATE_TOKEN",
        "OPENAI_API_KEY",
        "SUPABASE_ACCESS_TOKEN",
        "DOCKER_HOST",
        "SUPABASE_NETWORK_ID",
      ])
        assert.equal(env[key], "");
      assert.equal(env.NODE_OPTIONS, undefined);
      assert.ok(
        Object.entries(env)
          .filter(([k]) => k.startsWith("NEXT_PUBLIC_"))
          .every(([, v]) => v !== source.MY_KRAVV_V3_CLOUD_SECRET_KEY),
      );
    }
    assert.deepEqual(inherited, before);
    assert.equal(
      fs.readFileSync(path.join(root, ".env.local"), "utf8"),
      dotenv,
    );
    assert.throws(
      () =>
        prepareCloudEnvironment(
          "dev",
          {
            ...source,
            MY_KRAVV_V3_CLOUD_PUBLISHABLE_KEY:
              source.MY_KRAVV_V3_CLOUD_SECRET_KEY,
          },
          evidence,
          root,
        ),
      /publishable/,
    );
    assert.throws(
      () =>
        prepareCloudEnvironment(
          "test",
          { ...source, MY_KRAVV_V3_CLOUD_SECRET_KEY: "" },
          evidence,
          root,
        ),
      /fixture credential/,
    );
  } finally {
    fs.rmSync(root, { recursive: true });
  }
});

test("Substituted public Cloud config rejects before any identity request and never returns private values", async (t) => {
  const keys = [
    "NEXT_PUBLIC_MY_KRAVV_ENV",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_MY_KRAVV_CLOUD_PROJECT_REF",
    "SUPABASE_SECRET_KEY",
  ];
  const before = keys.map((k) => [k, process.env[k]] as const);
  try {
    Object.assign(process.env, {
      NEXT_PUBLIC_MY_KRAVV_ENV: v3CloudProfile,
      NEXT_PUBLIC_SUPABASE_URL: origin,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        source.MY_KRAVV_V3_CLOUD_PUBLISHABLE_KEY,
      NEXT_PUBLIC_MY_KRAVV_CLOUD_PROJECT_REF: ref,
      SUPABASE_SECRET_KEY: source.MY_KRAVV_V3_CLOUD_SECRET_KEY,
    });
    let requests = 0;
    const mock: typeof fetch = async () => {
      requests++;
      throw Error("Unexpected network request");
    };
    t.mock.method(globalThis, "fetch", mock);
    assert.throws(getPublicSupabaseConfig, /conflicts/);
    await assert.rejects(() => verifyV3DatabaseTarget(mock), /conflicts/);
    assert.equal(requests, 0);
    Object.assign(process.env, {
      NEXT_PUBLIC_MY_KRAVV_ENV: v3ProjectId,
      NEXT_PUBLIC_SUPABASE_URL: v3ApiUrl,
      NEXT_PUBLIC_MY_KRAVV_CLOUD_PROJECT_REF: "",
    });
    const publicConfig = getPublicSupabaseConfig();
    assert.deepEqual(Object.keys(publicConfig).sort(), [
      "publishableKey",
      "url",
    ]);
    assert.ok(
      !JSON.stringify(publicConfig).includes(
        source.MY_KRAVV_V3_CLOUD_SECRET_KEY,
      ),
    );
    await assert.rejects(
      () => verifyV3DatabaseTarget(async () => Response.json(marker)),
      /identity/,
    );
  } finally {
    for (const [key, value] of before)
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
  }
});

test("Cloud live entry and portable helper remain blocked; SQL/reset and missing local SQL coverage cannot pass", async (t) => {
  for (const action of ["reset", "db", "link", "push", "start", undefined])
    assert.throws(() => validateCloudAction(action));
  assert.throws(assertCloudExecutionReady, /blocked/);
  let network = 0;
  t.mock.method(globalThis, "fetch", async () => {
    network++;
    throw Error("Unexpected request");
  });
  await assert.rejects(
    () =>
      runPortableFoundationTests(t, {
        kind: "cloud",
        apiUrl: origin,
        appUrl: "http://127.0.0.1:3103",
        projectId: ref,
        fixturePurpose: "my-kravv-v3-slice0-cloud",
      }),
    /blocked/,
  );
  assert.equal(network, 0);
  const localKeys = [
    "MY_KRAVV_V3_INTEGRATION",
    "MY_KRAVV_TEST_APP_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
  ];
  const previous = localKeys.map((key) => [key, process.env[key]] as const);
  try {
    Object.assign(process.env, {
      MY_KRAVV_V3_INTEGRATION: v3ProjectId,
      MY_KRAVV_TEST_APP_URL: "http://127.0.0.1:3103",
      NEXT_PUBLIC_SUPABASE_URL: v3ApiUrl,
    });
    await assert.rejects(
      () =>
        runPortableFoundationTests(t, {
          kind: "local",
          apiUrl: v3ApiUrl,
          appUrl: "http://127.0.0.1:3103",
          projectId: v3ProjectId,
          fixturePurpose: "my-kravv-v3-slice0",
        }),
      /SQL coverage must not be omitted/,
    );
    assert.equal(network, 0);
  } finally {
    for (const [key, value] of previous)
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
  }
  for (const action of ["dev", "build", "serve", "test", "reset"]) {
    const result = spawnSync(
      process.execPath,
      ["scripts/v3/cloud.ts", action],
      {
        env: { PATH: "", Path: "", ...source },
        encoding: "utf8",
        timeout: 10000,
        windowsHide: true,
      },
    );
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /conflicts|no SQL\/reset/);
    assert.ok(!result.stderr.includes(source.MY_KRAVV_V3_CLOUD_SECRET_KEY));
  }
});

test("Application and command execution gates are identical and reject all missing/mismatched/ambiguous grants", () => {
  assert.equal(applicationExecutionGate, assertCloudExecutionReady);
  // Checkpoint 1 accepts no runtime grant shape, including apparently positive
  // grants. Target approval must never serve as an execution override.
  for (const grant of [
    undefined,
    null,
    false,
    true,
    "approved",
    evidence,
    { status: "approved", projectRef: "b".repeat(20) },
    { status: "approved", projectRef: ref },
    [{ projectRef: ref }, { projectRef: "b".repeat(20) }],
  ])
    assert.throws(
      () => Reflect.apply(applicationExecutionGate, undefined, [grant]),
      /Cloud execution is blocked/,
    );
});

const populatedApplicationProbe = String.raw`
import assert from 'node:assert/strict';
import approval from './src/lib/env/v3-cloud-approval.json' with {type:'json'};
import {validateCloudTarget} from './src/lib/env/v3-cloud.ts';
import {resolveV3Target} from './src/lib/env/v3-target.ts';
import {getPublicSupabaseConfig, getPublicSupabaseTarget} from './src/lib/env/public.ts';
import {verifyV3DatabaseTarget} from './src/server/auth/v3-target.ts';
import {registerHooks} from 'node:module';
import {createSupabaseBrowserClient} from './src/lib/supabase/browser.ts';
import {updateSession} from './src/server/auth/proxy.ts';
import {NextRequest} from 'next/server.js';
import {cloudMain} from './scripts/v3/cloud.ts';
import {v3ProjectId,v3ApiUrl,v3CookieName} from './src/lib/env/v3.ts';
// Node ESM needs the extension that Next's bundler normally resolves. Load the
// actual SSR adapter; no auth/target function is replaced by this test mapping.
const hooks=registerHooks({resolve(specifier,context,nextResolve){
  return nextResolve(specifier==='next/headers'?'next/headers.js':specifier,context);
}});
const {createSupabaseServerClient}=await import('./src/server/auth/client.ts');
hooks.deregister();
const actual=process.argv[1]==='approved';
const ref=actual?approval.projectRef:'a'.repeat(20), origin='https://'+ref+'.supabase.co';
const marker={project_id:ref,purpose:'disposable-v3-slice0-cloud',schema_version:1};
if(!actual)Object.assign(approval,{status:'owner-approved',projectRef:ref,apiOrigin:origin,marker});
assert.equal(validateCloudTarget({profile:'my-kravv-v3-cloud-dev',projectRef:ref,apiOrigin:origin}).projectRef,ref);
let requests=0;
globalThis.fetch=async()=>{requests++;return Response.json(marker)};
const publicEnv={NEXT_PUBLIC_MY_KRAVV_ENV:'my-kravv-v3-cloud-dev',NEXT_PUBLIC_SUPABASE_URL:origin,
NEXT_PUBLIC_MY_KRAVV_CLOUD_PROJECT_REF:ref,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_offline_review_only'};
if(process.argv[1]==='local'){
  Object.assign(process.env,publicEnv,{NEXT_PUBLIC_MY_KRAVV_ENV:v3ProjectId,NEXT_PUBLIC_SUPABASE_URL:v3ApiUrl,
  NEXT_PUBLIC_MY_KRAVV_CLOUD_PROJECT_REF:''});
  assert.equal(getPublicSupabaseTarget().cookieName,v3CookieName);
  assert.equal(getPublicSupabaseConfig().url,v3ApiUrl);
  globalThis.fetch=async()=>{requests++;return Response.json({project_id:v3ProjectId,purpose:'disposable-v3-slice0',schema_version:1})};
  await verifyV3DatabaseTarget();assert.equal(requests,1);
  process.env.NEXT_PUBLIC_MY_KRAVV_CLOUD_PROJECT_REF=ref;
  assert.throws(getPublicSupabaseConfig,/Conflicting/);
  await assert.rejects(()=>verifyV3DatabaseTarget(),/Conflicting/);assert.equal(requests,1);
  console.log(JSON.stringify({localProfilePreserved:true,mockedLocalIdentityRequests:requests}));
}else{
  Object.assign(process.env,publicEnv);
  for(const grant of [undefined,'true',JSON.stringify({projectRef:'b'.repeat(20)}),JSON.stringify({projectRef:ref}),
    JSON.stringify([{projectRef:ref},{projectRef:'b'.repeat(20)}])]){
    if(grant===undefined)delete process.env.MY_KRAVV_V3_CLOUD_EXECUTION;
    else process.env.MY_KRAVV_V3_CLOUD_EXECUTION=grant;
    assert.throws(()=>resolveV3Target({profile:'my-kravv-v3-cloud-dev',url:origin,cloudProjectRef:ref}),/Cloud execution is blocked/);
    assert.throws(getPublicSupabaseTarget,/Cloud execution is blocked/);
    assert.throws(getPublicSupabaseConfig,/Cloud execution is blocked/);
    assert.throws(createSupabaseBrowserClient,/Cloud execution is blocked/);
    await assert.rejects(()=>verifyV3DatabaseTarget(),/Cloud execution is blocked/);
    await assert.rejects(()=>createSupabaseServerClient(),/Cloud execution is blocked/);
    const response=await updateSession(new NextRequest('http://127.0.0.1:3103/auth'));
    assert.equal(response.status,503);assert.match(response.headers.get('cache-control'),/no-store/);
  }
  assert.equal(requests,0);
  for(const key of Object.keys(publicEnv))delete process.env[key];
  Object.assign(process.env,{MY_KRAVV_V3_CLOUD_PROFILE:'my-kravv-v3-cloud-dev',
    MY_KRAVV_V3_CLOUD_PROJECT_REF:ref,MY_KRAVV_V3_CLOUD_API_ORIGIN:origin});
  for(const action of ['dev','build','serve','test'])assert.throws(()=>cloudMain([action]),/Cloud execution is blocked/);
  assert.equal(requests,0);
  console.log(JSON.stringify({populatedApproval:true,applicationAndCommandsBlocked:true,outboundIdentityRequests:requests}));
}
`;

function runPopulatedApplicationProbe(mode: "cloud" | "local" | "approved") {
  const result = spawnSync(
    process.execPath,
    [
      "--conditions=react-server",
      "--input-type=module",
      "-e",
      populatedApplicationProbe,
      mode,
    ],
    {
      env: { NODE_ENV: "test", PATH: "", Path: "" },
      encoding: "utf8",
      timeout: 15000,
      windowsHide: true,
    },
  );
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout.trim());
}

test("Populated approval cannot activate application resolver, identity, browser/SSR clients or Proxy; zero requests", () => {
  assert.deepEqual(runPopulatedApplicationProbe("cloud"), {
    populatedApproval: true,
    applicationAndCommandsBlocked: true,
    outboundIdentityRequests: 0,
  });
});

test("Populated Cloud metadata leaves local application identity verification and conflict rejection unchanged", () => {
  assert.deepEqual(runPopulatedApplicationProbe("local"), {
    localProfilePreserved: true,
    mockedLocalIdentityRequests: 1,
  });
});

test("Checked-in owner approval cannot activate real application or command paths; zero outbound requests", () => {
  assert.deepEqual(runPopulatedApplicationProbe("approved"), {
    populatedApproval: true,
    applicationAndCommandsBlocked: true,
    outboundIdentityRequests: 0,
  });
});
