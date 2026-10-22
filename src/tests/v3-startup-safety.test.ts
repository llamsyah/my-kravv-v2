import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import {
  readStartupFingerprint,
  assertRetainedCompatibility,
  assertStartupAuthorization,
  assertCreationPublisherReady,
  assertServiceImageMetadata,
  assertExplicitLoopbackBindings,
  makeFreshReceipt,
  assertReviewedCliInputs,
} from "../../scripts/v3/startup-safety.ts";
import {
  dbContainer,
  repositoryRoot,
  statePath,
} from "../../scripts/v3/guards.ts";

const fingerprint = readStartupFingerprint();
const volumes = [{ name: dbContainer, createdAt: "2026-10-21T12:10:02Z" }];
const freshConfirmation = {
  flag: "--confirm-fresh-v3",
  existingReceipt: false,
  existingResources: false,
};
const approvedFixture = () =>
  makeFreshReceipt("a".repeat(64), volumes, fingerprint, freshConfirmation);

test("V3 compatibility requires explicit provenance bound to the exact volume; identity alone is insufficient", () => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "kravv-startup-inputs-"),
  );
  try {
    fs.mkdirSync(path.join(directory, "supabase/.temp"), { recursive: true });
    fs.mkdirSync(path.join(directory, "supabase/.branches"));
    fs.writeFileSync(
      path.join(directory, "supabase/.temp/cli-latest"),
      "2.121.0",
    );
    fs.writeFileSync(
      path.join(directory, "supabase/.branches/_current_branch"),
      "main\n",
    );
    assert.doesNotThrow(() => assertReviewedCliInputs(directory));
    fs.writeFileSync(
      path.join(directory, "supabase/.temp/postgres-version"),
      "17.11.0.004",
    );
    assert.throws(
      () => assertReviewedCliInputs(directory),
      /cache\/version override/,
    );
    fs.unlinkSync(path.join(directory, "supabase/.temp/postgres-version"));
    fs.writeFileSync(
      path.join(directory, ".env.local"),
      "SUPABASE_DB_PORT=54321",
    );
    assert.throws(() => assertReviewedCliInputs(directory), /dotenv override/);
    fs.unlinkSync(path.join(directory, ".env.local"));
    fs.writeFileSync(
      path.join(directory, "supabase/.branches/_current_branch"),
      "v2",
    );
    assert.throws(() => assertReviewedCliInputs(directory), /branch override/);
  } finally {
    assert.equal(
      path.dirname(path.resolve(directory)),
      path.resolve(os.tmpdir()),
    );
    fs.rmSync(directory, { recursive: true });
  }
  const state = approvedFixture();
  assert.doesNotThrow(() =>
    assertRetainedCompatibility(state, fingerprint, volumes),
  );
  const legacy = {
    project: state.project,
    container: state.container,
    volumes: state.volumes,
  };
  assert.throws(
    () => assertRetainedCompatibility(legacy, fingerprint),
    /missing.*backfill/,
  );
  for (const invalid of [
    { ...state, project: "v2" },
    { ...state, container: "unknown" },
    {
      ...state,
      compatibility: { ...state.compatibility, basis: "inferred-from-label" },
    },
    {
      ...state,
      compatibility: { ...state.compatibility, approvedAt: "not-a-date" },
    },
    { ...state, compatibility: { ...state.compatibility, evidence: "" } },
    {
      ...state,
      compatibility: {
        ...state.compatibility,
        volumes: [{ ...volumes[0], createdAt: "2026-10-20T12:10:02Z" }],
      },
    },
  ])
    assert.throws(() => assertRetainedCompatibility(invalid, fingerprint));
  assert.throws(
    () => assertRetainedCompatibility(state, fingerprint, []),
    /exact recorded volumes/,
  );
  assert.throws(
    () =>
      assertRetainedCompatibility(state, fingerprint, [
        { ...volumes[0], name: "v2" },
      ]),
    /exact recorded volumes/,
  );
});

test("CLI binary, environment, service names/digests, config, migration and publisher drift invalidate retained approval", () => {
  const mutations = [
    (x: typeof fingerprint) => {
      x.cli.version = "2.118.0" as typeof x.cli.version;
    },
    (x: typeof fingerprint) => {
      x.cli.executableSha256 = "b".repeat(64);
    },
    (x: typeof fingerprint) => {
      x.environment.apiUrl = "https://remote.invalid";
    },
    (x: typeof fingerprint) => {
      x.environment.project = "v2";
    },
    (x: typeof fingerprint) => {
      x.environment.dockerHost = "tcp://remote:2375";
    },
    (x: typeof fingerprint) => {
      x.environment.workdir = "supabase";
    },
    (x: typeof fingerprint) => {
      x.configHash = "c".repeat(64);
    },
    (x: typeof fingerprint) => {
      x.migration.sha256 = "d".repeat(64);
    },
    (x: typeof fingerprint) => {
      x.services.pop();
    },
    (x: typeof fingerprint) => {
      x.services[0].reference = "public.ecr.aws/supabase/postgres:17.11.0.004";
    },
    (x: typeof fingerprint) => {
      x.services[0].registryDigest = "sha256:" + "e".repeat(64);
    },
    (x: typeof fingerprint) => {
      x.services[1].platformManifestDigest = "sha256:" + "e".repeat(64);
    },
    (x: typeof fingerprint) => {
      x.services[2].configDigest = "sha256:" + "e".repeat(64);
    },
    (x: typeof fingerprint) => {
      x.publishing.implementation = "different-build";
    },
  ];
  for (const mutate of mutations) {
    const state = approvedFixture();
    const stale = structuredClone(fingerprint);
    mutate(stale);
    state.compatibility!.fingerprint = stale;
    assert.throws(
      () => assertRetainedCompatibility(state, fingerprint),
      /incompatible/,
    );
  }
});

