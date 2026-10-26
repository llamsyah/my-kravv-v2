"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "../../server/auth/client.ts";
import {
  FoundationError,
  verifiedOwner,
} from "../../server/foundation/service.ts";
import {
  companyManagementReady,
  loadCompanyDirectory,
} from "../../server/foundation/management.ts";
import { createCapture } from "../../server/captures/service.ts";

export async function saveCaptureAction(input: unknown, expectedOwner: string) {
  try {
    const client = await createSupabaseServerClient();
    // Reject an old mounted form after account change; the client value never grants authority.
    if ((await verifiedOwner(client)) !== expectedOwner)
      return { error: "Akun telah berubah. Muat ulang sebelum menyimpan." };
    const capture = await createCapture(client, input);
    revalidatePath("/foundation");
    return { error: null, capture };
  } catch (error) {
    return {
      error:
        error instanceof FoundationError
          ? error.message
          : "Penyimpanan belum terkonfirmasi. Teks tetap tersedia.",
    };
  }
}
export async function findCaptureCompaniesAction(
  query: string,
  page: number,
  expectedOwner: string,
) {
  try {
    const client = await createSupabaseServerClient();
    if ((await verifiedOwner(client)) !== expectedOwner)
      return { error: "Akun telah berubah. Muat ulang halaman." };
    const loaded = await loadCompanyDirectory(
      client,
      query,
      page,
      await companyManagementReady(client),
    );
    return {
      error: null,
      items: loaded.items.map(({ id, name, ticker }) => ({ id, name, ticker })),
      hasNext: loaded.hasNext,
    };
  } catch {
    return { error: "Perusahaan belum dapat dicari. Catatan tetap tersedia." };
  }
}
