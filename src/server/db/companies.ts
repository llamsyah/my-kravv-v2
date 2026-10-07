import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  companyIdSchema,
  companyInputSchema,
  companyRowSchema,
  type Company,
} from "../../domain/company/company.ts";

const columns =
  "id,user_id,name,ticker,exchange,sector,short_note,state,archived_at,created_at,updated_at";
export class CompanyUnavailableError extends Error {
  constructor() {
    super("Perusahaan tidak tersedia.");
  }
}
export class CompanyDataError extends Error {
  constructor() {
    super("Perusahaan belum bisa dimuat atau disimpan. Silakan coba lagi.");
  }
}
function ownedRow(data: unknown, userId: string): Company {
  const result = companyRowSchema.safeParse(data);
  if (!result.success || result.data.user_id !== userId)
    throw new CompanyDataError();
  return result.data;
}
// userId is supplied only by getUser() in the server session, never a form field.
export async function getCompanies(
  client: SupabaseClient,
  userId: string,
  archived = false,
) {
  let query = client.from("companies").select(columns).eq("user_id", userId);
  query = archived
    ? query.eq("state", "ARCHIVED")
    : query.neq("state", "ARCHIVED");
  const { data, error } = await query
    .order("updated_at", { ascending: false })
    .order("id", { ascending: true });
  if (error || !data) throw new CompanyDataError();
  return data.map((row) => ownedRow(row, userId));
}
export async function getCompanyById(
  client: SupabaseClient,
  userId: string,
  id: string,
) {
  if (!companyIdSchema.safeParse(id).success) return null;
  const { data, error } = await client
    .from("companies")
    .select(columns)
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new CompanyDataError();
  return data ? ownedRow(data, userId) : null;
}
export async function createCompany(
  client: SupabaseClient,
  userId: string,
  input: unknown,
) {
  const value = companyInputSchema.parse(input);
  // Explicit allowlist ignores forged user_id, id, archive state, and timestamps.
  const { data, error } = await client
    .from("companies")
    .insert({
      user_id: userId,
      name: value.name,
      ticker: value.ticker,
      exchange: value.exchange,
      sector: value.sector,
      short_note: value.short_note,
      state: "EXPLORING",
    })
    .select(columns)
    .single();
  if (error || !data) throw new CompanyDataError();
  return ownedRow(data, userId);
}
export async function updateCompany(
  client: SupabaseClient,
  userId: string,
  id: string,
  input: unknown,
) {
  const company = await getCompanyById(client, userId, id);
  if (!company) throw new CompanyUnavailableError();
  const value = companyInputSchema.parse(input);
  if (company.state !== "ARCHIVED" && value.state === "ARCHIVED")
    throw new CompanyUnavailableError();
  const { data, error } = await client
    .from("companies")
    .update({
      name: value.name,
      ticker: value.ticker,
      exchange: value.exchange,
      sector: value.sector,
      short_note: value.short_note,
      ...(company.state === "ARCHIVED" ? {} : { state: value.state }),
    })
    .eq("user_id", userId)
    .eq("id", id)
    .eq("state", company.state)
    .select(columns)
    .maybeSingle();
  if (error) throw new CompanyDataError();
  if (!data) throw new CompanyUnavailableError();
  return ownedRow(data, userId);
}
export async function archiveCompany(
  client: SupabaseClient,
  userId: string,
  id: string,
) {
  const company = await getCompanyById(client, userId, id);
  if (!company) throw new CompanyUnavailableError();
  if (company.state === "ARCHIVED") return company;
  const { data, error } = await client
    .from("companies")
    .update({ state: "ARCHIVED" })
    .eq("user_id", userId)
    .eq("id", id)
    .select(columns)
    .maybeSingle();
  if (error) throw new CompanyDataError();
  if (!data) throw new CompanyUnavailableError();
  return ownedRow(data, userId);
}
