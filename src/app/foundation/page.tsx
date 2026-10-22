import { requireAuthenticatedSession } from "@/server/auth/session";
import { listFoundationCompanies } from "@/server/foundation/service";
import { V3Workspace } from "@/features/v3-workspace/workspace";
import { workspaceLocation } from "@/features/v3-workspace/model";

export const dynamic = "force-dynamic";

export default async function FoundationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase } = await requireAuthenticatedSession();
  let companies: Awaited<ReturnType<typeof listFoundationCompanies>> = [];
  let failed = false;
  try {
    companies = await listFoundationCompanies(supabase);
  } catch {
    failed = true;
  }
  return (
    <V3Workspace
      companies={companies}
      location={workspaceLocation(await searchParams)}
      failed={failed}
    />
  );
}
