"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "../../server/auth/client.ts";
import {
  mutateResearch,
  getResearchDraft,
  researchOwner,
  researchHistory,
  ResearchError,
} from "../../server/research/service.ts";
export async function researchMutationAction(input: unknown, owner: string) {
  try {
    const result = await mutateResearch(
      await createSupabaseServerClient(),
      input,
      owner,
    );
    revalidatePath("/foundation");
    return { ok: true as const, ...result };
  } catch (error) {
    return {
      ok: false as const,
      code: error instanceof ResearchError ? error.code : "unavailable",
      error:
        error instanceof ResearchError
          ? error.message
          : "Ruang riset belum tersedia. Teks lokal tidak diubah.",
    };
  }
}
export async function reloadResearchAction(id: string, owner: string) {
  try {
    const client = await createSupabaseServerClient();
    await researchOwner(client, owner);
    return { ok: true as const, draft: await getResearchDraft(client, id) };
  } catch {
    return { ok: false as const, error: "Versi server belum dapat dimuat." };
  }
}
export async function researchHistoryAction(
  id: string,
  page: number,
  owner: string,
) {
  try {
    const client = await createSupabaseServerClient();
    await researchOwner(client, owner);
    return { ok: true as const, ...(await researchHistory(client, id, page)) };
  } catch {
    return { ok: false as const, error: "Riwayat belum dapat dimuat." };
  }
}
