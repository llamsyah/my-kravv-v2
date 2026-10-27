import {
  draftRow,
  versionRow,
  type ThoughtVersion,
} from "../research/contract.ts";

export const companyDraftSummary = draftRow.pick({
  id: true,
  user_id: true,
  company_id: true,
  title: true,
  revision: true,
  updated_at: true,
});
export const companyVersionSummary = versionRow.pick({
  id: true,
  user_id: true,
  company_id: true,
  draft_id: true,
  thought_id: true,
  number: true,
  title: true,
  created_at: true,
});
export type CompanyResearchState = {
  ready: boolean;
  failed: boolean;
  drafts: ReturnType<typeof companyDraftSummary.parse>[];
  draftsHasNext: boolean;
  versions: ReturnType<typeof companyVersionSummary.parse>[];
  versionsHasNext: boolean;
  page: number;
  selectedVersion: ThoughtVersion | null;
};
export function emptyCompanyResearch(): CompanyResearchState {
  return {
    ready: false,
    failed: false,
    drafts: [],
    draftsHasNext: false,
    versions: [],
    versionsHasNext: false,
    page: 0,
    selectedVersion: null,
  };
}
