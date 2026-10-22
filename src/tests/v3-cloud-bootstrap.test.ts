import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { test } from "node:test";
import approval from "../lib/env/v3-cloud-approval.json" with { type: "json" };
import plan from "../../supabase/v3-cloud/bootstrap-plan.json" with { type: "json" };
import { validateCloudTarget, v3CloudProfile } from "../lib/env/v3-cloud.ts";
import { resolveV3Target } from "../lib/env/v3-target.ts";

const projectRef = "kjcvgjfwlmyfroiqlbmw";
const apiOrigin = `https://${projectRef}.supabase.co`;
const input = { profile: v3CloudProfile, projectRef, apiOrigin };

test("Owner target metadata and bootstrap marker agree exactly; substitution is refused", () => {
  assert.deepEqual(validateCloudTarget(input), approval);
  assert.deepEqual(approval, {
    status: "owner-approved",
    projectRef,
    apiOrigin,
    marker: {
      project_id: projectRef,
      purpose: "disposable-v3-slice0-cloud",
      schema_version: 1,
    },
  });
  assert.equal(plan.projectRef, projectRef);
  assert.equal(plan.apiOrigin, apiOrigin);
  assert.deepEqual(plan.databaseMarker, approval.marker);
  for (const substitute of [
    { ...input, projectRef: "b".repeat(20) },
    { ...input, apiOrigin: "https://my-kravv-dev.supabase.co" },
    { ...input, apiOrigin: apiOrigin + "/" },
  ])
    assert.throws(() => validateCloudTarget(substitute));
});

test("Actual approved target remains blocked before identity I/O without any synthetic credentials", async (t) => {
  let requests = 0;
  t.mock.method(globalThis, "fetch", async () => {
    requests++;
    throw Error("Unexpected request");
  });
  assert.throws(
    () =>
      resolveV3Target({
        profile: v3CloudProfile,
        url: apiOrigin,
        cloudProjectRef: projectRef,
      }),
    /Cloud execution is blocked/,
  );
  // Child-process application regressions also cover browser/SSR/Proxy paths.
  assert.equal(requests, 0);
});

test("Cloud SQL preserves the complete pinned local contract except the two marker substitutions", () => {
  const localBytes = fs.readFileSync(plan.foundationSource);
  const cloudBytes = fs.readFileSync(plan.cloudMigration);
  const sha = (bytes: Buffer) =>
    createHash("sha256").update(bytes).digest("hex");
  assert.equal(sha(localBytes), plan.foundationSourceSha256);
  assert.equal(
    plan.foundationSourceSha256,
    "d819f9d322179dde279fbab3632783c9c2ed331d892054f3f39c2e1ffdd1b17c",
  );
  assert.equal(sha(cloudBytes), plan.cloudMigrationSha256);
  const normalize = (s: string) => s.replaceAll("\r\n", "\n");
  const expected = normalize(localBytes.toString())
    .replace(
      "purpose = 'disposable-v3-slice0'",
      "purpose = 'disposable-v3-slice0-cloud'",
    )
    .replace(
      "(true, 'my-kravv-v3-local-01a14897', 'disposable-v3-slice0', 1)",
      `(true, '${projectRef}', 'disposable-v3-slice0-cloud', 1)`,
    );
  assert.equal(normalize(cloudBytes.toString()), expected);
  assert.match(expected, /^begin;/);
  assert.match(expected, /commit;\s*$/);
  assert.equal(
    plan.execution,
    "blocked-pending-bootstrap-and-live-operation-approval",
  );
});
