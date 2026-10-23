import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const environment: NodeJS.ProcessEnv = {
  SystemRoot: process.env.SystemRoot,
  PATH: process.env.PATH,
  NODE_ENV: "test",
};

test("Offline HTTP adapter exercises real auth/proxy/page/actions/services across account changes", () => {
  const result = spawnSync(
    process.execPath,
    [path.resolve("src/tests/helpers/v3-application-http.mjs")],
    { env: environment, encoding: "utf8", timeout: 30000, windowsHide: true },
  );
  assert.equal(result.status, 0, result.stderr);
  const evidence = JSON.parse(result.stdout);
  assert.equal(evidence.outcome, "PASS");
  assert.equal(evidence.requests, 45);
  assert.ok(evidence.assertions >= 141);
  assert.equal(evidence.externalRequests, 0);
  assert.equal(evidence.realNextRuntime, false);
  assert.equal(evidence.accountKeysDistinct, true);
});

test("A valid public Cloud build target still stops at the unchanged application execution gate", () => {
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import assert from 'node:assert/strict';
       import {cloudMain} from './scripts/v3/cloud.ts';
       Object.assign(process.env,{
         MY_KRAVV_V3_CLOUD_PROFILE:'my-kravv-v3-cloud-dev',
         MY_KRAVV_V3_CLOUD_PROJECT_REF:'kjcvgjfwlmyfroiqlbmw',
         MY_KRAVV_V3_CLOUD_API_ORIGIN:'https://kjcvgjfwlmyfroiqlbmw.supabase.co'
       });
       let requests=0;globalThis.fetch=async()=>{requests++;throw Error('Forbidden network')};
       assert.throws(()=>cloudMain(['build']),/Cloud execution is blocked/);
       assert.equal(requests,0);console.log('BUILD_BLOCKED_BEFORE_EXECUTION');`,
    ],
    { env: environment, encoding: "utf8", timeout: 10000, windowsHide: true },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), "BUILD_BLOCKED_BEFORE_EXECUTION");
});
