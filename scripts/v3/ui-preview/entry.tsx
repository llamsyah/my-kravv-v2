import { emptyCompanyResearch } from "../../../src/features/v3-workspace/company-research-contract";
import { configureWritingPreview } from "./mocks";
import { createRoot } from "react-dom/client";
import { V3Workspace } from "../../../src/features/v3-workspace/workspace";
import { workspaceLocation } from "../../../src/features/v3-workspace/model";
import Loading from "../../../src/app/foundation/loading";
import {
  parseDirectorySearch,
  parseDirectorySort,
  directoryPageSize,
  themeSchema,
} from "../../../src/features/v3-workspace/management-contract";
import { findWorkspaceCompanies } from "../../../src/features/v3-workspace/model";
const owner = "20000000-0000-4000-8000-000000000001";
const companies = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    user_id: owner,
    name: "Nusantara Industri",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    user_id: owner,
    name: "Cakrawala Konsumer",
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    user_id: owner,
    name: "Arunika Infrastruktur",
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    user_id: owner,
    name: "Lestari Teknologi",
  },
];
const search = Object.fromEntries(new URLSearchParams(window.location.search));
if (search.state === "long-name")
  companies[0].name =
    "Perusahaan dengan nama panjang untuk memeriksa tata letak responsif";
const metadataReady = search.state !== "legacy";
const enriched = companies.map((company, index) => ({
  ...company,
  created_at: `2026-10-${String(20 + index).padStart(2, "0")}T04:00:00.000Z`,
  updated_at: `2026-10-${String(24 + index).padStart(2, "0")}T06:30:00.000Z`,
  ticker: "SIM" + (index + 1),
  exchange: "Bursa sintetis",
  sector: "Sektor contoh",
  short_note: "Catatan sintetis untuk pemeriksaan antarmuka.",
}));
const all =
  search.state === "many"
    ? Array.from({ length: 55 }, (_, index) => ({
        ...enriched[index % enriched.length],
        id: "10000000-0000-4000-8000-" + String(index + 1).padStart(12, "0"),
        name: "Perusahaan Sintetis " + (index + 1),
        ticker: "SIM" + (index + 1),
      }))
    : metadataReady
      ? enriched
      : companies;
const directory = parseDirectorySearch(search);
const sort =
  search.view === "companies" ? parseDirectorySort(search.sort) : undefined;
const matching = findWorkspaceCompanies(all, directory.query);
if (sort)
  matching.sort((a, b) => {
    const key =
      sort === "name"
        ? "name"
        : sort === "created"
          ? "created_at"
          : "updated_at";
    const value = String(a[key as keyof typeof a] ?? "").localeCompare(
      String(b[key as keyof typeof b] ?? ""),
      "id",
    );
    return (sort === "updated" ? -value : value) || a.id.localeCompare(b.id);
  });
const items = matching.slice(
  directory.page * directoryPageSize,
  (directory.page + 1) * directoryPageSize,
);
const previewCompany =
  search.company ??
  (search.view === "research" &&
  search.draft === "50000000-0000-4000-8000-000000000001"
    ? companies[0].id
    : undefined);
const selectedCompany =
  search.state === "writing-independent"
    ? undefined
    : all.find((company) => company.id === previewCompany);
const hasCompanyResearch =
  selectedCompany?.id === companies[0].id && search.state !== "research-empty";
const previewSelected =
  selectedCompany &&
  (search.view === "company" ||
    search.view === "research" ||
    search.view === "edit")
    ? {
        ...selectedCompany,
        short_note:
          "Catatan sintetis: telusuri perubahan margin, biaya distribusi, dan bauran produk sebelum menyusun kesimpulan. Fokus riset saat ini adalah memeriksa asumsi dan mencari bukti pembanding. Ini bukan fakta pasar atau tesis investasi.",
      }
    : selectedCompany;
