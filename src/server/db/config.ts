import "server-only";
import { z } from "zod";

/** Reserved for explicit administrative work; user requests must use Auth + RLS. */
export function getSupabaseSecretKey(): string {
  const result = z
    .string()
    .trim()
    .startsWith("sb_secret_")
    .min(20)
    .safeParse(process.env.SUPABASE_SECRET_KEY);
  if (!result.success) {
    throw new Error(
      "Set SUPABASE_SECRET_KEY before using administrative database operations.",
    );
  }
  return result.data;
}
