import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { setTimeout as pause } from "node:timers/promises";
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
  if (!applicationSourceApproved())
    throw Error(
      "Application execution is blocked; separate owner authorization required.",
    );
  let original: string | undefined, activated: string | undefined;
  let shutdownVerified = false,
    initialized = false,
    launchAttempted = false;
  const authority = applicationAuthority();
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
    const deadline = setTimeout(() => abort.abort(), expiry - Date.now());
    const timer = setInterval(() => {
      authority.heartbeat().catch(() => {
        failed = true;
        abort.abort();
      });
    }, 1000);
    timer.unref();
    try {
      // The build receives public configuration only and denies all Node network.
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
            },
            {
              signal: abort.signal,
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
    }
  } catch {
    throw Error(
      "Application dispatch stopped; review private evidence; no retry authorized.",
    );
  } finally {
    // Pre-launch failures have no server. Once launched, withNextServer must
    // confirm listener removal before the source pin can be restored.
    if (!initialized && !authority.replayRestorationAllowed())
      throw Error(
        "Existing consumed window requires owner shutdown/restoration review.",
      );
    if (!launchAttempted) shutdownVerified = !listeners().length;
    else if (!shutdownVerified && !listeners().length) shutdownVerified = true;
    if (initialized)
      try {
        await authority.close();
      } catch {
        console.error(
          "APPLICATION_EVIDENCE_INCOMPLETE; no further requests permitted.",
        );
      }
    if (shutdownVerified && original && activated) {
      if (fs.readFileSync(path.join(root, source), "utf8") !== activated)
        throw Error(
          "Source changed during window; owner restoration required.",
        );
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
    } else if (!shutdownVerified)
      throw Error(
        "Shutdown unresolved; owner must verify process before restoring pin.",
      );
  }
}
