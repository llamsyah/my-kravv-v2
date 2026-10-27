"use client";
import { useEffect, useRef, useState } from "react";
import {
  researchReasoningAction,
  researchAIHistoryAction,
} from "./reasoning-actions";
import type { ResearchAIRun, ReasoningRequest } from "./reasoning-contract";
import type { ThoughtVersion } from "./contract";
import styles from "./workspace.module.css";
export function ReasoningPanel({
  owner,
  draftId,
  revision,
  dirty,
  sourceAvailable,
  version,
}: {
  owner: string;
  draftId: string;
  revision: number;
  dirty: boolean;
  sourceAvailable: boolean;
  version: ThoughtVersion | null;
}) {
  const [company, setCompany] = useState(false),
    [capture, setCapture] = useState(false),
    [includeVersion, setVersion] = useState(false),
    [runs, setRuns] = useState<ResearchAIRun[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [pendingOperation, setPendingOperation] =
    useState<ReasoningRequest | null>(null);
  const operation = useRef<ReasoningRequest | null>(null),
    alive = useRef(true),
    sending = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  async function run(mode: ReasoningRequest["mode"]) {
    if (dirty || sending.current) return;
    sending.current = true;
    setBusy(true);
    setError("");
    const request = operation.current ?? {
      operation: crypto.randomUUID(),
      draftId,
      revision,
      mode,
      includeCompany: company,
      includeCapture: capture,
      versionId: includeVersion && version ? version.id : null,
    };
    operation.current = request;
    setPendingOperation(request);
    try {
      const result = await researchReasoningAction(request, owner);
      if (!alive.current) return;
      if (result.ok) {
        setRuns(
          [result.run, ...runs.filter((r) => r.id !== result.run.id)].slice(
            0,
            10,
          ),
        );
        operation.current = null;
        setPendingOperation(null);
      } else {
        setError(result.error);
        if (
          [
            "AI_DISABLED",
            "API_KEY_MISSING",
            "CONFIGURATION_MISSING",
            "PRICING_UNAVAILABLE",
            "INVALID_REQUEST",
            "invalid",
            "conflict",
            "account",
            "BUDGET_EXHAUSTED",
            "PROVIDER_REJECTED",
            "PROVIDER_RATE_LIMIT",
            "INVALID_PROVIDER_RESPONSE",
          ].includes(result.code)
        ) {
          operation.current = null;
          setPendingOperation(null);
        }
      }
    } catch {
      if (alive.current)
        setError(
          "Hasil AI belum pasti. Identitas operasi dipertahankan; jangan membuat permintaan baru.",
        );
    } finally {
      sending.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function history() {
    setBusy(true);
    try {
      const r = await researchAIHistoryAction(draftId, owner);
      if (alive.current) {
        if (r.ok) setRuns(r.runs);
        else setError(r.error);
      }
    } catch {
      if (alive.current) setError("Riwayat AI belum dapat dimuat.");
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return (
    <section className={styles.panel}>
      <h2>Tinjauan penalaran AI</h2>
      <p>
        Opsional. AI menelaah argumen, bukan memutuskan investasi. Teks tidak
        pernah diterapkan otomatis. Aktivasi penyedia masih memerlukan
        persetujuan terpisah.
      </p>
      <fieldset disabled={busy || !!pendingOperation}>
        <legend>Konteks yang akan dikirim</legend>
        <p>
          Judul dan seluruh isi draf tersimpan r{revision}. Dokumen terlalu
          besar akan ditolak, tidak dipotong diam-diam.
        </p>
        <label>
          <input
            type="checkbox"
            checked={company}
            onChange={(e) => setCompany(e.target.checked)}
          />{" "}
          Metadata perusahaan terkait
        </label>
        <label>
          <input
            type="checkbox"
            disabled={!sourceAvailable}
            checked={capture}
            onChange={(e) => setCapture(e.target.checked)}
          />{" "}
          Capture sumber
        </label>
        <label>
          <input
            type="checkbox"
            disabled={!version}
            checked={includeVersion}
            onChange={(e) => setVersion(e.target.checked)}
          />{" "}
          Snapshot Thought yang sedang dibuka{" "}
          {version ? `v${version.number}` : ""}
        </label>
      </fieldset>
      <div>
        {(["CLARIFY", "CHALLENGE", "GAP_CHECK"] as const).map((mode) => (
          <button
            key={mode}
            disabled={
              busy ||
              dirty ||
              (!!pendingOperation && pendingOperation.mode !== mode)
            }
            onClick={() => run(mode)}
          >
            {mode === "CLARIFY"
              ? "Perjelas · Clarify"
              : mode === "CHALLENGE"
                ? "Uji argumen · Challenge"
                : "Periksa celah · Gap Check"}
          </button>
        ))}
      </div>
      {dirty && <p>Simpan dan pastikan revisi bersih sebelum meminta AI.</p>}
      {busy && (
        <p role="status">
          Menunggu hasil. Tidak ada pengiriman ulang otomatis.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      <button disabled={busy} onClick={history}>
        Muat riwayat AI · 10 terbaru
      </button>
      {runs.map((run) => (
        <article key={run.id}>
          <h3>
            {run.mode} · r{run.source_revision} · {run.status}
          </h3>
          <p>
            {run.provider} / {run.model} · {run.prompt_version} ·{" "}
            {run.created_at.slice(0, 16)} UTC
          </p>
          {(run.source_revision !== revision || dirty) && (
            <p role="status">
              Tinjauan untuk snapshot sebelumnya; bukan penilaian teks terbaru.
            </p>
          )}
          <details>
            <summary>Konteks snapshot yang ditinjau</summary>
            <h4>{run.snapshot.title}</h4>
            <pre>{run.snapshot.body}</pre>
            <p>
              Perusahaan: {run.snapshot.company ? "disertakan" : "tidak"};
              Capture: {run.snapshot.capture !== null ? "disertakan" : "tidak"};
              Thought:{" "}
              {run.snapshot.version
                ? `v${run.snapshot.version.number}`
                : "tidak"}
              .
            </p>
          </details>
          {run.output ? (
            Object.entries(run.output)
              .filter(([k]) => k !== "mode")
              .map(([key, value]) => (
                <section key={key}>
                  <h4>{labels[key] ?? key}</h4>
                  <ResultValue value={value} />
                </section>
              ))
          ) : (
            <p>
              Hasil tidak tersedia. Status tidak pasti tidak dikirim ulang
              otomatis.
            </p>
          )}
          {run.output && (
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    JSON.stringify(run.output, null, 2),
                  );
                  setError(
                    "Umpan balik disalin. Gabungkan sendiri bila relevan; draf belum diubah.",
                  );
                } catch {
                  setError(
                    "Salin manual dari bagian hasil; papan klip tidak tersedia.",
                  );
                }
              }}
            >
              Salin umpan balik
            </button>
          )}
        </article>
      ))}
    </section>
  );
}
const labels: Record<string, string> = {
  summary: "Ringkasan",
  claim: "Klaim utama",
  reasoning: "Penalaran yang disampaikan",
  ambiguities: "Bagian ambigu",
  assumptions: "Asumsi",
  questions: "Pertanyaan lanjutan",
  counterarguments: "Sanggahan yang perlu diuji",
  alternatives: "Interpretasi alternatif",
  supported_claims: "Klaim dengan dukungan yang disuplai",
  unsupported_claims: "Klaim belum didukung",
  missing_information: "Informasi yang kurang",
  uncertainties: "Ketidakpastian",
  argument: "Argumen",
  relevance: "Relevansi",
  evidence_to_seek: "Bukti yang perlu dicari",
  evidence_excerpt: "Kutipan dari konteks suplai",
};
function ResultValue({ value }: { value: unknown }) {
  if (typeof value === "string") return <p>{value}</p>;
  if (Array.isArray(value))
    return value.length ? (
      <ul>
        {value.map((v, i) => (
          <li key={i}>
            <ResultValue value={v} />
          </li>
        ))}
      </ul>
    ) : (
      <p>Tidak ada butir yang dilaporkan.</p>
    );
  if (value && typeof value === "object")
    return (
      <dl>
        {Object.entries(value).map(([k, v]) => (
          <div key={k}>
            <dt>{labels[k] ?? k}</dt>
            <dd>
              <ResultValue value={v} />
            </dd>
          </div>
        ))}
      </dl>
    );
  return null;
}
