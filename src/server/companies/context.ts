import "server-only";
import { refuseLegacyWorkspace } from "../../lib/env/v3.ts";
import type { requireAuthenticatedSession } from "../auth/session.ts";
export async function getCompanyContext(): Promise<
  Awaited<ReturnType<typeof requireAuthenticatedSession>>
> {
  // Independent of Proxy: all V2 Company/Thought/Refine actions stop here.
  // Keep the old return shape for retained V2 source; never execute those paths.
  return refuseLegacyWorkspace();
}
