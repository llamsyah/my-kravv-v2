import assert from "node:assert/strict";
import fs from "node:fs";
import { EventEmitter } from "node:events";
import { test } from "node:test";
import {
  applicationMain,
  applicationRestoration,
} from "../../scripts/v3/application-dispatch.ts";
import { assertCloudExecutionReady } from "../../src/lib/env/v3-cloud-execution.ts";
// @ts-expect-error Isolated synthetic module loader; never edits source.
import { authorityCopy, fixture } from "./helpers/v3-application-authority.mjs";
// @ts-expect-error Node process lifecycle has deterministic injectable adapters.
import * as nextLifecycle from "../../scripts/v3/next-process.mjs";
const { withNextServer, verifyOwnedListeners } = nextLifecycle;

test("Restoration allows only the exact pin edit after verified shutdown", () => {
  const original =
    "before\nconst approvedApplicationGrantSha256: string | null = null;\nafter\n";
  const active = original.replace("= null;", `= "${"a".repeat(64)}";`);
  assert.equal(
    applicationRestoration(original, active, active, true),
    original,
  );
  assert.throws(() => applicationRestoration(original, active, active, false));
  assert.throws(() =>
    applicationRestoration(original, active, active + "concurrent edit", true),
  );
  assert.throws(() =>
    applicationRestoration(original, active + "extra", active + "extra", true),
  );
});

test("Application dispatch/source/browser gates deny before private reads or network", async () => {
  const before = fs.readFileSync;
  let reads = 0;
  fs.readFileSync = (() => {
    reads++;
    throw Error();
  }) as typeof before;
  try {
    await assert.rejects(applicationMain());
    assert.throws(() => assertCloudExecutionReady());
    assert.equal(reads, 0);
  } finally {
    fs.readFileSync = before;
  }
});
test("Null application authority does not read private paths", () => {
  const api = authorityCopy();
  assert.throws(() =>
    new api.ApplicationAuthority("not-a-private-directory").load(),
  );
});
test("Application grants reject wrong scope, target, identities, plan and expiry", () => {
  const edits = [
    (g: Record<string, unknown>) => {
      g.purpose = "two-user-api-only";
    },
    (g: Record<string, unknown>) => {
      g.projectRef = "other-project";
    },
    (g: Record<string, unknown>) => {
      g.expiresAt = "2026-10-23T00:00:00Z";
    },
    (g: Record<string, unknown>) => {
      g.planSha256 = "0".repeat(64);
    },
    (g: Record<string, unknown>) => {
      g.credentialSha256 = "0".repeat(64);
    },
  ];
  for (const edit of edits) {
    const f = fixture(edit);
    try {
      assert.throws(() => f.a.initialize());
      assert.equal(f.requests, 0);
    } finally {
      f.dispose();
    }
  }
});
test("Grant exact bytes are checked before JSON and credentials", () => {
  const f = fixture();
  try {
    f.write("application-run-approval.json", " {malformed");
    fs.unlinkSync(f.root + "/credentials.json");
    assert.throws(() => f.a.load());
    assert.equal(f.requests, 0);
  } finally {
    f.dispose();
  }
});
test("Synthetic dispatch identity/HTTP/live account scope and shutdown use shared durable state", async () => {
  const f = fixture();
  try {
    await f.start();
    await f.a.http("GET", "127.0.0.1:3103", undefined, "/auth");
    await f.login();
    assert.equal(f.requests, 2);
    assert.equal(f.instance().target().kind, "cloud");
    await f.a.close();
    assert.throws(() => f.instance().target());
    assert.match(f.manifest(), /"state":"closed"/);
    assert.throws(() => f.instance().initialize());
  } finally {
    f.dispose();
  }
});
test("Separate worker instances share Cloud and HTTP budgets", async () => {
  const f = fixture();
  try {
    await f.start();
    f.setState((s: { cloud: number; http: number }) => {
      s.cloud = 599;
      s.http = 298;
    });
    await Promise.all([
      f.a.http("GET", "127.0.0.1:3103", undefined, "/auth"),
      f.instance().http("GET", "127.0.0.1:3103", undefined, "/auth"),
    ]);
    await f.identity();
    assert.equal(f.state().cloud, 600);
    await assert.rejects(f.identity());
    assert.equal(f.requests, 2);
    await assert.rejects(
      f.instance().http("GET", "127.0.0.1:3103", undefined, "/auth"),
    );
  } finally {
    f.dispose();
  }
});
test("Expired grant, stale heartbeat and corrupt ledger fail closed", async () => {
  for (const mode of ["expiry", "lease", "corrupt"]) {
    const f = fixture();
    try {
      await f.start();
      if (mode === "expiry") f.advance(600001);
      else if (mode === "lease") f.advance(10001);
      else
        f.setState((s: { cloud: number }) => {
          s.cloud = NaN;
        });
      await assert.rejects(f.identity());
      assert.equal(f.requests, 1);
    } finally {
      f.dispose();
    }
  }
});
test("Wrong identity and unexpected transport responses stop subsequent network calls", async () => {
  const f = fixture();
  try {
    f.a.initialize();
    f.respond(() => Response.json({ project_id: "wrong" }));
    await assert.rejects(f.identity());
    await assert.rejects(f.identity());
    assert.equal(f.requests, 1);
    assert.match(f.manifest(), /transport-or-response/);
  } finally {
    f.dispose();
  }
});

