import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  thoughtInputSchema,
  thoughtRowSchema,
  thoughtCursorSchema,
  type Thought,
  type ThoughtCursor,
} from "../../domain/thought/thought.ts";
import { getCompanyById, CompanyUnavailableError } from "./companies.ts";

const columns = "id,user_id,company_id,raw_content,intent,created_at";
export class ThoughtDataError extends Error {
  constructor() {
    super("Pemikiran belum bisa dimuat atau disimpan. Silakan coba lagi.");
  }
}
export class ArchivedThoughtError extends Error {
  constructor() {
    super("Perusahaan diarsipkan. Pemikiran sebelumnya tetap dapat dibaca.");
  }
}
function ownedRow(data: unknown, userId: string, companyId?: string): Thought {
  const result = thoughtRowSchema.safeParse(data);
  if (
    !result.success ||
    result.data.user_id !== userId ||
    (companyId && result.data.company_id !== companyId)
  )
    throw new ThoughtDataError();
  return result.data;
}
// userId comes from the server-verified session. The user client retains RLS.
export async function createThought(
  client: SupabaseClient,
  userId: string,
  input: unknown,
) {
  const value = thoughtInputSchema.parse(input);
  const company = await getCompanyById(client, userId, value.company_id);
  if (!company) throw new CompanyUnavailableError();
  if (company.state === "ARCHIVED") throw new ArchivedThoughtError();
  const { data, error } = await client
    .from("thoughts")
    .insert({
      user_id: userId,
      company_id: company.id,
      raw_content: value.raw_content,
    })
    .select(columns)
    .single();
  // The database atomically appends history and independently checks archive/owner.
  if (error || !data) throw new ThoughtDataError();
  return ownedRow(data, userId, company.id);
}
export async function getCompanyThoughts(
  client: SupabaseClient,
  userId: string,
  companyId: string,
  cursor?: ThoughtCursor,
) {
  const company = await getCompanyById(client, userId, companyId);
  if (!company) throw new CompanyUnavailableError();
  let query = client
    .from("thoughts")
    .select(columns)
    .eq("user_id", userId)
    .eq("company_id", companyId);
  if (cursor) {
    const safe = thoughtCursorSchema.parse(cursor);
    query = query.or(
      `created_at.lt.${safe.created_at},and(created_at.eq.${safe.created_at},id.gt.${safe.id})`,
    );
  }
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(21);
  if (error || !data) throw new ThoughtDataError();
  const rows = data.map((row) => ownedRow(row, userId, companyId));
  return { thoughts: rows.slice(0, 20), hasMore: rows.length > 20 };
}
export async function getRecentThoughts(
  client: SupabaseClient,
  userId: string,
) {
  const { data, error } = await client
    .from("thoughts")
    .select(`${columns},company:companies(name)`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(5);
  if (error || !data) throw new ThoughtDataError();
  return data.map((row) => {
    const thought = ownedRow(row, userId);
    const company = z.object({ name: z.string() }).safeParse(row.company);
    if (!company.success) throw new ThoughtDataError();
    return { ...thought, companyName: company.data.name };
  });
}