const previewVersionIndex = [1, 2, 3].findIndex(
  (n) =>
    search.version === "60000000-0000-4000-8000-" + String(n).padStart(12, "0"),
);
const writingDemo = search.state?.startsWith("writing-");
const writingDraft = {
  id: search.draft ?? "50000000-0000-4000-8000-000000000001",
  user_id: owner,
  title: search.draft?.endsWith("2")
    ? "Pertanyaan tentang alokasi modal"
    : "Analisis fundamental — riset sintetis",
  body: "## Identitas & model bisnis\n\nCatatan sintetis: saya ingin memahami bagaimana bisnis menghasilkan pendapatan dan apa yang menjaga ketahanannya.\n\nPerubahan margin belum dapat dianggap berkelanjutan tanpa memeriksa biaya, volume, dan bauran produk.\n\n### Pertanyaan berikutnya\n\n- Bukti apa yang mendukung asumsi ini?\n- Penjelasan alternatif apa yang perlu diuji?",
  mode: (search.state === "writing-guided" ? "guided" : "assisted") as
    "guided" | "assisted",
  company_id: search.state === "writing-independent" ? null : companies[0].id,
  source_capture_id:
    search.state === "writing-capture"
      ? "30000000-0000-4000-8000-000000000001"
      : null,
  revision: 1,
  created_at: "2026-10-28T04:00:00Z",
  updated_at: "2026-10-28T04:00:00Z",
};
if (search.state === "writing-guided")
  writingDraft.body =
    "Catatan sintetis: saya ingin memahami lini bisnis utama, struktur pendapatan, serta biaya yang menentukan margin. Perubahan satu periode belum cukup untuk menyimpulkan ketahanan bisnis. Saya perlu membandingkan beberapa periode dan mencari bukti yang dapat membantah asumsi awal.";
