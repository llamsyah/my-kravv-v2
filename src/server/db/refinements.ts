import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  refinementRow,
  refinementRequestRow,
  type Refinement,
  type RefinementRequest,
} from "../../domain/refinement/refinement.ts";
import { getPublicSupabaseConfig } from "../../lib/env/public.ts";
import { getSupabaseSecretKey } from "./config.ts";

const messages = {
  UNAVAILABLE: "Pemikiran atau versi ini tidak tersedia.",
  ARCHIVED:
    "Perusahaan diarsipkan. Versi sebelumnya tetap bisa dibaca dan ditinjau.",
  BUSY: "Ada permintaan untuk pemikiran ini yang statusnya belum selesai. Muat ulang untuk melihat hasil; jangan langsung mengulang.",
  CONFLICT:
    "Permintaan ini sudah digunakan. Muat ulang untuk melihat hasil yang tersimpan.",
  RESOLVED:
    "Versi ini sudah ditinjau. Muat ulang untuk melihat keputusan yang tersimpan.",
  FAILED:
    "Versi dirapikan belum dapat dimuat atau disimpan. Status permintaan belum dapat dipastikan; muat ulang sebelum melanjutkan.",
  TOO_LONG:
    "Pemikiran ini melebihi batas Refine awal (2.000 byte teks). Aslinya tetap tersimpan lengkap; pilih pemikiran yang lebih pendek.",
} as const;
export class RefinementError extends Error {
  readonly code: keyof typeof messages;
  constructor(code: keyof typeof messages) {
    super(messages[code]);
    this.code = code;
  }
}
function failure(error: unknown): RefinementError {
  const parsed = z.object({ message: z.string() }).safeParse(error);
  const codes: Record<string, keyof typeof messages> = {
    REFINEMENT_UNAVAILABLE: "UNAVAILABLE",
    REFINEMENT_ARCHIVED: "ARCHIVED",
    REFINEMENT_BUSY: "BUSY",
    REFINEMENT_OPERATION_CONFLICT: "CONFLICT",
    REFINEMENT_ALREADY_RESOLVED: "RESOLVED",
  };
  return new RefinementError(
    (parsed.success && codes[parsed.data.message]) || "FAILED",
  );
}
function owned<
  T extends { user_id: string; company_id: string; thought_id: string },
>(row: T, owner: string, company: string, thought: string) {
  if (
    row.user_id !== owner ||
    row.company_id !== company ||
    row.thought_id !== thought
  )
    throw new RefinementError("UNAVAILABLE");
  return row;
}
export async function getRefinements(
  client: SupabaseClient,
  owner: string,
  company: string,
  thought: string,
  before?: { created_at: string; id: string },
) {
  let query = client
    .from("refinements")
    .select("*")
    .eq("user_id", owner)
    .eq("company_id", z.uuid().parse(company))
    .eq("thought_id", z.uuid().parse(thought));
  if (before) {
    const cursor = z
      .object({ created_at: z.iso.datetime({ offset: true }), id: z.uuid() })
      .parse(before);
    query = query.or(
      `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.gt.${cursor.id})`,
    );
  }
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(21);
  if (error || !data) throw new RefinementError("FAILED");
  const rows = z
    .array(refinementRow)
    .parse(data)
    .map((r) => owned(r, owner, company, thought));
  return { refinements: rows.slice(0, 20), hasMore: rows.length > 20 };
}
export async function getRefinement(
  client: SupabaseClient,
  owner: string,
  company: string,
  thought: string,
  id: string,
  byRequest = false,
) {
  const { data, error } = await client
    .from("refinements")
    .select("*")
    .eq("user_id", owner)
    .eq("company_id", company)
    .eq("thought_id", thought)
    .eq(byRequest ? "generation_request_id" : "id", z.uuid().parse(id))
    .maybeSingle();
  if (error) throw new RefinementError("FAILED");
  return data
    ? owned(refinementRow.parse(data), owner, company, thought)
    : null;
}
export async function getPendingRefinement(
  client: SupabaseClient,
  owner: string,
  company: string,
  thought: string,
) {
  const { data, error } = await client
    .from("refinement_requests")
    .select("*")
    .eq("user_id", owner)
    .eq("company_id", company)
    .eq("thought_id", thought)
    .eq("status", "PENDING")
    .maybeSingle();
  if (error) throw new RefinementError("FAILED");
  return data
    ? owned(refinementRequestRow.parse(data), owner, company, thought)
    : null;
}
/** Independent of chronological pagination; the database enforces one ACCEPTED. */
export async function getActiveRefinement(
  client: SupabaseClient,
  owner: string,
  company: string,
  thought: string,
  status: "ACCEPTED" | "SUGGESTED" | "REJECTED",
) {
  const { data, error } = await client
    .from("refinements")
    .select("*")
    .eq("user_id", owner)
    .eq("company_id", z.uuid().parse(company))
    .eq("thought_id", z.uuid().parse(thought))
    .eq("status", status)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(status === "ACCEPTED" ? 2 : 1);
  if (error || !data || (status === "ACCEPTED" && data.length > 1))
    throw new RefinementError("FAILED");
  const row = data[0]
    ? owned(refinementRow.parse(data[0]), owner, company, thought)
    : null;
  if (row && row.status !== status) throw new RefinementError("FAILED");
  return row;
}

