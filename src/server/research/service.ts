import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { verifiedOwner } from "../foundation/service.ts";
import {
  draftFields,
  draftRow,
  versionRow,
  revision,
  researchPageSize,
  type Draft,
  type ThoughtVersion,
} from "../../features/research/contract.ts";

type ResearchErrorCode =
  "unavailable" | "invalid" | "conflict" | "uncertain" | "account";
export class ResearchError extends Error {
  readonly code: ResearchErrorCode;
  constructor(
    code:
      | "unavailable"
      | "invalid"
      | "conflict"
      | "uncertain"
      | "account" = "unavailable",
  ) {
    super(
      {
        unavailable: "Ruang riset belum tersedia. Teks tidak diubah.",
        invalid: "Periksa judul, panjang teks, dan pilihan konteks.",
        conflict:
          "Versi server sudah berubah. Teks lokal dipertahankan; bandingkan sebelum menyimpan lagi.",
        uncertain:
          "Hasil operasi belum terkonfirmasi. Jangan membuat operasi baru; coba lagi dengan identitas yang sama.",
        account: "Akun telah berubah. Masuk kembali dengan akun yang sesuai.",
      }[code],
    );
    this.code = code;
  }
}
export async function researchOwner(client: SupabaseClient, expected?: string) {
  const owner = await verifiedOwner(client);
  if (expected !== undefined && owner !== expected)
    throw new ResearchError("account");
  return owner;
}
export async function researchReady(client: SupabaseClient) {
  await researchOwner(client);
  const { data, error } = await client.rpc("v3_research_contract");
  if (error?.code === "PGRST202") return false;
  if (error || data !== 1) throw new ResearchError();
  return true;
}
const draftColumns =
  "id,user_id,title,body,company_id,mode,revision,source_capture_id,created_at,updated_at";
const versionColumns =
  "id,user_id,draft_id,thought_id,number,draft_revision,title,body,company_id,message,created_at";
