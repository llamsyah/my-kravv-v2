import "server-only";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAIGateway, type GatewayDependencies } from "./gateway.ts";
import type { AIContract } from "./contracts.ts";

/** Synthetic infrastructure verification, never a Refine operation. No private
 * Company/Thought references accepted, one request maximum, no repair retry.
 * Not imported by pages, actions or route handlers; CLI use requires authorization.
 */
export const infrastructureContract: AIContract = {
  id: "infrastructure-check",
  role: "REFINE",
  promptVersion: "infra-check-v1",
  schemaVersion: "infra-check-v1",
  input: z.strictObject({ nonce: z.literal("MY_KRAVV_INFRA") }),
  output: z.strictObject({
    ok: z.literal(true),
    nonce: z.literal("MY_KRAVV_INFRA"),
  }),
  instructions:
    'For this synthetic connectivity check return {"ok":true,"nonce":"MY_KRAVV_INFRA"}. Do not perform a product AI role.',
  allowStoredContext: false,
  outputTokenLimit: 128,
  repair: false,
};
export function runInfrastructureCheck(
  client: SupabaseClient,
  dependencies: Omit<GatewayDependencies, "contracts"> = {},
) {
  return createAIGateway({
    ...dependencies,
    contracts: [infrastructureContract],
  })(client, {
    role: "REFINE",
    contract: "infrastructure-check",
    taskInput: { nonce: "MY_KRAVV_INFRA" },
  });
}
