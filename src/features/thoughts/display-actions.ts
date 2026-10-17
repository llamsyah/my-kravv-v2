"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCompanyContext } from "../../server/companies/context.ts";
import {
  setThoughtDisplay,
  ThoughtDisplayError,
} from "../../server/db/thought-display.ts";
import type { DisplayFormState } from "../../domain/thought/display.ts";

export async function saveThoughtDisplayAction(
  _state: DisplayFormState,
  form: FormData,
): Promise<DisplayFormState> {
  const { supabase, user } = await getCompanyContext();
  const target = form.get("display_version");
  let saved;
  try {
    const revision = form.get("expected_revision");
    saved = await setThoughtDisplay(supabase, user.id, {
      company_id: form.get("company_id"),
      thought_id: form.get("thought_id"),
      source: target === "ORIGINAL" ? "ORIGINAL" : "REFINEMENT",
      refinement_id: target === "ORIGINAL" ? null : target,
      expected_revision:
        typeof revision === "string" && /^\d+$/.test(revision)
          ? Number(revision)
          : undefined,
    });
  } catch (error) {
    return {
      error:
        error instanceof ThoughtDisplayError
          ? error.message
          : "Pilihan tidak valid atau belum dapat disimpan.",
      ...(typeof target === "string" ? { target } : {}),
    };
  }
  const path = `/companies/${saved.company_id}/thoughts/${saved.thought_id}/refine`;
  for (const page of [
    "/",
    `/companies/${saved.company_id}`,
    `/companies/${saved.company_id}/thoughts`,
    `/companies/${saved.company_id}/refinements`,
    path,
  ])
    revalidatePath(page);
  redirect(`${path}?displaySaved=${saved.revision}#thought-display`);
}
