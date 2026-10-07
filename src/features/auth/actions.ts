"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "../../server/auth/client.ts";
import {
  authenticatePassword,
  terminateSession,
} from "../../server/auth/operations.ts";
import type { AuthFormState } from "./schema.ts";

export async function login(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const supabase = await createSupabaseServerClient();
  const state = await authenticatePassword(supabase, formData);
  if (state.error) return state;
  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout(): Promise<AuthFormState> {
  const supabase = await createSupabaseServerClient();
  const state = await terminateSession(supabase);
  if (state.error) return state;
  revalidatePath("/", "layout");
  redirect("/auth");
}
