import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { EventEmitter } from "node:events";
import { test } from "node:test";
import {
  ApplicationRefusal,
  stopReasons,
  shutdownDiagnostic,
} from "../../scripts/v3/application-diagnostics.ts";
// @ts-expect-error Synthetic, in-memory source-pin loader; never reads owner files.
import { fixture } from "./helpers/v3-application-authority.mjs";
// @ts-expect-error Node-only lifecycle with existing injectable process adapters.
import * as lifecycle from "../../scripts/v3/next-process.mjs";
const { withNextServer } = lifecycle;
const stopFile = (f: ReturnType<typeof fixture>) =>
  JSON.parse(
    fs.readFileSync(
      path.join(f.root, `run-${f.g.runId}.application-stop`),
      "utf8",
    ),
  );

test("Every fixed reason produces sanitized timestamp/elapsed evidence; arbitrary fields are discarded", () => {
  for (const reason of stopReasons) {
    const d = shutdownDiagnostic(reason, "shutdown", 1000, 1500, {
      childExitCode: 1,
      childSignal: "SIGTERM",
    });
    assert.equal(d.reason, reason);
    assert.equal(d.elapsedMs, 500);
    assert.equal(Date.parse(d.timestamp), 1500);
  }
  assert.equal(
    shutdownDiagnostic("normal", "shutdown", 0, 1).category,
    "normal-shutdown",
  );
  assert.equal(
    shutdownDiagnostic("external-signal", "shutdown", 0, 1).category,
    "external-termination",
  );
  assert.equal(
    shutdownDiagnostic("child-exit", "shutdown", 0, 1).category,
    "process-exit",
  );
  assert.equal(
    shutdownDiagnostic("login-credentials", "before-transmission", 0, 1)
      .category,
    "guard-refusal",
  );
  const secret = "offline-private-value-must-not-appear";
  const d = shutdownDiagnostic(secret, secret as "state", 1000, 1500, {
    childExitCode: secret,
    childSignal: secret,
    password: secret,
    token: secret,
  } as { childExitCode: unknown; childSignal: unknown });
  assert.equal(d.reason, "unknown");
  assert.equal(d.stage, "state");
  assert.equal(d.childExitCode, null);
  assert.equal(d.childSignal, null);
  assert.doesNotMatch(JSON.stringify(d), new RegExp(secret));
});
test("Pre-send approved-credential, origin, payload and token refusals have distinct durable reasons", async () => {
  for (const expected of [
    "login-credentials",
    "login-origin",
    "login-payload",
    "token-scope",
  ]) {
    const f = fixture();
    try {
      await f.start();
      const body: Record<string, unknown> = {
        email: f.c.users.A.email,
        password: f.c.users.A.password,
      };
      const headers = { ...f.headers };
      let origin = "http://127.0.0.1:3103";
      if (expected === "login-credentials")
        body.password = "offline-wrong-secret";
      if (expected === "login-origin") origin = "https://unapproved.invalid";
      if (expected === "login-payload") body.extra = "offline-secret";
      if (expected === "token-scope")
        Object.assign(headers, { authorization: `Bearer ${f.jwt("A")}` });
      await assert.rejects(
        f.a.fetch(
          f.c.apiOrigin + "/auth/v1/token?grant_type=password",
          { method: "POST", headers, body: JSON.stringify(body) },
          origin,
        ),
      );
      assert.equal(f.requests, 1);
      assert.equal(stopFile(f).reason, expected);
      assert.equal(stopFile(f).stage, "before-transmission");
      assert.equal(stopFile(f).elapsedMs, 0);
      assert.match(f.manifest(), /"state":"diagnostic"/);
      assert.doesNotMatch(
        f.manifest(),
        /offline-wrong-secret|offline-secret|offline-password|@example.invalid|access_token|refresh_token/,
      );
      await f.a.close("normal");
      assert.equal(stopFile(f).reason, expected);
      const closed = JSON.parse(f.manifest().trim().split("\n").at(-1));
      assert.equal(closed.state, "closed");
      assert.equal(closed.reason, expected);
      await assert.rejects(f.identity());
      assert.equal(f.requests, 1);
    } finally {
      f.dispose();
    }
  }
});
test("Parsing before a transaction is diagnosed and cannot send or retry", async () => {
  const f = fixture();
  try {
    await f.start();
    await assert.rejects(
      f.a.fetch(
        f.c.apiOrigin + "/auth/v1/token?grant_type=password",
        { method: "POST", headers: f.headers, body: "{bad-json" },
        "http://127.0.0.1:3103",
      ),
    );
    assert.equal(f.requests, 1);
    assert.equal(stopFile(f).reason, "request-shape");
    await assert.rejects(f.identity());
    assert.equal(f.requests, 1);
  } finally {
    f.dispose();
  }
});
test("Expiry, HTTP/Cloud budgets, lease and process boundaries preserve their exact predicates", async () => {
  for (const expected of [
    "grant-expired",
    "http-budget",
    "cloud-budget",
    "lease-invalid",
    "process-scope",
  ]) {
    const f = fixture();
    try {
      await f.start();
      if (expected === "grant-expired") f.advance(600001);
      if (expected === "lease-invalid") f.advance(10001);
      if (expected === "cloud-budget")
        f.setState((s: { cloud: number }) => {
          s.cloud = 600;
        });
      if (expected === "http-budget")
        f.setState((s: { http: number }) => {
          s.http = 300;
        });
      if (expected === "process-scope")
        f.setState((s: { controllerPid: number }) => {
          s.controllerPid = process.pid + 1000000;
        });
      if (expected === "http-budget")
        await assert.rejects(
          f.a.http("GET", "127.0.0.1:3103", undefined, "/auth"),
        );
      else await assert.rejects(f.identity());
      assert.equal(f.requests, 1);
      assert.equal(stopFile(f).reason, expected);
      assert.ok(stopFile(f).elapsedMs >= 0);
    } finally {
      f.dispose();
    }
  }
});
test("Diagnostic short-write/fsync failure stays terminal without another transmission", async () => {
  for (const kind of ["short", "zero", "exception", "fsync", "partial-bytes"]) {
    const f = fixture(),
      write = fs.writeSync,
      sync = fs.fsyncSync;
    try {
      await f.start();
      if (kind === "fsync")
        fs.fsyncSync = () => {
          throw Error("offline-secret");
        };
      else if (kind === "partial-bytes")
        fs.writeSync = ((
          fd: number,
          b: Uint8Array,
          offset: number,
          length: number,
          pos: number | null,
        ) => write(fd, b, offset, Math.min(7, length), pos)) as typeof write;
      else
        fs.writeSync = (() => {
          if (kind === "exception") throw Error("offline-secret");
          return kind === "short" ? 1 : 0;
        }) as typeof write;
      await assert.rejects(f.identity());
      assert.equal(f.requests, 1);
      fs.writeSync = write;
      fs.fsyncSync = sync;
      await assert.rejects(f.identity());
      assert.equal(f.requests, 1);
      assert.doesNotMatch(f.manifest(), /offline-secret/);
    } finally {
      fs.writeSync = write;
      fs.fsyncSync = sync;
      f.dispose();
    }
  }
});
test("Closure records normal versus unknown and sanitized child status before caller restoration", async () => {
  for (const reason of ["normal", "unknown"] as const) {
    const f = fixture();
    try {
      await f.start();
      f.a.noteDiagnostic("owned-stop", "shutdown", {
        childExitCode: 0,
        childSignal: null,
        password: "offline-secret",
      });
      await f.a.close(reason);
      const rows = f.manifest().trim().split("\n").map(JSON.parse);
      assert.equal(rows.at(-1).state, "closed");
      assert.equal(rows.at(-1).reason, reason);
      assert.equal(
        rows.find((e: { childExitCode?: number }) => e.childExitCode === 0)
          .childSignal,
        null,
      );
      assert.doesNotMatch(f.manifest(), /offline-secret/);
      assert.equal(f.state().phase, "closed");
    } finally {
      f.dispose();
    }
  }
});
function fakeChild() {
  return Object.assign(new EventEmitter(), {
    pid: 123,
    exitCode: null as number | null,
    signalCode: null as string | null,
  });
}

