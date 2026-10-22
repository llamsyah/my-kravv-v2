import { z } from "zod";
import { resolveV3Target } from "./v3-target.ts";

const supabaseSchema = z.object({
  url: z.url({ protocol: /^https?$/ }),
  publishableKey: z.string().trim().startsWith("sb_publishable_").min(20),
});

/** Only public-safe values may be read by browser and authenticated SSR clients. */
export function getPublicSupabaseConfig() {
  const { url, publishableKey } = getPublicSupabaseTarget();
  return { url, publishableKey };
}

export function getPublicSupabaseTarget() {
  const result = supabaseSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!result.success) {
    throw new Error(
      "Set a valid NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY before using Supabase.",
    );
  }

  const target = resolveV3Target({
    profile: process.env.NEXT_PUBLIC_MY_KRAVV_ENV,
    url: result.data.url,
    cloudProjectRef: process.env.NEXT_PUBLIC_MY_KRAVV_CLOUD_PROJECT_REF,
  });
  return { ...result.data, ...target };
}