test("An unrelated server process cannot inherit a live application window", async () => {
  const f = fixture();
  try {
    await f.start();
    f.setState((s: { controllerPid: number; nextPid: number }) => {
      s.controllerPid = process.pid + 1000000;
      s.nextPid = process.pid + 1000001;
    });
    await assert.rejects(f.identity());
    assert.equal(f.requests, 1);
  } finally {
    f.dispose();
  }
});

test("A second invocation cannot restore the pin underneath an open consumed window", async () => {
  const f = fixture();
  try {
    await f.start();
    const second = f.instance();
    assert.throws(() => second.initialize());
    assert.equal(second.replayRestorationAllowed(), false);
    await f.a.close();
    assert.equal(second.replayRestorationAllowed(), true);
  } finally {
    f.dispose();
  }
});
test("Redirects, foreign origins and unapproved account login never authorize further operations", async () => {
  const f = fixture();
  try {
    await f.start();
    await assert.rejects(
      f.a.fetch("https://example.invalid/auth/v1/token", {}),
    );
    await assert.rejects(
      f.a.fetch(
        f.c.apiOrigin + "/auth/v1/token?grant_type=password",
        {
          method: "POST",
          headers: f.headers,
          body: JSON.stringify({
            email: "not-approved@example.invalid",
            password: "offline",
          }),
        },
        "http://127.0.0.1:3103",
      ),
    );
    assert.equal(f.requests, 1);
  } finally {
    f.dispose();
  }
});
test("Company writes persist intent then actual returned ID; settings support single representation", async () => {
  const f = fixture();
  try {
    await f.start();
    await f.login();
    const id = "40000000-0000-4000-8000-000000000001",
      name = `v3-slice1-app:${f.g.runId}:A fixture`;
    f.respond((url: string, init: RequestInit) => {
      assert.match(f.manifest(), /"state":"sending"/);
      const body = JSON.parse(String(init.body));
      assert.equal(body.id, undefined);
      return Response.json(
        url.includes("companies") ? [{ ...body, id }] : body,
        { status: 201 },
      );
    });
    await f.call("/rest/v1/companies?select=id,user_id,name", "POST", {
      name,
      user_id: f.g.users.A,
    });
    assert.equal(f.state().ids.A, id);
    assert.match(f.manifest(), /write-verified/);
    await f.call(
      "/rest/v1/user_settings?select=user_id,theme",
      "POST",
      { theme: "dark", user_id: f.g.users.A },
      "A",
      { accept: "application/vnd.pgrst.object+json" },
    );
    assert.equal(f.state().writes.A.theme, 1);
    const count = f.requests;
    await assert.rejects(
      f.call("/rest/v1/companies?select=id,user_id,name", "POST", {
        id,
        name,
        user_id: f.g.users.A,
      }),
    );
    assert.equal(f.requests, count);
  } finally {
    f.dispose();
  }
});
test("Invalid returned fixture ID preserves uncertain-write evidence and denies dependents", async () => {
  const f = fixture();
  try {
    await f.start();
    await f.login();
    f.respond(() =>
      Response.json(
        [
          {
            id: "invalid",
            user_id: f.g.users.A,
            name: `v3-slice1-app:${f.g.runId}:A`,
          },
        ],
        { status: 201 },
      ),
    );
    await assert.rejects(
      f.call("/rest/v1/companies?select=id,user_id,name", "POST", {
        user_id: f.g.users.A,
        name: `v3-slice1-app:${f.g.runId}:A`,
      }),
    );
    assert.equal(f.state().ids.A, undefined);
    assert.match(f.manifest(), /uncertainWrite/);
    await assert.rejects(f.identity());
    assert.equal(f.requests, 3);
  } finally {
    f.dispose();
  }
});
test("Short, zero and fsync failures prevent any subsequent request", async () => {
  for (const mode of ["short", "zero", "fsync"]) {
    const f = fixture();
    const write = fs.writeSync,
      sync = fs.fsyncSync;
    try {
      await f.start();
      if (mode === "fsync")
        fs.fsyncSync = () => {
          throw Error("offline-sensitive-error");
        };
      else fs.writeSync = (() => (mode === "short" ? 1 : 0)) as typeof write;
      await assert.rejects(f.identity());
      assert.equal(f.requests, 1);
    } finally {
      fs.writeSync = write;
      fs.fsyncSync = sync;
      f.dispose();
    }
  }
});
test("Verified-write persistence failure cannot permit dependent requests", async () => {
  const f = fixture(),
    sync = fs.fsyncSync;
  try {
    await f.start();
    await f.login();
    f.respond(() => {
      fs.fsyncSync = () => {
        throw Error("offline-secret");
      };
      return Response.json(
        [
          {
            id: "40000000-0000-4000-8000-000000000001",
            user_id: f.g.users.A,
            name: `v3-slice1-app:${f.g.runId}:A`,
          },
        ],
        { status: 201 },
      );
    });
    await assert.rejects(
      f.call("/rest/v1/companies?select=id,user_id,name", "POST", {
        name: `v3-slice1-app:${f.g.runId}:A`,
        user_id: f.g.users.A,
      }),
    );
    fs.fsyncSync = sync;
    await assert.rejects(f.identity());
    assert.equal(f.requests, 3);
    assert.doesNotMatch(
      f.manifest(),
      /offline-secret|offline-password|access_token|refresh_token|authorization/i,
    );
  } finally {
    fs.fsyncSync = sync;
    f.dispose();
  }
});
function fakeProcess() {
  return Object.assign(new EventEmitter(), {
    pid: 123,
    exitCode: null as number | null,
    signalCode: null as string | null,
  });
}

