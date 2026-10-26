import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { verifiedOwner, FoundationError } from "../foundation/service.ts";
import {
  captureInput,
  captureRow,
  capturePage,
  capturePageSize,
} from "../../features/captures/contract.ts";
import type { CaptureItem } from "../../features/captures/contract.ts";

const fields = "id,user_id,request_id,raw_text,company_id,created_at";
export async function captureSchemaReady(client: SupabaseClient) {
  await verifiedOwner(client);
  const { data, error } = await client.rpc("v3_capture_contract");
  if (error?.code === "PGRST202") return false;
  if (error || data !== 1)
    throw new FoundationError("Status Penampungan belum dapat diverifikasi.");
  return true;
}
export async function createCapture(client: SupabaseClient, input: unknown) {
  const owner = await verifiedOwner(client);
  const parsed = captureInput.safeParse(input);
  if (!parsed.success)
    throw new FoundationError(
      "Periksa isi catatan dan perusahaan yang dipilih.",
    );
  if (!(await captureSchemaReady(client)))
    throw new FoundationError(
      "Penampungan menunggu pembaruan skema yang disetujui.",
    );
  const { data, error } = await client.rpc("v3_create_capture", {
    p_request_id: parsed.data.request_id,
    p_raw_text: parsed.data.raw_text,
    p_company_id: parsed.data.company_id,
  });
  if (error || !Array.isArray(data) || data.length !== 1)
    throw new FoundationError(
      "Penyimpanan belum terkonfirmasi. Teks tetap tersedia; periksa inbox atau coba ulang catatan yang sama.",
    );
  const result = captureRow.safeParse(data[0]);
  if (
    !result.success ||
    result.data.user_id !== owner ||
    Object.entries(parsed.data).some(
      ([key, value]) => result.data[key as keyof typeof result.data] !== value,
    )
  )
    throw new FoundationError(
      "Penyimpanan belum terkonfirmasi. Teks tidak dihapus.",
    );
  return result.data;
}
export async function listCaptures(client: SupabaseClient, page: unknown) {
  const owner = await verifiedOwner(client),
    p = capturePage.safeParse(page);
  if (!p.success) throw new FoundationError("Halaman Penampungan tidak valid.");
  const { data, error } = await client
    .from("captures")
    .select(fields)
    .eq("user_id", owner)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(
      p.data * capturePageSize,
      p.data * capturePageSize + capturePageSize,
    );
  if (error || !Array.isArray(data) || data.length > capturePageSize + 1)
    throw new FoundationError();
  const rows = data.map((value) => {
    const row = captureRow.safeParse(value);
    if (!row.success || row.data.user_id !== owner) throw new FoundationError();
    return row.data;
  });
  if (new Set(rows.map((row) => row.id)).size !== rows.length)
    throw new FoundationError();
  // Resolve only the selected page's associations, never all companies or a public directory.
  const ids = [
    ...new Set(
      rows
        .slice(0, capturePageSize)
        .flatMap((row) => (row.company_id ? [row.company_id] : [])),
    ),
  ];
  const names = new Map<string, string>();
  if (ids.length) {
    const result = await client
      .from("companies")
      .select("id,user_id,name")
      .eq("user_id", owner)
      .in("id", ids);
    if (result.error || !Array.isArray(result.data))
      throw new FoundationError();
    for (const value of result.data) {
      const company = z
        .object({
          id: z.uuid(),
          user_id: z.literal(owner),
          name: z.string().min(1).max(200),
        })
        .safeParse(value);
      if (
        !company.success ||
        !ids.includes(company.data.id) ||
        names.has(company.data.id)
      )
        throw new FoundationError();
      names.set(company.data.id, company.data.name);
    }
    if (names.size !== ids.length) throw new FoundationError();
  }
  const items: CaptureItem[] = rows.slice(0, capturePageSize).map((row) => ({
    ...row,
    company_name: row.company_id ? names.get(row.company_id)! : null,
  }));
  return { items, hasNext: rows.length > capturePageSize };
}
