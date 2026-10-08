import "server-only";
import OpenAI from "openai";
import { z } from "zod";
import type { AIConfig } from "./config.ts";
import type {
  AIProvider,
  ProviderRequest,
  ProviderResult,
  Usage,
} from "./contracts.ts";
import { modelIdentifier } from "./contracts.ts";
import { AIError } from "./errors.ts";

const token = z.number().int().min(0).max(1000000000);
/** Reported usage only. A missing/malformed total never becomes invented zeros. */
export function parseProviderUsage(value: unknown): Usage {
  const parsed = z.record(z.string(), z.unknown()).safeParse(value);
  if (!parsed.success) return { inputTokens: null, outputTokens: null };
  const input = token.safeParse(parsed.data.prompt_tokens);
  const output = token.safeParse(parsed.data.completion_tokens);
  const total = token.safeParse(parsed.data.total_tokens);
  if (
    parsed.data.total_tokens !== undefined &&
    (!total.success ||
      (input.success &&
        output.success &&
        total.data !== input.data + output.data))
  ) {
    return { inputTokens: null, outputTokens: null };
  }
  return {
    inputTokens: input.success ? input.data : null,
    outputTokens: output.success ? output.data : null,
  };
}
export function parseProviderResponse(value: unknown): ProviderResult {
  const raw = z.record(z.string(), z.unknown()).safeParse(value);
  const usage = parseProviderUsage(raw.success ? raw.data.usage : undefined);
  const model = modelIdentifier.safeParse(
    raw.success ? raw.data.model : undefined,
  );
  const requestId = z
    .string()
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}$/)
    .safeParse(raw.success ? (raw.data._request_id ?? raw.data.id) : undefined);
  const envelope = z
    .object({
      object: z.literal("chat.completion"),
      choices: z
        .array(
          z.object({
            index: z.literal(0),
            finish_reason: z.literal("stop"),
            message: z.object({
              role: z.literal("assistant"),
              content: z.string().max(65536),
              refusal: z.null().optional(),
              tool_calls: z.array(z.unknown()).max(0).optional(),
              function_call: z.null().optional(),
            }),
          }),
        )
        .length(1),
    })
    .safeParse(value);
  return {
    usage,
    model: model.success ? model.data : null,
    requestId: requestId.success ? requestId.data : null,
    validEnvelope: envelope.success && model.success,
    content: envelope.success ? envelope.data.choices[0].message.content : null,
  };
}
export function classifyProviderError(error: unknown): AIError {
  if (error instanceof AIError) return error;
  if (
    error instanceof OpenAI.APIConnectionTimeoutError ||
    error instanceof OpenAI.APIUserAbortError
  )
    return new AIError("PROVIDER_TIMEOUT");
  if (error instanceof OpenAI.APIError) {
    if (error.status === 429) return new AIError("PROVIDER_RATE_LIMIT");
    if (error.status === 408) return new AIError("PROVIDER_TIMEOUT");
    if (error.status && error.status >= 400 && error.status < 500)
      return new AIError("PROVIDER_REJECTED");
  }
  return new AIError("PROVIDER_UNAVAILABLE");
}
/** Only audited parameters; Groq does not support OpenAI's store/metadata fields. */
export function buildProviderBody(
  config: AIConfig,
  request: ProviderRequest,
): OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming {
  const responseFormat =
    config.format === "json_schema"
      ? {
          type: "json_schema" as const,
          json_schema: {
            name: request.schemaName,
            strict: true,
            schema: request.schema,
          },
        }
      : config.format === "json_object"
        ? { type: "json_object" as const }
        : undefined;
  return {
    model: config.model,
    messages: request.messages,
    max_completion_tokens: request.outputTokenLimit,
    stream: false,
    ...(responseFormat ? { response_format: responseFormat } : {}),
    ...(config.reasoningEffort
      ? { reasoning_effort: config.reasoningEffort }
      : {}),
    ...(config.provider === "openai" ? { store: false } : {}),
  };
}
/** No construction or network activity until an explicitly invoked gateway call. */
export function createAIProvider(
  config: AIConfig,
  fetcher?: typeof fetch,
): AIProvider {
  const sdk = new OpenAI({
    apiKey: config.apiKey,
    baseURL:
      config.provider === "groq"
        ? "https://api.groq.com/openai/v1"
        : "https://api.openai.com/v1",
    timeout: config.timeoutMs,
    maxRetries: 0,
    logLevel: "off",
    ...(fetcher ? { fetch: fetcher } : {}),
  });
  return {
    async generate(request, signal) {
      try {
        return parseProviderResponse(
          await sdk.chat.completions.create(
            buildProviderBody(config, request),
            { signal, maxRetries: 0, timeout: config.timeoutMs },
          ),
        );
      } catch (error) {
        throw classifyProviderError(error);
      }
    },
  };
}
