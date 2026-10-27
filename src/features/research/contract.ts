import { z } from "zod";
export const writingMode = z.enum(["blank", "guided", "assisted"]);
export const reasoningMode = z.enum(["CLARIFY", "CHALLENGE", "GAP_CHECK"]);
export const revision = z.number().int().min(1).max(2147483647);
export const authoredText = z
  .string()
  .max(100000)
  .refine(
    (v) =>
      !v.includes("\0") &&
      v.isWellFormed() &&
      new TextEncoder().encode(v).length <= 262144,
  );
export const draftTitle = z
  .string()
  .max(200)
  .refine((v) => v.trim().length > 0 && !v.includes("\0") && v.isWellFormed());
export const draftFields = z
  .object({
    title: draftTitle,
    body: authoredText,
    mode: writingMode,
    company_id: z.uuid().nullable(),
  })
  .strict();
export const draftRow = draftFields
  .extend({
    id: z.uuid(),
    user_id: z.uuid(),
    revision,
    source_capture_id: z.uuid().nullable(),
    created_at: z.iso.datetime({ offset: true }),
    updated_at: z.iso.datetime({ offset: true }),
  })
  .strict();
export const versionRow = z
  .object({
    id: z.uuid(),
    user_id: z.uuid(),
    draft_id: z.uuid(),
    thought_id: z.uuid(),
    number: revision,
    draft_revision: revision,
    title: draftTitle,
    body: authoredText,
    company_id: z.uuid().nullable(),
    message: z.string().max(500),
    created_at: z.iso.datetime({ offset: true }),
  })
  .strict();
export type Draft = z.infer<typeof draftRow>;
export type DraftFields = z.infer<typeof draftFields>;
export type ThoughtVersion = z.infer<typeof versionRow>;
export const researchPageSize = 20;
export function researchHref(
  draft?: string,
  company?: string,
  capture?: string,
  page = 0,
) {
  const q = new URLSearchParams({ view: "research" });
  if (draft && z.uuid().safeParse(draft).success) q.set("draft", draft);
  if (company && z.uuid().safeParse(company).success) q.set("company", company);
  if (capture && z.uuid().safeParse(capture).success) q.set("capture", capture);
  if (Number.isInteger(page) && page > 0 && page <= 10000)
    q.set("research_page", String(page));
  return "/foundation?" + q.toString();
}
export function researchLocation(
  search: Record<string, string | string[] | undefined>,
) {
  const id = (v: unknown) =>
    z.uuid().safeParse(v).success ? (v as string) : undefined;
  const page =
    typeof search.research_page === "string" &&
    /^\d{1,5}$/.test(search.research_page)
      ? Number(search.research_page)
      : 0;
  return {
    draft: id(search.draft),
    capture: id(search.capture),
    company: id(search.company),
    page: page <= 10000 ? page : 0,
  };
}
export const guidance = [
  "Apa pertanyaan atau tesis yang sedang diuji?",
  "Bagaimana konteks bisnisnya?",
  "Observasi dan bukti apa yang mendukungnya?",
  "Asumsi apa yang digunakan?",
  "Apa risiko, sanggahan, dan informasi yang belum diketahui?",
  "Bagaimana interpretasimu saat ini?",
];

// Bounded, linear line comparison. Preserve exact snapshots; this is a readable
// prefix/suffix change view, not a minimal-edit or semantic diff algorithm.
export function textChanges(before: string, after: string) {
  const a = before.split("\n"),
    b = after.split("\n");
  let first = 0,
    last = 0;
  while (first < a.length && first < b.length && a[first] === b[first]) first++;
  while (
    last < a.length - first &&
    last < b.length - first &&
    a[a.length - 1 - last] === b[b.length - 1 - last]
  )
    last++;
  return {
    unchanged: first,
    removed: a.slice(first, a.length - last),
    added: b.slice(first, b.length - last),
    trailing: last,
  };
}
