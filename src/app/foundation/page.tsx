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
import {
  researchReady,
  listResearchDrafts,
  getResearchDraft,
  researchHistory,
  researchSource,
  type ResearchPageState,
} from "@/server/research/service";
import { researchLocation } from "@/features/research/contract";
import { captureSchemaReady, listCaptures } from "@/server/captures/service";
import {
  parseCapturePage,
  type CaptureInboxState,
} from "@/features/captures/contract";

export const dynamic = "force-dynamic";

export default async function FoundationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase, user } = await requireAuthenticatedSession();
  const search = await searchParams;
  const location = workspaceLocation(search);
  const home = location.view === "home";
  const directory = parseDirectorySearch(home ? {} : search);
  const research = researchLocation(search);
  const researchState: ResearchPageState = {
    ready: false,
    failed: false,
    items: [],
    hasNext: false,
    page: research.page,
    selected: null,
    history: [],
    historyHasNext: false,
    source: null,
    unavailable: false,
  };
  if (location.view === "research" || home) {
    try {
      researchState.ready = await researchReady(supabase);
      if (researchState.ready) {
        if (!home && research.draft) {
          researchState.selected = await getResearchDraft(
            supabase,
            research.draft,
          );
          researchState.unavailable = !researchState.selected;
          if (researchState.selected) {
            const history = await researchHistory(supabase, research.draft);
            researchState.history = history.items;
            researchState.historyHasNext = history.hasNext;
            if (researchState.selected.source_capture_id)
              researchState.source = await researchSource(
                supabase,
                researchState.selected.source_capture_id,
              );
          }
        } else {
          Object.assign(
            researchState,
            await listResearchDrafts(
              supabase,
              home ? 0 : research.page,
              home ? undefined : research.company,
            ),
          );
          if (!home && research.capture)
            researchState.source = await researchSource(
              supabase,
              research.capture,
            );
        }
      }
    } catch {
      researchState.failed = true;
      researchState.items = [];
      researchState.selected = null;
      researchState.history = [];
      researchState.source = null;
    }
  }
  const captureState: CaptureInboxState = {
    ready: false,
    failed: false,
    items: [],
    page: home ? 0 : parseCapturePage(search.capture_page),
    hasNext: false,
  };
  if (location.view === "captures" || home) {
    try {
      captureState.ready = await captureSchemaReady(supabase);
      if (captureState.ready)
        Object.assign(
          captureState,
          await listCaptures(supabase, captureState.page),
        );
    } catch {
      captureState.ready = false;
      captureState.failed = true;
      captureState.items = [];
      captureState.hasNext = false;
    }
  }
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
    // Never render a partially confirmed projection after a later read fails.
    companies = [];
    selectedCompany = undefined;
    metadataReady = false;
    hasNext = false;
    initialTheme = "light";
  }
  return (
    <V3Workspace
      key={user.id}
      ownerId={user.id}
      captureState={captureState}
      researchState={researchState}
      researchCompany={research.company}
      companies={companies}
      selectedCompany={selectedCompany ?? null}
      location={location}
      directory={{ ...directory, hasNext, metadataReady }}
      initialTheme={initialTheme}
      failed={failed}
    />
  );
}
