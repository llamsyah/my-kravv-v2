import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import {
  cliVersion,
  configHash,
  migrationHash,
  migrationName,
  repositoryRoot,
  localDockerHost,
  networkName,
  dbContainer,
  verifyLayout,
  workdir,
} from "./guards.ts";
import { v3ApiUrl, v3ProjectId } from "../../src/lib/env/v3.ts";

const digest = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const volumeSchema = z
  .object({
    name: z.literal(dbContainer),
    createdAt: z.iso.datetime(),
  })
  .strict();
const volumesSchema = z.array(volumeSchema).length(1);
const serviceSchema = z
  .object({
    service: z.enum(["db", "auth", "rest", "gateway", "mail"]),
    reference: z
      .string()
      .regex(/^public\.ecr\.aws\/supabase\/[a-z-]+:[a-zA-Z0-9.]+$/),
    registryDigest: digest,
    platformManifestDigest: digest,
    configDigest: digest,
  })
  .strict();
const lockSchema = z
  .object({
    schemaVersion: z.literal(1),
    platform: z.literal("linux/amd64"),
    cli: z
      .object({
        version: z.literal(cliVersion),
        upstreamCommit: z.literal("e07c7ea15b842e9bb45c79518a5f20cea84fc753"),
        executablePlatform: z.literal("win32/x64"),
        executableSha256: sha256,
      })
      .strict(),
    services: z.array(serviceSchema).length(5),
  })
  .strict()
  .refine((value) => new Set(value.services.map((s) => s.service)).size === 5);

/** Source-backed candidate service set; this is NOT publisher/volume approval. */
export function readStartupFingerprint() {
  verifyLayout();
  assertReviewedCliInputs();
  let candidate: unknown;
  try {
    candidate = JSON.parse(
      fs.readFileSync(
        path.join(import.meta.dirname, "service-lock.json"),
        "utf8",
      ),
    );
  } catch {
    throw Error("V3 service lock is unavailable; startup refused.");
  }
  const parsed = lockSchema.safeParse(candidate);
  if (!parsed.success)
    throw Error("V3 service lock is invalid; startup refused.");
  return {
    ...parsed.data,
    environment: {
      project: v3ProjectId,
      purpose: "disposable-v3-slice0",
      apiUrl: v3ApiUrl,
      workdir: "supabase/v3",
      dockerHost: localDockerHost,
      network: networkName,
    },
    configHash,
    cliInputs: {
      branch: "main",
      dotenv: "absent",
      serviceVersionOverrides: "absent",
    },
    migration: { name: migrationName, sha256: migrationHash },
    publishing: {
      requiredHostIp: "127.0.0.1",
      implementation: "unapproved-stock-cli-2.75.0",
    },
  };
}
export type StartupFingerprint = ReturnType<typeof readStartupFingerprint>;
export type VolumeProof = z.infer<typeof volumeSchema>;

/** Reject CLI side inputs that could change the effective locked service/config set. */
export function assertReviewedCliInputs(root = workdir) {
  for (const directory of [root, path.join(root, "supabase")]) {
    if (fs.readdirSync(directory).some((name) => /^\.env(?:\.|$)/.test(name)))
      throw Error("Unreviewed V3 CLI dotenv override; startup refused.");
    const cache = path.join(directory, ".temp");
    if (
      fs.existsSync(cache) &&
      fs.readdirSync(cache).some((name) => name !== "cli-latest")
    )
      throw Error("Unreviewed V3 CLI cache/version override; startup refused.");
    const branches = path.join(directory, ".branches");
    if (!fs.existsSync(branches)) continue;
    if (
      fs.readdirSync(branches).some((name) => name !== "_current_branch") ||
      (fs.existsSync(path.join(branches, "_current_branch")) &&
        fs
          .readFileSync(path.join(branches, "_current_branch"), "utf8")
          .trim() !== "main")
    )
      throw Error("Unreviewed V3 CLI branch override; startup refused.");
  }
}
const compatibilitySchema = z
  .object({
    basis: z.enum(["owner-reviewed-retained", "owner-confirmed-fresh"]),
    approvedAt: z.iso.datetime(),
    evidence: z.string().trim().min(1).max(500),
    fingerprint: z.unknown(),
    volumes: volumesSchema,
  })
  .strict();
const receiptSchema = z
  .object({
    project: z.literal(v3ProjectId),
    container: sha256,
    volumes: volumesSchema,
    compatibility: compatibilitySchema.optional(),
  })
  .strict();
export type InstanceReceipt = z.infer<typeof receiptSchema>;

export function validateInstanceReceipt(value: unknown) {
  const parsed = receiptSchema.safeParse(value);
  if (!parsed.success)
    throw Error("Invalid V3 instance identity; access refused.");
  return parsed.data;
}