test("a verified image cache does not imply runtime approval; wrong image name/digest/platform fails closed", () => {
  for (const service of fingerprint.services) {
    const repository = service.reference.slice(
      0,
      service.reference.lastIndexOf(":"),
    );
    const metadata = {
      Os: "linux",
      Architecture: "amd64",
      Descriptor: { digest: service.registryDigest },
      RepoDigests: [`${repository}@${service.registryDigest}`],
    };
    assert.doesNotThrow(() => assertServiceImageMetadata(service, metadata));
    for (const invalid of [
      undefined,
      {},
      { ...metadata, Architecture: "arm64" },
      { ...metadata, Os: "windows" },
      { ...metadata, Descriptor: { digest: "sha256:" + "b".repeat(64) } },
      {
        ...metadata,
        RepoDigests: [`unrelated/image@${service.registryDigest}`],
      },
    ])
      assert.throws(
        () => assertServiceImageMetadata(service, invalid),
        /unavailable or incompatible/,
      );
  }
});

test("proposed and actual port maps reject omitted, wildcard, IPv6 and malformed host bindings", () => {
  const effective = {
    "5432/tcp": [{ HostIp: "127.0.0.1", HostPort: "55322" }],
    "9999/tcp": null,
  };
  assert.doesNotThrow(() => assertExplicitLoopbackBindings(effective));
  for (const HostIp of [
    undefined,
    "",
    "0.0.0.0",
    "::",
    "::1",
    "localhost",
    "192.168.1.1",
  ])
    assert.throws(
      () =>
        assertExplicitLoopbackBindings({
          "5432/tcp": [{ HostIp, HostPort: "55322" }],
        }),
      /explicit 127/,
    );
  assert.throws(() =>
    assertExplicitLoopbackBindings({
      ...effective,
      "8000/tcp": [{ HostIp: "0.0.0.0", HostPort: "55321" }],
    }),
  );
  for (const HostPort of ["", "0", "65536", "55321:55322", "not-a-port"])
    assert.throws(() =>
      assertExplicitLoopbackBindings({
        "5432/tcp": [{ HostIp: "127.0.0.1", HostPort }],
      }),
    );
  for (const value of [undefined, null, [], "unavailable"])
    assert.throws(() => assertExplicitLoopbackBindings(value));
});

test("no receipt/flag can waive the unimplemented creation-time publisher; fresh approval cannot adopt retained resources", () => {
  assert.throws(assertCreationPublisherReady, /unapproved/);
  assert.throws(
    () =>
      assertStartupAuthorization(
        "start",
        undefined,
        approvedFixture(),
        fingerprint,
      ),
    /publisher is unapproved/,
  );
  assert.throws(
    () =>
      assertStartupAuthorization(
        "reset",
        "--confirm-disposable-v3",
        approvedFixture(),
        fingerprint,
      ),
    /publisher is unapproved/,
  );
  assert.throws(
    () =>
      assertStartupAuthorization(
        "start",
        "--confirm-fresh-v3",
        approvedFixture(),
        fingerprint,
      ),
    /cannot authorize retained/,
  );
  assert.throws(
    () =>
      assertStartupAuthorization(
        "start",
        "--confirm-fresh-v3",
        undefined,
        fingerprint,
      ),
    /publisher is unapproved/,
  );
  assert.throws(
    () =>
      assertStartupAuthorization("start", undefined, undefined, fingerprint),
    /requires --confirm-fresh/,
  );
  assert.throws(
    () =>
      assertStartupAuthorization(
        "reset",
        undefined,
        approvedFixture(),
        fingerprint,
      ),
    /confirm-disposable/,
  );
  for (const confirmation of [
    { ...freshConfirmation, existingResources: true },
    { ...freshConfirmation, existingReceipt: true },
    { ...freshConfirmation, flag: undefined },
  ])
    assert.throws(
      () =>
        makeFreshReceipt("a".repeat(64), volumes, fingerprint, confirmation),
      /cannot be created/,
    );
  assert.throws(() =>
    makeFreshReceipt(
      "a".repeat(64),
      [{ name: "v2", createdAt: volumes[0].createdAt }],
      fingerprint,
      freshConfirmation,
    ),
  );
});

test("real startup/reset entry points fail before Docker and preserve the identity-only receipt", () => {
  const before = fs.existsSync(statePath)
    ? fs.readFileSync(statePath)
    : undefined;
  for (const args of [
    ["start"],
    ["start", "--confirm-fresh-v3"],
    ["reset", "--confirm-disposable-v3"],
  ]) {
    const result = spawnSync(
      process.execPath,
      ["scripts/v3/local.ts", ...args],
      {
        cwd: repositoryRoot,
        env: { ...process.env, PATH: "", Path: "" },
        encoding: "utf8",
        timeout: 10000,
        windowsHide: true,
      },
    );
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.match(
      result.stderr,
      /compatibility evidence is missing|requires --confirm-fresh|publisher is unapproved/,
    );
    assert.ok(
      !result.stderr.includes("Local docker operation"),
      "Rejection must precede the unavailable Docker executable.",
    );
  }
  if (before) assert.deepEqual(fs.readFileSync(statePath), before);
  else assert.equal(fs.existsSync(statePath), false);
});
