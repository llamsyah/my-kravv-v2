import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { z } from "zod";
import { assertCloudExecutionReady } from "../../src/lib/env/v3-cloud-execution.ts";
import { v3CloudProfile } from "../../src/lib/env/v3-cloud.ts";
import {
  buildCloudTwoUserPlan,
  checkCloudTestObservation,
  capturedCloudCompany,
  resolveCloudCompanyStep,
  assertCloudFixtureWrite,
} from "./cloud-two-user-plan.ts";

const repository = path.resolve(import.meta.dirname, "../..");
const sha = (bytes: string | Buffer) =>
  createHash("sha256").update(bytes).digest("hex");
const fail = () =>
  new Error(
    "Cloud two-user run refused or failed; review the private manifest.",
  );

// One complete UTF-8 record or fail closed; fsync alone cannot detect short writes.
function durableManifestRecord(fd: number, event: unknown) {
  const bytes = Buffer.from(JSON.stringify(event) + "\n", "utf8");
  if (fs.writeSync(fd, bytes, 0, bytes.length, null) !== bytes.length)
    throw fail();
  fs.fsyncSync(fd);
}
const account = z
  .object({
    id: z.uuid(),
    email: z.email(),
    password: z
      .string()
      .min(1)
      .max(1024)
      .refine((value) => value.trim().length > 0),
  })
  .strict();
const credentialsSchema = z
  .object({
    projectRef: z.literal("kjcvgjfwlmyfroiqlbmw"),
    apiOrigin: z.literal("https://kjcvgjfwlmyfroiqlbmw.supabase.co"),
    publishableKey: z.string().regex(/^sb_publishable_[A-Za-z0-9_-]{5,}$/),
    users: z.object({ A: account, B: account }).strict(),
  })
  .strict();
