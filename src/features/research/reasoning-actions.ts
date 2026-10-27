"use server";
import { createSupabaseServerClient } from "../../server/auth/client.ts";
import {
  runResearchReasoning,
  researchAIHistory,
} from "../../server/research/reasoning.ts";
import { researchOwner } from "../../server/research/service.ts";
export async function researchReasoningAction(input: unknown, owner: string) {
  try {
    return await runResearchReasoning(
      await createSupabaseServerClient(),
      input,
      owner,
    );
  } catch {
    return {
      ok: false as const,
      error: "AI belum tersedia. Dokumen tidak diubah.",
      code: "unavailable",
    };
  }
}
export async function researchAIHistoryAction(draftId: string, owner: string) {
  try {
    const client = await createSupabaseServerClient();
    await researchOwner(client, owner);
    return {
      ok: true as const,
      runs: await researchAIHistory(client, draftId),
    };
  } catch {
    return { ok: false as const, error: "Riwayat AI belum dapat dimuat." };
  }
}
