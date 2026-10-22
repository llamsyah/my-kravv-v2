import { z } from "zod";
import approval from "./v3-cloud-approval.json" with { type: "json" };

// A profile label is not a project reference or evidence of provisioning.
export const v3CloudProfile = "my-kravv-v3-cloud-dev";
export const v3CloudCookieName = "my-kravv-v3-cloud-dev-auth";
const reference = z.string().regex(/^[a-z0-9]{20}$/);
const approvedSchema = z
  .object({
    status: z.literal("owner-approved"),
    projectRef: reference,
    apiOrigin: z.string(),
    marker: z
      .object({
        project_id: reference,
        purpose: z.literal("disposable-v3-slice0-cloud"),
        schema_version: z.literal(1),
      })
      .strict(),
  })
  .strict();

/** Pure validation; injectable evidence is for offline fixtures, never env approval. */
export function validateCloudTarget(
  input: { profile: unknown; projectRef: unknown; apiOrigin: unknown },
  evidence: unknown = approval,
) {
  const result = approvedSchema.safeParse(evidence);
  if (!result.success)
    throw Error("V3 Cloud is unprovisioned or unapproved; execution refused.");
  const target = result.data;
  const expected = `https://${target.projectRef}.supabase.co`;
  if (
    target.apiOrigin !== expected ||
    target.marker.project_id !== target.projectRef ||
    input.profile !== v3CloudProfile ||
    input.projectRef !== target.projectRef ||
    input.apiOrigin !== expected
  )
    throw Error("V3 Cloud target identity conflicts with owner approval.");
  return target;
}

export function matchesCloudMarker(value: unknown, marker: unknown) {
  const parsed = approvedSchema.shape.marker.safeParse(value);
  const expected = approvedSchema.shape.marker.safeParse(marker);
  return (
    parsed.success &&
    expected.success &&
    parsed.data.project_id === expected.data.project_id &&
    parsed.data.purpose === expected.data.purpose &&
    parsed.data.schema_version === expected.data.schema_version
  );
}