test("HTTP cap, foreign origin and stale browser sessions cannot widen the window", async () => {
  const f = fixture();
  try {
    await f.start();
    await f.a.http(
      "POST",
      "127.0.0.1:3103",
      "https://csrf.invalid",
      "/foundation",
    );
    assert.equal(f.state().csrfProbe, true);
    f.setState((s: { http: number }) => {
      s.http = 300;
    });
    await assert.rejects(f.a.http("GET", "127.0.0.1:3103", undefined, "/auth"));
    assert.equal(f.requests, 1);
  } finally {
    f.dispose();
  }
  const other = fixture();
  try {
    await other.start();
    await assert.rejects(
      other.a.http(
        "POST",
        "127.0.0.1:3103",
        "https://unapproved.invalid",
        "/foundation",
      ),
    );
    assert.equal(other.requests, 1);
  } finally {
    other.dispose();
  }
});
test("Only current-window tokens and listed user endpoints may transmit", async () => {
  for (const endpoint of [
    "/rest/v1/companies?select=id,user_id,name",
    "/auth/v1/admin/users",
  ]) {
    const f = fixture();
    try {
      await f.start();
      await assert.rejects(f.call(endpoint));
      assert.equal(f.requests, 1);
    } finally {
      f.dispose();
    }
  }
  const f = fixture();
  try {
    await f.start();
    await f.login();
    await assert.rejects(f.call("/auth/v1/admin/users"));
    assert.equal(f.requests, 2);
  } finally {
    f.dispose();
  }
});

test("Read responses confirm owned rows and reject a foreign owner before returning data", async () => {
  const f = fixture();
  try {
    await f.start();
    await f.login();
    f.respond(() =>
      Response.json([
        {
          id: "40000000-0000-4000-8000-000000000001",
          user_id: f.g.users.A,
          name: "offline company",
        },
      ]),
    );
    await f.call(
      `/rest/v1/companies?select=id,user_id,name&user_id=eq.${f.g.users.A}`,
    );
    f.respond(() =>
      Response.json([
        {
          id: "40000000-0000-4000-8000-000000000002",
          user_id: f.g.users.B,
          name: "foreign offline",
        },
      ]),
    );
    await assert.rejects(
      f.call(
        `/rest/v1/companies?select=id,user_id,name&user_id=eq.${f.g.users.A}`,
      ),
    );
    await assert.rejects(f.identity());
    assert.equal(f.requests, 4);
  } finally {
    f.dispose();
  }
});

