import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  // Preserve passwords exactly. Existing accounts may have older password rules.
  password: z.string().min(1).max(4096),
});

export type AuthFormState = { error: string | null };
export const initialAuthState: AuthFormState = { error: null };
