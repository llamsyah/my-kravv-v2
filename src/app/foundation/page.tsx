import { requireAuthenticatedSession } from "@/server/auth/session";
import {
  companyManagementReady,
  getManagedCompany,
  loadCompanyDirectory,
  readAccountTheme,
} from "@/server/foundation/management";
import type { WorkspaceCompany } from "@/features/v3-workspace/model";
import {
  parseDirectorySearch,
  type Theme,
} from "@/features/v3-workspace/management-contract";
import { V3Workspace } from "@/features/v3-workspace/workspace";
import { workspaceLocation } from "@/features/v3-workspace/model";

export const dynamic = "force-dynamic";

export default async function FoundationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase } = await requireAuthenticatedSession();
  const search = await searchParams;
  const location = workspaceLocation(search);
  const directory = parseDirectorySearch(search);
  let companies: WorkspaceCompany[] = [],
    selectedCompany: WorkspaceCompany | undefined;
  let metadataReady = false,
    hasNext = false,
    initialTheme: Theme = "light";
  let failed = false;
  try {
    metadataReady = await companyManagementReady(supabase);
    const loaded = await loadCompanyDirectory(
      supabase,
      directory.query,
      directory.page,
      metadataReady,
    );
    companies = loaded.items;
    hasNext = loaded.hasNext;
    if (location.companyId)
      selectedCompany = await getManagedCompany(
        supabase,
        location.companyId,
        metadataReady,
      );
    if (metadataReady) initialTheme = await readAccountTheme(supabase);
  } catch {
    failed = true;
  }
  return (
    <V3Workspace
      companies={companies}
      selectedCompany={selectedCompany ?? null}
      location={location}
      directory={{ ...directory, hasNext, metadataReady }}
      initialTheme={initialTheme}
      failed={failed}
    />
  );
}
