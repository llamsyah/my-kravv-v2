import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  researchOwner,
  researchReady,
  ResearchError,
  getResearchVersion,
} from "./service.ts";
import {
  companyDraftSummary,
  companyVersionSummary,
  emptyCompanyResearch,
} from "../../features/v3-workspace/company-research-contract.ts";

/** Bounded projections from existing owner/company indexes. No bodies, totals or writes. */
export async function loadCompanyResearch(
  client: SupabaseClient,
  company: string,
  page = 0,
  selected?: { version: string; draft: string },
) {
  const owner = await researchOwner(client);
  z.uuid().parse(company);
  z.number().int().min(0).max(10000).parse(page);
  const state = emptyCompanyResearch();
  state.page = page;
  state.ready = await researchReady(client);
  if (!state.ready) return state;
  const draftResult = await client
    .from("research_drafts")
    .select("id,user_id,company_id,title,revision,updated_at")
    .eq("user_id", owner)
    .eq("company_id", company)
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false })
    .range(0, 20);
  const versionResult = await client
    .from("research_versions")
    .select("id,user_id,company_id,draft_id,thought_id,number,title,created_at")
    .eq("user_id", owner)
    .eq("company_id", company)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(page * 20, page * 20 + 20);
  const parse = <
    T extends { id: string; user_id: string; company_id: string | null },
  >(
    result: { data: unknown; error: unknown },
    schema: z.ZodType<T>,
  ) => {
    if (result.error || !Array.isArray(result.data) || result.data.length > 21)
      throw new ResearchError();
    const rows = result.data.map((v) => {
      const parsed = schema.safeParse(v);
      if (!parsed.success) throw new ResearchError();
      return parsed.data;
    });
    if (
      rows.some((v) => v.user_id !== owner || v.company_id !== company) ||
      new Set(rows.map((v) => v.id)).size !== rows.length
    )
      throw new ResearchError();
    return rows;
  };
  const drafts = parse(draftResult, companyDraftSummary),
    versions = parse(versionResult, companyVersionSummary);
  state.drafts = drafts.slice(0, 20);
  state.draftsHasNext = drafts.length > 20;
  state.versions = versions.slice(0, 20);
  state.versionsHasNext = versions.length > 20;
  if (selected) {
    const version = await getResearchVersion(
      client,
      selected.version,
      selected.draft,
    );
    if (version.company_id !== company) throw new ResearchError();
    state.selectedVersion = version;
  }
  return state;
}
