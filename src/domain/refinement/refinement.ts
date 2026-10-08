import { z } from "zod";

export const refinedText = z
  .string()
  .min(1)
  .max(3000)
  .refine((text) => text.trim().length > 0 && !text.includes("\u0000"));
export const refineInput = z.strictObject({ thought_id: z.uuid() });
export const refineOutput = z.strictObject({
  schema_version: z.literal("1"),
  role: z.literal("REFINE"),
  status: z.literal("OK"),
  data: z.strictObject({
    refined_text: refinedText,
    preserved_uncertainty: z.literal(true),
    meaning_changed: z.literal(false),
  }),
  warnings: z.array(z.string().max(160)).max(3),
});
export const refinementRow = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  company_id: z.uuid(),
  thought_id: z.uuid(),
  generation_request_id: z.uuid(),
  ai_run_id: z.uuid().nullable(),
  ai_content: refinedText,
  user_final_content: refinedText.nullable(),
  status: z.enum(["SUGGESTED", "ACCEPTED", "REJECTED", "SUPERSEDED"]),
  prompt_version: z.literal("refine-v1"),
  output_schema_version: z.literal("refine-schema-v1"),
  provider: z.enum(["groq", "openai"]),
  model: z.string().max(200),
  warnings: z.array(z.string().max(160)).max(3),
  created_at: z.iso.datetime({ offset: true }),
  resolved_at: z.iso.datetime({ offset: true }).nullable(),
});
export const refinementRequestRow = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  company_id: z.uuid(),
  thought_id: z.uuid(),
  status: z.enum(["PENDING", "SUCCEEDED", "FAILED"]),
  ai_run_id: z.uuid().nullable(),
  error_code: z.string().nullable(),
  created_at: z.iso.datetime({ offset: true }),
  completed_at: z.iso.datetime({ offset: true }).nullable(),
});
export type Refinement = z.infer<typeof refinementRow>;
export type RefinementRequest = z.infer<typeof refinementRequestRow>;
export const generateRefinementInput = z.strictObject({
  company_id: z.uuid(),
  thought_id: z.uuid(),
  operation_id: z.uuid(),
});
export const resolveRefinementInput = z
  .strictObject({
    company_id: z.uuid(),
    thought_id: z.uuid(),
    refinement_id: z.uuid(),
    status: z.enum(["ACCEPTED", "REJECTED"]),
    user_final_content: refinedText.nullable(),
  })
  .refine(
    (value) => value.status !== "REJECTED" || value.user_final_content === null,
  );
export type RefineFormState = { error: string | null; finalContent?: string };
export const initialRefineFormState: RefineFormState = { error: null };
export const refinementLabels = {
  SUGGESTED: "Usulan AI · belum kamu terima",
  ACCEPTED: "Kamu terima",
  REJECTED: "Kamu tolak · asli tetap tersimpan",
  SUPERSEDED: "Versi sebelumnya · tetap tersimpan",
} as const;
