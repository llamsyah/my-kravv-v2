/**
 * Shared application/command boundary. Target approval is not execution approval.
 * Checkpoint 1 accepts no execution grant, flag or environment override. A future
 * activation requires a separately reviewed change to this invariant.
 * Client-safe: no server imports, secrets, configuration reads or side effects.
 */
export function assertCloudExecutionReady(): never {
  throw Error(
    "Cloud execution is blocked: provisioning, bootstrap and live-operation approval are separate checkpoints.",
  );
}
