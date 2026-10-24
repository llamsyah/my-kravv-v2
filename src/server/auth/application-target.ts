import "server-only";
import { getPublicSupabaseTarget } from "../../lib/env/public.ts";
import {
  applicationSourceApproved,
  applicationAuthority,
} from "../../../scripts/v3/application-authority.ts";

/** Only server clients may enter the independently pinned application window. */
export function serverApplicationTarget(origin?: string) {
  if (!applicationSourceApproved())
    return { target: getPublicSupabaseTarget(), fetcher: undefined };
  try {
    const authority = applicationAuthority();
    const target = authority.target();
    return {
      target,
      fetcher: ((input, init) =>
        authority.fetch(input, init, origin)) as typeof fetch,
    };
  } catch {
    throw Error("V3 server application execution refused.");
  }
}