const grantSchema = z
  .object({
    purpose: z.literal("two-user-api-only"),
    projectRef: z.literal("kjcvgjfwlmyfroiqlbmw"),
    apiOrigin: z.literal("https://kjcvgjfwlmyfroiqlbmw.supabase.co"),
    runId: z.uuid(),
    users: z.object({ A: z.uuid(), B: z.uuid() }).strict(),
    issuedAt: z.iso.datetime(),
    expiresAt: z.iso.datetime(),
    maxRequests: z.literal(48),
    overallMs: z.literal(180000),
    retries: z.literal(0),
    planSha256: z.string().regex(/^[a-f0-9]{64}$/),
    credentialSha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();

/** Pure preparation helper, not an execution grant. Never accepts secrets. */
export function cloudTwoUserPlanDigest(spec: unknown) {
  return sha(JSON.stringify(buildCloudTwoUserPlan(spec)));
}

/** Shared budget, including Auth/identity and response-body time. */
export function cloudTwoUserBudget(
  start: number,
  expiry: number,
  now: () => number,
) {
  let count = 0;
  const deadline = Math.min(start + 180000, expiry);
  const check = () => {
    if (now() >= deadline) throw fail();
  };
  return {
    check,
    timeout() {
      check();
      return Math.min(10000, deadline - now());
    },
    begin() {
      check();
      if (count >= 48) throw fail();
      count++;
      return Math.min(10000, deadline - now());
    },
    get count() {
      return count;
    },
  };
}

function refuseInherited(source: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(source))
    if (
      value &&
      /^(?:NEXT_PUBLIC_|SUPABASE_|MY_KRAVV_|NODE_OPTIONS$|NODE_EXTRA_CA_CERTS$|NODE_TLS_REJECT_UNAUTHORIZED$|NODE_USE_ENV_PROXY$|SSL_CERT_FILE$|SSL_CERT_DIR$|HTTP_PROXY$|HTTPS_PROXY$|ALL_PROXY$)/i.test(
        key,
      )
    )
      throw fail();
}

/** Pure Windows ACL policy, also exercised without inspecting real secrets. */
export function assertCloudPrivateAcl(value: unknown) {
  const result = z
    .object({
      owner: z.string().min(1),
      current: z.string().min(1),
      allowed: z.array(z.string()).min(1),
      nonNullDacl: z.literal(true),
    })
    .strict()
    .safeParse(value);
  if (!result.success) throw fail();
  const r = result.data;
  if (
    r.owner !== r.current ||
    r.allowed.some((s) => ![r.current, "S-1-5-18", "S-1-5-32-544"].includes(s))
  )
    throw fail();
}

// Owner, SYSTEM and local Administrators only. No ACL repair or chmod is done.
function windowsPrivate(file: string) {
  const script =
    "$ErrorActionPreference='Stop'; $a=Get-Acl -LiteralPath $env:KRAVV_ACL_PATH; $sid=[System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value; $owner=$a.GetOwner([System.Security.Principal.SecurityIdentifier]).Value; $rules=@($a.GetAccessRules($true,$true,[System.Security.Principal.SecurityIdentifier]) | Where-Object {$_.AccessControlType -eq 'Allow'} | ForEach-Object {$_.IdentityReference.Value}); $raw=[System.Security.AccessControl.RawSecurityDescriptor]::new($a.Sddl); @{owner=$owner; current=$sid; allowed=$rules; nonNullDacl=($null -ne $raw.DiscretionaryAcl)} | ConvertTo-Json -Compress";
  const result = JSON.parse(
    execFileSync(
      path.join(
        process.env.SystemRoot ?? "C:\\Windows",
        "System32/WindowsPowerShell/v1.0/powershell.exe",
      ),
      ["-NoProfile", "-NonInteractive", "-Command", script],
      {
        env: {
          NODE_ENV: "production",
          SystemRoot: process.env.SystemRoot,
          KRAVV_ACL_PATH: file,
        },
        encoding: "utf8",
        timeout: 5000,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      },
    ),
  );
  assertCloudPrivateAcl(result);
}

function privatePath(file: string, directory: boolean, simulation: boolean) {
  const st = fs.lstatSync(file);
  if (
    st.isSymbolicLink() ||
    (directory ? !st.isDirectory() : !st.isFile() || st.nlink !== 1)
  )
    throw fail();
  if (process.platform === "win32") {
    if (!simulation) windowsPrivate(file);
  } else if (st.uid !== process.getuid?.() || (st.mode & 0o077) !== 0)
    throw fail();
}

function readPrivate(root: string, name: string, simulation: boolean) {
  const file = path.join(root, name);
  privatePath(file, false, simulation);
  const fd = fs.openSync(
    file,
    fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0),
  );
  try {
    const before = fs.lstatSync(file),
      opened = fs.fstatSync(fd);
    if (
      before.ino !== opened.ino ||
      before.dev !== opened.dev ||
      opened.nlink !== 1 ||
      opened.size > 32768
    )
      throw fail();
    return fs.readFileSync(fd, "utf8");
  } finally {
    fs.closeSync(fd);
  }
}

type Wire = (
  url: string,
  init: RequestInit,
  timeout: number,
) => Promise<{ status: number; body: unknown }>;
type Plan = ReturnType<typeof buildCloudTwoUserPlan>;

