"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "../../server/auth/client.ts";
import {
  createFoundationCompany,
  renameFoundationCompany,
  FoundationError,
} from "../../server/foundation/service.ts";

export async function saveFoundationCompanyAction(
  _previous: { error: string | null },
  form: FormData,
): Promise<{ error: string | null }> {
  try {
    const client = await createSupabaseServerClient();
    // The service independently calls getUser; form.user_id is never authority.
    if (form.has("company_id"))
      await renameFoundationCompany(
        client,
        form.get("company_id"),
        form.get("name"),
      );
    else await createFoundationCompany(client, form.get("name"));
  } catch (error) {
    return {
      error:
        error instanceof FoundationError
          ? error.message
          : "Lingkungan V3 belum tersedia. Coba lagi setelah terhubung.",
    };
  }
  revalidatePath("/foundation");
  return { error: null };
}
