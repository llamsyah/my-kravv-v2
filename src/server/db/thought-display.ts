import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Thought, ThoughtCursor } from "../../domain/thought/thought.ts";
import { thoughtCursorSchema } from "../../domain/thought/thought.ts";
import {
  displayInputSchema,
  displayPreferenceSchema,
  projectThoughtDisplay,
  unavailableDisplay,
} from "../../domain/thought/display.ts";
import { refinementRow } from "../../domain/refinement/refinement.ts";

export class ThoughtDisplayError extends Error {
  readonly conflict: boolean;
  constructor(conflict = false) {
    super(
      conflict
        ? "Pilihan sudah berubah. Muat ulang sebelum menyimpan."
        : "Pilihan belum dapat disimpan. Muat ulang dan periksa versi.",
    );
    this.conflict = conflict;
  }
}
/** One owned RPC, independent of refinement pagination; no cross-request cache. */
export async function projectThoughts<T extends Thought>(
  client: SupabaseClient,
  owner: string,
  thoughts: T[],
) {
  if (thoughts.length > 40 || thoughts.some((t) => t.user_id !== owner))
    throw new ThoughtDisplayError();
  if (!thoughts.length)
    return [] as (T & { display: ReturnType<typeof projectThoughtDisplay> })[];
  const ids = [...new Set(thoughts.map((t) => z.uuid().parse(t.id)))];
  const { data, error } = await client.rpc("read_thought_displays", {
    p_thought_ids: ids,
  });
  const rows = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  const valid =
    !error &&
    rows.length === ids.length &&
    new Set(rows.map((r) => r.thought_id)).size === ids.length &&
    rows.every(
      (r) => ids.includes(String(r.thought_id)) && r.user_id === owner,
    );
  return thoughts.map((thought) => ({
    ...thought,
    display: valid
      ? projectThoughtDisplay(
          thought,
          rows.find((r) => r.thought_id === thought.id),
        )
      : unavailableDisplay(thought),
  }));
}
export async function setThoughtDisplay(
  client: SupabaseClient,
  owner: string,
  input: unknown,
) {
  const v = displayInputSchema.parse(input);
  const { data, error } = await client
    .rpc("set_thought_display", {
      p_company_id: v.company_id,
      p_thought_id: v.thought_id,
      p_source: v.source,
      p_refinement_id: v.refinement_id,
      p_expected_revision: v.expected_revision,
    })
    .retry(false)
    .abortSignal(AbortSignal.timeout(15000))
    .select("*")
    .single();
  if (error || !data)
    throw new ThoughtDisplayError(
      error?.code === "PT409" && error.message === "DISPLAY_CONFLICT",
    );
  const p = displayPreferenceSchema.parse(data);
  if (
    p.user_id !== owner ||
    p.company_id !== v.company_id ||
    p.thought_id !== v.thought_id ||
    p.source !== v.source ||
    p.refinement_id !== v.refinement_id ||
    (p.revision !== v.expected_revision &&
      p.revision !== v.expected_revision + 1)
  )
    throw new ThoughtDisplayError();
  return p;
}
export async function getApprovedDisplayVersions(
  client: SupabaseClient,
  owner: string,
  company: string,
  thought: string,
  before?: ThoughtCursor,
) {
  let query = client
    .from("refinements")
    .select("*")
    .eq("user_id", owner)
    .eq("company_id", z.uuid().parse(company))
    .eq("thought_id", z.uuid().parse(thought))
    .in("status", ["ACCEPTED", "SUPERSEDED"])
    .not("resolved_at", "is", null);
  if (before) {
    const c = thoughtCursorSchema.parse(before);
    query = query.or(
      `created_at.lt.${c.created_at},and(created_at.eq.${c.created_at},id.gt.${c.id})`,
    );
  }
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(21);
  if (error || !data) throw new ThoughtDisplayError();
  const rows = z.array(refinementRow).parse(data);
  if (
    rows.some(
      (r) =>
        r.user_id !== owner ||
        r.company_id !== company ||
        r.thought_id !== thought ||
        !["ACCEPTED", "SUPERSEDED"].includes(r.status) ||
        r.resolved_at === null,
    )
  )
    throw new ThoughtDisplayError();
  return { versions: rows.slice(0, 20), hasMore: rows.length > 20 };
}
