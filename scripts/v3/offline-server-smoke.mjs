// Real optimized Next server, dormant gate, no private files or credentials.
import fs from "node:fs";
import path from "node:path";
import { withOfflineBuild, offlineBuildEnvironment } from "./offline-build.mjs";
import { withNextServer } from "./next-process.mjs";
import { setTimeout as pause } from "node:timers/promises";

let smokeStage = "build";
export async function offlineServerSmoke() {
  const root = path.resolve(import.meta.dirname, "../..");
  if (
    process.argv.slice(2).length ||
    !fs
      .readFileSync(
        path.join(root, "scripts/v3/application-authority.ts"),
        "utf8",
      )
      .includes("const approvedApplicationGrantSha256: string | null = null;")
  )
    throw Error("Dormant source required.");
  await withOfflineBuild(async (directory) => {
    // The general build preload lives at the temporary root; this smoke-only
    // preload lives alongside it and permits exactly one loopback listener.
    const preload = path.join(directory, "offline-server-deny.cjs");
    fs.copyFileSync(
      path.join(root, "scripts/v3/offline-server-deny.cjs"),
      preload,
    );
    smokeStage = "launch";
    await withNextServer(
      directory,
      offlineBuildEnvironment(process.env, preload),
      async (child) => {
        smokeStage = "private-route";
        // Listener readiness precedes Next initialization; bounded local readiness
        // requests are not Cloud calls or a live acceptance retry.
        const until = Date.now() + 20000;
        let response;
        do {
          if (child.exitCode !== null || Date.now() >= until)
            throw Error("Closed server readiness failed.");
          try {
            response = await fetch("http://127.0.0.1:3103/auth", {
              redirect: "manual",
              signal: AbortSignal.timeout(1000),
            });
          } catch {
            await pause(100);
          }
        } while (!response);
        const text = await response.text();
        if (
          response.status !== 503 ||
          !response.headers.get("cache-control")?.includes("no-store") ||
          !text.includes("unavailable")
        )
          throw Error("Closed application guard not observed.");
        smokeStage = "static-asset";
        const chunks = path.join(directory, ".next/static");
        const asset = fs
          .readdirSync(chunks, { recursive: true })
          .find((name) => typeof name === "string" && name.endsWith(".js"));
        if (!asset) throw Error("Static asset absent.");
        const responseAsset = await fetch(
          "http://127.0.0.1:3103/_next/static/" + asset.replaceAll("\\", "/"),
          { redirect: "manual", signal: AbortSignal.timeout(3000) },
        );
        if (responseAsset.status !== 200)
          throw Error("Static Next response failed.");
        console.log(
          "OFFLINE_NEXT_SMOKE_PASS: real production server; private route 503, static asset 200; exact IPv4 listener verified.",
        );
      },
    );
    smokeStage = "network-marker";
    if (fs.existsSync(path.join(directory, "offline-network-attempt")))
      throw Error("Unexpected Node networking attempt.");
    console.log(
      "OFFLINE_NEXT_SHUTDOWN_PASS: owned listener gone; no credentials, grants or Cloud requests.",
    );
  });
}
if (path.resolve(process.argv[1] ?? "") === import.meta.filename)
  offlineServerSmoke().catch(() => {
    console.error(
      `OFFLINE_NEXT_SMOKE_FAILED: ${smokeStage}; no live execution authorized.`,
    );
    process.exitCode = 1;
  });
