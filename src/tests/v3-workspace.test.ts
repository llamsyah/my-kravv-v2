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
    const calls = [], invalidations = [];
    const company = { id: "10000000-0000-4000-8000-000000000001", user_id: "20000000-0000-4000-8000-000000000001", name: "Nama tersimpan" };
    class FoundationError extends Error {}
    let failed = false;
    const client = {};
    const save = async (...args) => { calls.push(args); if (failed) throw new FoundationError("Gagal tersimpan."); return company; };
    const imports = {
      "next/cache": {revalidatePath: (value) => invalidations.push(value)},
      "../../server/auth/client.ts": {createSupabaseServerClient: async () => client},
      "../../server/foundation/service.ts": {createFoundationCompany:save, renameFoundationCompany:save, FoundationError},
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
    failed=true;
    const form = new FormData();form.set("name","Pertahankan input");
    assert.deepEqual(await exported.saveFoundationCompanyAction({error:null,company},form),{error:"Gagal tersimpan."});
    assert.equal(invalidations.length,2);
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
});
