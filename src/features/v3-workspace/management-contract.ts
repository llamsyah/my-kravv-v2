import { z } from "zod";

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
export type DirectoryState = {
  query: string;
  page: number;
  hasNext: boolean;
  metadataReady: boolean;
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
) {
  const params = new URLSearchParams({ view });
  if (companyId && z.uuid().safeParse(companyId).success)
    params.set("company", companyId);
  if (query) params.set("q", query);
  if (page) params.set("page", String(page));
  return "/foundation?" + params;
}
