import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./client.ts";

/** Deduplicated only within a render pass, never cached between users/requests. */
export const getVerifiedSession = cache(async () => {
  const supabase = await createSupabaseServerClient();
  try {
    const { data, error } = await supabase.auth.getUser();
    return { supabase, user: error ? null : data.user };
  } catch {
    return { supabase, user: null };
  }
});

export async function requireAuthenticatedSession() {
  const session = await getVerifiedSession();
  if (!session.user) redirect("/auth");
  return { supabase: session.supabase, user: session.user };
}