test("Heartbeat and abandoned-lock diagnostics are durable without breaking the old lock", async () => {
  const f = fixture();
  try {
    await f.start();
    f.advance(10001);
    await assert.rejects(f.a.heartbeat());
    assert.equal(stopFile(f).reason, "lease-invalid");
    assert.equal(stopFile(f).stage, "heartbeat");
    assert.equal(f.requests, 1);
  } finally {
    f.dispose();
  }
  const locked = fixture();
  try {
    await locked.start();
    const name = `run-${locked.g.runId}.application-lock`;
    locked.write(name, "offline abandoned lock");
    await assert.rejects(locked.identity());
    assert.equal(stopFile(locked).reason, "lock-unavailable");
    assert.equal(fs.existsSync(path.join(locked.root, name)), true);
    assert.equal(locked.requests, 1);
  } finally {
    locked.dispose();
  }
});

test("Unexpected child signal is preserved without inventing an exit code", async () => {
  const child = fakeChild();
  let spawned = false,
    stopped = false;
  const events: Array<{
    reason: string;
    childExitCode: number | null;
    childSignal: string | null;
  }> = [];
  await withNextServer(
    "offline",
    {},
    async () => {
      child.signalCode = "SIGTERM";
      child.emit("exit", null, "SIGTERM");
    },
    {
      inspect: () =>
        spawned && !stopped
          ? [{ LocalAddress: "127.0.0.1", OwningProcess: 123 }]
          : [],
      start: () => {
        spawned = true;
        return child;
      },
      stop: () => {
        stopped = true;
      },
      onDiagnostic: (e: {
        reason: string;
        childExitCode: number | null;
        childSignal: string | null;
      }) => events.push(e),
      wait: async () => {},
    },
  );
  const exit = events.find((e) => e.reason === "child-exit");
  assert.equal(exit?.childExitCode, null);
  assert.equal(exit?.childSignal, "SIGTERM");
});
test("Child exit, external controller signal and deadline abort have separate lifecycle evidence", async () => {
  for (const kind of ["child", "signal", "deadline"]) {
    const child = fakeChild(),
      abort = new AbortController(),
      events: Array<{
        reason: string;
        childExitCode: number | null;
        childSignal: string | null;
      }> = [];
    let spawned = false,
      stopped = false;
    await withNextServer(
      "offline",
      {},
      async () => {
        if (kind === "child") {
          child.exitCode = 7;
          child.emit("exit", 7, null);
        } else if (kind === "signal") process.emit("SIGTERM");
        else abort.abort("grant-expired");
      },
      {
        signal: abort.signal,
        inspect: () =>
          spawned && !stopped
            ? [{ LocalAddress: "127.0.0.1", OwningProcess: 123 }]
            : [],
        start: () => {
          spawned = true;
          return child;
        },
        stop: () => {
          stopped = true;
          if (child.exitCode === null) {
            child.exitCode = 1;
            child.emit("exit", 1, null);
          }
        },
        onDiagnostic: (e: {
          reason: string;
          childExitCode: number | null;
          childSignal: string | null;
        }) => events.push(e),
        wait: async () => {},
      },
    );
    assert.ok(stopped);
    assert.ok(
      events.some(
        (e) =>
          e.reason ===
          (kind === "child"
            ? "child-exit"
            : kind === "signal"
              ? "external-signal"
              : "grant-expired"),
      ),
    );
    assert.ok(events.some((e) => e.childExitCode !== null));
  }
});
test("Unwritable lifecycle diagnostics stop the owned process and cannot report success", async () => {
  const child = fakeChild();
  let spawned = false,
    stopped = false;
  await assert.rejects(
    withNextServer(
      "offline",
      {},
      async () => {
        child.emit("exit", 4, null);
      },
      {
        inspect: () =>
          spawned && !stopped
            ? [{ LocalAddress: "127.0.0.1", OwningProcess: 123 }]
            : [],
        start: () => {
          spawned = true;
          return child;
        },
        stop: () => {
          stopped = true;
          child.exitCode = 1;
        },
        onDiagnostic: () => {
          throw Error("offline-sensitive-error");
        },
        wait: async () => {},
      },
    ),
    (e: unknown) =>
      e instanceof ApplicationRefusal && e.reason === "evidence-persistence",
  );
  assert.ok(stopped);
});
