import type { Refinement } from "../../domain/refinement/refinement.ts";

const createdTick = (value: string) =>
  BigInt(Math.floor(Date.parse(value) / 1000)) * 1000000n +
  BigInt((value.match(/\.(\d+)/)?.[1] ?? "").padEnd(6, "0").slice(0, 6));
/** An explicit historical suggestion is reviewable; older suggestions remain history. */
export function comparisonVersion(
  target: Refinement | null,
  accepted: Refinement | null,
  suggested: Refinement | null,
) {
  if (target?.status === "SUGGESTED") return target;
  return suggested &&
    (!accepted ||
      createdTick(suggested.created_at) > createdTick(accepted.created_at))
    ? suggested
    : accepted;
}

/** Presentation only: unresolved review takes priority; no lifecycle is inferred. */
export function refinePresentation({
  uncertain,
  pending,
  target,
  accepted,
  suggested,
  hasHistory,
}: {
  uncertain: boolean;
  pending: boolean;
  target: Refinement | null;
  accepted: Refinement | null;
  suggested: Refinement | null;
  hasHistory: boolean;
}) {
  const candidate = comparisonVersion(target, accepted, suggested);
  const review =
    !uncertain && !pending && candidate?.status === "SUGGESTED"
      ? candidate
      : null;
  return {
    state:
      uncertain || pending
        ? "WAITING"
        : review
          ? "REVIEW"
          : hasHistory || accepted
            ? "RESOLVED"
            : "ORIGINAL",
    review,
    generation:
      uncertain || pending || review
        ? null
        : hasHistory || accepted
          ? "SECONDARY"
          : "INITIAL",
  } as const;
}

export const reviewLabels: Record<Refinement["status"], string> = {
  SUGGESTED: "Belum ditinjau",
  ACCEPTED: "Diterima",
  REJECTED: "Ditolak",
  SUPERSEDED: "Diterima sebelumnya",
};

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