function own<T extends { user_id: string }>(
  schema: z.ZodType<T>,
  data: unknown,
  owner: string,
): T {
  const row = schema.safeParse(data);
  if (!row.success || row.data.user_id !== owner) throw new ResearchError();
  return row.data;
}
export async function getResearchDraft(client: SupabaseClient, id: unknown) {
  const owner = await researchOwner(client),
    parsed = z.uuid().safeParse(id);
  if (!parsed.success) throw new ResearchError("invalid");
  const { data, error } = await client
    .from("research_drafts")
    .select(draftColumns)
    .eq("user_id", owner)
    .eq("id", parsed.data)
    .maybeSingle();
  if (error) throw new ResearchError();
  if (!data) return null;
  const row = own(draftRow, data, owner);
  if (row.id !== parsed.data) throw new ResearchError();
  return row;
}
export async function listResearchDrafts(
  client: SupabaseClient,
  page: number,
  company?: string,
) {
  const owner = await researchOwner(client);
  if (!z.number().int().min(0).max(10000).safeParse(page).success)
    throw new ResearchError("invalid");
  let request = client
    .from("research_drafts")
    .select(draftColumns)
    .eq("user_id", owner);
  if (company) request = request.eq("company_id", z.uuid().parse(company));
  const { data, error } = await request
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false })
    .range(page * researchPageSize, page * researchPageSize + researchPageSize);
  if (error || !Array.isArray(data) || data.length > researchPageSize + 1)
    throw new ResearchError();
  const items = data.map((v) => own(draftRow, v, owner));
  if (
    new Set(items.map((v) => v.id)).size !== items.length ||
    items.some((v) => company && v.company_id !== company)
  )
    throw new ResearchError();
  const pageItems = items.slice(0, researchPageSize);
  const ids = [
    ...new Set(pageItems.flatMap((v) => (v.company_id ? [v.company_id] : []))),
  ];
  const names = new Map<string, string>();
  if (ids.length) {
    const result = await client
      .from("companies")
      .select("id,user_id,name")
      .eq("user_id", owner)
      .in("id", ids);
    if (
      result.error ||
      !Array.isArray(result.data) ||
      result.data.length > ids.length
    )
      throw new ResearchError();
    for (const value of result.data) {
      const c = z
        .object({
          id: z.uuid(),
          user_id: z.literal(owner),
          name: z.string().min(1).max(200),
        })
        .strict()
        .safeParse(value);
      if (!c.success || !ids.includes(c.data.id) || names.has(c.data.id))
        throw new ResearchError();
      names.set(c.data.id, c.data.name);
    }
    if (names.size !== ids.length) throw new ResearchError();
  }
  return {
    items: pageItems.map((v) => ({
      ...v,
      company_name: v.company_id ? names.get(v.company_id)! : null,
    })),
    hasNext: items.length > researchPageSize,
  };
}
export async function researchHistory(
  client: SupabaseClient,
  draftId: string,
  page = 0,
) {
  const owner = await researchOwner(client);
  z.uuid().parse(draftId);
  z.number().int().min(0).max(10000).parse(page);
  const { data, error } = await client
    .from("research_versions")
    .select(versionColumns)
    .eq("user_id", owner)
    .eq("draft_id", draftId)
    .order("number", { ascending: false })
    .range(page * 20, page * 20 + 20);
  if (error || !Array.isArray(data) || data.length > 21)
    throw new ResearchError();
  const rows = data.map((v) => own(versionRow, v, owner));
  if (
    rows.some((v) => v.draft_id !== draftId) ||
    new Set(rows.map((v) => v.id)).size !== rows.length ||
    rows.some((v, i) => i > 0 && rows[i - 1].number <= v.number)
  )
    throw new ResearchError();
  return { items: rows.slice(0, 20), hasNext: rows.length > 20 };
}
export async function getResearchVersion(
  client: SupabaseClient,
  id: string,
  draftId: string,
) {
  const owner = await researchOwner(client);
  z.uuid().parse(id);
  z.uuid().parse(draftId);
  const { data, error } = await client
    .from("research_versions")
    .select(versionColumns)
    .eq("user_id", owner)
    .eq("draft_id", draftId)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) throw new ResearchError();
  const v = own(versionRow, data, owner);
  if (v.id !== id || v.draft_id !== draftId) throw new ResearchError();
  return v;
}
export async function researchSource(client: SupabaseClient, id: string) {
  const owner = await researchOwner(client);
  z.uuid().parse(id);
  const { data, error } = await client
    .from("captures")
    .select("id,user_id,raw_text,company_id")
    .eq("user_id", owner)
    .eq("id", id)
    .maybeSingle();
  const row = z
    .object({
      id: z.literal(id),
      user_id: z.literal(owner),
      raw_text: z.string().max(32000),
      company_id: z.uuid().nullable(),
    })
    .strict()
    .safeParse(data);
  if (error || !row.success) throw new ResearchError();
  return row.data;
}
const mutation = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("create"),
      operation: z.uuid(),
      title: draftFields.shape.title,
      company_id: z.uuid().nullable(),
      capture_id: z.uuid().nullable(),
      mode: draftFields.shape.mode,
    })
    .strict(),
  z
    .object({
      kind: z.literal("save"),
      operation: z.uuid(),
      id: z.uuid(),
      expected: revision,
      fields: draftFields,
    })
    .strict(),
  z
    .object({
      kind: z.literal("commit"),
      operation: z.uuid(),
      id: z.uuid(),
      expected: revision,
      latest: z.number().int().min(0).max(2147483646),
      message: z
        .string()
        .max(500)
        .refine((v) => !v.includes("\0") && v.isWellFormed()),
    })
    .strict(),
  z
    .object({
      kind: z.literal("restore"),
      operation: z.uuid(),
      id: z.uuid(),
      expected: revision,
      version: z.uuid(),
    })
    .strict(),
]);
export type ResearchMutation = z.infer<typeof mutation>;
export async function mutateResearch(
  client: SupabaseClient,
  input: unknown,
  expectedOwner: string,
) {
  await researchOwner(client, expectedOwner);
  const parsed = mutation.safeParse(input);
  if (!parsed.success) throw new ResearchError("invalid");
  if (!(await researchReady(client))) throw new ResearchError();
  const m = parsed.data;
  let name: string, args: Record<string, unknown>;
  if (m.kind === "create") {
    name = "v3_create_research";
    args = {
      p_operation: m.operation,
      p_title: m.title,
      p_company: m.company_id,
      p_capture: m.capture_id,
      p_mode: m.mode,
    };
  } else if (m.kind === "save") {
    name = "v3_save_research";
    args = {
      p_operation: m.operation,
      p_draft: m.id,
      p_expected: m.expected,
      p_title: m.fields.title,
      p_body: m.fields.body,
      p_company: m.fields.company_id,
      p_mode: m.fields.mode,
    };
  } else if (m.kind === "commit") {
    name = "v3_commit_research";
    args = {
      p_operation: m.operation,
      p_draft: m.id,
      p_expected: m.expected,
      p_latest: m.latest,
      p_message: m.message,
    };
  } else {
    name = "v3_restore_research";
    args = {
      p_operation: m.operation,
      p_draft: m.id,
      p_expected: m.expected,
      p_version: m.version,
    };
  }
  const { data, error } = await client.rpc(name, args);
  if (error)
    throw new ResearchError(
      error.code === "P0001" &&
        [
          "Research revision conflict",
          "Research operation conflict",
          "Research already committed",
        ].includes(error.message)
        ? "conflict"
        : "uncertain",
    );
  const receipt = z.object({ id: z.uuid(), revision }).strict().safeParse(data);
  if (!receipt.success) throw new ResearchError("uncertain");
  if (m.kind === "commit") {
    const v = await getResearchVersion(client, receipt.data.id, m.id);
    if (
      v.number !== receipt.data.revision ||
      v.draft_revision !== m.expected ||
      v.message !== m.message
    )
      throw new ResearchError("uncertain");
    return { version: v };
  }
  const row = await getResearchDraft(client, receipt.data.id);
  if (
    !row ||
    row.revision !== receipt.data.revision ||
    (m.kind !== "create" && row.id !== m.id)
  )
    throw new ResearchError("conflict");
  if (
    m.kind === "save" &&
    Object.entries(m.fields).some(([k, v]) => row[k as keyof Draft] !== v)
  )
    throw new ResearchError("conflict");
  if (m.kind === "create" && row.source_capture_id !== m.capture_id)
    throw new ResearchError("uncertain");
  if (m.kind === "restore") {
    const v = await getResearchVersion(client, m.version, m.id);
    if (
      row.title !== v.title ||
      row.body !== v.body ||
      row.company_id !== v.company_id
    )
      throw new ResearchError("uncertain");
  }
  return { draft: row };
}
export type ResearchPageState = {
  ready: boolean;
  failed: boolean;
  items: (Draft & { company_name: string | null })[];
  hasNext: boolean;
  page: number;
  selected: Draft | null;
  history: ThoughtVersion[];
  historyHasNext: boolean;
  source: { id: string; raw_text: string; company_id: string | null } | null;
  unavailable: boolean;
};