// Private kernel: there is no exported injectable-fetch path to real networking.
async function execute(
  root: string,
  source: Record<string, string | undefined>,
  now: () => number,
  wire: Wire,
  simulation: boolean,
  monotonic: () => number,
) {
  let manifest: number | undefined;
  let manifestPersistenceFailed = false;
  let creds: z.infer<typeof credentialsSchema> | undefined;
  const tokens: Partial<Record<"A" | "B", string>> = {};
  let requests = 0;
  let completed = 0;
  const started = monotonic();
  try {
    refuseInherited(source);
    if (
      !path.isAbsolute(root) ||
      fs.realpathSync(root) !== root ||
      root === repository ||
      root.startsWith(repository + path.sep)
    )
      throw fail();
    // No symlinked ancestors or enclosing Git checkout, including other projects.
    for (let ancestor = root; ; ancestor = path.dirname(ancestor)) {
      if (
        fs.lstatSync(ancestor).isSymbolicLink() ||
        fs.existsSync(path.join(ancestor, ".git"))
      )
        throw fail();
      if (ancestor === path.dirname(ancestor)) break;
    }
    privatePath(root, true, simulation);
    if (readPrivate(root, ".gitignore", simulation).trim() !== "*")
      throw fail();
    const grant = grantSchema.safeParse(
      JSON.parse(readPrivate(root, "run-approval.json", simulation)),
    );
    if (!grant.success) throw fail();
    const g = grant.data;
    const issued = Date.parse(g.issuedAt),
      expiry = Date.parse(g.expiresAt);
    if (
      issued > now() ||
      expiry <= now() ||
      expiry <= issued ||
      expiry - issued > 600000
    )
      throw fail();
    const plan: Plan = buildCloudTwoUserPlan({
      profile: v3CloudProfile,
      projectRef: g.projectRef,
      apiOrigin: g.apiOrigin,
      runId: g.runId,
      users: g.users,
    });
    if (sha(JSON.stringify(plan)) !== g.planSha256) throw fail();
    const raw = readPrivate(root, "credentials.json", simulation);
    if (sha(raw) !== g.credentialSha256) throw fail();
    const parsed = credentialsSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) throw fail();
    creds = parsed.data;
    if (
      simulation &&
      (!creds.publishableKey.startsWith("sb_publishable_offline_") ||
        Object.values(creds.users).some(
          (u) =>
            !u.email.endsWith("@example.invalid") ||
            !u.password.startsWith("offline-"),
        ))
    )
      throw fail();
    if (
      creds.users.A.id !== g.users.A ||
      creds.users.B.id !== g.users.B ||
      creds.users.A.email.toLowerCase() === creds.users.B.email.toLowerCase()
    )
      throw fail();
    const budget = cloudTwoUserBudget(
      started,
      monotonic() + expiry - now(),
      monotonic,
    );
    budget.check();
    // Exclusive persistent claim, never removed even on failure or crash.
    const claim = fs.openSync(
      path.join(root, `run-${g.runId}.consumed.json`),
      "wx",
      0o600,
    );
    try {
      fs.writeFileSync(
        claim,
        JSON.stringify({
          runId: g.runId,
          projectRef: g.projectRef,
          planSha256: g.planSha256,
        }),
      );
      fs.fsyncSync(claim);
    } finally {
      fs.closeSync(claim);
    }
    manifest = fs.openSync(
      path.join(root, `run-${g.runId}.manifest.jsonl`),
      "wx",
      0o600,
    );
    const record = (event: unknown) => {
      try {
        durableManifestRecord(manifest!, event);
      } catch {
        manifestPersistenceFailed = true;
        throw fail();
      }
    };
    record({
      state: "planned",
      runId: g.runId,
      projectRef: g.projectRef,
      fixtures: plan.fixtures,
      planSha256: g.planSha256,
    });
    const companyIds: Partial<Record<"A" | "B", string>> = {};
    for (const template of plan.steps) {
      const step = resolveCloudCompanyStep(template, companyIds);
      assertCloudFixtureWrite(step);
      const url = new URL(step.url);
      if (
        url.origin !== g.apiOrigin ||
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.hash
      )
        throw fail();
      const headers: Record<string, string> = {
        apikey: creds.publishableKey,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      };
      if (
        step.actor !== "anonymous" &&
        !step.credentialSlot &&
        step.check !== "unauthenticated"
      ) {
        const token = tokens[step.actor];
        if (!token) throw fail();
        headers.Authorization = `Bearer ${token}`;
      }
      let body = step.body;
      if (step.credentialSlot) {
        const user = creds.users[step.credentialSlot];
        body = { email: user.email, password: user.password };
      }
      if (now() >= expiry) throw fail();
      budget.begin();
      requests = budget.count;
      // Persist exact planned mutation BEFORE transmission, including uncertainty.
      record({
        state: "sending",
        index: completed,
        label: step.label,
        method: step.method,
        path: url.pathname + url.search,
        ...(step.body ? { fixtureBody: step.body } : {}),
      });
      const reply = await wire(
        url.href,
        {
          method: step.method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          redirect: "error",
        },
        budget.timeout(),
      );
      budget.check();
      if (now() >= expiry) throw fail();
      checkCloudTestObservation(step, reply.status, reply.body);
      if (step.check === "company-create") {
        if (step.actor === "anonymous") throw fail();
        const row = capturedCloudCompany(step, reply.status, reply.body);
        if (Object.values(companyIds).includes(row.id)) throw fail();
        // Bind only after a validated successful response, then fsync before further sends.
        companyIds[step.actor] = row.id;
        record({
          state: "company-id-verified",
          index: completed,
          actor: step.actor,
          company: row,
        });
      }
      if (step.check === "login") {
        const b = reply.body as {
          access_token: string;
          user: { email: string };
        };
        if (
          step.actor === "anonymous" ||
          b.user.email?.toLowerCase() !==
            creds.users[step.actor].email.toLowerCase()
        )
          throw fail();
        const claims = JSON.parse(
          Buffer.from(
            b.access_token.split(".")[1] ?? "",
            "base64url",
          ).toString(),
        ) as Record<string, unknown>;
        if (
          b.access_token.split(".").length !== 3 ||
          claims.iss !== `${g.apiOrigin}/auth/v1` ||
          claims.sub !== g.users[step.actor] ||
          claims.role !== "authenticated" ||
          typeof claims.exp !== "number" ||
          claims.exp * 1000 <= now()
        )
          throw fail();
        tokens[step.actor] = b.access_token;
      }
      if (step.check === "user") {
        const user = reply.body as { email: string };
        if (
          step.actor === "anonymous" ||
          user.email?.toLowerCase() !==
            creds.users[step.actor].email.toLowerCase()
        )
          throw fail();
      }
      if (step.check === "logout" && step.actor !== "anonymous")
        delete tokens[step.actor];
      completed++;
      record({
        state: "verified",
        index: completed - 1,
        label: step.label,
        status: reply.status,
      });
    }
    budget.check();
    record({
      state: "passed",
      requests,
      completed,
      cleanup: "retained; no automatic cleanup",
    });
    return { outcome: "passed" as const, requests, completed };
  } catch {
    if (manifest !== undefined && !manifestPersistenceFailed) {
      try {
        durableManifestRecord(manifest, {
          state: "failed",
          requests,
          completed,
          cleanup: "retained; review sending events for uncertain mutations",
        });
      } catch {
        /* Never continue or disclose a raw filesystem/transport error. */
      }
    }
    return { outcome: "failed" as const, requests, completed };
  } finally {
    if (manifest !== undefined) fs.closeSync(manifest);
    delete tokens.A;
    delete tokens.B;
    if (creds) {
      creds.users.A.password = "";
      creds.users.B.password = "";
      creds.publishableKey = "";
    }
  }
}

