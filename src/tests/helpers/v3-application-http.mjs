// Test-only loopback HTTP adapter. Real route/actions/services; synthetic SDK and
// Next request APIs. This is NOT a Next server or its Server Action wire protocol.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { AsyncLocalStorage } from "node:async_hooks";
import { createRequire } from "node:module";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const root = process.cwd(),
  require = createRequire(path.join(root, "package.json"));
const { NextRequest } = require("next/server");
const contexts = new AsyncLocalStorage(),
  modules = new Map(),
  journal = [];
const cookieName = "offline-session";
const users = {
  A: { id: "20000000-0000-4000-8000-000000000001" },
  B: { id: "20000000-0000-4000-8000-000000000002" },
};
const rows = [];
let sequence = 100;
const id = (n) => `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
for (const actor of ["A", "B"])
  for (let i = 0; i < (actor === "A" ? 26 : 2); i++)
    rows.push({
      id: id(actor === "A" ? i + 1 : i + 51),
      user_id: users[actor].id,
      name: `${actor}-PRIVATE-${String(i + 1).padStart(2, "0")}`,
      ticker: `${actor}T${i + 1}`,
      exchange: null,
      sector: null,
      short_note: null,
      created_at: new Date(1700000000000 + i).toISOString(),
      updated_at: new Date(1700000000000 + i).toISOString(),
    });
const settings = [
  { user_id: users.A.id, theme: "dark" },
  { user_id: users.B.id, theme: "light" },
];
let externalRequests = 0;
const localFetch = globalThis.fetch;
globalThis.fetch = async () => {
  externalRequests++;
  throw Error("External network forbidden in offline application acceptance");
};
const ctx = () => {
  const c = contexts.getStore();
  if (!c) throw Error("No synthetic HTTP request context");
  return c;
};
function fakeSdk(_url, _key, options) {
  const c = ctx();
  const actor = () => {
    const value = options.cookies
      .getAll()
      .find((v) => v.name === cookieName)?.value;
    return value === "expired"
      ? "A"
      : ["A", "B"].includes(value)
        ? value
        : undefined;
  };
  const user = () => users[actor()];
  return {
    auth: {
      getClaims: async () => {
        if (c.failure === "claims") throw Error("PRIVATE PROVIDER DETAIL");
        if (options.cookies.getAll().some((v) => v.value === "expired"))
          options.cookies.setAll(
            [
              {
                name: cookieName,
                value: "A",
                options: { httpOnly: true, path: "/" },
              },
            ],
            { "Cache-Control": "private, no-store" },
          );
        return {
          data: { claims: user() ? { sub: user().id } : null },
          error: null,
        };
      },
      getUser: async () => ({
        data: { user: c.failure === "user" ? null : (user() ?? null) },
        error: null,
      }),
      signInWithPassword: async (input) => {
        const key = ["A", "B"].find(
          (k) =>
            input.email === `offline-${k.toLowerCase()}@example.invalid` &&
            input.password === `offline-password-${k}`,
        );
        if (!key || c.failure === "login")
          return { error: { status: 400, message: "PRIVATE AUTH DETAIL" } };
        options.cookies.setAll([
          {
            name: cookieName,
            value: key,
            options: { httpOnly: true, path: "/" },
          },
        ]);
        return { error: null };
      },
      signOut: async () => {
        if (c.failure === "logout")
          return { error: { message: "PRIVATE AUTH DETAIL" } };
        options.cookies.setAll([
          {
            name: cookieName,
            value: "",
            options: { httpOnly: true, path: "/", maxAge: 0 },
          },
        ]);
        return { error: null };
      },
    },
    rpc: async (name, args) => {
      journal.push({ actor: actor(), rpc: name, args });
      if (name === "v3_company_management_contract")
        return c.failure === "capability"
          ? { data: null, error: { code: "unexpected" } }
          : { data: 1, error: null };
      if (name !== "v3_company_directory")
        throw Error("Unreviewed synthetic RPC");
      if (c.failure === "directory")
        return { data: null, error: { message: "PRIVATE DB DETAIL" } };
      const result = rows
        .filter(
          (r) =>
            r.user_id === user()?.id &&
            (r.name.toLowerCase().includes(args.p_query.toLowerCase()) ||
              r.ticker?.toLowerCase().includes(args.p_query.toLowerCase())),
        )
        .sort(
          (a, b) =>
            a.created_at.localeCompare(b.created_at) ||
            a.id.localeCompare(b.id),
        );
      return {
        data:
          c.failure === "foreign"
            ? [rows.find((r) => r.user_id !== user()?.id)]
            : result.slice(args.p_page * 24, args.p_page * 24 + 25),
        error: null,
      };
    },
    from(table) {
      if (!["companies", "user_settings"].includes(table))
        throw Error("Unreviewed synthetic table");
      const filters = [],
        orders = [];
      let columns = "*",
        mode = "read",
        input,
        range,
        limit,
        single = false;
      const execute = () => {
        journal.push({
          actor: actor(),
          table,
          mode,
          filters: [...filters],
          columns,
          ...(input ? { input: { ...input } } : {}),
        });
        if (!user()) return { data: null, error: { message: "Unauthorized" } };
        if (
          (c.failure === "write" && mode !== "read") ||
          (c.failure === "theme" && table === "user_settings")
        )
          return { data: null, error: { message: "PRIVATE DB DETAIL" } };
        const store = table === "companies" ? rows : settings;
        let found = store.filter(
          (r) =>
            r.user_id === user().id &&
            filters.every(([key, value]) => r[key] === value),
        );
        if (mode === "insert") {
          if (input.user_id !== user().id)
            return { data: null, error: { message: "PRIVATE RLS DETAIL" } };
          const record =
            table === "companies"
              ? {
                  id: id(++sequence),
                  ticker: null,
                  exchange: null,
                  sector: null,
                  short_note: null,
                  created_at: new Date(1800000000000 + sequence).toISOString(),
                  updated_at: new Date(1800000000000 + sequence).toISOString(),
                  ...input,
                }
              : { ...input };
          store.push(record);
          found = [record];
        }
        if (mode === "update") for (const r of found) Object.assign(r, input);
        for (const key of orders.toReversed())
          found.sort((a, b) => String(a[key]).localeCompare(String(b[key])));
        if (range) found = found.slice(range[0], range[1] + 1);
        if (limit) found = found.slice(0, limit);
        const project = (r) =>
          columns === "*"
            ? { ...r }
            : Object.fromEntries(columns.split(",").map((k) => [k, r[k]]));
        const data = found.map(project);
        return { data: single ? (data[0] ?? null) : data, error: null };
      };
      const builder = {
        select(v) {
          columns = v;
          return this;
        },
        eq(k, v) {
          filters.push([k, v]);
          return this;
        },
        order(k) {
          orders.push(k);
          return this;
        },
        range(a, b) {
          range = [a, b];
          return this;
        },
        limit(n) {
          limit = n;
          return this;
        },
        insert(v) {
          mode = "insert";
          input = v;
          return this;
        },
        update(v) {
          mode = "update";
          input = v;
          return this;
        },
        single() {
          single = true;
          return Promise.resolve(execute());
        },
        maybeSingle() {
          single = true;
          return Promise.resolve(execute());
        },
        then(resolve, reject) {
          return Promise.resolve(execute()).then(resolve, reject);
        },
      };
      return builder;
    },
  };
}
class Redirect extends Error {
  constructor(location) {
    super("Synthetic Next redirect");
    this.location = location;
  }
}
function load(file) {
  file = path.resolve(file);
  if (modules.has(file)) return modules.get(file).exports;
  const loadedModule = { exports: {} };
  modules.set(file, loadedModule);
  const customRequire = (name) => {
    if (name === "server-only") return {};
    if (name === "@supabase/ssr") return { createServerClient: fakeSdk };
    if (name === "next/headers") return { cookies: async () => ctx().cookies };
    if (name === "next/cache")
      return { revalidatePath: (...args) => ctx().invalidations.push(args) };
    if (name === "next/navigation")
      return {
        redirect: (url) => {
          throw new Redirect(url);
        },
        useRouter: () => ({ replace() {}, refresh() {}, push() {} }),
      };
    if (name === "next/link")
      return {
        __esModule: true,
        default: ({ children, ...props }) =>
          React.createElement("a", props, children),
      };
    if (name.endsWith(".module.css"))
      return {
        __esModule: true,
        default: new Proxy({}, { get: (_, key) => String(key) }),
      };
    if (name.startsWith(".") || name.startsWith("@/")) {
      const base = name.startsWith("@/")
        ? path.join(root, "src", name.slice(2))
        : path.resolve(path.dirname(file), name);
      const target = [base, base + ".ts", base + ".tsx"].find((p) =>
        fs.existsSync(p),
      );
      if (!target) throw Error("Missing offline source module");
      if (target === path.join(root, "src/lib/env/public.ts"))
        return {
          getPublicSupabaseTarget: () => ({
            url: "https://offline.invalid",
            publishableKey: "sb_publishable_offline_only",
            cookieName,
          }),
        };
      if (target === path.join(root, "src/server/auth/v3-target.ts"))
        return {
          verifyV3DatabaseTarget: async () => {
            if (ctx().failure === "identity")
              throw Error("Synthetic identity refusal");
          },
        };
      return load(target);
    }
    return require(name);
  };
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  new Function("require", "module", "exports", output)(
    customRequire,
    loadedModule,
    loadedModule.exports,
  );
  return loadedModule.exports;
}
const proxy = load("src/server/auth/proxy.ts").updateSession;
const page = load("src/app/foundation/page.tsx");
const authPage = load("src/app/auth/page.tsx").default;
const auth = load("src/features/auth/actions.ts"),
  actions = load("src/features/foundation/actions.ts");
assert.equal(page.dynamic, "force-dynamic");
const captures = [];
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`),
    cookieValues = new Map(
      (req.headers.cookie ?? "")
        .split(";")
        .filter(Boolean)
        .map((v) => v.trim().split("=")),
    );
  const responseCookies = [],
    invalidations = [];
  const context = {
    failure: req.headers["x-offline-failure"],
    invalidations,
    cookies: {
      getAll: () => [...cookieValues].map(([name, value]) => ({ name, value })),
      set: (name, value, options) => {
        cookieValues.set(name, value);
        responseCookies.push(
          `${name}=${value}; Path=/; HttpOnly${options?.maxAge === 0 ? "; Max-Age=0" : ""}`,
        );
      },
    },
  };
  await contexts.run(context, async () => {
    try {
      // Exercise the real proxy on product GET paths; action dispatch below is a
      // synthetic HTTP adapter, not a substitute for Next's CSRF/action protocol.
      if (req.method === "GET") {
        const request = new NextRequest(url, { headers: req.headers });
        const response = await proxy(request);
        for (const cookie of response.cookies.getAll()) {
          cookieValues.set(cookie.name, cookie.value);
          responseCookies.push(
            `${cookie.name}=${cookie.value}; Path=/; HttpOnly`,
          );
        }
        res.setHeader("Cache-Control", response.headers.get("Cache-Control"));
        if (response.headers.has("location") || response.status !== 200) {
          res.writeHead(response.status, {
            ...(response.headers.has("location")
              ? { Location: response.headers.get("location") }
              : {}),
          });
          res.end(await response.text());
          return;
        }
        const search = {};
        for (const key of new Set(url.searchParams.keys())) {
          const values = url.searchParams.getAll(key);
          search[key] = values.length === 1 ? values[0] : values;
        }
        const element =
          url.pathname === "/auth"
            ? await authPage()
            : await page.default({ searchParams: Promise.resolve(search) });
        captures.push({ key: element.key, props: element.props });
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Set-Cookie", responseCookies);
        res.end(renderToStaticMarkup(element));
        return;
      }
      res.setHeader("Cache-Control", "private, no-store");
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 16384) throw Error("Oversized synthetic form");
      }
      const form = new FormData();
      for (const [k, v] of new URLSearchParams(body)) form.append(k, v);
      let result;
      if (url.pathname === "/__offline/login")
        result = await auth.login({ error: null }, form);
      else if (url.pathname === "/__offline/logout")
        result = await auth.logout();
      else if (url.pathname === "/__offline/company")
        result = await actions.saveFoundationCompanyAction(
          { error: null },
          form,
        );
      else if (url.pathname === "/__offline/theme")
        result = await actions.saveFoundationThemeAction(form.get("theme"));
      else {
        res.writeHead(404);
        res.end();
        return;
      }
      res.setHeader("Set-Cookie", responseCookies);
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result));
    } catch (error) {
      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("Set-Cookie", responseCookies);
      if (error instanceof Redirect) {
        res.writeHead(req.method === "POST" ? 303 : 307, {
          Location: error.location,
        });
        res.end();
      } else {
        res.writeHead(500);
        res.end("Offline application request failed");
      }
    } finally {
      context.lastInvalidations = invalidations;
      captures.push({ invalidations });
    }
  });
});
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
const origin = `http://127.0.0.1:${server.address().port}`;
let requests = 0,
  assertions = 0;
