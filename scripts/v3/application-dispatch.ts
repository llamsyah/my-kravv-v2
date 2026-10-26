import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { setTimeout as pause } from "node:timers/promises";
import {
  shutdownDiagnostic,
  refusalReason,
  safeReason,
  type StopReason,
  type DiagnosticStage,
} from "./application-diagnostics.ts";
import {
  applicationAuthority,
  applicationSourceApproved,
  applicationPinMatchesSource,
} from "./application-authority.ts";
// @ts-expect-error Node-only JavaScript lifecycle utility.
import { withOfflineBuild, offlineBuildEnvironment } from "./offline-build.mjs";
// @ts-expect-error Node-only JavaScript lifecycle utility.
import { withNextServer, listeners } from "./next-process.mjs";

const root = path.resolve(import.meta.dirname, "../..");
const source = "scripts/v3/application-authority.ts";
const pin =
  /const approvedApplicationGrantSha256: string \| null = (?:null|"[a-f0-9]{64}");/;
const dormant = "const approvedApplicationGrantSha256: string | null = null;";
/** Pure restoration check: never overwrites concurrent edits or an unresolved server. */
export function applicationRestoration(
  original: string,
  activated: string,
  current: string,
  shutdown: boolean,
) {
  if (
    !shutdown ||
    current !== activated ||
    !original.includes(dormant) ||
    activated === original ||
    activated.replace(pin, dormant).replaceAll("\r\n", "\n") !==
      original.replaceAll("\r\n", "\n")
  )
    throw Error("Source restoration refused.");
  return original;
}
function git(args: string[]) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