test("Logout unregisters that actor's local access and refresh tokens without claiming JWT revocation", async () => {
  const f = fixture();
  try {
    await f.start();
    await f.login();
    f.respond(() => new Response(null, { status: 204 }));
    await f.call("/auth/v1/logout?scope=local", "POST");
    assert.deepEqual(f.state().tokens, {});
    assert.deepEqual(f.state().refresh, {});
    await assert.rejects(
      f.call(
        `/rest/v1/companies?select=id,user_id,name&user_id=eq.${f.g.users.A}`,
      ),
    );
    assert.equal(f.requests, 3);
  } finally {
    f.dispose();
  }
});
test("A scoped foreign-company edit is denied without transmission or ending the read-only walkthrough", async () => {
  const f = fixture();
  try {
    await f.start();
    await f.login();
    await assert.rejects(
      f.call(
        `/rest/v1/companies?select=id,user_id,name&user_id=eq.${f.g.users.A}&id=eq.40000000-0000-4000-8000-000000000002`,
        "PATCH",
        { name: `v3-slice1-app:${f.g.runId}:A` },
      ),
    );
    assert.equal(f.requests, 2);
    await f.identity();
    assert.equal(f.requests, 3);
    assert.match(f.manifest(), /scope-denied/);
  } finally {
    f.dispose();
  }
});
test("Parent cancellation stops only its owned Next process", async () => {
  const child = fakeProcess(),
    abort = new AbortController();
  let created = false,
    stopped = false;
  await withNextServer(
    "offline",
    {},
    async () => {
      abort.abort();
    },
    {
      signal: abort.signal,
      inspect: () =>
        created && !stopped
          ? [{ LocalAddress: "127.0.0.1", OwningProcess: 123 }]
          : [],
      start: () => {
        created = true;
        return child;
      },
      stop: () => {
        stopped = true;
        child.exitCode = 0;
      },
      wait: async () => {},
    },
  );
  assert.ok(stopped);
});

test("Failure to persist child ownership stops the launched process", async () => {
  const child = fakeProcess();
  let created = false,
    stopped = false;
  await assert.rejects(
    withNextServer(
      "offline",
      {},
      async () => {
        throw Error("Must not dispatch");
      },
      {
        onStarted: () => {
          throw Error("Evidence unavailable");
        },
        inspect: () =>
          created && !stopped
            ? [{ LocalAddress: "127.0.0.1", OwningProcess: 123 }]
            : [],
        start: () => {
          created = true;
          return child;
        },
        stop: () => {
          stopped = true;
          child.exitCode = 0;
        },
        wait: async () => {},
      },
    ),
  );
  assert.ok(stopped);
});
test("Next dispatch verifies fixed loopback ownership and always stops its child", async () => {
  const child = fakeProcess();
  let created = false,
    stopped = false;
  const result = await withNextServer("offline", {}, async () => "review", {
    inspect: () =>
      created && !stopped
        ? [{ LocalAddress: "127.0.0.1", OwningProcess: 123 }]
        : [],
    start: (_exe: string, args: string[]) => {
      assert.deepEqual(args.slice(-4), [
        "--hostname",
        "127.0.0.1",
        "--port",
        "3103",
      ]);
      created = true;
      return child;
    },
    stop: () => {
      stopped = true;
      child.exitCode = 0;
    },
    wait: async () => {},
  });
  assert.equal(result, "review");
  assert.ok(stopped);
  for (const host of ["0.0.0.0", "::", "::1"])
    assert.throws(() =>
      verifyOwnedListeners([{ LocalAddress: host, OwningProcess: 123 }], 123),
    );
});
test("Launch failure, work failure and unresolved shutdown cannot report success", async () => {
  for (const mode of ["launch", "work", "shutdown"]) {
    const child = fakeProcess();
    let created = false,
      stopped = false;
    await assert.rejects(
      withNextServer(
        "offline",
        {},
        async () => {
          if (mode === "work") throw Error();
        },
        {
          inspect: () =>
            created && (!stopped || mode === "shutdown")
              ? [{ LocalAddress: "127.0.0.1", OwningProcess: 123 }]
              : [],
          start: () => {
            created = true;
            if (mode === "launch") child.exitCode = 1;
            return child;
          },
          stop: () => {
            stopped = true;
            child.exitCode = 0;
          },
          wait: async () => {},
        },
      ),
    );
    assert.ok(stopped);
  }
});
