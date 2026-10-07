import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/** userId comes exclusively from the server-verified Auth user, never form data. */
export async function ensureUserSettings(
  supabase: SupabaseClient,
  userId: string,
) {
  // ON CONFLICT DO NOTHING handles concurrent first entries and preserves edits.
  const { error: insertError } = await supabase
    .from("user_settings")
    .upsert(
      { user_id: userId },
      { onConflict: "user_id", ignoreDuplicates: true },
    );
  if (insertError)
    throw new Error("Private workspace settings could not be initialized.");
  const { data, error } = await supabase
    .from("user_settings")
    .select("user_id")
    .eq("user_id", userId)
    .single();
  if (error || data?.user_id !== userId) {
    throw new Error("Private workspace settings could not be verified.");
  }
  return { user_id: userId };
}