/** No grant, pin, target, port, command or credential override arguments. */
export async function applicationMain() {
  const startedAt = Date.now();
  if (!applicationSourceApproved()) {
    console.error(
      "APPLICATION_DIAGNOSTIC " +
        JSON.stringify(
          shutdownDiagnostic(
            "preflight-refused",
            "preflight",
            startedAt,
            Date.now(),
          ),
        ),
    );
    throw Error(
      "Application execution is blocked; separate owner authorization required.",
    );
  }
  let original: string | undefined, activated: string | undefined;
  let shutdownVerified = false,
    initialized = false,
    launchAttempted = false;
  const authority = applicationAuthority();
  let stage: DiagnosticStage = "preflight",
    cause: StopReason = "unknown";
  let hasCause = false;
  const setCause = (reason: StopReason) => {
    if (!hasCause) {
      cause = reason;
      hasCause = true;
    }
  };
  const report = (
    reason: unknown,
    where: DiagnosticStage,
    child: { childExitCode?: unknown; childSignal?: unknown } = {},
  ) => {
    const record = initialized
      ? authority.diagnostic(reason, where, child)
      : shutdownDiagnostic(reason, where, startedAt, Date.now(), child);
    console.error("APPLICATION_DIAGNOSTIC " + JSON.stringify(record));
    if (initialized) authority.noteDiagnostic(reason, where, child);
  };
  try {
    const baseline = execFileSync("git", ["show", `HEAD:${source}`], {
      cwd: root,
      encoding: "utf8",
    });
    const disk = fs.readFileSync(path.join(root, source), "utf8");
    applicationRestoration(baseline, disk, disk, true);
    if (!applicationPinMatchesSource(disk)) throw Error();
    original = baseline;
    activated = disk;
    const { g, expiry } = authority.load();
    if (
      git(["branch", "--show-current"]) !== "v3" ||
      git(["rev-parse", "HEAD"]) !== g.head ||
      expiry - Date.now() < 60000
    )
      throw Error();
    if (
      git(["diff", "--cached", "--name-only"]) ||
      git(["ls-files", "--others", "--exclude-standard"])
    )
      throw Error();
    if (git(["diff", "--name-only"]) !== source) throw Error();
    for (const runner of [
      "cloud-two-user-runner.ts",
      "company-acceptance-runner.ts",
    ])
      if (
        !fs
          .readFileSync(path.join(root, "scripts/v3", runner), "utf8")
          .includes("approvedGrantSha256: string | null = null")
      )
        throw Error();
    if (listeners().length) throw Error();
    authority.initialize();
    initialized = true;
    let failed = false;
    const abort = new AbortController();
    const deadline = setTimeout(() => {
      setCause("grant-expired");
      try {
        report("grant-expired", stage);
      } catch {
        /* Abort regardless of evidence failure. */
      }
      abort.abort("grant-expired");
    }, expiry - Date.now());
    const timer = setInterval(() => {
      authority.heartbeat().catch(() => {
        failed = true;
        const reason = authority.stopReason();
        setCause(reason === "unknown" ? "heartbeat-failure" : reason);
        try {
          report(cause, "heartbeat");
        } catch {
          /* Abort regardless. */
        }
        abort.abort(cause);
      });
    }, 1000);
    timer.unref();
    const onExternal = () => {
      setCause("external-signal");
      try {
        report("external-signal", stage);
      } catch {
        /* Abort even if evidence is unwritable. */
      }
      abort.abort("external-signal");
    };
    process.once("SIGINT", onExternal);
    process.once("SIGTERM", onExternal);
    try {
      // The build receives public configuration only and denies all Node network.
      stage = "build";
      await withOfflineBuild(
        async (directory: string) => {
          if (failed || Date.now() >= expiry) throw Error();
          if (
            git(["rev-parse", "HEAD"]) !== g.head ||
            git(["diff", "--cached", "--name-only"]) ||
            git(["diff", "--name-only"]) !== source ||
            git(["ls-files", "--others", "--exclude-standard"]) ||
            fs.readFileSync(path.join(root, source), "utf8") !== activated
          )
            throw Error();
          stage = "launch";
          const { c } = authority.load();
          await authority.fetch(
            `${g.apiOrigin}/rest/v1/rpc/v3_target_identity`,
            {
              method: "POST",
              headers: {
                apikey: c.publishableKey,
                "Content-Type": "application/json",
              },
              body: "{}",
            },
          );
          const env = {
            ...offlineBuildEnvironment(
              process.env,
              path.join(directory, "scripts/v3/application-http-guard.cjs"),
            ),
            ...authority.publicEnvironment(),
            USERPROFILE: process.env.USERPROFILE,
          };
          await withNextServer(
            directory,
            env,
            async (child: {
              pid: number;
              exitCode: number | null;
              signalCode: string | null;
            }) => {
              await authority.serve(child.pid);
              stage = "serving";
              console.log(
                "APPLICATION_WINDOW_READY: loopback only; owner walkthrough required; no automatic acceptance.",
              );
              while (
                Date.now() < expiry &&
                !failed &&
                !authority.isStopped() &&
                child.exitCode === null &&
                child.signalCode === null
              )
                await pause(100);
              setCause(
                Date.now() >= expiry
                  ? "grant-expired"
                  : failed
                    ? "heartbeat-failure"
                    : authority.isStopped()
                      ? authority.stopReason()
                      : child.exitCode !== null || child.signalCode !== null
                        ? "child-exit"
                        : "unknown",
              );
              report(cause, "serving", {
                childExitCode: child.exitCode,
                childSignal: child.signalCode,
              });
            },
            {
              signal: abort.signal,
              onDiagnostic: (event: {
                reason: unknown;
                stage: DiagnosticStage;
                childExitCode?: unknown;
                childSignal?: unknown;
              }) => {
                const reason = safeReason(event.reason);
                if (reason !== "owned-stop") setCause(reason);
                report(reason, event.stage, event);
              },
              onStarted: async (child: { pid: number }) => {
                launchAttempted = true;
                await authority.launched(child.pid);
              },
            },
          );
          shutdownVerified = true;
        },
        authority.publicEnvironment(),
        abort.signal,
      );
    } finally {
      clearInterval(timer);
      clearTimeout(deadline);
      process.removeListener("SIGINT", onExternal);
      process.removeListener("SIGTERM", onExternal);
    }
  } catch (error) {
    setCause(
      refusalReason(
        error,
        stage === "preflight"
          ? "preflight-refused"
          : stage === "build"
            ? "build-failed"
            : stage === "launch"
              ? "launch-failed"
              : "unknown",
      ),
    );
    try {
      report(cause, stage);
    } catch {
      console.error(
        "APPLICATION_DIAGNOSTIC " +
          JSON.stringify(
            shutdownDiagnostic(
              "evidence-persistence",
              stage,
              startedAt,
              Date.now(),
            ),
          ),
      );
    }
    throw Error(
      "Application dispatch stopped; review private evidence; no retry authorized.",
    );
  } finally {
    // Pre-launch failures have no server. Once launched, withNextServer must
    // confirm listener removal before the source pin can be restored.
    if (!initialized && !authority.replayRestorationAllowed()) {
      report("restoration-refused", "restoration");
      throw Error(
        "Existing consumed window requires owner shutdown/restoration review.",
      );
    }
    try {
      if (!launchAttempted) shutdownVerified = !listeners().length;
      else if (!shutdownVerified && !listeners().length)
        shutdownVerified = true;
    } catch {
      try {
        report("shutdown-unverified", "shutdown");
      } catch {
        /* No restoration. */
      }
      throw Error("Shutdown verification unavailable; owner review required.");
    }
    let evidenceIncomplete = false;
    if (initialized) {
      try {
        report(cause, "restoration");
      } catch {
        evidenceIncomplete = true;
      }
      try {
        await authority.close(cause);
      } catch {
        evidenceIncomplete = true;
        console.error(
          "APPLICATION_DIAGNOSTIC " +
            JSON.stringify(
              shutdownDiagnostic(
                "evidence-persistence",
                "shutdown",
                startedAt,
                Date.now(),
              ),
            ),
        );
      }
    }
    if (shutdownVerified && original && activated) {
      try {
        if (fs.readFileSync(path.join(root, source), "utf8") !== activated)
          throw Error("Concurrent source edit.");
        fs.writeFileSync(
          path.join(root, source),
          applicationRestoration(
            original,
            activated,
            fs.readFileSync(path.join(root, source), "utf8"),
            shutdownVerified,
          ),
        );
        if (git(["status", "--porcelain"]))
          throw Error("Restoration requires owner review.");
      } catch {
        try {
          report("restoration-refused", "restoration");
        } catch {
          /* Preserve the original failure. */
        }
        throw Error("Pin restoration unverified; owner review required.");
      }
      if (evidenceIncomplete)
        throw Error(
          "APPLICATION_EVIDENCE_INCOMPLETE; pin restored after verified shutdown.",
        );
    } else if (!shutdownVerified) {
      try {
        report("shutdown-unverified", "shutdown");
      } catch {
        /* No restoration without verified shutdown. */
      }
      throw Error(
        "Shutdown unresolved; owner must verify process before restoring pin.",
      );
    }
  }
}
