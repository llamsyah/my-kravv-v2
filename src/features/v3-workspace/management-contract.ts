import { z } from "zod";
import { companySections, type CompanySection } from "./model.ts";

const optionalLine = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .regex(/^[^\u0000-\u001f\u007f]*$/u)
    .transform((value) => value || null)
    .nullable();
export const companyMetadataInput = z
  .object({
    name: z.string().trim().min(1).max(200),
    ticker: optionalLine(32),
    exchange: optionalLine(80),
    sector: optionalLine(120),
    short_note: z
      .string()
      .trim()
      .max(2000)
      .refine((value) => !value.includes("\0"))
      .transform((value) => value || null)
      .nullable(),
  })
  .strict();
export const themeSchema = z.enum(["light", "dark"]);
export type Theme = z.infer<typeof themeSchema>;
export const directoryPageSize = 24;
export const directoryQuery = z.string().trim().max(200);
export const directoryPage = z.number().int().min(0).max(10000);
export const directorySortSchema = z.enum(["updated", "created", "name"]);
export type DirectorySort = z.infer<typeof directorySortSchema>;
export function parseDirectorySort(value: unknown): DirectorySort {
  const parsed = directorySortSchema.safeParse(value);
  return parsed.success ? parsed.data : "updated";
}
export type DirectoryState = {
  query: string;
  page: number;
  hasNext: boolean;
  metadataReady: boolean;
  sort?: DirectorySort;
};
export function parseDirectorySearch(
  search: Record<string, string | string[] | undefined>,
) {
  const query = directoryQuery.safeParse(
    typeof search.q === "string" ? search.q : "",
  );
  const page =
    typeof search.page === "string" && /^(0|[1-9]\d{0,4})$/.test(search.page)
      ? Number(search.page)
      : 0;
  return {
    query: query.success ? query.data : "",
    page: directoryPage.safeParse(page).success ? page : 0,
  };
}
export function directoryHref(
  view: string,
  query: string,
  page: number,
  companyId?: string,
  sort?: DirectorySort,
  section?: CompanySection,
  draftId?: string,
) {
  const params = new URLSearchParams({ view });
  if (companyId && z.uuid().safeParse(companyId).success)
    params.set("company", companyId);
  if (query) params.set("q", query);
  if (page) params.set("page", String(page));
  if (sort) params.set("sort", directorySortSchema.parse(sort));
  if (
    view === "company" &&
    params.has("company") &&
    section &&
    companySections.includes(section)
  )
    params.set("section", section);
  if (view === "research" && draftId && z.uuid().safeParse(draftId).success)
    params.set("draft", draftId);
  return "/foundation?" + params;
}
