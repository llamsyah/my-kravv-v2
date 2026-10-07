import { z } from "zod";

export const companyStates = [
  "EXPLORING",
  "DEVELOPING",
  "THESIS_FORMED",
  "TRACKING",
  "REVIEWING",
  "ARCHIVED",
] as const;
export const companyStateLabels: Record<CompanyState, string> = {
  EXPLORING: "Menjelajah",
  DEVELOPING: "Berkembang",
  THESIS_FORMED: "Tesis terbentuk",
  TRACKING: "Mengikuti",
  REVIEWING: "Meninjau",
  ARCHIVED: "Diarsipkan",
};
export type CompanyState = (typeof companyStates)[number];
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Gunakan paling banyak ${max} karakter.`)
    .transform((value) => value || null);
export const companyInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Isi nama perusahaan.")
    .max(200, "Nama perusahaan paling banyak 200 karakter."),
  ticker: optionalText(40),
  exchange: optionalText(80),
  sector: optionalText(120),
  short_note: optionalText(2000),
  state: z
    .enum(companyStates, { error: "Pilih keadaan perusahaan yang tersedia." })
    .default("EXPLORING"),
});
export type CompanyInput = z.infer<typeof companyInputSchema>;
export const companyIdSchema = z.uuid();
export const companyRowSchema = z.object({
  id: companyIdSchema,
  user_id: z.uuid(),
  name: z.string(),
  ticker: z.string().nullable(),
  exchange: z.string().nullable(),
  sector: z.string().nullable(),
  short_note: z.string().nullable(),
  state: z.enum(companyStates),
  archived_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Company = z.infer<typeof companyRowSchema>;
export function readCompanyForm(form: FormData) {
  return Object.fromEntries(
    ["name", "ticker", "exchange", "sector", "short_note", "state"].map(
      (key) => [key, form.get(key) ?? (key === "state" ? "EXPLORING" : "")],
    ),
  );
}
export type CompanyFormState = {
  error: string | null;
  fieldErrors?: Record<string, string[]>;
  values?: Record<string, string>;
};
export const initialCompanyFormState: CompanyFormState = { error: null };
