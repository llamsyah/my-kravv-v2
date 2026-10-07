import { z } from "zod";

const supabaseSchema = z.object({
  url: z.url({ protocol: /^https?$/ }),
  anonKey: z.string().trim().min(1),
});

/** Read lazily: the foundation shell does not need a Supabase project. */
export function getPublicSupabaseConfig() {
  const result = supabaseSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!result.success) {
    throw new Error(
      "Set a valid NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before using Supabase.",
    );
  }

  return result.data;
}
