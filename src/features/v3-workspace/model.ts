import { z } from "zod";

/** Optional metadata is supplied only after the V3 management contract is verified. */
export const workspaceCompanySchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  name: z.string().min(1).max(200),
  ticker: z.string().max(32).nullable().optional(),
  exchange: z.string().max(80).nullable().optional(),
  sector: z.string().max(120).nullable().optional(),
  short_note: z.string().max(2000).nullable().optional(),
  created_at: z.iso.datetime({ offset: true }).optional(),
  updated_at: z.iso.datetime({ offset: true }).optional(),
});
export type WorkspaceCompany = z.infer<typeof workspaceCompanySchema>;
export type WorkspaceView =
  "home" | "companies" | "company" | "new" | "edit" | "captures" | "research";
export type WorkspaceLocation = { view: WorkspaceView; companyId?: string };

export function workspaceLocation(
  search: Record<string, string | string[] | undefined>,
): WorkspaceLocation {
  const views: WorkspaceView[] = [
    "home",
    "companies",
    "company",
    "new",
    "edit",
    "captures",
    "research",
  ];
  const view =
    typeof search.view === "string" &&
    views.includes(search.view as WorkspaceView)
      ? (search.view as WorkspaceView)
      : "home";
  if (view === "company" || view === "edit") {
    const id = z.uuid().safeParse(search.company);
    return { view, ...(id.success ? { companyId: id.data } : {}) };
  }
  return { view };
}
export function workspaceHref(view: WorkspaceView, companyId?: string) {
  const query = new URLSearchParams({ view });
  if (
    (view === "company" || view === "edit") &&
    companyId &&
    z.uuid().safeParse(companyId).success
  )
    query.set("company", companyId);
  return "/foundation?" + query.toString();
}
export function selectedWorkspaceCompany(
  companies: WorkspaceCompany[],
  location: WorkspaceLocation,
) {
  return companies.find((company) => company.id === location.companyId);
}
export function findWorkspaceCompanies(
  companies: WorkspaceCompany[],
  query: string,
) {
  const needle = query.trim().slice(0, 200).toLocaleLowerCase("id-ID");
  return companies.filter(
    (company) =>
      company.name.toLocaleLowerCase("id-ID").includes(needle) ||
      (company.ticker ?? "").toLocaleLowerCase("id-ID").includes(needle),
  );
}
export function companyInitials(name: string) {
  return name
    .trim()
    .split(/\s+/u)
    .slice(0, 2)
    .map((word) => Array.from(word)[0])
    .join("")
    .toLocaleUpperCase("id-ID");
}
