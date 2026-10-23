import { createRoot } from "react-dom/client";
import { V3Workspace } from "../../../src/features/v3-workspace/workspace";
import { workspaceLocation } from "../../../src/features/v3-workspace/model";
import Loading from "../../../src/app/foundation/loading";
import {
  parseDirectorySearch,
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
const matching = findWorkspaceCompanies(all, directory.query);
const items = matching.slice(
  directory.page * directoryPageSize,
  (directory.page + 1) * directoryPageSize,
);
const selectedCompany = all.find((company) => company.id === search.company);
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
          : (selectedCompany ?? null)
      }
      directory={{
        ...directory,
        metadataReady,
        hasNext: matching.length > (directory.page + 1) * directoryPageSize,
      }}
      initialTheme={theme.success ? theme.data : "light"}
      location={workspaceLocation(search)}
      failed={search.state === "error"}
    />
  ),
);
