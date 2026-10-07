import "server-only";
import { requireAuthenticatedSession } from "../auth/session.ts";
import { ensureUserSettings } from "../db/user-settings.ts";
export async function getCompanyContext() {
  const session = await requireAuthenticatedSession();
  await ensureUserSettings(session.supabase, session.user.id);
  return session;
}
