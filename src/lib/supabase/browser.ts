"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseTarget } from "../env/public.ts";

/** For future browser auth usage; mutations must still have server authorization. */
export function createSupabaseBrowserClient() {
  const { url, publishableKey, cookieName } = getPublicSupabaseTarget();
  return createBrowserClient(url, publishableKey, {
    cookieOptions: { name: cookieName },
  });
}
