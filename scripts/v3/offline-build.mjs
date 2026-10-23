// Production compilation verification only. Never starts a server, loads owner
// environment files, reads credentials, or grants Cloud application execution.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";

const repository = path.resolve(import.meta.dirname, "../..");
let buildStage = "input-validation";
export function offlineBuildFiles(candidates) {
  return candidates.filter((name) => {
    if (
      name.includes("\\") ||
      name.split("/").some((p) => p === "..") ||
      path.isAbsolute(name)
    )
      throw Error("Unsafe offline build input");
    if (name.split("/").some((p) => p.startsWith(".env"))) return false;
    return (
      [
        "package.json",
        "package-lock.json",
        "next.config.ts",
        "tsconfig.json",
      ].includes(name) || /^(src|scripts|supabase|public)\//.test(name)
    );
  });
}
export function offlineBuildEnvironment(source, preload) {
  const env = {
    NODE_ENV: "production",
    NEXT_TELEMETRY_DISABLED: "1",
    CI: "1",
    NODE_OPTIONS: `--require="${preload.replaceAll("\\", "/")}"`,
  };
  for (const key of ["SystemRoot", "WINDIR", "PATH", "Path", "TEMP", "TMP"])
    if (source[key]) env[key] = source[key];
  return env;
}

export async function offlineBuild() {
  if (process.argv.slice(2).length)
    throw Error("Offline build accepts no arguments");
  const candidates = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: repository, encoding: "utf8" },
  )
    .split("\0")
    .filter(Boolean);
  const files = offlineBuildFiles(candidates);
  buildStage = "temporary-source-copy";
  const output = fs.mkdtempSync(
    path.join(os.tmpdir(), "my-kravv-offline-build-"),
  );
  // Do not remove a dependency junction recursively. Remove that exact link first.
  const dependencies = path.join(output, "node_modules");
  try {
    for (const name of files) {
      const source = path.join(repository, name),
        target = path.join(output, name);
      for (let item = source; item !== repository; item = path.dirname(item))
        if (fs.lstatSync(item).isSymbolicLink())
          throw Error("Linked source input refused");
      if (!fs.lstatSync(source).isFile())
        throw Error("Non-file build input refused");
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(source, target);
    }
    buildStage = "dependency-link";
    fs.symlinkSync(
      path.join(repository, "node_modules"),
      dependencies,
      process.platform === "win32" ? "junction" : "dir",
    );
    const preload = path.join(output, "offline-network-deny.cjs");
    fs.copyFileSync(
      path.join(repository, "scripts/v3/offline-network-deny.cjs"),
      preload,
    );
    buildStage = "next-build";
    const result = await new Promise((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [path.join(dependencies, "next/dist/bin/next"), "build", "--webpack"],
        {
          cwd: output,
          env: offlineBuildEnvironment(process.env, preload),
          windowsHide: true,
          detached: process.platform !== "win32",
          stdio: ["ignore", "pipe", "pipe"],
        },
      );
      const stop = () => {
        if (!Number.isSafeInteger(child.pid) || child.pid <= 0) return;
        try {
          if (process.platform === "win32")
            execFileSync(
              path.join(process.env.SystemRoot, "System32/taskkill.exe"),
              ["/PID", String(child.pid), "/T", "/F"],
              { windowsHide: true, timeout: 10000, stdio: "ignore" },
            );
          else process.kill(-child.pid, "SIGKILL");
        } catch {
          // An already-exited child is harmless; cleanup still awaits close.
        }
      };
      const timer = setTimeout(stop, 240000);
      process.once("SIGINT", stop);
      process.once("SIGTERM", stop);
      const clear = () => {
        clearTimeout(timer);
        process.removeListener("SIGINT", stop);
        process.removeListener("SIGTERM", stop);
      };
      child.stdout.on("data", (data) => process.stdout.write(data));
      child.stderr.on("data", (data) => process.stderr.write(data));
      child.once("error", (error) => {
        clear();
        reject(error);
      });
      child.once("close", (code) => {
        clear();
        resolve(code);
      });
    });
    if (
      result !== 0 ||
      fs.existsSync(path.join(output, "offline-network-attempt"))
    )
      throw Error(
        "Isolated offline build failed; no application execution authorized",
      );
    console.log(
      "OFFLINE_PRODUCTION_BUILD_PASS: unchanged source, no credentials, no Node network attempts; artifact not deployment-ready.",
    );
  } finally {
    const resolved = path.resolve(output);
    if (
      path.dirname(resolved) !== path.resolve(os.tmpdir()) ||
      !path.basename(resolved).startsWith("my-kravv-offline-build-")
    )
      throw Error("Unsafe build cleanup target");
    if (fs.existsSync(dependencies)) fs.unlinkSync(dependencies);
    fs.rmSync(resolved, { recursive: true, force: true });
  }
}
if (path.resolve(process.argv[1] ?? "") === import.meta.filename)
  offlineBuild().catch(() => {
    console.error(
      `OFFLINE_BUILD_BLOCKED_OR_FAILED: ${buildStage}; guards remain unchanged.`,
    );
    process.exitCode = 1;
  });
