import type { AnchorHTMLAttributes } from "react";
import type {
  Draft,
  ThoughtVersion,
} from "../../../src/features/research/contract";
import type { ResearchMutation } from "../../../src/server/research/service";
import type { ResearchAIRun } from "../../../src/features/research/reasoning-contract";
let writingFixture: Draft | null = null;
const fixtureVersions: ThoughtVersion[] = [];
export function configureWritingPreview(draft: Draft) {
  writingFixture = structuredClone(draft);
  fixtureVersions.length = 0;
}
export async function researchMutationAction(
  input: ResearchMutation,
  owner: string,
) {
  if (!writingFixture || owner !== writingFixture.user_id)
    return {
      ok: false as const,
      error: "Pratinjau sintetis: tidak ada penyimpanan ke server.",
      code: "unavailable",
    };
  await new Promise((resolve) => setTimeout(resolve, 350));
  if (input.kind === "save") {
    if (
      input.id !== writingFixture.id ||
      input.expected !== writingFixture.revision
    )
      return {
        ok: false as const,
        error: "Konflik sintetis; teks lokal dipertahankan.",
        code: "conflict",
      };
    if (
      new URLSearchParams(window.location.search).get("state") ===
      "writing-uncertain"
    )
      return {
        ok: false as const,
        error: "Simulasi sambungan terputus; operasi dipertahankan.",
        code: "uncertain",
      };
    writingFixture = {
      ...writingFixture,
      ...input.fields,
      revision: writingFixture.revision + 1,
      updated_at: new Date().toISOString(),
    };
    return { ok: true as const, draft: structuredClone(writingFixture) };
  }
  if (
    input.kind === "commit" &&
    input.id === writingFixture.id &&
    input.expected === writingFixture.revision
  ) {
    const version: ThoughtVersion = {
      id:
        "60000000-0000-4000-8000-" +
        String(fixtureVersions.length + 1).padStart(12, "0"),
      user_id: owner,
      draft_id: writingFixture.id,
      thought_id: "70000000-0000-4000-8000-000000000001",
      number: fixtureVersions.length + 1,
      draft_revision: writingFixture.revision,
      title: writingFixture.title,
      body: writingFixture.body,
      company_id: writingFixture.company_id,
      message: input.message,
      created_at: new Date().toISOString(),
    };
    fixtureVersions.unshift(version);
    return { ok: true as const, version };
  }
  return {
    ok: false as const,
    error: "Operasi ini tidak disimulasikan dalam pratinjau.",
    code: "unavailable",
  };
}
export async function reloadResearchAction() {
  return writingFixture
    ? { ok: true as const, draft: structuredClone(writingFixture) }
    : {
        ok: false as const,
        error: "Pratinjau sintetis: tidak ada versi server.",
      };
}
export async function researchHistoryAction() {
  return {
    ok: true as const,
    items: structuredClone(fixtureVersions),
    hasNext: false,
  };
}
export async function researchReasoningAction() {
  return {
    ok: false as const,
    error: "Pratinjau: tidak ada inferensi atau biaya AI.",
    code: "AI_DISABLED",
  };
}
export async function researchAIHistoryAction() {
  const d = writingFixture;
  const runs: ResearchAIRun[] = d
    ? [
        {
          id: "80000000-0000-4000-8000-000000000001",
          user_id: d.user_id,
          draft_id: d.id,
          operation_id: "90000000-0000-4000-8000-000000000001",
          source_revision: 1,
          mode: "CHALLENGE",
          status: "completed",
          provider: "groq",
          model: "synthetic-no-provider",
          prompt_version: "research-v1",
          snapshot: {
            title: d.title,
            body: d.body,
            company: null,
            capture: null,
            version: null,
          },
          output: {
            mode: "CHALLENGE",
            summary:
              "Umpan balik sintetis untuk memeriksa tampilan, bukan hasil inferensi.",
            counterarguments: [
              {
                argument:
                  "Asumsi yang perlu diuji: apakah perubahan margin benar-benar berulang?",
                relevance:
                  "Satu periode belum cukup untuk menunjukkan ketahanan bisnis.",
                evidence_to_seek:
                  "Bandingkan beberapa periode dan pisahkan perubahan harga dari volume.",
              },
            ],
            alternatives: [
              "Perubahan bauran produk atau biaya sementara mungkin memberi penjelasan lain.",
            ],
            questions: [
              "Bukti tambahan apa yang dapat membantah interpretasi awal?",
              "Bagaimana hasilnya berubah dalam skenario biaya yang berbeda?",
            ],
          },
          error_code: null,
          created_at: "2026-10-28T04:00:00Z",
        },
      ]
    : [];
  return { ok: true as const, runs };
}
export async function saveCaptureAction() {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    error:
      "Simulasi lokal: penyimpanan gagal. Tidak ada permintaan server atau data tersimpan.",
  };
}
export async function findCaptureCompaniesAction() {
  return {
    error: null,
    items: [
      {
        id: "10000000-0000-4000-8000-000000000001",
        name: "Nusantara Industri",
      },
    ],
    hasNext: false,
  };
}
function fixtureHref(href: string) {
  const url = new URL(href, window.location.origin);
  if (url.origin !== window.location.origin || url.pathname !== "/foundation")
    throw Error("Unexpected preview navigation");
  const state = new URLSearchParams(window.location.search).get("state");
  if (state === "many" || state === "legacy" || state?.startsWith("writing-"))
    url.searchParams.set("state", state);
  return url.pathname + url.search + url.hash;
}
export default function PreviewLink({
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a {...props} href={props.href ? fixtureHref(props.href) : undefined}>
      {children}
    </a>
  );
}
export function useRouter() {
  return {
    push(href: string) {
      window.location.assign(fixtureHref(href));
    },
    replace(href: string) {
      window.location.assign(fixtureHref(href));
    },
    refresh() {},
  };
}
export async function saveFoundationThemeAction(theme: "light" | "dark") {
  window.localStorage.setItem("my-kravv:v3:preview-account-theme", theme);
  return { error: null, theme };
}
export async function logout() {
  return { error: "Pratinjau sintetis: tidak ada sesi atau permintaan Auth." };
}
export async function saveFoundationCompanyAction(
  _previous: unknown,
  form: FormData,
) {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const name = String(form.get("name") ?? "");
  if (!name.trim() || name.trim().length > 200)
    return { error: "Isi nama paling banyak 200 karakter." };
  return {
    error:
      "Simulasi kegagalan penyimpanan. Tidak ada data dikirim atau disimpan.",
  };
}
