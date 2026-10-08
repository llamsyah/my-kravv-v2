import "server-only";
import { z } from "zod";
import { identifier, roleSchema, type AIContract } from "./contracts.ts";
export const roleRegistry = {
  REFINE: { tier: "LIGHT", implemented: false },
  STRUCTURE: { tier: "LIGHT", implemented: false },
  GUIDE: { tier: "STANDARD", implemented: false },
  CHALLENGE: { tier: "DEEP", implemented: false },
  COMPARE: { tier: "STANDARD", implemented: false },
  REFLECT: { tier: "DEEP", implemented: false },
} as const;
export const productContracts: readonly AIContract[] = [];
export function createContractRegistry(contracts: readonly AIContract[]) {
  const registry = new Map<string, AIContract>();
  for (const contract of contracts) {
    identifier.parse(contract.id);
    roleSchema.parse(contract.role);
    identifier.parse(contract.promptVersion);
    identifier.parse(contract.schemaVersion);
    z.string().min(1).max(8000).parse(contract.instructions);
    if (registry.has(contract.id))
      throw new Error("Duplicate server AI contract.");
    registry.set(contract.id, contract);
  }
  return registry;
}
