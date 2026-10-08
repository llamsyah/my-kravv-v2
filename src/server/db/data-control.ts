import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

export class DeleteDataError extends Error {}
export async function deleteOwnedRecord(
  client: SupabaseClient,
  kind: "thought" | "company",
  id: string,
  confirmed: boolean,
  companyName = "",
) {
  const target = z.uuid().parse(id);
  if (!confirmed)
    throw new DeleteDataError("Konfirmasi penghapusan diperlukan.");
  // The client's verified JWT is the owner authority; no owner/key is supplied.
  const { data, error } = await client.rpc(
    kind === "thought" ? "delete_thought" : "delete_company",
    kind === "thought"
      ? { p_thought_id: target, p_confirmed: true }
      : {
          p_company_id: target,
          p_confirmed: true,
          p_company_name: companyName,
        },
  );
  if (error?.code === "23503")
    throw new DeleteDataError(
      "Catatan ini masih digunakan oleh data terkait dan belum dapat dihapus.",
    );
  if (error?.code === "22023")
    throw new DeleteDataError(
      "Periksa konfirmasi. Jika ada pemikiran, ketik nama perusahaan persis seperti judulnya.",
    );
  if (error || data !== target)
    throw new DeleteDataError(
      "Catatan tidak tersedia atau belum dapat dihapus. Silakan muat ulang dan coba lagi.",
    );
}
