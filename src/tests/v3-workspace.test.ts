import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import {
  companyInitials,
  findWorkspaceCompanies,
  selectedWorkspaceCompany,
  workspaceCompanySchema,
  workspaceHref,
  workspaceLocation,
} from "../features/v3-workspace/model.ts";

const company = {
  id: "10000000-0000-4000-8000-000000000001",
  user_id: "20000000-0000-4000-8000-000000000001",
  name: "Perusahaan Sintetis",
};
function render(props: object) {
  const result = spawnSync(
    process.execPath,
    [path.resolve("src/tests/helpers/v3-workspace-render.mjs")],
    { input: JSON.stringify(props), encoding: "utf8", timeout: 20000 },
  );
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}
test("V3 locations reject repeated/foreign route values and select only a supplied owned projection", () => {
  assert.deepEqual(
    workspaceLocation({ view: ["company", "new"], company: company.id }),
    { view: "home" },
  );
  assert.deepEqual(
    workspaceLocation({ view: "company", company: "../companies" }),
    { view: "company" },
  );
  assert.equal(
    selectedWorkspaceCompany(
      [company],
      workspaceLocation({ view: "company", company: company.id }),
    ),
    company,
  );
  assert.equal(
    selectedWorkspaceCompany([company], {
      view: "company",
      companyId: "30000000-0000-4000-8000-000000000001",
    }),
    undefined,
  );
  assert.equal(
    workspaceHref("company", company.id),
    "/foundation?view=company&company=" + company.id,
  );
  assert.equal(
    workspaceHref("company", "https://other.invalid"),
    "/foundation?view=company",
  );
  assert.equal(
    workspaceCompanySchema.safeParse({ ...company, name: "" }).success,
    false,
  );
});
test("Directory and switcher share case-insensitive bounded name search without mutating records", () => {
  const companies = [
    company,
    {
      ...company,
      id: "10000000-0000-4000-8000-000000000002",
      name: "Usaha Lain",
    },
  ];
  assert.deepEqual(findWorkspaceCompanies(companies, "  SINTETIS "), [company]);
  assert.deepEqual(findWorkspaceCompanies(companies, ""), companies);
  assert.deepEqual(findWorkspaceCompanies(companies, "tidak cocok"), []);
  assert.equal(companies[0].name, "Perusahaan Sintetis");
  assert.equal(companyInitials("  日本 株式 "), "日株");
  assert.equal(companyInitials("😀 Ruang"), "😀R");
});
test("Light-first V3 directory renders real navigation and an honest empty state without fabricated metrics", () => {
  const html = render({ companies: [], location: { view: "companies" } });
  assert.ok(html.includes('data-theme="light"'));
  assert.ok(html.includes('aria-label="Navigasi utama"'));
  assert.ok(html.includes("Mulai dari satu perusahaan."));
  assert.ok(html.includes("Tambah perusahaan pertama"));
  assert.ok(!html.includes("Diarsipkan"));
  assert.ok(!html.includes("Hapus perusahaan"));
});
test("Load failure and inaccessible-company states never render empty success or company data", () => {
  const failed = render({
    companies: [],
    location: { view: "companies" },
    failed: true,
  });
  assert.ok(failed.includes('role="alert"'));
  assert.ok(failed.includes("Perusahaan belum dapat dimuat."));
  assert.ok(!failed.includes("Mulai dari satu perusahaan."));
  const unavailable = render({
    companies: [company],
    location: {
      view: "company",
      companyId: "30000000-0000-4000-8000-000000000001",
    },
  });
  assert.ok(unavailable.includes("Ruang ini tidak dapat dibuka."));
  assert.ok(!unavailable.includes(company.name));
});
test("Owned overview exposes independent panels and name editing while future sections stay unavailable", () => {
  const html = render({
    companies: [company],
    location: { view: "company", companyId: company.id },
  });
  assert.ok(html.includes('aria-controls="v3-company-sidebar"'));
  assert.ok(html.includes('aria-controls="v3-company-context"'));
  assert.ok(html.includes("Ganti perusahaan"));
  assert.ok(html.includes("Ubah nama"));
  assert.ok(html.includes("Penghapusan perusahaan belum tersedia."));
  assert.ok(html.includes('aria-disabled="true"'));
  assert.ok(!html.includes("/thoughts"));
  assert.ok(!html.includes("/refinements"));
});
test("Create/edit render only the approved name contract, preserved labels and safe cancel destination", () => {
  for (const view of ["new", "edit"]) {
    const html = render({
      companies: [company],
      location: { view, companyId: company.id },
    });
    assert.ok(html.includes('name="name"'));
    assert.ok(html.includes('maxLength="200"'));
    assert.ok(html.includes("Ticker, bursa, sektor"));
    assert.ok(!html.includes('name="user_id"'));
    assert.ok(!html.includes('name="state"'));
    assert.ok(!html.includes('name="ticker"'));
    if (view === "edit")
      assert.ok(html.includes('value="Perusahaan Sintetis"'));
  }
});