/** Three bounded batch reads. Truncated history never proves absence. */
export async function getRefinementQueue(
  client: SupabaseClient,
  owner: string,
  company: string,
  thoughts: string[],
) {
  const ids = thoughts.map((id) => z.uuid().parse(id));
  z.uuid().parse(company);
  const result = new Map<
    string,
    { statuses: string[] | null; pending: boolean | null }
  >();
  if (!ids.length) return result;
  if (ids.length > 20) throw new RefinementError("FAILED");
  const [history, accepted, pending] = await Promise.all([
    client
      .from("refinements")
      .select("thought_id,status,user_id,company_id")
      .eq("user_id", owner)
      .eq("company_id", company)
      .in("thought_id", ids)
      .order("created_at", { ascending: false })
      .limit(101),
    client
      .from("refinements")
      .select("thought_id,status,user_id,company_id")
      .eq("user_id", owner)
      .eq("company_id", company)
      .in("thought_id", ids)
      .eq("status", "ACCEPTED")
      .limit(21),
    client
      .from("refinement_requests")
      .select("thought_id,status,user_id,company_id")
      .eq("user_id", owner)
      .eq("company_id", company)
      .in("thought_id", ids)
      .eq("status", "PENDING")
      .limit(21),
  ]);
  const summary = z.array(
    z.object({
      thought_id: z.uuid(),
      user_id: z.uuid(),
      company_id: z.uuid(),
      status: z.enum([
        "ACCEPTED",
        "SUGGESTED",
        "REJECTED",
        "SUPERSEDED",
        "PENDING",
      ]),
    }),
  );
  function rows(value: typeof history, expected?: "ACCEPTED" | "PENDING") {
    if (value.error || !value.data) return null;
    const parsed = summary.safeParse(value.data);
    if (
      !parsed.success ||
      parsed.data.some(
        (r) =>
          r.user_id !== owner ||
          r.company_id !== company ||
          !ids.includes(r.thought_id) ||
          (expected ? r.status !== expected : r.status === "PENDING"),
      )
    )
      return null;
    return parsed.data;
  }
  const h = rows(history),
    a = rows(accepted, "ACCEPTED"),
    p = rows(pending, "PENDING");
  for (const id of ids) {
    const known = [...(h ?? []), ...(a ?? [])]
      .filter((r) => r.thought_id === id)
      .map((r) => r.status);
    result.set(id, {
      statuses:
        h && h.length <= 100
          ? known
          : known.some((s) => s === "SUGGESTED" || s === "ACCEPTED")
            ? known
            : null,
      pending: p && p.length <= 20 ? p.some((r) => r.thought_id === id) : null,
    });
  }
  return result;
}
export async function claimRefinement(
  client: SupabaseClient,
  owner: string,
  company: string,
  thought: string,
  operation: string,
) {
  const { data, error } = await client.rpc("claim_refinement_request", {
    p_company_id: company,
    p_thought_id: thought,
    p_operation_id: operation,
  });
  if (error) throw failure(error);
  const claim = z
    .object({ claimed: z.boolean(), request: refinementRequestRow })
    .parse(data);
  owned(claim.request, owner, company, thought);
  if (claim.request.id !== operation) throw new RefinementError("FAILED");
  return claim;
}
export async function resolveRefinement(
  client: SupabaseClient,
  owner: string,
  row: Refinement,
  status: "ACCEPTED" | "REJECTED",
  final: string | null,
) {
  const { data, error } = await client
    .rpc("resolve_refinement", {
      p_refinement_id: row.id,
      p_status: status,
      p_user_final_content: final,
    })
    .select("*")
    .single();
  if (error) throw failure(error);
  const saved = owned(
    refinementRow.parse(data),
    owner,
    row.company_id,
    row.thought_id,
  );
  if (
    saved.id !== row.id ||
    saved.ai_content !== row.ai_content ||
    saved.status !== status ||
    saved.user_final_content !== (final === row.ai_content ? null : final)
  )
    throw new RefinementError("FAILED");
  return saved;
}
export type RefinementCompletion = {
  owner: string;
  operation: string;
  runId: string | null;
  content: string | null;
  warnings: string[];
  error: string | null;
};
export type RefinementWriter = {
  complete(value: RefinementCompletion): Promise<RefinementRequest>;
};
/** Elevated client exposes one write closure; it never retrieves original content. */
export function createRefinementWriter(
  client: SupabaseClient,
): RefinementWriter {
  return {
    async complete(v) {
      const { data, error } = await client
        .rpc("complete_refinement_request", {
          p_user_id: v.owner,
          p_operation_id: v.operation,
          p_ai_run_id: v.runId,
          p_ai_content: v.content,
          p_warnings: v.warnings,
          p_error_code: v.error,
        })
        .select("*")
        .single();
      if (error) throw failure(error);
      const result = refinementRequestRow.parse(data);
      if (
        result.id !== v.operation ||
        result.user_id !== v.owner ||
        result.status !== (v.error ? "FAILED" : "SUCCEEDED")
      )
        throw new RefinementError("FAILED");
      return result;
    },
  };
}
export function getRefinementWriter(): RefinementWriter {
  const { url } = getPublicSupabaseConfig();
  return createRefinementWriter(
    createClient(url, getSupabaseSecretKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            signal: init?.signal
              ? AbortSignal.any([init.signal, AbortSignal.timeout(10000)])
              : AbortSignal.timeout(10000),
          }),
      },
    }),
  );
}
