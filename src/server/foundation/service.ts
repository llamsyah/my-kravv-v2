import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const companyRow = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  name: z.string().min(1).max(200),
});
const nameInput = z.string().trim().min(1).max(200);
export class FoundationError extends Error {
  constructor(message = "Data belum dapat dimuat atau disimpan. Coba lagi.") {
    super(message);
  }
}

export async function verifiedOwner(client: SupabaseClient) {
  try {
    const { data, error } = await client.auth.getUser();
    const id = z.uuid().safeParse(data.user?.id);
    if (error || !id.success)
      throw new FoundationError("Silakan masuk kembali.");
    return id.data;
  } catch {
    throw new FoundationError("Silakan masuk kembali.");
  }
}
function ownedRow(data: unknown, owner: string) {
  const parsed = companyRow.safeParse(data);
  if (!parsed.success || parsed.data.user_id !== owner)
    throw new FoundationError();
  return parsed.data;
}

export async function listFoundationCompanies(client: SupabaseClient) {
  const owner = await verifiedOwner(client);
  const { data, error } = await client
    .from("companies")
    .select("id,user_id,name")
    .eq("user_id", owner)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(100);
  if (error || !Array.isArray(data)) throw new FoundationError();
  return data.map((value) => ownedRow(value, owner));
}

export async function createFoundationCompany(
  client: SupabaseClient,
  input: unknown,
) {
  const owner = await verifiedOwner(client);
  const name = nameInput.safeParse(input);
  if (!name.success)
    throw new FoundationError("Isi nama paling banyak 200 karakter.");
  const { data, error } = await client
    .from("companies")
    .insert({ user_id: owner, name: name.data })
    .select("id,user_id,name")
    .single();
  if (error) throw new FoundationError();
  return ownedRow(data, owner);
}

export async function renameFoundationCompany(
  client: SupabaseClient,
  target: unknown,
  input: unknown,
) {
  const owner = await verifiedOwner(client);
  const id = z.uuid().safeParse(target);
  const name = nameInput.safeParse(input);
  if (!id.success) throw new FoundationError("Perusahaan tidak tersedia.");
  if (!name.success)
    throw new FoundationError("Isi nama paling banyak 200 karakter.");
  const { data, error } = await client
    .from("companies")
    .update({ name: name.data })
    .eq("id", id.data)
    .eq("user_id", owner)
    .select("id,user_id,name")
    .maybeSingle();
  if (error) throw new FoundationError();
  if (!data) throw new FoundationError("Perusahaan tidak tersedia.");
  const result = ownedRow(data, owner);
  if (result.id !== id.data) throw new FoundationError();
  return result;
}
