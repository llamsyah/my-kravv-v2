"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  readCompanyForm,
  type CompanyFormState,
} from "../../domain/company/company.ts";
import { getCompanyContext } from "../../server/companies/context.ts";
import {
  createCompany,
  updateCompany,
  archiveCompany,
  CompanyUnavailableError,
} from "../../server/db/companies.ts";
function failure(error: unknown, form?: FormData): CompanyFormState {
  const values = form
    ? Object.fromEntries(
        Object.entries(readCompanyForm(form))
          .filter(
            (entry): entry is [string, string] => typeof entry[1] === "string",
          )
          .map(([key, value]) => [key, value.slice(0, 4096)]),
      )
    : undefined;
  if (error instanceof z.ZodError)
    return {
      error: "Periksa isian perusahaan.",
      fieldErrors: z.flattenError(error).fieldErrors,
      values,
    };
  if (error instanceof CompanyUnavailableError)
    return { error: "Perusahaan tidak tersedia.", values };
  return {
    error: "Belum bisa menyimpan perusahaan. Silakan coba lagi.",
    values,
  };
}
export async function createCompanyAction(
  _previous: CompanyFormState,
  form: FormData,
): Promise<CompanyFormState> {
  const { supabase, user } = await getCompanyContext();
  let id: string;
  try {
    id = (await createCompany(supabase, user.id, readCompanyForm(form))).id;
  } catch (error) {
    return failure(error, form);
  }
  revalidatePath("/companies");
  redirect(`/companies/${id}`);
}
export async function updateCompanyAction(
  _previous: CompanyFormState,
  form: FormData,
): Promise<CompanyFormState> {
  const { supabase, user } = await getCompanyContext();
  const target = form.get("company_id");
  const id = typeof target === "string" ? target : "";
  try {
    await updateCompany(supabase, user.id, id, readCompanyForm(form));
  } catch (error) {
    return failure(error, form);
  }
  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
  revalidatePath(`/companies/${id}/thoughts`);
  revalidatePath(`/companies/${id}/refinements`);
  redirect(`/companies/${id}`);
}
export async function archiveCompanyAction(
  _previous: CompanyFormState,
  form: FormData,
): Promise<CompanyFormState> {
  const { supabase, user } = await getCompanyContext();
  const target = form.get("company_id");
  const id = typeof target === "string" ? target : "";
  if (form.get("confirm_archive") !== "yes")
    return { error: "Konfirmasikan pengarsipan perusahaan." };
  try {
    await archiveCompany(supabase, user.id, id);
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
  revalidatePath(`/companies/${id}/thoughts`);
  revalidatePath(`/companies/${id}/refinements`);
  redirect(`/companies/${id}`);
}
