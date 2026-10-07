import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loginSchema, type AuthFormState } from "../../features/auth/schema.ts";

export async function authenticatePassword(
  supabase: SupabaseClient,
  formData: FormData,
): Promise<AuthFormState> {
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!result.success) return { error: "Isi email yang valid dan kata sandi." };
  try {
    const { error } = await supabase.auth.signInWithPassword(result.data);
    if (!error) return { error: null };
    if (error.status === 429) {
      return {
        error:
          "Terlalu banyak percobaan. Tunggu sebentar sebelum mencoba lagi.",
      };
    }
    if (!error.status || error.status >= 500) {
      return {
        error: "Belum bisa masuk sekarang. Silakan coba lagi sebentar.",
      };
    }
    return { error: "Belum bisa masuk. Periksa email dan kata sandimu." };
  } catch {
    return { error: "Belum bisa terhubung. Silakan coba lagi sebentar." };
  }
}

export async function terminateSession(
  supabase: SupabaseClient,
): Promise<AuthFormState> {
  try {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    return { error: error ? "Belum bisa keluar. Silakan coba lagi." : null };
  } catch {
    return { error: "Belum bisa keluar. Periksa koneksi dan coba lagi." };
  }
}
