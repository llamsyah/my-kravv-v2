"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  readThoughtForm,
  type ThoughtFormState,
} from "../../domain/thought/thought.ts";
import { getCompanyContext } from "../../server/companies/context.ts";
import { createThought } from "../../server/db/thoughts.ts";
import { thoughtFailure } from "./failure.ts";

export async function createThoughtAction(
  _previous: ThoughtFormState,
  form: FormData,
): Promise<ThoughtFormState> {
  const { supabase, user } = await getCompanyContext();
  let saved: { id: string; company_id: string };
  try {
    z.uuid().parse(form.get("capture_operation_id"));
    saved = await createThought(supabase, user.id, readThoughtForm(form));
  } catch (error) {
    return thoughtFailure(error, form);
  }
  revalidatePath("/");
  revalidatePath(`/companies/${saved.company_id}`);
  revalidatePath(`/companies/${saved.company_id}/thoughts`);
  revalidatePath(`/companies/${saved.company_id}/refinements`);
  // Validate the returned reference before building a navigation destination.
  const id = z.uuid().parse(saved.id);
  redirect(`/companies/${saved.company_id}/thoughts?saved=${id}#thought-${id}`);
}
