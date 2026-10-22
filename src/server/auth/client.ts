import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicSupabaseTarget } from "../../lib/env/public.ts";
import { verifyV3DatabaseTarget } from "./v3-target.ts";

/** Request scoped, publishable key + user JWT; never an administrative client. */
export async function createSupabaseServerClient() {
  await verifyV3DatabaseTarget();
  const cookieStore = await cookies();
  const { url, publishableKey, cookieName } = getPublicSupabaseTarget();
  return createServerClient(url, publishableKey, {
    cookieOptions: { name: cookieName },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        try {
          for (const { name, value, options } of values) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies. Proxy performs refresh first;
          // Server Actions can write login/logout cookies through this adapter.
        }
      },
    },
  });
}
