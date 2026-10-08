import "server-only";
import type { AIConfig } from "./config.ts";
import type { Usage } from "./contracts.ts";
/** Conservative estimate, never an invoice; cached-input discounts are omitted. */
export function estimateCostIdr(
  usage: Usage,
  config: Pick<
    AIConfig,
    "inputUsdPerMillion" | "outputUsdPerMillion" | "usdToIdr"
  >,
): number | null {
  if (usage.inputTokens === null || usage.outputTokens === null) return null;
  for (const tokens of [usage.inputTokens, usage.outputTokens]) {
    if (!Number.isSafeInteger(tokens) || tokens < 0)
      throw new Error("Invalid token usage.");
  }
  const scaled = (value: number, digits: number) => {
    if (!Number.isFinite(value) || value < 0)
      throw new Error("Invalid pricing.");
    return BigInt(value.toFixed(digits).replace(".", ""));
  };
  const numerator =
    (BigInt(usage.inputTokens) * scaled(config.inputUsdPerMillion, 8) +
      BigInt(usage.outputTokens) * scaled(config.outputUsdPerMillion, 8)) *
    scaled(config.usdToIdr, 4);
  const divisor = 100000000000000n;
  return Number((numerator + divisor - 1n) / divisor) / 10000;
}
