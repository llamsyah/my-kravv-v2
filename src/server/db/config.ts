import "server-only";
import { z } from "zod";

/** Reserved for explicit administrative work; user requests must use Auth + RLS. */
export function getSupabaseServiceRoleKey(): string {
  const result = z
    .string()
    .trim()
    .min(1)
    .safeParse(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!result.success) {
    throw new Error(
      "Set SUPABASE_SERVICE_ROLE_KEY before using administrative database operations.",
    );
  }
  return result.data;
}
