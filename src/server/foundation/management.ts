import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { FoundationError, verifiedOwner } from "./service.ts";
import {
  workspaceCompanySchema,
  type WorkspaceCompany,
} from "../../features/v3-workspace/model.ts";
import {
  companyMetadataInput,
  directoryPage,
  directoryPageSize,
  directoryQuery,
  themeSchema,
  directorySortSchema,
  type DirectorySort,
} from "../../features/v3-workspace/management-contract.ts";

const metadataFields = "id,user_id,name,ticker,exchange,sector,short_note";
const basicFields = "id,user_id,name";
const basicRow = workspaceCompanySchema.pick({
  id: true,
  user_id: true,
  name: true,
});
const managedRow = workspaceCompanySchema.required({
  ticker: true,
  exchange: true,
  sector: true,
  short_note: true,
});
function row(data: unknown, owner: string, ready: boolean): WorkspaceCompany {
  const parsed = (ready ? managedRow : basicRow).safeParse(data);
  if (!parsed.success || parsed.data.user_id !== owner)
    throw new FoundationError();
  return parsed.data;
}
export async function companyManagementReady(client: SupabaseClient) {
  await verifiedOwner(client);
  const { data, error } = await client.rpc("v3_company_management_contract");
  if (error?.code === "PGRST202") return false;
  if (error || data !== 1)
    throw new FoundationError(
      "Status skema perusahaan belum dapat diverifikasi.",
    );
  return true;
}
export async function loadCompanyDirectory(
  client: SupabaseClient,
  query: unknown,
  page: unknown,
  ready: boolean,
  sort?: DirectorySort,
) {
  const owner = await verifiedOwner(client);
  const q = directoryQuery.safeParse(query),
    p = directoryPage.safeParse(page);
  if (!q.success || !p.success)
    throw new FoundationError("Pencarian perusahaan tidak valid.");
  let result;
  if (sort !== undefined) {
    if (!directorySortSchema.safeParse(sort).success)
      throw new FoundationError();
    // Sort globally BEFORE range/limit. Home and workspace pickers retain the
    // original RPC path. These columns already have authenticated SELECT grants.
    const ordering = {
      updated: ["updated_at", false],
      created: ["created_at", true],
      name: ["name", true],
    } as const;
    const [column, ascending] = ordering[sort];
    let request = client
      .from("companies")
      .select((ready ? metadataFields : basicFields) + ",created_at,updated_at")
      .eq("user_id", owner)
      .order(column, { ascending })
      .order("id", { ascending: true });
    if (q.data) {
      // Literal substring, not user-supplied regex. Quote PostgREST reserved
      // characters separately; unlike ILIKE, IMATCH does not alias * to %.
      const literal = q.data.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const value =
        '"' + literal.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
      request = ready
        ? request.or(`name.imatch.${value},ticker.imatch.${value}`)
        : request.filter("name", "imatch", literal);
    }
    result = await request.range(
      p.data * directoryPageSize,
      p.data * directoryPageSize + directoryPageSize,
    );
  } else if (ready) {
    // Parameters stay separate from SQL/filter syntax. The invoker RPC preserves RLS.
    result = await client.rpc("v3_company_directory", {
      p_query: q.data,
      p_page: p.data,
    });
  } else {
    let request = client
      .from("companies")
      .select(basicFields)
      .eq("user_id", owner)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });
    if (q.data)
      request = request.ilike(
        "name",
        "%" + q.data.replace(/[\\%_]/g, "\\$&") + "%",
      );
    result = await request.range(
      p.data * directoryPageSize,
      p.data * directoryPageSize + directoryPageSize,
    );
  }
  if (
    result.error ||
    !Array.isArray(result.data) ||
    result.data.length > directoryPageSize + 1
  )
    throw new FoundationError();
  const items = result.data.map((value) => {
    const item = row(value, owner, ready);
    if (sort !== undefined) {
      const dates = workspaceCompanySchema
        .pick({ created_at: true, updated_at: true })
        .required()
        .safeParse(value);
      if (!dates.success) throw new FoundationError();
      return { ...item, ...dates.data };
    }
    return item;
  });
  if (new Set(items.map((item) => item.id)).size !== items.length)
    throw new FoundationError();
  return {
    items: items.slice(0, directoryPageSize),
    hasNext: items.length > directoryPageSize,
  };
}
export async function getManagedCompany(
  client: SupabaseClient,
  target: unknown,
  ready: boolean,
) {
  const owner = await verifiedOwner(client),
    id = z.uuid().safeParse(target);
  if (!id.success) return undefined;
  const { data, error } = await client
    .from("companies")
    .select(ready ? metadataFields : basicFields)
    .eq("user_id", owner)
    .eq("id", id.data)
    .maybeSingle();
  if (error) throw new FoundationError();
  if (!data) return undefined;
  const company = row(data, owner, ready);
  if (company.id !== id.data) throw new FoundationError();
  return company;
}
export async function saveCompanyMetadata(
  client: SupabaseClient,
  target: unknown,
  input: unknown,
) {
  const owner = await verifiedOwner(client);
  const parsed = companyMetadataInput.safeParse(input);
  const id = target === undefined ? undefined : z.uuid().safeParse(target);
  if (!parsed.success)
    throw new FoundationError("Periksa nama dan panjang metadata perusahaan.");
  if (id && !id.success)
    throw new FoundationError("Perusahaan tidak tersedia.");
  if (!(await companyManagementReady(client)))
    throw new FoundationError(
      "Metadata menunggu pembaruan skema yang disetujui.",
    );
  let request;
  if (id?.success)
    request = client
      .from("companies")
      .update(parsed.data)
      .eq("user_id", owner)
      .eq("id", id.data);
  else
    request = client
      .from("companies")
      .insert({ ...parsed.data, user_id: owner });
  const { data, error } = await request.select(metadataFields).maybeSingle();
  if (error || !data)
    throw new FoundationError("Perusahaan belum terkonfirmasi tersimpan.");
  const company = row(data, owner, true);
  if (id?.success && company.id !== id.data) throw new FoundationError();
  if (
    Object.entries(parsed.data).some(
      ([key, value]) => company[key as keyof typeof company] !== value,
    )
  )
    throw new FoundationError("Perusahaan belum terkonfirmasi tersimpan.");
  return company;
}
export async function readAccountTheme(client: SupabaseClient) {
  const owner = await verifiedOwner(client);
  const { data, error } = await client
    .from("user_settings")
    .select("user_id,theme")
    .eq("user_id", owner)
    .maybeSingle();
  if (error) throw new FoundationError();
  if (!data) return "light" as const;
  if (data.user_id !== owner || !themeSchema.safeParse(data.theme).success)
    throw new FoundationError();
  return themeSchema.parse(data.theme);
}
export async function saveAccountTheme(client: SupabaseClient, input: unknown) {
  const owner = await verifiedOwner(client),
    theme = themeSchema.safeParse(input);
  if (!theme.success || !(await companyManagementReady(client)))
    throw new FoundationError("Preferensi akun belum dapat disimpan.");
  const { data: existing, error: readError } = await client
    .from("user_settings")
    .select("user_id")
    .eq("user_id", owner)
    .maybeSingle();
  if (readError || (existing && existing.user_id !== owner))
    throw new FoundationError();
  // No upsert: UPDATE(user_id) is deliberately not granted. A concurrent insert fails safely.
  const request = existing
    ? client
        .from("user_settings")
        .update({ theme: theme.data })
        .eq("user_id", owner)
    : client
        .from("user_settings")
        .insert({ user_id: owner, theme: theme.data });
  const { data, error } = await request.select("user_id,theme").single();
  if (error || data?.user_id !== owner || data?.theme !== theme.data)
    throw new FoundationError("Preferensi akun belum terkonfirmasi tersimpan.");
  return theme.data;
}
