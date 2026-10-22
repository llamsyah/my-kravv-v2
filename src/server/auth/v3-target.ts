import "server-only";
import { getPublicSupabaseConfig } from "../../lib/env/public.ts";
import { matchesV3Identity } from "../../lib/env/v3.ts";

/** Verify non-private target identity before auth/content I/O; no redirects. */
export async function verifyV3DatabaseTarget(fetcher: typeof fetch = fetch) {
  const { url, publishableKey } = getPublicSupabaseConfig();
  try {
    const response = await fetcher(`${url}/rest/v1/rpc/v3_target_identity`, {
      method: "POST",
      headers: { apikey: publishableKey, "Content-Type": "application/json" },
      body: "{}",
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok || !matchesV3Identity(await response.json()))
      throw Error();
  } catch {
    throw new Error("V3 local database identity could not be verified.");
  }
}
