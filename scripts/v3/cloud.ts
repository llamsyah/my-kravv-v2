import path from "node:path";
import {
  validateCloudAction,
  configuredCloudTarget,
  assertCloudExecutionReady,
} from "./cloud-guards.ts";

import { applicationMain } from "./application-dispatch.ts";

export function cloudMain(args = process.argv.slice(2)) {
  if (args.length !== 1)
    throw Error("One Cloud action is required; extra arguments refused.");
  if (args[0] === "accept-app") return applicationMain();
  validateCloudAction(args[0]);
  configuredCloudTarget(process.env);
  // Deliberately no fetch, SDK, CLI, Docker, process launch or credential lookup.
  assertCloudExecutionReady();
}

if (path.resolve(process.argv[1] ?? "") === import.meta.filename)
  try {
    await cloudMain();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Cloud operation refused.",
    );
    process.exitCode = 1;
  }
