import { createRoot } from "react-dom/client";
import { V3Workspace } from "../../../src/features/v3-workspace/workspace";
import { workspaceLocation } from "../../../src/features/v3-workspace/model";
import Loading from "../../../src/app/foundation/loading";
const owner = "20000000-0000-4000-8000-000000000001";
const companies = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    user_id: owner,
    name: "Perusahaan Contoh Nusantara",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    user_id: owner,
    name: "Usaha Contoh Bersama",
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    user_id: owner,
    name: "Perusahaan dengan nama panjang untuk memeriksa tata letak responsif",
  },
];
const search = Object.fromEntries(new URLSearchParams(window.location.search));
createRoot(document.getElementById("preview")!).render(
  search.state === "loading" ? (
    <Loading />
  ) : (
    <V3Workspace
      companies={
        search.state === "empty" || search.state === "error" ? [] : companies
      }
      location={workspaceLocation(search)}
      failed={search.state === "error"}
    />
  ),
);
