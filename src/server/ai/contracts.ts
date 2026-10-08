import "server-only";
import { z } from "zod";
import type { AIErrorCode, ProviderErrorCode } from "./errors.ts";

export const roles = [
  "REFINE",
  "STRUCTURE",
  "GUIDE",
  "CHALLENGE",
  "COMPARE",
  "REFLECT",
] as const;
export const roleSchema = z.enum(roles);
export type AIRole = z.infer<typeof roleSchema>;
export const identifier = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/);
export const modelIdentifier = z
  .string()
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}$/);
export const requestSchema = z.strictObject({
  role: roleSchema,
  contract: identifier,
  companyId: z.uuid().optional(),
  thoughtIds: z
    .array(z.uuid())
    .max(20)
    .default([])
    .refine((ids) => new Set(ids).size === ids.length),
  language: z.enum(["id-ID", "en-US"]).default("id-ID"),
  taskInput: z.unknown(),
});
export type AIRequest = z.infer<typeof requestSchema>;
/** Only trusted server code can register instructions or output schemas. */
export type AIContract = {
  id: string;
  role: AIRole;
  promptVersion: string;
  schemaVersion: string;
  input: z.ZodType;
  output: z.ZodType;
  instructions: string;
  allowStoredContext: boolean;
  contextMode?: "REFINE_THOUGHT";
  validateRequest?: (request: AIRequest) => boolean;
  outputTokenLimit?: number;
  repair: boolean;
  validateReferences?: (
    output: unknown,
    authorizedIds: ReadonlySet<string>,
  ) => boolean;
};
export type Usage = { inputTokens: number | null; outputTokens: number | null };
export type ProviderResult = {
  content: string | null;
  validEnvelope: boolean;
  model: string | null;
  requestId: string | null;
  usage: Usage;
};
export type ProviderRequest = {
  messages: { role: "system" | "user"; content: string }[];
  schema: Record<string, unknown>;
  schemaName: string;
  outputTokenLimit: number;
};
export type AIProvider = {
  generate(
    request: ProviderRequest,
    signal: AbortSignal,
  ): Promise<ProviderResult>;
};
export type AttemptReceipt = {
  userId: string;
  runId: string;
  attempt: number;
  model: string | null;
  requestId: string | null;
  usage: Usage;
  error: ProviderErrorCode | null;
  durationMs: number;
};
export type AIResult =
  | {
      ok: true;
      runId: string;
      role: AIRole;
      provider: "groq" | "openai";
      model: string;
      promptVersion: string;
      schemaVersion: string;
      output: unknown;
      usage: Usage;
      estimatedCostIdr: number | null;
      accountingStatus: "ESTIMATED" | "UNKNOWN";
      warnings: "UNKNOWN_USAGE"[];
    }
  | {
      ok: false;
      runId?: string;
      error: { code: AIErrorCode; message: string };
    };
