import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import {
  cliVersion,
  repositoryRoot,
  workdir,
  statePath,
  networkName,
  dbContainer,
  localDockerHost,
  verifyLayout,
  isolatedChildEnvironment,
  validateStatus,
  verifyApiIdentity,
  validateDisposable,
} from "./guards.ts";
import { v3ProjectId, v3AppUrl } from "../../src/lib/env/v3.ts";
import {
  readStartupFingerprint,
  validateInstanceReceipt,
  assertRetainedCompatibility,
  assertStartupAuthorization,
  assertCliExecutable,
  assertServiceImageMetadata,
  assertExplicitLoopbackBindings,
  makeFreshReceipt,
} from "./startup-safety.ts";

const environment = isolatedChildEnvironment();
function command(executable: string, args: string[], timeout = 30000) {
  // CLI output can contain credentials: capture it, never stream/log raw output.
  try {
    return execFileSync(executable, args, {
      cwd: repositoryRoot,
      env: environment,
      encoding: "utf8",
      timeout,
      maxBuffer: 32 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    }).trim();
  } catch (error) {
    const timeout = (error as NodeJS.ErrnoException).code === "ETIMEDOUT";
    throw Error(
      `Local ${path.basename(executable)} operation ${timeout ? "timed out" : "failed"}; raw output suppressed to protect credentials.`,
    );
  }
}
function docker(...args: string[]) {
  return command("docker", ["--context", "desktop-linux", ...args]);
}
function cli(args: string[], timeout?: number, startupParameter?: string) {
  verifyLayout();
  if (args[0] === "start" || (args[0] === "db" && args[1] === "reset")) {
    const fingerprint = readStartupFingerprint();
    assertStartupAuthorization(
      args[0] === "start" ? "start" : "reset",
      startupParameter,
      fs.existsSync(statePath) ? readState() : undefined,
      fingerprint,
    );
    assertCliExecutable(fingerprint);
  }
  return command(
    path.join(
      repositoryRoot,
      "node_modules/supabase/bin",
      process.platform === "win32" ? "supabase.exe" : "supabase",
    ),
    ["--network-id", networkName, ...args, "--workdir", workdir],
    timeout,
  );
}
function engine() {
  const endpoint = JSON.parse(
    docker(
      "context",
      "inspect",
      "desktop-linux",
      "--format",
      "{{json .Endpoints.docker.Host}}",
    ),
  );
  if (endpoint !== localDockerHost)
    throw Error("Nonlocal Docker context refused.");
  const info = JSON.parse(docker("version", "--format", "{{json .Server}}"));
  if (info?.Os !== "linux" || info?.Arch !== "amd64")
    throw Error("Docker Linux engine unavailable. Stop Docker-dependent work.");
  return info.Version as string;
}
function readState() {
  if (!fs.existsSync(statePath))
    throw Error(
      "No locally recorded V3 instance. Existing resources will not be adopted.",
    );
  let value: unknown;
  try {
    value = JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch {
    throw Error(
      "V3 instance receipt is unreadable; no access or automatic repair permitted.",
    );
  }
  return validateInstanceReceipt(value);
}
function volumeProofs() {
  return docker(
    "volume",
    "ls",
    "--filter",
    `label=com.supabase.cli.project=${v3ProjectId}`,
    "--format",
    "{{.Name}}",
  )
    .split("\n")
    .filter(Boolean)
    .sort()
    .map((name) => {
      if (!name.startsWith("supabase_") || !name.endsWith(`_${v3ProjectId}`))
        throw Error("Unexpected V3 volume name.");
      return {
        name,
        createdAt: docker(
          "volume",
          "inspect",
          "--format",
          "{{.CreatedAt}}",
          name,
        ),
      };
    });
}
function verifyVolumes() {
  const state = readState();
  const fingerprint = readStartupFingerprint();
  // Reject the legacy identity-only receipt before even querying Docker.
  assertRetainedCompatibility(state, fingerprint);
  assertRetainedCompatibility(state, fingerprint, volumeProofs());
}
function verifyServiceImages() {
  const fingerprint = readStartupFingerprint();
  assertCliExecutable(fingerprint);
  for (const service of fingerprint.services)
    assertServiceImageMetadata(
      service,
      JSON.parse(docker("image", "inspect", service.reference))[0],
    );
}
function recordInstance(fresh?: { flag: string; noPreviousResources: true }) {
  const fingerprint = readStartupFingerprint();
  if (!fresh) assertRetainedCompatibility(readState(), fingerprint);
  const container = docker("inspect", "--format", "{{.Id}}", dbContainer);
  const volumes = volumeProofs();
  const state = fresh
    ? makeFreshReceipt(container, volumes, fingerprint, {
        flag: fresh.flag,
        existingReceipt: fs.existsSync(statePath),
        existingResources: !fresh.noPreviousResources,
      })
    : {
        ...assertRetainedCompatibility(readState(), fingerprint, volumes),
        container,
      };
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  // Existing compatibility evidence is preserved, never inferred/backfilled.
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}
function verifyContainer() {
  const state = readState();
  verifyVolumes();
  const running = docker(
    "ps",
    "--filter",
    `label=com.supabase.cli.project=${v3ProjectId}`,
    "--format",
    "{{.Names}}",
  );
  if (!running.split("\n").includes(dbContainer))
    throw Error(
      "Recorded V3 database is stopped or absent; no database/build/integration operation attempted. Use v3:up after resolving startup.",
    );
  if (docker("inspect", "--format", "{{.Id}}", dbContainer) !== state.container)
    throw Error("V3 container identity changed; refusing database access.");
  const labels = JSON.parse(
    docker("inspect", "--format", "{{json .Config.Labels}}", dbContainer),
  );
  if (labels?.["com.supabase.cli.project"] !== v3ProjectId)
    throw Error("V3 container label mismatch.");
}
const disposableQuery = `select jsonb_build_object(
  'identity', public.v3_target_identity(),
  'foreign_users', (select count(*) from auth.users where
    email !~ '^v3-slice0-.*@example.invalid$' or
    raw_user_meta_data->>'purpose' is distinct from 'my-kravv-v3-slice0'),
  'unexpected_tables', (select count(*) from pg_tables where schemaname='public'
    and tablename not in ('companies','user_settings')));`;
function disposable() {
  verifyContainer();
  // Exact local container already identified; socket psql, no URL/password args.
  const result = JSON.parse(
    docker(
      "exec",
      dbContainer,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-At",
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      disposableQuery,
    ),
  );
  validateDisposable(result);
}
function loopbackBindings() {
  const names = docker(
    "ps",
    "--filter",
    `label=com.supabase.cli.project=${v3ProjectId}`,
    "--format",
    "{{.Names}}",
  )
    .split("\n")
    .filter(Boolean);
  for (const name of names) {
    const ports = JSON.parse(
      docker("inspect", "--format", "{{json .NetworkSettings.Ports}}", name),
    );
    try {
      assertExplicitLoopbackBindings(ports);
    } catch {
      const mode = docker(
        "inspect",
        "--format",
        "{{.HostConfig.NetworkMode}}",
        name,
      );
      // Only positively identified V3 resources, preserve volumes on stop.
      cli(["stop"]);
      throw Error(
        `V3 port binding refused on ${name} (network ${mode}); this V3 stack was stopped with data retained.`,
      );
    }
  }
}
async function credentials() {
  verifyLayout();
  assertRetainedCompatibility(readState(), readStartupFingerprint());
  engine();
  verifyServiceImages();
  verifyContainer();
  loopbackBindings();
  disposable();
  const values = validateStatus(
    JSON.parse(cli(["status", "--output", "json"])),
  );
  await verifyApiIdentity(values.key);
  return values;
}
async function main() {
  const [action, parameter] = process.argv.slice(2);
  verifyLayout();
  const installed = JSON.parse(
    fs.readFileSync(
      path.join(repositoryRoot, "node_modules/supabase/package.json"),
      "utf8",
    ),
  );
  if (installed.version !== cliVersion)
    throw Error("Pinned Supabase CLI version mismatch.");
  if (action === "build") {
    const values = await credentials();
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = values.key;
    await launch([
      path.join(repositoryRoot, "node_modules/next/dist/bin/next"),
      "build",
    ]);
    return;
  }
  if (action === "start") {
    assertStartupAuthorization(
      "start",
      parameter,
      fs.existsSync(statePath) ? readState() : undefined,
      readStartupFingerprint(),
    );
    engine();
    verifyServiceImages();
    const resources =
      docker("ps", "-a", "--format", "{{.Names}}") +
      "\n" +
      docker("volume", "ls", "--format", "{{.Name}}");
    if (resources.includes(v3ProjectId)) {
      verifyVolumes();
      const running = docker(
        "ps",
        "--filter",
        `label=com.supabase.cli.project=${v3ProjectId}`,
        "--format",
        "{{.Names}}",
      );
      if (!running.split("\n").includes(dbContainer)) {
        console.log(
          `Verified retained task-owned V3 volumes; restarting only ${v3ProjectId}, no reset or V2 import.`,
        );
        cli(["start"], 600000, parameter);
        recordInstance();
      }
      await credentials();
      console.log(
        "Positively identified V3 stack is healthy; no reset executed.",
      );
      return;
    }
    if (fs.existsSync(statePath))
      throw Error(
        "Recorded instance disappeared. Review before rebuilding; no automatic reset.",
      );
    const networks = docker("network", "ls", "--format", "{{.Name}}").split(
      "\n",
    );
    if (networks.includes(networkName))
      throw Error("Existing unverified V3 network; review before adoption.");
    docker(
      "network",
      "create",
      "--driver",
      "bridge",
      "--opt",
      "com.docker.network.bridge.host_binding_ipv4=127.0.0.1",
      "--label",
      `my-kravv.v3=${v3ProjectId}`,
      networkName,
    );
    console.log(
      `Verified fresh local target ${v3ProjectId}; no matching containers/volumes, no remote link. Applying V3-only manifest.`,
    );
    // A second absence check immediately precedes the only future fresh start.
    const currentResources =
      docker("ps", "-a", "--format", "{{.Names}}") +
      "\n" +
      docker("volume", "ls", "--format", "{{.Name}}");
    if (currentResources.includes(v3ProjectId) || fs.existsSync(statePath))
      throw Error(
        "V3 resources appeared during fresh preflight; no automatic adoption permitted.",
      );
    cli(["start"], 600000, parameter);
    recordInstance({ flag: parameter!, noPreviousResources: true });
    await credentials();
    console.log(
      "V3 target identity, synthetic-only foundation and loopback ports verified. Credentials withheld.",
    );
    return;
  }
  if (action === "doctor") {
    console.log(
      `Linux engine ${engine()} reachable; pinned CLI ${cliVersion}; isolated manifest verified.`,
    );
    if (fs.existsSync(statePath)) {
      await credentials();
      console.log(
        "V3 database/API identity verified; no V2 or remote target used.",
      );
    } else
      console.log("V3 instance not created; no database operation attempted.");
    return;
  }
  if (action === "reset") {
    assertStartupAuthorization(
      "reset",
      parameter,
      fs.existsSync(statePath) ? readState() : undefined,
      readStartupFingerprint(),
    );
    if (parameter !== "--confirm-disposable-v3")
      throw Error("Explicit --confirm-disposable-v3 required.");
    await credentials();
    // Repeat positive checks immediately before destructive execution.
    verifyLayout();
    engine();
    disposable();
    console.log(
      `Reverified disposable local target ${v3ProjectId}; resetting only its V3 manifest.`,
    );
    cli(["db", "reset", "--local", "--no-seed", "--yes"], 180000, parameter);
    recordInstance();
    await credentials();
    console.log("Isolated V3 reset/rebuild verified; credentials withheld.");
    return;
  }
  if (action === "dev" || action === "serve" || action === "test") {
    const values = await credentials();
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = values.key;
    if (action === "test") {
      environment.SUPABASE_SECRET_KEY = values.secret;
      environment.MY_KRAVV_V3_INTEGRATION = v3ProjectId;
      await launch([
        "--conditions=react-server",
        "--test",
        "src/tests/v3-live/foundation.test.ts",
      ]);
    } else {
      // Privileged keys and AI credentials are never inherited by the app.
      console.log(
        `Starting isolated V3 app at ${v3AppUrl}; legacy paths and AI disabled.`,
      );
      await launch([
        path.join(repositoryRoot, "node_modules/next/dist/bin/next"),
        action === "dev" ? "dev" : "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3103",
      ]);
    }
    return;
  }
  throw Error(
    "Use only doctor/start/reset/dev/serve/build/test. Remote and arbitrary CLI commands are not exposed.",
  );
}
function launch(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: repositoryRoot,
      env: environment,
      stdio: "inherit",
      windowsHide: true,
    });
    child.on("error", () => reject(Error("V3 child process could not start.")));
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(Error(`V3 child process failed (${code ?? "signal"}).`));
    });
  });
}
if (path.resolve(process.argv[1] ?? "") === import.meta.filename)
  main().catch((error) => {
    console.error(
      error instanceof Error ? error.message : "V3 operation failed.",
    );
    process.exitCode = 1;
  });
