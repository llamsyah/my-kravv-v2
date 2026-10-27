import { z } from "zod";
import { reasoningMode } from "./contract.ts";
const text = z.string().min(1).max(1500),
  list = z.array(text).max(8);
export const reasoningOutput = z.discriminatedUnion("mode", [
  z
    .object({
      mode: z.literal("CLARIFY"),
      summary: text,
      claim: text,
      reasoning: list,
      ambiguities: list,
      assumptions: list,
      questions: list,
    })
    .strict(),
  z
    .object({
      mode: z.literal("CHALLENGE"),
      summary: text,
      counterarguments: z
        .array(
          z
            .object({ argument: text, relevance: text, evidence_to_seek: text })
            .strict(),
        )
        .max(8),
      alternatives: list,
      questions: list,
    })
    .strict(),
  z
    .object({
      mode: z.literal("GAP_CHECK"),
      summary: text,
      supported_claims: z
        .array(z.object({ claim: text, evidence_excerpt: text }).strict())
        .max(8),
      unsupported_claims: list,
      missing_information: list,
      assumptions: list,
      uncertainties: list,
      questions: list,
    })
    .strict(),
]);
export type ReasoningOutput = z.infer<typeof reasoningOutput>;
export const reasoningRequest = z
  .object({
    operation: z.uuid(),
    draftId: z.uuid(),
    revision: z.number().int().positive(),
    mode: reasoningMode,
    includeCompany: z.boolean(),
    includeCapture: z.boolean(),
    versionId: z.uuid().nullable(),
  })
  .strict();
export type ReasoningRequest = z.infer<typeof reasoningRequest>;
export const aiRunRow = z
  .object({
    id: z.uuid(),
    user_id: z.uuid(),
    draft_id: z.uuid(),
    operation_id: z.uuid(),
    source_revision: z.number().int().positive(),
    mode: reasoningMode,
    status: z.enum(["reserved", "completed", "failed", "uncertain"]),
    provider: z.enum(["openai", "groq"]),
    model: z.string().min(1).max(200),
    prompt_version: z.literal("research-v1"),
    snapshot: z
      .object({
        title: z.string(),
        body: z.string(),
        company: z.record(z.string(), z.unknown()).nullable(),
        capture: z.string().nullable(),
        version: z
          .object({
            title: z.string(),
            body: z.string(),
            number: z.number().int().positive(),
          })
          .nullable(),
      })
      .strict(),
    output: reasoningOutput.nullable(),
    error_code: z.string().nullable(),
    created_at: z.iso.datetime({ offset: true }),
  })
  .strict();
export type ResearchAIRun = z.infer<typeof aiRunRow>;
