import "server-only";
import { z } from "zod";

/** Administration and narrow AI accounting only. User content uses Auth + RLS. */
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
