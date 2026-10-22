import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { parseEnv } from "node:util";
import {
  v3ApiUrl,
  v3AppUrl,
  v3ProjectId,
  matchesV3Identity,
} from "../../src/lib/env/v3.ts";

export const cliVersion = "2.75.0";
export const repositoryRoot = path.resolve(import.meta.dirname, "../..");
export const workdir = path.join(repositoryRoot, "supabase/v3");
export const configPath = path.join(workdir, "supabase/config.toml");
export const migrationName = "20261021000100_slice0_foundation.sql";
// Reviewed manifest: changing config/migrations requires updating this guard deliberately.
export const configHash =
  "84d498b018d4c835fe725683af3f5970e0d09d849c408e2447e85bba9f5c30de";
export const migrationHash =
  "d819f9d322179dde279fbab3632783c9c2ed331d892054f3f39c2e1ffdd1b17c";
export const statePath = path.join(
  repositoryRoot,
  ".qa/v3-local-instance.json",
);
export const networkName = `${v3ProjectId}-loopback`;
export const dbContainer = `supabase_db_${v3ProjectId}`;
export const localDockerHost = "npipe:////./pipe/dockerDesktopLinuxEngine";

const hash = (file: string) =>
  crypto
    .createHash("sha256")
    .update(fs.readFileSync(file, "utf8").replaceAll("\r\n", "\n"))
    .digest("hex");
export function verifyLayout(root = workdir) {
  const base = path.resolve(root);
  if (base !== workdir || fs.realpathSync(base) !== base)
    throw Error("Refusing a different or redirected V3 workdir.");
  const config = path.join(base, "supabase/config.toml");
  if (hash(config) !== configHash)
    throw Error("V3 config differs from the reviewed manifest.");
  const migrations = path.join(base, "supabase/migrations");
  if (
    fs.readdirSync(migrations).join(",") !== migrationName ||
    hash(path.join(migrations, migrationName)) !== migrationHash
  )
    throw Error("V3 migration discovery differs from the reviewed manifest.");
  for (const location of [
    path.join(base, "supabase/.temp/project-ref"),
    path.join(base, ".temp/project-ref"),
  ])
    if (fs.existsSync(location)) throw Error("Remote-linked project refused.");
}

/** Next must never inherit V2 .env values, including keys added in the future. */
export function isolatedChildEnvironment(root = repositoryRoot) {
  const env: NodeJS.ProcessEnv = { ...process.env };
  for (const key of Object.keys(env))
    if (
      /^(?:NEXT_PUBLIC_|SUPABASE_|AI_|OPENAI_|GROQ_|MY_KRAVV_|HTTP_PROXY$|HTTPS_PROXY$|ALL_PROXY$)/.test(
        key,
      )
    )
      env[key] = "";
  for (const file of fs
    .readdirSync(root)
    .filter((name) => /^\.env(?:\.|$)/.test(name))) {
    const filePath = path.join(root, file);
    if (!fs.statSync(filePath).isFile()) continue;
    // Parse only to blank key names in the child. Never return, log or write values.
    for (const key of Object.keys(parseEnv(fs.readFileSync(filePath, "utf8"))))
      env[key] = "";
  }
  Object.assign(env, {
    NEXT_PUBLIC_MY_KRAVV_ENV: v3ProjectId,
    NEXT_PUBLIC_SUPABASE_URL: v3ApiUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      "sb_publishable_v3_slice0_build_placeholder",
    SUPABASE_SECRET_KEY: "",
    OPENAI_API_KEY: "",
    GROQ_API_KEY: "",
    AI_PROVIDER: "",
    MY_KRAVV_TEST_APP_URL: v3AppUrl,
    DOCKER_CONTEXT: "desktop-linux",
    DOCKER_HOST: localDockerHost,
    SUPABASE_NETWORK_ID: networkName,
    NEXT_TELEMETRY_DISABLED: "1",
    SUPABASE_TELEMETRY_DISABLED: "1",
  });
  Reflect.deleteProperty(env, "NODE_ENV");
  delete env.NODE_OPTIONS;
  return env;
}

export function validateStatus(value: unknown) {
  if (!value || typeof value !== "object")
    throw Error("Local CLI status unavailable.");
  const row = value as Record<string, unknown>;
  // Accept current CLI naming, never legacy JWT keys as a prefix-validation bypass.
  const api = row.API_URL ?? row.api_url;
  const key = row.PUBLISHABLE_KEY ?? row.publishable_key;
  const secret = row.SECRET_KEY ?? row.secret_key;
  if (
    api !== v3ApiUrl ||
    typeof key !== "string" ||
    !key.startsWith("sb_publishable_") ||
    typeof secret !== "string" ||
    !secret.startsWith("sb_secret_")
  )
    throw Error("CLI target or key format is incompatible with V3 isolation.");
  return { key, secret };
}

export async function verifyApiIdentity(key: string) {
  try {
    const response = await fetch(`${v3ApiUrl}/rest/v1/rpc/v3_target_identity`, {
      method: "POST",
      redirect: "error",
      body: "{}",
      headers: { apikey: key, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok || !matchesV3Identity(await response.json()))
      throw Error();
  } catch {
    throw Error(
      "Identified V3 API is unavailable; no auth/content operation permitted.",
    );
  }
}

export function validateDisposable(value: unknown) {
  if (!value || typeof value !== "object")
    throw Error("Disposable target proof unavailable.");
  const row = value as Record<string, unknown>;
  if (
    !matchesV3Identity(row.identity) ||
    row.foreign_users !== 0 ||
    row.unexpected_tables !== 0
  )
    throw Error(
      "Target is not the known synthetic-only Slice 0 foundation; reset/test refused.",
    );
}
