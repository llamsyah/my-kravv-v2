import type { Refinement } from "../../domain/refinement/refinement.ts";

/** Detail-only projection. Never infer the accepted version from a history page. */
export function comparisonVersion(
  target: Refinement | null,
  accepted: Refinement | null,
  suggested: Refinement | null,
) {
  if (target?.status === "SUGGESTED") return target;
  return accepted ?? suggested;
}

export function comparisonText(row: Refinement) {
  return row.status === "ACCEPTED" || row.status === "SUPERSEDED"
    ? (row.user_final_content ?? row.ai_content)
    : row.ai_content;
}

export function queueLabel(statuses: string[] | null, pending: boolean | null) {
  if (pending === true) return "Sedang diproses";
  if (pending === null) return "Status belum dapat dipastikan";
  if (statuses?.includes("SUGGESTED")) return "Ada usulan";
  if (statuses?.includes("ACCEPTED")) return "Versi diterima";
  if (statuses === null) return "Status belum dapat dipastikan";
  return statuses.length ? "Riwayat ditinjau" : "Belum dirapikan";
}
