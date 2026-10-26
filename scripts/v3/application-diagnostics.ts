// Fixed vocabulary only. Never accepts messages, URLs, request bodies or identities.
export const stopReasons = Object.freeze([
  "normal",
  "owned-stop",
  "grant-expired",
  "cloud-budget",
  "http-budget",
  "heartbeat-failure",
  "lease-invalid",
  "process-scope",
  "state-invalid",
  "request-scope",
  "request-shape",
  "request-origin",
  "login-credentials",
  "login-origin",
  "login-payload",
  "token-scope",
  "transport-or-response",
  "response-invalid",
  "request-timeout",
  "evidence-persistence",
  "lock-unavailable",
  "preflight-refused",
  "build-failed",
  "launch-failed",
  "listener-unverified",
  "external-signal",
  "child-exit",
  "shutdown-unverified",
  "restoration-refused",
  "unknown",
] as const);
export type StopReason = (typeof stopReasons)[number];
export type DiagnosticStage =
  | "preflight"
  | "build"
  | "launch"
  | "serving"
  | "http-entry"
  | "before-transmission"
  | "response"
  | "state"
  | "heartbeat"
  | "shutdown"
  | "restoration";
export class ApplicationRefusal extends Error {
  readonly reason: StopReason;
  constructor(reason: StopReason) {
    super("V3 application window refused; inspect private evidence.");
    this.reason = safeReason(reason);
  }
}
export function safeReason(reason: unknown): StopReason {
  return stopReasons.includes(reason as StopReason)
    ? (reason as StopReason)
    : "unknown";
}
export function refusalReason(
  error: unknown,
  fallback: StopReason,
): StopReason {
  return error instanceof ApplicationRefusal
    ? safeReason(error.reason)
    : fallback;
}
export function shutdownDiagnostic(
  reason: unknown,
  stage: DiagnosticStage,
  startedAt: number,
  now: number,
  child: { childExitCode?: unknown; childSignal?: unknown } = {},
) {
  const r = safeReason(reason);
  const stages: DiagnosticStage[] = [
    "preflight",
    "build",
    "launch",
    "serving",
    "http-entry",
    "before-transmission",
    "response",
    "state",
    "heartbeat",
    "shutdown",
    "restoration",
  ];
  const safeStage = stages.includes(stage) ? stage : "state";
  const at = Number.isFinite(now) ? now : Date.now();
  const start = Number.isFinite(startedAt) ? startedAt : at;
  const category = ["normal", "owned-stop"].includes(r)
    ? "normal-shutdown"
    : r === "external-signal"
      ? "external-termination"
      : r === "child-exit"
        ? "process-exit"
        : r === "unknown"
          ? "unknown"
          : "guard-refusal";
  // Construct fields explicitly: extra properties and raw errors cannot enter evidence.
  return {
    reason: r,
    category,
    stage: safeStage,
    timestamp: new Date(at).toISOString(),
    elapsedMs: Math.max(0, at - start),
    ...(Object.hasOwn(child, "childExitCode")
      ? {
          childExitCode: Number.isSafeInteger(child.childExitCode)
            ? (child.childExitCode as number)
            : null,
        }
      : {}),
    ...(Object.hasOwn(child, "childSignal")
      ? {
          childSignal:
            typeof child.childSignal === "string" &&
            [
              "SIGINT",
              "SIGTERM",
              "SIGKILL",
              "SIGABRT",
              "SIGSEGV",
              "SIGHUP",
              "SIGBREAK",
            ].includes(child.childSignal)
              ? (child.childSignal as string)
              : null,
        }
      : {}),
  };
}