if (writingDemo) configureWritingPreview(writingDraft);
const theme = themeSchema.safeParse(
  window.localStorage.getItem("my-kravv:v3:preview-account-theme"),
);
createRoot(document.getElementById("preview")!).render(
  search.state === "loading" ? (
    <Loading />
  ) : (
    <V3Workspace
      companies={
        search.state === "empty" || search.state === "error" ? [] : items
      }
      selectedCompany={
        search.state === "empty" || search.state === "error"
          ? null
          : (previewSelected ?? null)
      }
      directory={{
        ...directory,
        sort,
        metadataReady,
        hasNext: matching.length > (directory.page + 1) * directoryPageSize,
      }}
      initialTheme={theme.success ? theme.data : "light"}
      ownerId={owner}
      companyResearch={{
        ...emptyCompanyResearch(),
        ready: search.state !== "schema-pending",
        failed: search.state === "research-error",
        drafts:
          !hasCompanyResearch || !selectedCompany
            ? []
            : [
                {
                  id: "50000000-0000-4000-8000-000000000001",
                  user_id: owner,
                  company_id: selectedCompany.id,
                  title: "Apakah margin ini berkelanjutan?",
                  revision: 3,
                  updated_at: "2026-10-27T06:30:00Z",
                },
              ],
        versions:
          !hasCompanyResearch || !selectedCompany
            ? []
            : [1, 2, 3].map((n) => ({
                id: "60000000-0000-4000-8000-" + String(n).padStart(12, "0"),
                user_id: owner,
                company_id: selectedCompany.id,
                draft_id: "50000000-0000-4000-8000-000000000001",
                thought_id: "70000000-0000-4000-8000-000000000001",
                number: 4 - n,
                title: [
                  "Margin membaik, penyebabnya perlu diuji",
                  "Asumsi biaya distribusi belum terkonfirmasi",
                  "Pertanyaan awal tentang bauran produk",
                ][n - 1],
                created_at: `2026-10-${28 - n}T04:00:00Z`,
              })),
        selectedVersion:
          search.version &&
          previewVersionIndex >= 0 &&
          hasCompanyResearch &&
          selectedCompany
            ? {
                id: search.version,
                user_id: owner,
                company_id: selectedCompany.id,
                draft_id: "50000000-0000-4000-8000-000000000001",
                thought_id: "70000000-0000-4000-8000-000000000001",
                number: 3,
                draft_revision: 3,
                title: "Margin membaik, penyebabnya perlu diuji",
                body: "Revisi sintetis yang tersimpan. Ini bukan fakta pasar atau saran investasi.",
                message: "Catatan sintetis",
                created_at: "2026-10-27T04:00:00Z",
              }
            : null,
      }}
      researchState={{
        ready: search.state !== "schema-pending",
        failed: search.state === "error",
        items:
          search.state === "empty" ||
          search.state === "error" ||
          (search.view === "research" &&
            search.company &&
            search.company !== companies[0].id)
            ? []
            : writingDemo
              ? [
                  {
                    ...writingDraft,
                    company_name: writingDraft.company_id
                      ? companies[0].name
                      : null,
                    id: "50000000-0000-4000-8000-000000000001",
                    title: "Analisis fundamental — riset sintetis",
                  },
                  {
                    ...writingDraft,
                    company_name: writingDraft.company_id
                      ? companies[0].name
                      : null,
                    id: "50000000-0000-4000-8000-000000000002",
                    title: "Pertanyaan tentang alokasi modal",
                  },
                ]
              : [
                  {
                    id: "50000000-0000-4000-8000-000000000001",
                    user_id: owner,
                    title: "Apakah margin ini berkelanjutan?",
                    body: "Menelaah perubahan biaya bahan baku dan bauran produk sebelum menyimpulkan keberlanjutan margin. Data sintetis, bukan fakta pasar.",
                    mode: "guided",
                    company_id: companies[0].id,
                    company_name: companies[0].name,
                    source_capture_id: null,
                    revision: 3,
                    created_at: "2026-10-27T04:00:00.000Z",
                    updated_at: "2026-10-27T06:30:00.000Z",
                  },
                ],
        hasNext: false,
        page: 0,
        selected:
          writingDemo && search.draft
            ? writingDraft
            : search.draft
              ? {
                  id: search.draft,
                  user_id: owner,
                  title: "Apakah margin ini berkelanjutan?",
                  body: "# Pertanyaan riset\n\nApakah peningkatan margin berasal dari bauran produk atau perubahan biaya?\n\n## Asumsi\n\n- Perubahan belum tentu permanen.\n- Data sintetis, bukan fakta pasar.",
                  mode: "guided",
                  company_id: companies[0].id,
                  source_capture_id: null,
                  revision: 1,
                  created_at: "2026-10-27T04:00:00.000Z",
                  updated_at: "2026-10-27T04:00:00.000Z",
                }
              : null,
        history: [],
        historyHasNext: false,
        source:
          search.state === "writing-capture"
            ? {
                id: "30000000-0000-4000-8000-000000000001",
                raw_text:
                  "Capture sintetis asli: apakah perubahan margin ini berkelanjutan?",
                company_id: companies[0].id,
              }
            : null,
        unavailable: false,
      }}
      captureState={{
        ready: search.state !== "schema-pending",
        failed: search.state === "error",
        page: 0,
        hasNext: false,
        items:
          search.state === "empty"
            ? []
            : [
                {
                  id: "30000000-0000-4000-8000-000000000001",
                  user_id: owner,
                  request_id: "40000000-0000-4000-8000-000000000001",
                  raw_text:
                    "Apakah kenaikan margin ini berkelanjutan?\n\nPerlu memeriksa perubahan biaya bahan baku, bukan hanya penjualan.",
                  company_id: companies[0].id,
                  company_name: companies[0].name,
                  created_at: "2026-10-26T04:00:00.000Z",
                },
                {
                  id: "30000000-0000-4000-8000-000000000002",
                  user_id: owner,
                  request_id: "40000000-0000-4000-8000-000000000002",
                  raw_text:
                    "  Hipotesis awal: biaya distribusi mungkin lebih penting daripada pertumbuhan volume.  ",
                  company_id: null,
                  company_name: null,
                  created_at: "2026-10-25T08:20:00.000Z",
                },
              ],
      }}
      location={workspaceLocation(
        writingDemo && !writingDraft.company_id
          ? { ...search, company: undefined }
          : previewCompany
            ? { ...search, company: previewCompany }
            : search,
      )}
      failed={search.state === "error"}
    />
  ),
);
