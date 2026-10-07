import "server-only";
import { requireAuthenticatedSession } from "./session.ts";
import { ensureUserSettings } from "../db/user-settings.ts";

/** Check identity near the data access, independent of the parent layout/Proxy. */
export async function getPrivateWorkspace() {
  const { supabase, user } = await requireAuthenticatedSession();
  return ensureUserSettings(supabase, user.id);
}
