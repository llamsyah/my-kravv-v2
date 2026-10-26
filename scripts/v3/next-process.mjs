import { execFileSync, spawn } from "node:child_process";
import path from "node:path";
import { ApplicationRefusal, safeReason } from "./application-diagnostics.ts";
import { setTimeout as pause } from "node:timers/promises";

export function listeners() {
  if (process.platform !== "win32")
    throw Error("Windows listener verification required.");
  const result = execFileSync(
    path.join(
      process.env.SystemRoot,
      "System32/WindowsPowerShell/v1.0/powershell.exe",
    ),
    [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      "$ErrorActionPreference='Stop'; ConvertTo-Json -Compress -InputObject @(Get-NetTCPConnection -State Listen | Where-Object LocalPort -eq 3103 | Select-Object LocalAddress,OwningProcess)",
    ],
    {
      encoding: "utf8",
      timeout: 10000,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const rows = JSON.parse(result);
  if (!Array.isArray(rows)) throw Error("Listener evidence invalid.");
  return rows;
}
export function verifyOwnedListeners(rows, pid) {
  if (
    !Number.isSafeInteger(pid) ||
    pid <= 0 ||
    !rows.length ||
    rows.some((r) => r.LocalAddress !== "127.0.0.1" || r.OwningProcess !== pid)
  )
    throw new ApplicationRefusal("listener-unverified");
}
export function stopOwned(child) {
  if (!Number.isSafeInteger(child.pid) || child.pid <= 0)
    throw Error("Unknown child ownership.");
  if (child.exitCode !== null || child.signalCode !== null) return;
  if (process.platform === "win32")
    execFileSync(
      path.join(process.env.SystemRoot, "System32/taskkill.exe"),
      ["/PID", String(child.pid), "/T", "/F"],
      { timeout: 10000, windowsHide: true, stdio: "ignore" },
    );
  else process.kill(-child.pid, "SIGKILL");
}
/** No endpoint, port or command overrides in the production entry point. */
export async function withNextServer(
  directory,
  env,
  work,
  {
    inspect = listeners,
    start = spawn,
    stop = stopOwned,
    wait = pause,
    signal,
    onStarted = () => {},
    onDiagnostic = () => {},
  } = {},
) {
  if (signal?.aborted) throw new ApplicationRefusal(safeReason(signal.reason));
  if (inspect().length) throw new ApplicationRefusal("listener-unverified");
  const child = start(
    process.execPath,
    [
      path.join(directory, "node_modules/next/dist/bin/next"),
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3103",
    ],
    {
      cwd: directory,
      env,
      windowsHide: true,
      detached: process.platform !== "win32",
      stdio: ["ignore", "ignore", "ignore", "ipc"],
    },
  );
  let error = false,
    diagnosticFailed = false,
    stopping = false;
  const emit = (
    reason,
    stage,
    code = child.exitCode,
    sig = child.signalCode,
  ) => {
    try {
      onDiagnostic({
        reason: safeReason(reason),
        stage,
        childExitCode: code ?? null,
        childSignal: sig ?? null,
      });
    } catch {
      error = true;
      diagnosticFailed = true;
      try {
        stopping = true;
        stop(child);
      } catch {
        /* Finally verifies shutdown. */
      }
    }
  };
  child.once("error", () => {
    error = true;
    emit("launch-failed", "launch");
  });
  const onExit = (code, sig) =>
    emit(stopping ? "owned-stop" : "child-exit", "shutdown", code, sig);
  child.once("exit", onExit);
  const onSignal = () => {
    emit("external-signal", "shutdown");
    stopping = true;
    try {
      stop(child);
    } catch {
      error = true;
    }
  };
  const onAbort = () => {
    emit(safeReason(signal?.reason), "shutdown");
    stopping = true;
    try {
      stop(child);
    } catch {
      error = true;
    }
  };
  signal?.addEventListener("abort", onAbort, { once: true });
  if (signal?.aborted) onAbort();
  process.once("SIGINT", onSignal);
  process.once("SIGTERM", onSignal);
  try {
    await onStarted(child);
    let ready = false;
    const readinessDeadline = Date.now() + 20000;
    for (let i = 0; i < 100 && Date.now() < readinessDeadline; i++) {
      if (
        signal?.aborted ||
        error ||
        child.exitCode !== null ||
        child.signalCode !== null
      )
        throw new ApplicationRefusal("launch-failed");
      const rows = inspect();
      if (rows.length) {
        verifyOwnedListeners(rows, child.pid);
        ready = true;
        break;
      }
      await wait(100);
    }
    if (!ready) throw new ApplicationRefusal("launch-failed");
    return await work(child);
  } finally {
    signal?.removeEventListener("abort", onAbort);
    process.removeListener("SIGINT", onSignal);
    process.removeListener("SIGTERM", onSignal);
    try {
      stopping = true;
      stop(child);
    } catch {
      if (child.exitCode === null && child.signalCode === null)
        throw new ApplicationRefusal("shutdown-unverified");
    }
    for (let i = 0; i < 50 && inspect().length; i++) await wait(100);
    if (inspect().length) throw new ApplicationRefusal("shutdown-unverified");
    // Give queued exit events one turn; absence remains null, never an invented status.
    await wait(0);
    emit("owned-stop", "shutdown");
    child.removeListener("exit", onExit);
    if (diagnosticFailed) throw new ApplicationRefusal("evidence-persistence");
  }
}
