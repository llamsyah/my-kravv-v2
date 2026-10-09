"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import type { RefineFormState } from "../../domain/refinement/refinement.ts";
import { getCompanyContext } from "../../server/companies/context.ts";
import {
  generateRefinement,
  reviewRefinement,
} from "../../server/refinements/service.ts";
import { RefinementError } from "../../server/db/refinements.ts";
import { AIError } from "../../server/ai/errors.ts";

function feedback(error: unknown): string {
  if (error instanceof AIError || error instanceof RefinementError)
    return error.message;
  if (error instanceof ZodError)
    return "Permintaan atau teks versi pilihan tidak valid. Asli tetap tersimpan.";
  return "Status permintaan belum dapat dipastikan. Muat ulang sebelum melanjutkan; jangan langsung mengulang.";
}
export async function generateRefinementAction(
  _previous: RefineFormState,
  form: FormData,
): Promise<RefineFormState> {
  const { supabase } = await getCompanyContext();
  let saved;
  try {
    saved = await generateRefinement(supabase, {
      company_id: form.get("company_id"),
      thought_id: form.get("thought_id"),
      operation_id: form.get("operation_id"),
    });
  } catch (error) {
    return { error: feedback(error) };
  }
  const path = `/companies/${saved.company_id}/thoughts/${saved.thought_id}/refine`;
  revalidatePath(path);
  revalidatePath(`/companies/${saved.company_id}/refinements`);
  redirect(`${path}?proposal=${saved.id}#refinement-${saved.id}`);
}
export async function reviewRefinementAction(
  _previous: RefineFormState,
  form: FormData,
): Promise<RefineFormState> {
  const { supabase } = await getCompanyContext();
  const final = form.get("user_final_content");
  let saved;
  try {
    saved = await reviewRefinement(supabase, {
      company_id: form.get("company_id"),
      thought_id: form.get("thought_id"),
      refinement_id: form.get("refinement_id"),
      status: form.get("status"),
      user_final_content: form.get("status") === "REJECTED" ? null : final,
    });
  } catch (error) {
    return {
      error: feedback(error),
      ...(typeof final === "string" ? { finalContent: final } : {}),
    };
  }
  const path = `/companies/${saved.company_id}/thoughts/${saved.thought_id}/refine`;
  revalidatePath(path);
  revalidatePath(`/companies/${saved.company_id}`);
  revalidatePath(`/companies/${saved.company_id}/refinements`);
  redirect(`${path}?resolved=${saved.id}#refinement-${saved.id}`);
}
