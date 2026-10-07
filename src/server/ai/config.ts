import "server-only";
import { z } from "zod";

/** Only the future server-side AI Gateway may consume this credential. */
export function getOpenAIConfig() {
  const result = z.string().trim().min(1).safeParse(process.env.OPENAI_API_KEY);
  if (!result.success) {
    throw new Error(
      "Set OPENAI_API_KEY before enabling the server-side AI Gateway.",
    );
  }
  return { apiKey: result.data };
}