test("Company action returns only confirmed service identity and never revalidates after a failed save", () => {
  const child = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    import assert from "node:assert/strict";
    import fs from "node:fs";
    import ts from "typescript";
    const calls = [], invalidations = [], metadataCalls = [], themeCalls = [];
    const company = { id: "10000000-0000-4000-8000-000000000001", user_id: "20000000-0000-4000-8000-000000000001", name: "Nama tersimpan" };
    class FoundationError extends Error {}
    let failed = false;
    const client = {};
    const save = async (...args) => { calls.push(args); if (failed) throw new FoundationError("Gagal tersimpan."); return company; };
    const imports = {
      "next/cache": {revalidatePath: (value) => invalidations.push(value)},
      "../../server/auth/client.ts": {createSupabaseServerClient: async () => client},
      "../../server/foundation/service.ts": {createFoundationCompany:save, renameFoundationCompany:save, FoundationError},
      "../../server/foundation/management.ts": {saveCompanyMetadata: async (...args) => { metadataCalls.push(args); return company; }, saveAccountTheme: async (...args) => { themeCalls.push(args); if (failed) throw Error("PRIVATE FAILURE"); return "dark"; }},
    };
    const source = fs.readFileSync("src/features/foundation/actions.ts","utf8");
    const output = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
    const exported = {};
    new Function("require","exports",output)((name) => {assert.ok(name in imports); return imports[name];},exported);
    for (const rename of [false,true]) {
      const form = new FormData();
      form.set("name","Nama baru");
      form.set("user_id","not-authority");
      if(rename) form.set("company_id",company.id);
      assert.deepEqual(await exported.saveFoundationCompanyAction({error:null},form),{error:null,company});
      assert.deepEqual(calls.at(-1),rename?[client,company.id,"Nama baru"]:[client,"Nama baru"]);
    }
    assert.deepEqual(invalidations,["/foundation","/foundation"]);
    const metadata = new FormData();
    for (const [key,value] of Object.entries({company_id:company.id,name:"Name",ticker:"SYN",exchange:"",sector:"",short_note:"Private synthetic note",user_id:"forged"})) metadata.set(key,value);
    assert.deepEqual(await exported.saveFoundationCompanyAction({error:null},metadata),{error:null,company});
    assert.deepEqual(metadataCalls,[[client,company.id,{name:"Name",ticker:"SYN",exchange:"",sector:"",short_note:"Private synthetic note"}]]);
    assert.deepEqual(await exported.saveFoundationThemeAction("dark"),{error:null,theme:"dark"});
    assert.deepEqual(themeCalls,[[client,"dark"]]);
    failed=true;
    const form = new FormData();form.set("name","Pertahankan input");
    assert.deepEqual(await exported.saveFoundationCompanyAction({error:null,company},form),{error:"Gagal tersimpan."});
    assert.equal(invalidations.length,4);
    const themeFailure=await exported.saveFoundationThemeAction("dark");
    assert.ok(themeFailure.error); assert.ok(!themeFailure.error.includes("PRIVATE FAILURE"));
    assert.equal(invalidations.length,4);
  `,
    ],
    { encoding: "utf8", timeout: 20000 },
  );
  assert.equal(child.status, 0, child.stderr);
});

test("Company directory open links have distinct accessible names", () => {
  const html = render({
    companies: [
      company,
      {
        ...company,
        id: "10000000-0000-4000-8000-000000000002",
        name: "Usaha lain",
      },
    ],
    location: { view: "companies" },
  });
  assert.ok(html.includes('aria-label="Buka ruang Perusahaan Sintetis"'));
  assert.ok(html.includes('aria-label="Buka ruang Usaha lain"'));
});

test("Managed company editor exposes optional bounded metadata only when the schema is available", () => {
  const directory = { query: "", page: 0, hasNext: false, metadataReady: true };
  const html = render({
    companies: [company],
    selectedCompany: {
      ...company,
      ticker: "SYN",
      exchange: null,
      sector: null,
      short_note: "Private synthetic note",
    },
    location: { view: "edit", companyId: company.id },
    directory,
  });
  for (const field of ["ticker", "exchange", "sector", "short_note"])
    assert.ok(html.includes(`name="${field}"`));
  assert.ok(html.includes('value="SYN"'));
  assert.ok(html.includes("Private synthetic note"));
  assert.ok(!html.includes('name="user_id"'));
  const legacy = render({
    companies: [company],
    location: { view: "edit", companyId: company.id },
  });
  assert.ok(!legacy.includes('name="ticker"'));
  assert.ok(legacy.includes("menunggu pembaruan skema"));
});

test("Server-paged switcher preserves selected company outside the result page and carries literal search", () => {
  const other = {
    ...company,
    id: "10000000-0000-4000-8000-000000000002",
    name: "Another company",
  };
  const html = render({
    companies: [other],
    selectedCompany: company,
    location: { view: "company", companyId: company.id },
    directory: { query: "SYN&x", page: 2, hasNext: true, metadataReady: true },
  });
  assert.ok(html.includes("Perusahaan Sintetis"));
  assert.ok(html.includes("Halaman pemilih perusahaan"));
  assert.ok(html.includes("page=3"));
  assert.ok(html.includes("q=SYN%26x"));
  assert.ok(html.includes("company=" + company.id));
  assert.ok(!html.includes("Ruang ini tidak dapat dibuka."));
});

test("Home integrates creation and compact owned-company shortcuts without fabricated dashboard modules", () => {
  const companies = Array.from({ length: 8 }, (_, index) => ({
    ...company,
    id: "10000000-0000-4000-8000-" + String(index + 1).padStart(12, "0"),
    name: "Perusahaan " + (index + 1),
  }));
  const html = render({ companies, location: { view: "home" } });
  assert.ok(html.includes("Ruang berpikirmu,"));
  assert.ok(html.includes("lebih terarah."));
  assert.equal((html.match(/aria-label="Buka ruang /g) ?? []).length, 6);
  assert.ok(html.includes("Lihat seluruh perusahaan di direktori"));
  const section = html.match(
    /<section[^>]*data-dashboard-module="companies"[\s\S]*?<\/section>/,
  )?.[0];
  assert.ok(section?.includes("Tambah perusahaan"));
  assert.ok(section?.includes("Cari nama perusahaan"));
  assert.ok(!html.includes("Ada perusahaan yang ingin kamu pahami?"));
  assert.ok(!html.includes("homeAside"));
  assert.ok(!html.includes("Quick Capture"));
  assert.ok(!html.includes("Inbox"));
  assert.ok(!html.includes("AI review"));
  assert.ok(!/<img[\s>]/.test(html));
});

test("Workspace integrates sidebar controls and keeps optional context and future destinations disclosed", () => {
  const html = render({
    companies: [company],
    location: { view: "company", companyId: company.id },
  });
  const sidebar = html.match(
    /<aside[^>]*aria-label="Sidebar perusahaan"[\s\S]*?<\/aside>/,
  )?.[0];
  assert.ok(sidebar?.includes('aria-label="Tutup navigasi perusahaan"'));
  assert.ok(sidebar?.includes('aria-label="Ganti perusahaan"'));
  assert.ok(sidebar?.includes('aria-label="Navigasi perusahaan"'));
  assert.match(html, /<aside[^>]*id="v3-company-context"[^>]*hidden=""/);
  assert.match(html, /<details[^>]*><summary>[^<]*<svg[\s\S]*?Area penelitian/);
  assert.equal((html.match(/aria-disabled="true"/g) ?? []).length, 4);
  assert.ok(!html.includes("Sembunyikan navigasi"));
  assert.ok(!html.includes("Sembunyikan konteks"));
  assert.ok(!html.includes("Segera hadir"));
  assert.ok(html.includes('<summary aria-label="Akun">'));
});

test("Sidebar session preference survives module navigation and fails safely without storage", () => {
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    import assert from "node:assert/strict";
    const values = new Map();
    globalThis.window = { sessionStorage: {
      getItem: key => values.get(key) ?? null,
      setItem: (key,value) => values.set(key,value),
    }};
    const first = await import("./src/features/v3-workspace/sidebar-preference.ts?first");
    assert.equal(first.readSidebarPreference(), true);
    let notifications = 0;
    const unsubscribe = first.subscribeSidebarPreference(() => notifications++);
    first.setSidebarPreference(false);
    assert.equal(first.readSidebarPreference(), false);
    assert.equal(notifications, 1);
    assert.deepEqual([...values], [["my-kravv:v3:company-sidebar", "closed"]]);
    const remounted = await import("./src/features/v3-workspace/sidebar-preference.ts?remount");
    assert.equal(remounted.readSidebarPreference(), false);
    remounted.setSidebarPreference(true);
    const reopened = await import("./src/features/v3-workspace/sidebar-preference.ts?reopen");
    assert.equal(reopened.readSidebarPreference(), true);
    unsubscribe();
    first.setSidebarPreference(true);
    assert.equal(notifications, 1);
    window.sessionStorage.getItem = () => { throw Error("Storage unavailable"); };
    window.sessionStorage.setItem = () => { throw Error("Storage unavailable"); };
    const restricted = await import("./src/features/v3-workspace/sidebar-preference.ts?restricted");
    assert.equal(restricted.readSidebarPreference(), true);
    restricted.setSidebarPreference(false);
    assert.equal(restricted.readSidebarPreference(), false);
    // A blocked write must not leave an old stored value in control.
    window.sessionStorage.getItem = () => "open";
    assert.equal(restricted.readSidebarPreference(), false);
    window.sessionStorage.getItem = () => "not-a-boolean";
    const malformed = await import("./src/features/v3-workspace/sidebar-preference.ts?malformed");
    assert.equal(malformed.readSidebarPreference(), true);
  `,
    ],
    { encoding: "utf8", timeout: 10000 },
  );
  assert.equal(result.status, 0, result.stderr);
});

