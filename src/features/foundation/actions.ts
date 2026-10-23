"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "../../server/auth/client.ts";
import {
  createFoundationCompany,
  renameFoundationCompany,
  FoundationError,
} from "../../server/foundation/service.ts";
import type { WorkspaceCompany } from "../v3-workspace/model.ts";
import {
  saveCompanyMetadata,
  saveAccountTheme,
} from "../../server/foundation/management.ts";

export async function saveFoundationCompanyAction(
  _previous: { error: string | null; company?: WorkspaceCompany },
  form: FormData,
): Promise<{ error: string | null; company?: WorkspaceCompany }> {
  let company: WorkspaceCompany;
  try {
    const client = await createSupabaseServerClient();
    // The service independently calls getUser; form.user_id is never authority.
    if (
      ["ticker", "exchange", "sector", "short_note"].some((field) =>
        form.has(field),
      )
    )
      company = await saveCompanyMetadata(
        client,
        form.has("company_id") ? form.get("company_id") : undefined,
        {
          name: form.get("name"),
          ticker: form.get("ticker"),
          exchange: form.get("exchange"),
          sector: form.get("sector"),
          short_note: form.get("short_note"),
        },
      );
    else if (form.has("company_id"))
      company = await renameFoundationCompany(
        client,
        form.get("company_id"),
        form.get("name"),
      );
    else company = await createFoundationCompany(client, form.get("name"));
  } catch (error) {
    return {
      error:
        error instanceof FoundationError
          ? error.message
          : "Lingkungan V3 belum tersedia. Coba lagi setelah terhubung.",
    };
  }
  revalidatePath("/foundation");
  return { error: null, company };
}

export async function saveFoundationThemeAction(input: unknown) {
  try {
    const theme = await saveAccountTheme(
      await createSupabaseServerClient(),
      input,
    );
    revalidatePath("/foundation");
    return { error: null, theme };
  } catch {
    return {
      error:
        "Tema di perangkat ini berubah, tetapi penyimpanan akun belum terkonfirmasi.",
    };
  }
}
