import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  generateRefinementInput,
  resolveRefinementInput,
  refineOutput,
} from "../../domain/refinement/refinement.ts";
import { getThoughtById } from "../db/thoughts.ts";
import { getCompanyById } from "../db/companies.ts";
import { verifyAIUser } from "../ai/context.ts";
import { createAIGateway, type GatewayDependencies } from "../ai/gateway.ts";
import { refineContract } from "../ai/prompts/refine-v1.ts";
import { AIError, errorMessages, type AIErrorCode } from "../ai/errors.ts";
import {
  claimRefinement,
  getRefinement,
  resolveRefinement,
  getRefinementWriter,
  RefinementError,
  type RefinementWriter,
} from "../db/refinements.ts";

export type RefineDependencies = Omit<
  GatewayDependencies,
  "contracts" | "runId"
> & { writer?: () => RefinementWriter };
export function createRefineService(dependencies: RefineDependencies = {}) {
  return async (client: SupabaseClient, input: unknown) => {
    const owner = await verifyAIUser(client);
    const value = generateRefinementInput.parse(input);
    const company = await getCompanyById(client, owner, value.company_id);
    const thought = await getThoughtById(
      client,
      owner,
      value.company_id,
      value.thought_id,
    );
    if (!company || !thought) throw new RefinementError("UNAVAILABLE");
    if (Buffer.byteLength(thought.raw_content, "utf8") > 2000)
      throw new RefinementError("TOO_LONG");
    // An operation is durable before spending. Replays only read the previous result.
    const claim = await claimRefinement(
      client,
      owner,
      company.id,
      thought.id,
      value.operation_id,
    );
    if (!claim.claimed) {
      if (claim.request.status === "PENDING") throw new RefinementError("BUSY");
      if (claim.request.status === "FAILED") {
        const code = claim.request.error_code as AIErrorCode;
        if (Object.hasOwn(errorMessages, code)) throw new AIError(code);
        throw new RefinementError("FAILED");
      }
      const previous = await getRefinement(
        client,
        owner,
        company.id,
        thought.id,
        value.operation_id,
        true,
      );
      if (!previous) throw new RefinementError("FAILED");
      return previous;
    }
    const writer = (dependencies.writer ?? getRefinementWriter)();
    const gateway = createAIGateway({
      ...dependencies,
      contracts: [refineContract],
      runId: () => value.operation_id,
    });
    const result = await gateway(client, {
      role: "REFINE",
      contract: "refine-v1",
      companyId: company.id,
      thoughtIds: [thought.id],
      language: "id-ID",
      taskInput: { thought_id: thought.id },
    });
    if (!result.ok) {
      // Unknown logging/transport accounting state keeps the durable claim locked.
      // Never release a possibly charged budget hold or automatically re-send.
      if (result.error.code !== "DATABASE_LOGGING_FAILED") {
        await writer.complete({
          owner,
          operation: value.operation_id,
          runId: result.runId ?? null,
          content: null,
          warnings: [],
          error: result.error.code,
        });
      }
      throw new AIError(result.error.code);
    }
    const output = refineOutput.parse(result.output);
    await writer.complete({
      owner,
      operation: value.operation_id,
      runId: result.runId,
      content: output.data.refined_text,
      warnings: output.warnings,
      error: null,
    });
    const saved = await getRefinement(
      client,
      owner,
      company.id,
      thought.id,
      value.operation_id,
      true,
    );
    if (!saved) throw new RefinementError("FAILED");
    return saved;
  };
}
export const generateRefinement = createRefineService();
export async function reviewRefinement(client: SupabaseClient, input: unknown) {
  const owner = await verifyAIUser(client);
  const value = resolveRefinementInput.parse(input);
  const company = await getCompanyById(client, owner, value.company_id);
  const thought = await getThoughtById(
    client,
    owner,
    value.company_id,
    value.thought_id,
  );
  if (!company || !thought) throw new RefinementError("UNAVAILABLE");
  const row = await getRefinement(
    client,
    owner,
    company.id,
    thought.id,
    value.refinement_id,
  );
  if (!row) throw new RefinementError("UNAVAILABLE");
  return resolveRefinement(
    client,
    owner,
    row,
    value.status,
    value.user_final_content,
  );
}
