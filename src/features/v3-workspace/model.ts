import { z } from "zod";

/** Current Slice 0 projection: never assume the richer V2 Company contract. */
export const workspaceCompanySchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  name: z.string().min(1).max(200),
});
export type WorkspaceCompany = z.infer<typeof workspaceCompanySchema>;
export type WorkspaceView = "home" | "companies" | "company" | "new" | "edit";
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
  return companies.filter((company) =>
    company.name.toLocaleLowerCase("id-ID").includes(needle),
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
