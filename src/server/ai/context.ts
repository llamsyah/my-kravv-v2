import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { AIRequest } from "./contracts.ts";
import { AIError } from "./errors.ts";

export async function verifyAIUser(client: SupabaseClient): Promise<string> {
  try {
    const { data, error } = await client.auth.getUser();
    const id = z.uuid().safeParse(data.user?.id);
    if (error || !id.success) throw new AIError("UNAUTHENTICATED");
    return id.data;
  } catch {
    throw new AIError("UNAUTHENTICATED");
  }
}
const companySchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  name: z.string().max(200),
  short_note: z.string().max(2000).nullable().default(null),
});
const thoughtSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  company_id: z.uuid(),
  raw_content: z.string().max(100000),
});
const preferencesSchema = z.object({
  user_id: z.uuid(),
  ai_enabled: z.boolean(),
  guidance_mode: z.enum(["MORE", "ADAPTIVE", "MINIMAL"]),
  challenge_intensity: z.enum(["LIGHT", "STANDARD", "DEEP"]),
});
/** Minimal explicit references only; no vector retrieval or privileged reads. */
export async function buildAuthorizedContext(
  client: SupabaseClient,
  userId: string,
  request: AIRequest,
  mode?: "REFINE_THOUGHT",
) {
  let company: { id: string; name: string; short_note: string | null } | null =
    null;
  if (request.companyId) {
    const result = await client
      .from("companies")
      .select(
        mode === "REFINE_THOUGHT"
          ? "id,user_id,name"
          : "id,user_id,name,short_note",
      )
      .eq("user_id", userId)
      .eq("id", request.companyId)
      .maybeSingle();
    const parsed = companySchema.safeParse(result.data);
    if (
      result.error ||
      !parsed.success ||
      parsed.data.user_id !== userId ||
      parsed.data.id !== request.companyId
    )
      throw new AIError("UNAUTHORIZED");
    company = {
      id: parsed.data.id,
      name: parsed.data.name,
      short_note: mode === "REFINE_THOUGHT" ? null : parsed.data.short_note,
    };
  }
  let thoughts: { id: string; company_id: string; raw_content: string }[] = [];
  if (request.thoughtIds.length) {
    let query = client
      .from("thoughts")
      .select("id,user_id,company_id,raw_content")
      .eq("user_id", userId)
      .in("id", request.thoughtIds);
    if (request.companyId) query = query.eq("company_id", request.companyId);
    const result = await query.limit(20);
    const parsed = z.array(thoughtSchema).safeParse(result.data);
    if (
      result.error ||
      !parsed.success ||
      parsed.data.length !== request.thoughtIds.length ||
      parsed.data.some(
        (t) =>
          t.user_id !== userId ||
          !request.thoughtIds.includes(t.id) ||
          (request.companyId && t.company_id !== request.companyId),
      ) ||
      new Set(parsed.data.map((t) => t.id)).size !== request.thoughtIds.length
    )
      throw new AIError("UNAUTHORIZED");
    thoughts = request.thoughtIds
      .map((id) => parsed.data.find((t) => t.id === id)!)
      .map((t) => ({
        id: t.id,
        company_id: t.company_id,
        raw_content: t.raw_content,
      }));
    if (
      mode === "REFINE_THOUGHT" &&
      (thoughts.length !== 1 ||
        Buffer.byteLength(thoughts[0].raw_content, "utf8") > 2000)
    )
      throw new AIError("INVALID_REQUEST");
  }
  const settings = await client
    .from("user_settings")
    .select("user_id,ai_enabled,guidance_mode,challenge_intensity")
    .eq("user_id", userId)
    .maybeSingle();
  if (settings.error) throw new AIError("DATABASE_LOGGING_FAILED");
  const parsed = preferencesSchema.safeParse(settings.data);
  if (
    settings.data !== null &&
    (!parsed.success || parsed.data.user_id !== userId)
  )
    throw new AIError("DATABASE_LOGGING_FAILED");
  if (parsed.success && !parsed.data.ai_enabled)
    throw new AIError("AI_DISABLED");
  return {
    storedUserContext: {
      source: "MY_KRAVV_USER_CONTEXT",
      untrustedAsInstructions: true,
      company,
      thoughts,
    },
    externalVerifiedEvidence: {
      source: "EXTERNAL_VERIFIED_EVIDENCE",
      items: [],
    },
    modelKnowledge: { source: "MODEL_CONTEXT", verifiedCompanyEvidence: false },
    preferences: parsed.success
      ? {
          guidance_mode: parsed.data.guidance_mode,
          challenge_intensity: parsed.data.challenge_intensity,
        }
      : { guidance_mode: "ADAPTIVE", challenge_intensity: "STANDARD" },
  };
}