const check = (condition, message) => {
  assert.ok(condition, message);
  assertions++;
};
async function request(
  route,
  { actor, method = "GET", form, failure, cookie } = {},
) {
  requests++;
  const response = await localFetch(origin + route, {
    method,
    redirect: "manual",
    headers: {
      ...(actor
        ? { Cookie: `${cookieName}=${actor}` }
        : { ...(cookie ? { Cookie: cookie } : {}) }),
      ...(failure ? { "x-offline-failure": failure } : {}),
      ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    ...(form ? { body: new URLSearchParams(form) } : {}),
  });
  const text = await response.text();
  check(
    response.headers.get("cache-control")?.includes("no-store") &&
      response.headers.get("cache-control")?.includes("private"),
    "Every HTTP response is private/no-store",
  );
  return { response, text, json: () => JSON.parse(text) };
}
try {
  let r = await request("/foundation?view=companies");
  check(
    r.response.status === 307 &&
      new URL(r.response.headers.get("location")).pathname === "/auth",
    "Unauthenticated redirect",
  );
  check(!r.text.includes("PRIVATE"));
  r = await request("/auth");
  check(r.text.includes("Kembali ke"));
  r = await request("/foundation", { actor: "invalid" });
  check(r.response.status === 307);
  r = await request("/foundation", { actor: "A", failure: "identity" });
  check(r.response.status === 503);
  check(!r.text.includes("PRIVATE"));
  r = await request("/foundation", { actor: "A", failure: "claims" });
  check(r.response.status === 307);
  r = await request("/foundation", { actor: "A", failure: "user" });
  check(
    r.response.status === 307,
    "getClaims cannot substitute for verified user",
  );
  r = await request("/companies", { actor: "A" });
  check(r.response.status === 404, "Legacy route unavailable");
  r = await request("/", { actor: "A" });
  check(
    r.response.status === 307 &&
      new URL(r.response.headers.get("location")).pathname === "/foundation",
  );
  r = await request("/foundation", { actor: "expired" });
  check(
    r.response.headers.get("set-cookie")?.includes("offline-session=A"),
    "Proxy refresh cookies forwarded",
  );
  r = await request("/__offline/login", {
    method: "POST",
    form: { email: "bad", password: "" },
  });
  check(!!r.json().error);
  check(!r.text.includes("PRIVATE AUTH"));
  r = await request("/__offline/login", {
    method: "POST",
    form: { email: "offline-a@example.invalid", password: "wrong" },
  });
  check(!!r.json().error);
  r = await request("/__offline/login", {
    method: "POST",
    form: {
      email: "offline-a@example.invalid",
      password: "offline-password-A",
    },
  });
  check(
    r.response.status === 303 &&
      r.response.headers.get("location") === "/foundation",
  );
  check(r.response.headers.get("set-cookie")?.includes("offline-session=A"));
  check(
    captures
      .at(-1)
      .invalidations.some((v) => v[0] === "/" && v[1] === "layout"),
  );
  r = await request("/foundation?view=companies", { actor: "A" });
  check(r.text.includes("A-PRIVATE-01") && !r.text.includes("B-PRIVATE"));
  check(!r.text.includes("A-PRIVATE-25"), "24 visible rows");
  check(r.text.includes("page=1"));
  check(r.text.includes('data-theme="dark"'));
  const keyA = captures.at(-2).key;
  check(keyA === users.A.id, "Workspace keyed to verified identity");
  r = await request("/foundation?view=companies&page=1", { actor: "A" });
  check(r.text.includes("A-PRIVATE-25") && !r.text.includes("A-PRIVATE-01"));
  r = await request(
    `/foundation?view=company&company=${id(1)}&q=A-PRIVATE-26&page=0`,
    { actor: "A" },
  );
  check(
    r.text.includes("A-PRIVATE-01"),
    "Selected company independent of result page",
  );
  r = await request("/foundation?view=companies&q=at26", { actor: "A" });
  check(r.text.includes("A-PRIVATE-26") && !r.text.includes("A-PRIVATE-01"));
  r = await request("/foundation?view=companies&q=x&q=y&page=-1", {
    actor: "A",
  });
  check(r.text.includes("A-PRIVATE-01"), "Ambiguous search falls back safely");
  r = await request(`/foundation?view=company&company=${id(1)}`, {
    actor: "B",
  });
  check(
    r.text.includes("Ruang ini tidak dapat dibuka.") &&
      !r.text.includes("A-PRIVATE"),
  );
  r = await request("/__offline/company", {
    method: "POST",
    form: { name: "No anonymous write" },
  });
  check(!!r.json().error);
  r = await request("/__offline/company", {
    actor: "A",
    method: "POST",
    form: {
      name: " Created locally ",
      ticker: "TST",
      exchange: "IDX",
      sector: "Synthetic",
      short_note: "offline note",
      user_id: users.B.id,
    },
  });
  check(
    r.json().company.user_id === users.A.id &&
      r.json().company.name === "Created locally",
  );
  const created = r.json().company;
  r = await request("/__offline/company", {
    actor: "A",
    method: "POST",
    form: { company_id: created.id, name: "Renamed locally" },
  });
  check(r.json().company.name === "Renamed locally");
  r = await request("/__offline/company", {
    actor: "A",
    method: "POST",
    form: {
      company_id: created.id,
      name: "Updated locally",
      ticker: "",
      exchange: "",
      sector: "",
      short_note: "",
    },
  });
  check(
    r.json().company.ticker === null && r.json().company.short_note === null,
  );
  r = await request("/__offline/company", {
    actor: "B",
    method: "POST",
    form: { company_id: created.id, name: "Forbidden rename" },
  });
  check(!!r.json().error);
  check(rows.find((v) => v.id === created.id).name === "Updated locally");
  check(captures.at(-1).invalidations.length === 0);
  const before = journal.filter((v) => v.mode === "update").length;
  r = await request("/__offline/company", {
    actor: "A",
    method: "POST",
    form: {
      company_id: created.id,
      name: "Invalid metadata",
      ticker: "x".repeat(33),
      exchange: "",
      sector: "",
      short_note: "",
    },
  });
  check(!!r.json().error);
  check(journal.filter((v) => v.mode === "update").length === before);
  r = await request("/__offline/company", {
    actor: "A",
    method: "POST",
    failure: "write",
    form: { company_id: created.id, name: "Unconfirmed" },
  });
  check(!!r.json().error && !r.text.includes("PRIVATE DB"));
  check(captures.at(-1).invalidations.length === 0);
  r = await request("/__offline/theme", {
    actor: "A",
    method: "POST",
    form: { theme: "light" },
  });
  check(r.json().theme === "light");
  r = await request("/foundation?view=companies", { actor: "A" });
  check(r.text.includes('data-theme="light"'));
  r = await request("/__offline/theme", {
    actor: "B",
    method: "POST",
    form: { theme: "dark" },
  });
  check(r.json().theme === "dark");
  r = await request("/foundation?view=companies", { actor: "B" });
  check(
    r.text.includes('data-theme="dark"') &&
      r.text.includes("B-PRIVATE") &&
      !r.text.includes("A-PRIVATE") &&
      !r.text.includes("Updated locally"),
  );
  check(captures.at(-2).key === users.B.id && captures.at(-2).key !== keyA);
  r = await request("/__offline/theme", {
    actor: "B",
    method: "POST",
    failure: "write",
    form: { theme: "light" },
  });
  check(!!r.json().error);
  check(captures.at(-1).invalidations.length === 0);
  for (const failure of ["directory", "capability", "foreign", "theme"]) {
    r = await request(`/foundation?view=company&company=${id(1)}`, {
      actor: "A",
      failure,
    });
    check(r.text.includes("Perusahaan belum dapat dimuat."));
    check(
      !r.text.includes("A-PRIVATE"),
      "No partial company projection after failed load",
    );
  }
  r = await request("/__offline/logout", {
    actor: "A",
    method: "POST",
    failure: "logout",
  });
  check(!!r.json().error);
  check(captures.at(-1).invalidations.length === 0);
  r = await request("/__offline/logout", { actor: "A", method: "POST" });
  check(
    r.response.status === 303 && r.response.headers.get("location") === "/auth",
  );
  check(r.response.headers.get("set-cookie")?.includes("Max-Age=0"));
  check(
    captures
      .at(-1)
      .invalidations.some((v) => v[0] === "/" && v[1] === "layout"),
  );
  r = await request("/foundation?view=companies");
  check(r.response.status === 307 && !r.text.includes("PRIVATE"));
  // Follow real action Set-Cookie responses through logout/login, rather than
  // merely constructing two independent authenticated GET requests.
  r = await request("/__offline/login", {
    method: "POST",
    form: {
      email: "offline-b@example.invalid",
      password: "offline-password-B",
    },
  });
  check(r.response.status === 303);
  const cookieB = r.response.headers.get("set-cookie").split(";")[0];
  r = await request("/foundation?view=companies", { cookie: cookieB });
  check(
    r.text.includes("B-PRIVATE") &&
      !r.text.includes("A-PRIVATE") &&
      !r.text.includes("Updated locally"),
  );
  check(
    r.text.includes('data-theme="dark"') && captures.at(-2).key === users.B.id,
  );
  r = await request("/__offline/logout", { cookie: cookieB, method: "POST" });
  check(
    r.response.status === 303 &&
      r.response.headers.get("set-cookie").includes("Max-Age=0"),
  );
  r = await request("/foundation?view=companies");
  check(r.response.status === 307);
  r = await request("/__offline/login", {
    method: "POST",
    form: {
      email: "offline-a@example.invalid",
      password: "offline-password-A",
    },
  });
  check(r.response.status === 303);
  const cookieA = r.response.headers.get("set-cookie").split(";")[0];
  r = await request("/foundation?view=companies", { cookie: cookieA });
  check(r.text.includes("A-PRIVATE") && !r.text.includes("B-PRIVATE"));
  check(r.text.includes('data-theme="light"') && captures.at(-2).key === keyA);
  const switched = await Promise.all([
    request("/foundation?view=companies", { actor: "A" }),
    request("/foundation?view=companies", { actor: "B" }),
  ]);
  check(
    !switched[0].text.includes("B-PRIVATE") &&
      !switched[1].text.includes("A-PRIVATE"),
    "Concurrent HTTP request isolation",
  );
  for (const call of journal.filter((v) => v.table && v.mode !== "insert")) {
    check(
      call.filters.some(
        ([k, v]) => k === "user_id" && v === users[call.actor].id,
      ),
      "Real services explicitly constrain owner",
    );
  }
  check(externalRequests === 0);
  console.log(
    JSON.stringify({
      outcome: "PASS",
      requests,
      assertions,
      externalRequests,
      realNextRuntime: false,
      accountKeysDistinct: true,
    }),
  );
} finally {
  globalThis.fetch = localFetch;
  await new Promise((resolve) => server.close(resolve));
  server.closeAllConnections();
}
