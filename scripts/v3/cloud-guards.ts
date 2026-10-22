import { z } from "zod";
import {
  validateCloudTarget,
  v3CloudProfile,
} from "../../src/lib/env/v3-cloud.ts";
import { isolatedChildEnvironment, repositoryRoot } from "./guards.ts";
export { assertCloudExecutionReady } from "../../src/lib/env/v3-cloud-execution.ts";

const actions = ["dev", "build", "serve", "test"] as const;
export function validateCloudAction(value: unknown) {
  const result = z.enum(actions).safeParse(value);
  if (!result.success)
    throw Error(
      "Cloud permits only dev/build/serve/test; no SQL/reset/link operations.",
    );
  return result.data;
}

export function configuredCloudTarget(
  source: NodeJS.ProcessEnv,
  evidence?: unknown,
) {
  // Generic credentials/target variables can come from V2 or the local runner.
  // Cloud entry points accept only explicit namespaced inputs, never a fallback.
  for (const key of [
    "NEXT_PUBLIC_MY_KRAVV_ENV",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_MY_KRAVV_CLOUD_PROJECT_REF",
    "SUPABASE_SECRET_KEY",
    "MY_KRAVV_V3_INTEGRATION",
    "SUPABASE_NETWORK_ID",
  ])
    if (source[key])
      throw Error("Ambiguous inherited local/V2/Cloud configuration refused.");
  return validateCloudTarget(
    {
      profile: source.MY_KRAVV_V3_CLOUD_PROFILE,
      projectRef: source.MY_KRAVV_V3_CLOUD_PROJECT_REF,
      apiOrigin: source.MY_KRAVV_V3_CLOUD_API_ORIGIN,
    },
    evidence,
  );
}

/** Offline preparation only. No credentials are persisted, fetched or logged. */
export function prepareCloudEnvironment(
  action: unknown,
  source: NodeJS.ProcessEnv,
  evidence?: unknown,
  root = repositoryRoot,
) {
  const mode = validateCloudAction(action);
  const target = configuredCloudTarget(source, evidence);
  const key = z
    .string()
    .regex(/^sb_publishable_[A-Za-z0-9_-]{5,}$/)
    .safeParse(source.MY_KRAVV_V3_CLOUD_PUBLISHABLE_KEY);
  if (!key.success)
    throw Error("Explicit Cloud publishable credential unavailable.");
  const env = isolatedChildEnvironment(root, source);
  Object.assign(env, {
    NEXT_PUBLIC_MY_KRAVV_ENV: v3CloudProfile,
    NEXT_PUBLIC_MY_KRAVV_CLOUD_PROJECT_REF: target.projectRef,
    NEXT_PUBLIC_SUPABASE_URL: target.apiOrigin,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key.data,
    SUPABASE_SECRET_KEY: "",
    DOCKER_CONTEXT: "",
    DOCKER_HOST: "",
    SUPABASE_NETWORK_ID: "",
    MY_KRAVV_V3_INTEGRATION: "",
  });
  if (mode === "test") {
    const secret = z
      .string()
      .regex(/^sb_secret_[A-Za-z0-9_-]{5,}$/)
      .safeParse(source.MY_KRAVV_V3_CLOUD_SECRET_KEY);
    if (!secret.success)
      throw Error("Explicit Cloud fixture credential unavailable.");
    env.SUPABASE_SECRET_KEY = secret.data;
  }
  return env;
}
