"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseConfig } from "../env/public.ts";
import { v3CookieName } from "../env/v3.ts";

/** For future browser auth usage; mutations must still have server authorization. */
export function createSupabaseBrowserClient() {
  const { url, publishableKey } = getPublicSupabaseConfig();
  return createBrowserClient(url, publishableKey, {
    cookieOptions: { name: v3CookieName },
  });
}