async function networkWire(
  url: string,
  init: RequestInit,
  timeout: number,
  fetcher: typeof fetch = fetch,
) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(fail());
    }, timeout);
  });
  try {
    return await Promise.race([
      expired,
      (async () => {
        const response = await fetcher(url, {
          ...init,
          signal: controller.signal,
        });
        if (
          response.redirected ||
          response.url !== url ||
          (response.status >= 300 && response.status < 400)
        )
          throw fail();
        const reader = response.body?.getReader();
        const chunks: Uint8Array[] = [];
        let size = 0;
        if (reader)
          try {
            for (;;) {
              const next = await reader.read();
              if (next.done) break;
              size += next.value.length;
              if (size > 262144) throw fail();
              chunks.push(next.value);
            }
          } finally {
            await reader.cancel().catch(() => {});
          }
        const raw = Buffer.concat(chunks).toString("utf8");
        return {
          status: response.status,
          body: raw ? (JSON.parse(raw) as unknown) : undefined,
        };
      })(),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
    controller.abort();
  }
}

/** Production boundary stays closed, before file access, environment or network. */
export async function cloudTwoUserMain(args = process.argv.slice(2)) {
  assertCloudExecutionReady();
  if (args.length !== 0) throw fail();
  return execute(
    path.join(os.homedir(), ".my-kravv-v3-private"),
    process.env,
    Date.now,
    networkWire,
    false,
    () => performance.now(),
  );
}

export type SyntheticReply = {
  status: number;
  body?: unknown;
  elapsedMs?: number;
  transportFailure?: boolean;
  url?: string;
  redirected?: boolean;
  rawBody?: string;
  stallBody?: boolean;
};
/** Offline-only adapter: canned data only, no injected callbacks/fetch/network. */
export async function simulateCloudTwoUserRun(
  root: string,
  replies: SyntheticReply[],
  at: number,
  source: Record<string, string | undefined> = {},
) {
  // Simulator can only read test-created temporary roots with this exact prefix.
  const absolute = path.resolve(root);
  if (
    path.dirname(absolute) !== fs.realpathSync(os.tmpdir()) ||
    !path.basename(absolute).startsWith("kravv-v3-offline-")
  )
    throw fail();
  let clock = at;
  const sent: {
    url: string;
    method: string;
    actorAuthorization: boolean;
    fixtureColumns?: string[];
    returnedRepresentation?: boolean;
  }[] = [];
  const wire: Wire = async (url, init, timeout) => {
    let reply = replies[sent.length];
    // Mock database column ACL, independent of the response assertions.
    const table = new URL(url).pathname;
    let fixtureColumns: string[] | undefined;
    if (
      init.method !== "GET" &&
      ["/rest/v1/companies", "/rest/v1/user_settings"].includes(table)
    ) {
      fixtureColumns = Object.keys(
        JSON.parse(String(init.body)) as Record<string, unknown>,
      );
      const permitted =
        table === "/rest/v1/user_settings"
          ? ["user_id"]
          : init.method === "POST"
            ? ["user_id", "name"]
            : ["name"];
      if (fixtureColumns.some((column) => !permitted.includes(column)))
        reply = { status: 403, body: { code: "42501" } };
    }
    sent.push({
      url,
      method: init.method!,
      actorAuthorization: Boolean(
        (init.headers as Record<string, string>).Authorization,
      ),
      ...(fixtureColumns
        ? {
            fixtureColumns,
            returnedRepresentation:
              (init.headers as Record<string, string>).Prefer ===
              "return=representation",
          }
        : {}),
    });
    if (!reply) throw fail();
    clock += reply.elapsedMs ?? 0;
    if (reply.transportFailure || (reply.elapsedMs ?? 0) >= timeout)
      throw fail();
    return networkWire(url, init, timeout, async () => {
      const response = new Response(
        reply.stallBody
          ? new ReadableStream()
          : (reply.rawBody ??
              (reply.body === undefined ? null : JSON.stringify(reply.body))),
        { status: reply.status },
      );
      Object.defineProperty(response, "url", { value: reply.url ?? url });
      Object.defineProperty(response, "redirected", {
        value: reply.redirected ?? false,
      });
      return response;
    });
  };
  return {
    ...(await execute(
      absolute,
      source,
      () => clock,
      wire,
      true,
      () => clock,
    )),
    sent,
  };
}

if (path.resolve(process.argv[1] ?? "") === import.meta.filename) {
  cloudTwoUserMain()
    .then((result) => {
      console.log(
        result.outcome === "passed"
          ? "Cloud test completed; inspect retained manifest."
          : "Cloud test failed; inspect retained manifest.",
      );
      if (result.outcome !== "passed") process.exitCode = 1;
    })
    .catch(() => {
      console.error("Cloud two-user execution remains blocked.");
      process.exitCode = 1;
    });
}
