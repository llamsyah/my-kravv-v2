import { assertV3PublicTarget, v3CookieName, v3ProjectId } from "./v3.ts";
import {
  validateCloudTarget,
  v3CloudProfile,
  v3CloudCookieName,
} from "./v3-cloud.ts";
import { assertCloudExecutionReady } from "./v3-cloud-execution.ts";

export function resolveV3Target(
  input: {
    profile: unknown;
    url: unknown;
    cloudProjectRef: unknown;
  },
  cloudEvidence?: unknown,
) {
  if (input.profile === v3CloudProfile) {
    const cloud = validateCloudTarget(
      {
        profile: input.profile,
        projectRef: input.cloudProjectRef,
        apiOrigin: input.url,
      },
      cloudEvidence,
    );
    // Every application client and identity request resolves here first. Even
    // valid owner-approved target metadata cannot authorize Cloud execution.
    assertCloudExecutionReady();
    return {
      kind: "cloud" as const,
      cookieName: v3CloudCookieName,
      marker: cloud.marker,
    };
  }
  // The existing local-only guard is unchanged; no remote/default fallback.
  assertV3PublicTarget(input.profile, input.url);
  if (input.cloudProjectRef !== undefined && input.cloudProjectRef !== "")
    throw Error("Conflicting local/Cloud target configuration refused.");
  return {
    kind: "local" as const,
    cookieName: v3CookieName,
    marker: {
      project_id: v3ProjectId,
      purpose: "disposable-v3-slice0",
      schema_version: 1,
    },
  };
}
