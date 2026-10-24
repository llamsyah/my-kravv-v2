import "server-only";
import { serverApplicationTarget } from "./application-target.ts";
import { matchesV3Identity } from "../../lib/env/v3.ts";
import { matchesCloudMarker } from "../../lib/env/v3-cloud.ts";

/** Verify non-private target identity before auth/content I/O; no redirects. */
export async function verifyV3DatabaseTarget(fetcher: typeof fetch = fetch) {
  const {
    target: { url, publishableKey, kind, marker },
    fetcher: guardedFetch,
  } = serverApplicationTarget();
  try {
    const response = await (guardedFetch ?? fetcher)(
      `${url}/rest/v1/rpc/v3_target_identity`,
      {
        method: "POST",
        headers: { apikey: publishableKey, "Content-Type": "application/json" },
        body: "{}",
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!response.ok) throw Error();
    const identity: unknown = await response.json();
    if (
      !(kind === "local"
        ? matchesV3Identity(identity)
        : matchesCloudMarker(identity, marker))
    )
      throw Error();
  } catch {
    throw new Error("V3 local database identity could not be verified.");
  }
}
