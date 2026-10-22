/** Public non-secret identity shared by app, tooling and synthetic tests. */
export const v3ProjectId = "my-kravv-v3-local-01a14897";
export const v3ApiUrl = "http://127.0.0.1:55321";
export const v3AppUrl = "http://127.0.0.1:3103";
export const v3CookieName = "my-kravv-v3-slice0-auth";

export function assertV3PublicTarget(profile: unknown, url: unknown) {
  // Literal loopback only: no DNS, user-info, redirects or V2 fallback.
  if (profile !== v3ProjectId || url !== v3ApiUrl)
    throw new Error("V3 requires its identified isolated local environment.");
}

export function matchesV3Identity(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    row.project_id === v3ProjectId &&
    row.purpose === "disposable-v3-slice0" &&
    row.schema_version === 1
  );
}

export function refuseLegacyWorkspace(): never {
  throw new Error("V2 workspace operations are unavailable in V3 Slice 0.");
}
