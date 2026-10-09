"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCompanyContext } from "../../server/companies/context.ts";
import {
  deleteOwnedRecord,
  DeleteDataError,
} from "../../server/db/data-control.ts";

export async function deleteRecordAction(
  _previous: { error: string | null },
  form: FormData,
): Promise<{ error: string | null }> {
  const { supabase, user } = await getCompanyContext();
  let companyId: string;
  let kind: "company" | "thought";
  try {
    companyId = z.uuid().parse(form.get("company_id"));
    kind = z.enum(["company", "thought"]).parse(form.get("kind"));
    const id =
      kind === "company" ? companyId : z.uuid().parse(form.get("thought_id"));
    if (kind === "thought") {
      const { data, error } = await supabase
        .from("thoughts")
        .select("id")
        .eq("id", id)
        .eq("user_id", user.id)
        .eq("company_id", companyId)
        .maybeSingle();
      if (error || !data)
        throw new DeleteDataError(
          "Pemikiran tidak tersedia di perusahaan ini.",
        );
    }
    await deleteOwnedRecord(
      supabase,
      kind,
      id,
      form.get("confirm_delete") === "yes",
      typeof form.get("company_name") === "string"
        ? String(form.get("company_name"))
        : "",
    );
  } catch (error) {
    return {
      error:
        error instanceof DeleteDataError
          ? error.message
          : "Penghapusan belum berhasil. Periksa konfirmasi dan coba lagi.",
    };
  }
  revalidatePath("/");
  revalidatePath("/companies");
  revalidatePath(`/companies/${companyId}`);
  revalidatePath(`/companies/${companyId}/thoughts`);
  revalidatePath(`/companies/${companyId}/refinements`);
  redirect(
    kind === "company"
      ? "/companies?deleted=company"
      : `/companies/${companyId}/thoughts?deleted=thought`,
  );
}