test("Directory return and sidebar collapse/reopen preserve independent navigation semantics", () => {
  const result = spawnSync(
    process.execPath,
    ["src/tests/helpers/v3-navigation-interaction.mjs"],
    { encoding: "utf8", timeout: 10000 },
  );
  assert.equal(result.status, 0, result.stderr);
});

test("Mobile drawer cycles visible keyboard controls and ignores hidden disclosure content", () => {
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    import assert from "node:assert/strict";
    import fs from "node:fs";
    import ts from "typescript";
    const source = fs.readFileSync("src/features/v3-workspace/company-sidebar.tsx", "utf8");
    const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
    const exported = {};
    new Function("require", "exports", output)(() => ({}), exported);
    let focused = null, prevented = false;
    const control = visible => ({ getClientRects: () => visible ? [{}] : [], focus() { focused = this; } });
    const first = control(true), hidden = control(false), middle = control(true), last = control(true);
    const dialog = { querySelectorAll: () => [first, hidden, middle, last], ownerDocument: { activeElement: last }, focus() { focused = this; } };
    const event = { key: "Tab", shiftKey: false, currentTarget: dialog, preventDefault() { prevented = true; } };
    exported.cycleDrawerFocus(event);
    assert.equal(prevented, true); assert.equal(focused, first);
    prevented = false; event.shiftKey = true; dialog.ownerDocument.activeElement = first;
    exported.cycleDrawerFocus(event);
    assert.equal(prevented, true); assert.equal(focused, last);
    prevented = false; focused = null; event.shiftKey = false; dialog.ownerDocument.activeElement = middle;
    exported.cycleDrawerFocus(event);
    assert.equal(prevented, false); assert.equal(focused, null);
    dialog.querySelectorAll = () => [hidden];
    exported.cycleDrawerFocus(event);
    assert.equal(prevented, true); assert.equal(focused, dialog);
  `,
    ],
    { encoding: "utf8", timeout: 10000 },
  );
  assert.equal(result.status, 0, result.stderr);
});

test("Isolated interactive preview compiles actual UI with mocked boundaries and exits without a server", () => {
  const result = spawnSync(
    process.execPath,
    ["scripts/v3/ui-preview.mjs", "--check"],
    { encoding: "utf8", timeout: 30000 },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes("no server or backend started"));
  const refused = spawnSync(
    process.execPath,
    ["scripts/v3/ui-preview.mjs", "--target=https://other.invalid"],
    { encoding: "utf8", timeout: 10000 },
  );
  assert.notEqual(refused.status, 0);
  assert.ok(!refused.stdout.includes("Synthetic UI preview:"));
  const combined = spawnSync(
    process.execPath,
    ["scripts/v3/ui-preview.mjs", "--port=3105", "--check"],
    { encoding: "utf8", timeout: 10000 },
  );
  assert.notEqual(combined.status, 0);
  assert.ok(!combined.stdout.includes("Synthetic UI preview:"));
});
