import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getCompanyContext } from "./context.ts";
import { getCompanyById } from "../db/companies.ts";

/** Deduplicate only this render's owned read; never persist private data across requests. */
export const getCompanyWorkspaceContext = cache(async (companyId: string) => {
  const session = await getCompanyContext();
  const company = await getCompanyById(
    session.supabase,
    session.user.id,
    companyId,
  );
  if (!company) notFound();
  return { ...session, company };
});