export function assertRetainedCompatibility(
  value: unknown,
  fingerprint: StartupFingerprint,
  observedVolumes?: unknown,
) {
  const state = validateInstanceReceipt(value);
  if (!state.compatibility)
    throw Error(
      "Retained V3 compatibility evidence is missing; no automatic adoption or backfill permitted.",
    );
  if (!isDeepStrictEqual(state.compatibility.fingerprint, fingerprint))
    throw Error(
      "Retained V3 CLI/service/configuration fingerprint is incompatible; startup refused.",
    );
  if (
    !isDeepStrictEqual(state.compatibility.volumes, state.volumes) ||
    (observedVolumes !== undefined &&
      !isDeepStrictEqual(state.volumes, observedVolumes))
  )
    throw Error(
      "Retained V3 compatibility approval does not match the exact recorded volumes.",
    );
  return state;
}

/** No environment variable, receipt field or command flag can waive this. */
export function assertCreationPublisherReady(): void {
  // Stock 2.75.0 omits HostIP. A reviewed publisher must be wired in a later change.
  // Do not replace this interlock with a boolean approval of the stock executable.
  throw Error(
    "V3 creation-time loopback publisher is unapproved; start/reset blocked pending owner review of a reproducible CLI correction.",
  );
}

/** Called before any Docker operation, and again immediately before mutation. */
export function assertStartupAuthorization(
  action: "start" | "reset",
  parameter: string | undefined,
  receipt: unknown | undefined,
  fingerprint: StartupFingerprint,
) {
  if (action === "reset" && parameter !== "--confirm-disposable-v3")
    throw Error("Explicit --confirm-disposable-v3 required.");
  if (receipt !== undefined) {
    assertRetainedCompatibility(receipt, fingerprint);
    if (action === "start" && parameter !== undefined)
      throw Error(
        "Fresh initialization confirmation cannot authorize retained resources.",
      );
  } else if (action !== "start" || parameter !== "--confirm-fresh-v3") {
    throw Error(
      "New V3 initialization requires --confirm-fresh-v3 and absence of existing resources/receipt.",
    );
  }
  assertCreationPublisherReady();
}

export function assertCliExecutable(fingerprint: StartupFingerprint) {
  const file = path.join(
    repositoryRoot,
    "node_modules/supabase/bin/supabase.exe",
  );
  if (
    process.platform !== "win32" ||
    process.arch !== "x64" ||
    crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex") !==
      fingerprint.cli.executableSha256
  )
    throw Error("Approved local V3 CLI executable cannot be verified.");
}

/** Metadata only. No pull, container creation or database connection. */
export function assertServiceImageMetadata(
  service: StartupFingerprint["services"][number],
  value: unknown,
) {
  const parsed = z
    .object({
      Os: z.literal("linux"),
      Architecture: z.literal("amd64"),
      Descriptor: z.object({ digest }),
      RepoDigests: z.array(z.string()),
    })
    .safeParse(value);
  const repository = service.reference.slice(
    0,
    service.reference.lastIndexOf(":"),
  );
  if (
    !parsed.success ||
    parsed.data.Descriptor.digest !== service.registryDigest ||
    !parsed.data.RepoDigests.includes(`${repository}@${service.registryDigest}`)
  )
    throw Error(
      "Required V3 service image name/digest/platform is unavailable or incompatible; no automatic pull permitted.",
    );
}

/** Applies both to proposed HostConfig.PortBindings and actual published ports. */
export function assertExplicitLoopbackBindings(value: unknown) {
  const parsed = z
    .record(
      z.string(),
      z
        .array(
          z.object({
            HostIp: z.literal("127.0.0.1"),
            HostPort: z
              .string()
              .regex(/^[0-9]+$/)
              .refine((v) => Number(v) >= 1 && Number(v) <= 65535),
          }),
        )
        .nullable(),
    )
    .safeParse(value);
  if (!parsed.success)
    throw Error(
      "V3 publication requires explicit 127.0.0.1 on every host binding.",
    );
}

/** Only a positively empty, explicitly confirmed future initialization may use this. */
export function makeFreshReceipt(
  container: string,
  volumes: unknown,
  fingerprint: StartupFingerprint,
  confirmation: {
    flag: string | undefined;
    existingReceipt: boolean;
    existingResources: boolean;
  },
) {
  if (
    confirmation.flag !== "--confirm-fresh-v3" ||
    confirmation.existingReceipt ||
    confirmation.existingResources
  )
    throw Error(
      "Fresh V3 provenance cannot be created for existing or unconfirmed resources.",
    );
  return validateInstanceReceipt({
    project: v3ProjectId,
    container,
    volumes,
    compatibility: {
      basis: "owner-confirmed-fresh",
      approvedAt: new Date().toISOString(),
      evidence:
        "Explicit --confirm-fresh-v3 after verified absence of prior project resources and receipt.",
      fingerprint,
      volumes,
    },
  });
}
