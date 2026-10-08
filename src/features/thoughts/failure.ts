import "server-only";
import { z } from "zod";
import type { ThoughtFormState } from "../../domain/thought/thought.ts";
import { CompanyUnavailableError } from "../../server/db/companies.ts";
import { ArchivedThoughtError } from "../../server/db/thoughts.ts";

export function thoughtFailure(
  error: unknown,
  form: FormData,
): ThoughtFormState {
  const raw = form.get("raw_content");
  const raw_content = typeof raw === "string" ? raw : undefined;
  if (error instanceof z.ZodError)
    return {
      error: "Periksa isian pemikiran.",
      fieldErrors: z.flattenError(error).fieldErrors,
      raw_content,
    };
  if (
    error instanceof CompanyUnavailableError ||
    error instanceof ArchivedThoughtError
  )
    return { error: error.message, raw_content };
  return {
    error: "Pemikiran belum tersimpan. Teks tetap di sini; silakan coba lagi.",
    raw_content,
  };
}
