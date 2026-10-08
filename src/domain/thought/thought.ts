import { z } from "zod";

export const thoughtIntents = [
  "RAW_THOUGHT",
  "RESEARCH_NOTE",
  "EVIDENCE_UPDATE",
  "OPEN_QUESTION",
  "THESIS_THOUGHT",
  "DECISION_NOTE",
  "REVIEW_REFLECTION",
  "UNKNOWN_MIXED",
] as const;
export const rawContentLimit = 100_000;
export const thoughtInputSchema = z.object({
  capture_operation_id: z.uuid().optional(),
  company_id: z.uuid({ error: "Pilih perusahaan yang tersedia." }),
  raw_content: z
    .string({ error: "Tuliskan pemikiranmu." })
    .max(rawContentLimit, "Pemikiran paling banyak 100.000 karakter.")
    .refine(
      (text) => text.trim().length > 0,
      "Tuliskan pemikiranmu terlebih dahulu.",
    )
    .refine(
      (text) => !text.includes("\u0000"),
      "Teks berisi karakter yang tidak dapat disimpan.",
    ),
});
export const thoughtRowSchema = z.object({
  capture_operation_id: z.uuid().nullable().optional(),
  id: z.uuid(),
  user_id: z.uuid(),
  company_id: z.uuid(),
  raw_content: z.string(),
  intent: z.enum(thoughtIntents).nullable(),
  created_at: z.iso.datetime({ offset: true }),
});
export type Thought = z.infer<typeof thoughtRowSchema>;
export const thoughtCursorSchema = z.object({
  created_at: z.iso.datetime({ offset: true }),
  id: z.uuid(),
});
export type ThoughtCursor = z.infer<typeof thoughtCursorSchema>;
export function readThoughtCursor(value?: unknown): ThoughtCursor | undefined {
  if (typeof value !== "string" || !value) return undefined;
  const [created_at, id] = value.split("|");
  const result = thoughtCursorSchema.safeParse({ created_at, id });
  return result.success ? result.data : undefined;
}
export function thoughtCursor(thought: Thought) {
  return `${thought.created_at}|${thought.id}`;
}
export function readThoughtForm(form: FormData) {
  return {
    ...(form.has("capture_operation_id")
      ? { capture_operation_id: form.get("capture_operation_id") }
      : {}),
    company_id: form.get("company_id"),
    raw_content: form.get("raw_content"),
  };
}
export type ThoughtFormState = {
  error: string | null;
  fieldErrors?: Record<string, string[]>;
  raw_content?: string;
};
export const initialThoughtFormState: ThoughtFormState = { error: null };
