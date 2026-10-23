import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
// JavaScript build tooling is deliberately separate from the application runtime.
// @ts-expect-error The repository does not emit declarations for build-only .mjs.
import * as offline from "../../scripts/v3/offline-build.mjs";
const { offlineBuildFiles, offlineBuildEnvironment } = offline;

test("Offline production build includes source inputs but excludes environment/private/unrelated files", () => {
  assert.deepEqual(
    offlineBuildFiles([
      "src/app/layout.tsx",
      "scripts/v3/cloud.ts",
      "supabase/v3-cloud/bootstrap-plan.json",
      "package.json",
      "next.config.ts",
      ".env",
      ".env.local",
      ".env.example",
      "src/.env.production",
      "docs/report.md",
      ".git/config",
      "credentials.json",
    ]),
    [
      "src/app/layout.tsx",
      "scripts/v3/cloud.ts",
      "supabase/v3-cloud/bootstrap-plan.json",
      "package.json",
      "next.config.ts",
    ],
  );
  for (const candidate of [
    "../src/app.ts",
    "src/../private.json",
    "/src/app.ts",
    "src\\app.ts",
  ])
    assert.throws(() => offlineBuildFiles([candidate]));
});

test("Offline build environment never inherits target, credentials, proxies or caller Node overrides", () => {
  const env = offlineBuildEnvironment(
    {
      SystemRoot: "C:/Windows",
      PATH: "installed-runtime",
      SUPABASE_SECRET_KEY: "synthetic-forbidden",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "synthetic-forbidden",
      MY_KRAVV_V3_CLOUD_PROFILE: "synthetic-forbidden",
      OPENAI_API_KEY: "synthetic-forbidden",
      HTTPS_PROXY: "synthetic-forbidden",
      NODE_OPTIONS: "synthetic-forbidden",
    },
    "C:\\isolated build\\offline-network-deny.cjs",
  );
  assert.deepEqual(
    Object.keys(env).sort(),
    [
      "CI",
      "NEXT_TELEMETRY_DISABLED",
      "NODE_ENV",
      "NODE_OPTIONS",
      "PATH",
      "SystemRoot",
    ].sort(),
  );
  assert.equal(
    env.NODE_OPTIONS,
    '--require="C:/isolated build/offline-network-deny.cjs"',
  );
  assert.ok(!JSON.stringify(env).includes("synthetic-forbidden"));
});

test("Build preload denies network/listeners and survives inherited Node worker launch", () => {
  const temporary = fs.mkdtempSync(
    path.join(os.tmpdir(), "my-kravv-build-preload-test-"),
  );
  const preload = path.join(temporary, "offline-network-deny.cjs");
  fs.copyFileSync("scripts/v3/offline-network-deny.cjs", preload);
  try {
    const result = spawnSync(
      process.execPath,
      [
        "-e",
        `
      const assert=require('node:assert/strict');
      for(const operation of [
        ()=>fetch('https://blocked.invalid'),
        ()=>require('node:http').get('http://blocked.invalid'),
        ()=>require('node:https').request('https://blocked.invalid'),
        ()=>new (require('node:net').Socket)().connect(12345,'127.0.0.1'),
        ()=>require('node:net').createServer().listen(12345,'127.0.0.1'),
        ()=>require('node:dns').lookup('blocked.invalid',()=>{}),
        ()=>new (require('node:dns').Resolver)().resolve4('blocked.invalid',()=>{}),
      ]) assert.throws(operation,/Network is forbidden/);
      const child=require('node:child_process').spawnSync(process.execPath,['-e',
        "try{fetch('https://blocked.invalid');process.exitCode=2}catch{console.log('WORKER_BLOCKED')}"
      ],{encoding:'utf8'});
      assert.equal(child.status,0);assert.equal(child.stdout.trim(),'WORKER_BLOCKED');
      console.log('ALL_NETWORK_DENIED');
    `,
      ],
      {
        encoding: "utf8",
        timeout: 10000,
        windowsHide: true,
        env: offlineBuildEnvironment(process.env, preload),
      },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), "ALL_NETWORK_DENIED");
    assert.equal(
      fs.readFileSync(path.join(temporary, "offline-network-attempt"), "utf8"),
      "BLOCKED\n",
    );
    const unwritable = spawnSync(
      process.execPath,
      [
        "-e",
        `
      require('node:fs').writeFileSync=()=>{throw Error('Synthetic evidence storage failure')};
      try{fetch('https://blocked.invalid')}catch{}
      process.exitCode=0;
    `,
      ],
      {
        encoding: "utf8",
        timeout: 10000,
        windowsHide: true,
        env: offlineBuildEnvironment(process.env, preload),
      },
    );
    assert.equal(
      unwritable.status,
      86,
      "Unrecordable network attempts cannot be swallowed into a passing build",
    );
  } finally {
    const resolved = path.resolve(temporary);
    assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
    assert.ok(
      path.basename(resolved).startsWith("my-kravv-build-preload-test-"),
    );
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});
