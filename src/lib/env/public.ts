import { z } from "zod";
import { assertV3PublicTarget } from "./v3.ts";

const supabaseSchema = z.object({
  url: z.url({ protocol: /^https?$/ }),
  publishableKey: z.string().trim().startsWith("sb_publishable_").min(20),
});

/** Only public-safe values may be read by browser and authenticated SSR clients. */
export function getPublicSupabaseConfig() {
  const result = supabaseSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!result.success) {
    throw new Error(
      "Set a valid NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY before using Supabase.",
    );
  }

  assertV3PublicTarget(process.env.NEXT_PUBLIC_MY_KRAVV_ENV, result.data.url);
  return result.data;
}
