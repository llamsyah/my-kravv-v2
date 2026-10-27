"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  researchMutationAction,
  reloadResearchAction,
  researchHistoryAction,
} from "./actions";
import { findCaptureCompaniesAction } from "../captures/actions";
import { WritingSession } from "./session";
import {
  guidance,
  researchHref,
  textChanges,
  type Draft,
  type ThoughtVersion,
  type DraftFields,
} from "./contract";
import type {
  ResearchPageState,
  ResearchMutation,
} from "../../server/research/service";
import { ReasoningPanel } from "./reasoning-panel";
import styles from "./workspace.module.css";

function CompanyChoice({
  owner,
  id,
  onChange,
  disabled = false,
}: {
  owner: string;
  id: string | null;
  onChange: (v: string | null) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState(""),
    [page, setPage] = useState(0),
    [items, setItems] = useState<{ id: string; name: string }[]>([]),
    [next, setNext] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function search(p = 0) {
    setBusy(true);
    setError("");
    try {
      const r = await findCaptureCompaniesAction(query, p, owner);
      if (r.error || !r.items) setError(r.error ?? "Pencarian gagal.");
      else {
        setItems(r.items);
        setNext(r.hasNext);
        setPage(p);
      }
    } catch {
      setError("Pencarian belum tersedia.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <details>
      <summary>Perusahaan · opsional {id ? "(terkait)" : ""}</summary>
      <fieldset disabled={disabled || busy}>
        <label>
          Cari nama atau ticker
          <input
            value={query}
            maxLength={200}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <button type="button" onClick={() => search()}>
          Cari
        </button>
        <button type="button" onClick={() => onChange(null)}>
          Tanpa perusahaan
        </button>
        {id && (
          <Link href={`/foundation?view=company&company=${id}`}>
            Buka perusahaan terkait
          </Link>
        )}
        <ul>
          {items.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                aria-pressed={c.id === id}
                onClick={() => onChange(c.id)}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
        {items.length > 0 && (
          <div>
            <button
              type="button"
              disabled={page === 0}
              onClick={() => search(page - 1)}
            >
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={!next}
              onClick={() => search(page + 1)}
            >
              Berikutnya
            </button>
          </div>
        )}
        {error && <p role="alert">{error}</p>}
      </fieldset>
    </details>
  );
}
export function ResearchWorkspace({
  owner,
  state,
  company,
}: {
  owner: string;
  state: ResearchPageState;
  company?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("Riset tanpa judul"),
    [mode, setMode] = useState<DraftFields["mode"]>("blank"),
    [companyId, setCompany] = useState<string | null>(
      company ?? state.source?.company_id ?? null,
    );
  const [pendingOperation, setPendingOperation] =
    useState<ResearchMutation | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    operation = useRef<ResearchMutation | null>(null),
    sending = useRef(false),
    alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (sending.current || !state.ready) return;
    sending.current = true;
    setBusy(true);
    setError("");
    const m = operation.current ?? {
      kind: "create" as const,
      operation: crypto.randomUUID(),
      title,
      company_id: companyId,
      capture_id: state.source?.id ?? null,
      mode,
    };
    operation.current = m;
    setPendingOperation(m);
    try {
      const r = await researchMutationAction(m, owner);
      if (!alive.current) return;
      if (!r.ok || !r.draft) {
        setError(r.ok ? "Draf belum terkonfirmasi." : r.error);
        if (!r.ok && ["invalid", "account", "conflict"].includes(r.code)) {
          operation.current = null;
          setPendingOperation(null);
        }
      } else {
        router.push(researchHref(r.draft.id));
        router.refresh();
      }
    } catch {
      if (alive.current)
        setError("Pembuatan belum terkonfirmasi. Ulangi operasi yang sama.");
    } finally {
      sending.current = false;
      if (alive.current) setBusy(false);
    }
  }
  if (state.failed)
    return (
      <section className={styles.panel} role="alert">
        <h2>Ruang riset belum dapat dimuat.</h2>
        <a href={researchHref()}>Muat ulang</a>
      </section>
    );
  if (!state.ready)
    return (
      <section className={styles.panel}>
        <h2>Ruang riset menunggu pembaruan skema.</h2>
        <p>
          Penulisan dan riwayat akan tersedia setelah migrasi yang disetujui.
          Tidak ada penyimpanan yang disimulasikan.
        </p>
      </section>
    );
  if (state.unavailable)
    return (
      <section className={styles.panel}>
        <h2>Dokumen tidak tersedia untuk akun ini.</h2>
        <Link href={researchHref()}>Kembali ke daftar draf</Link>
      </section>
    );
  return (
    <div className={styles.research}>
      {state.selected ? (
        <DraftEditor
          key={state.selected.id + ":" + owner}
          draft={state.selected}
          owner={owner}
          initialHistory={state.history}
          historyHasNext={state.historyHasNext}
          source={state.source}
        />
      ) : (
        <>
          <section className={styles.panel}>
            <h2>{state.source ? "Mulai riset dari Capture" : "Draf baru"}</h2>
            {state.source && (
              <details open>
                <summary>Capture asli · tetap disimpan</summary>
                <pre>{state.source.raw_text}</pre>
                <p>
                  Capture ini hanya disalin sebagai titik awal. Membukanya lagi
                  akan melanjutkan draf yang sama.
                </p>
              </details>
            )}
            <form onSubmit={create}>
              <fieldset disabled={busy || !!pendingOperation}>
                <label>
                  Judul
                  <input
                    required
                    maxLength={200}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>
                <label>
                  Pendekatan
                  <select
                    value={mode}
                    onChange={(e) =>
                      setMode(e.target.value as DraftFields["mode"])
                    }
                  >
                    <option value="blank">Kosong</option>
                    <option value="guided">Terpandu</option>
                    <option value="assisted">Pendamping</option>
                  </select>
                </label>
                <p>
                  Semua pendekatan memakai dokumen yang sama. Tidak ada
                  permintaan AI otomatis.
                </p>
              </fieldset>
              <CompanyChoice
                owner={owner}
                id={companyId}
                onChange={setCompany}
                disabled={busy || !!pendingOperation}
              />
              <button disabled={busy || !title.trim()} type="submit">
                {busy
                  ? "Membuat…"
                  : pendingOperation
                    ? "Ulangi pembuatan yang sama"
                    : "Buka draf"}
              </button>
              {error && <p role="alert">{error}</p>}
            </form>
          </section>
          <section className={styles.panel}>
            <h2>Lanjutkan riset</h2>
            {!state.items.length ? (
              <p>Belum ada draf. Mulai dari pertanyaan atau Capture.</p>
            ) : (
              <ul className={styles.directory}>
                {state.items.map((d) => (
                  <li key={d.id}>
                    <Link href={researchHref(d.id)}>
                      <strong>{d.title}</strong>
                      <span>
                        {d.company_id ? d.company_name : "Tanpa perusahaan"} ·
                        revisi kerja {d.revision}
                      </span>
                      <time dateTime={d.updated_at}>
                        {new Date(d.updated_at)
                          .toISOString()
                          .slice(0, 16)
                          .replace("T", " ")}{" "}
                        UTC
                      </time>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <nav aria-label="Halaman draf">
              {state.page > 0 && (
                <Link
                  href={researchHref(
                    undefined,
                    company,
                    undefined,
                    state.page - 1,
                  )}
                >
                  Lebih baru
                </Link>
              )}
              {state.hasNext && state.page < 10000 && (
                <Link
                  href={researchHref(
                    undefined,
                    company,
                    undefined,
                    state.page + 1,
                  )}
                >
                  Lebih lama
                </Link>
              )}
            </nav>
          </section>
        </>
      )}
    </div>
  );
}
function DraftEditor({
  draft,
  owner,
  initialHistory,
  historyHasNext,
  source,
}: {
  draft: Draft;
  owner: string;
  initialHistory: ThoughtVersion[];
  historyHasNext: boolean;
  source: ResearchPageState["source"];
}) {
  const [session] = useState(
    () => new WritingSession(draft, (m) => researchMutationAction(m, owner)),
  );
  const state = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getServerSnapshot,
  );
  const [history, setHistory] = useState(initialHistory),
    [historyPage, setHistoryPage] = useState(0),
    [hasNext, setNext] = useState(historyHasNext),
    [latest, setLatest] = useState(initialHistory[0]?.number ?? 0),
    [lastCommitted, setLastCommitted] = useState(initialHistory[0]);
  const [view, setView] = useState<ThoughtVersion | null>(null),
    [compare, setCompare] = useState<ThoughtVersion | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [feedback, setFeedback] = useState(""),
    [server, setServer] = useState<Draft | null>(null);
  const [pendingOperation, setPendingOperation] =
    useState<ResearchMutation | null>(null);
  const operation = useRef<ResearchMutation | null>(null),
    sending = useRef(false),
    alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (state.status !== "saved") e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [state.status]);
  const edit = (field: Partial<DraftFields>) =>
    session.edit({ ...state.fields, ...field });
  async function mutate(kind: "commit" | "restore") {
    if (sending.current || busy) return;
    if (!operation.current && state.status !== "saved") {
      setFeedback(
        "Simpan dan pastikan draf bersih sebelum merekam atau memulihkan.",
      );
      return;
    }
    if (
      kind === "restore" &&
      !operation.current &&
      !window.confirm(
        "Ganti Working Tree dengan versi ini? Riwayat tidak berubah. Versi kerja tersimpan saat ini belum tentu pernah direkam.",
      )
    )
      return;
    if (kind === "restore" && !view) return;
    const m =
      operation.current ??
      (kind === "commit"
        ? {
            kind: "commit" as const,
            operation: crypto.randomUUID(),
            id: draft.id,
            expected: state.revision,
            latest,
            message,
          }
        : {
            kind: "restore" as const,
            operation: crypto.randomUUID(),
            id: draft.id,
            expected: state.revision,
            version: view!.id,
          });
    operation.current = m;
    setPendingOperation(m);
    sending.current = true;
    setBusy(true);
    setFeedback("");
    try {
      const r = await researchMutationAction(m, owner);
      if (!alive.current) return;
      if (!r.ok) {
        setFeedback(r.error);
        if (["invalid", "conflict", "account"].includes(r.code)) {
          operation.current = null;
          setPendingOperation(null);
          if (r.code === "conflict") {
            await loadServer();
            await loadHistory(0);
          }
        }
        return;
      }
      if (r.version) {
        setLatest(r.version.number);
        setLastCommitted(r.version);
        setNext(historyPage > 0 || hasNext || history.length >= 20);
        setHistory(
          [r.version, ...history.filter((v) => v.id !== r.version!.id)].slice(
            0,
            20,
          ),
        );
        setHistoryPage(0);
        setView(r.version);
        setMessage("");
        setFeedback(
          "Thought direkam sebagai revisi baru. Working Tree tetap dapat diedit.",
        );
      }
      if (r.draft) {
        session.acceptServer(r.draft, false);
        setFeedback(
          "Konten versi dipulihkan ke Working Tree. Belum ada Thought baru.",
        );
      }
      operation.current = null;
      setPendingOperation(null);
    } catch {
      if (alive.current)
        setFeedback(
          "Hasil belum terkonfirmasi. Ulangi operasi yang sama; jangan merekam dengan identitas baru.",
        );
    } finally {
      sending.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function loadServer() {
    try {
      const r = await reloadResearchAction(draft.id, owner);
      if (alive.current) {
        if (r.ok) setServer(r.draft);
        else setFeedback(r.error);
      }
    } catch {
      if (alive.current) setFeedback("Versi server belum dapat dimuat.");
    }
  }
  async function loadHistory(page: number) {
    setBusy(true);
    try {
      const r = await researchHistoryAction(draft.id, page, owner);
      if (!alive.current) return;
      if (r.ok) {
        setHistory(r.items);
        setHistoryPage(page);
        setNext(r.hasNext);
        if (page === 0) {
          setLatest(r.items[0]?.number ?? 0);
          setLastCommitted(r.items[0]);
        }
      } else setFeedback(r.error);
    } catch {
      if (alive.current) setFeedback("Riwayat belum dapat dimuat.");
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  const last = lastCommitted;
  const committed =
    last &&
    state.fields.title === last.title &&
    state.fields.body === last.body &&
    state.fields.company_id === last.company_id &&
    state.status === "saved";
  return (
    <>
      <div className={styles.toolbar}>
        <Link href={researchHref()}>← Semua draf</Link>
        <span>
          Working Tree ·{" "}
          {latest ? `Thought terakhir v${latest}` : "belum direkam"}
        </span>
      </div>
      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <h2>Ruang Tulis</h2>
          <span role="status">
            {
              {
                saved: "Tersimpan",
                dirty: "Belum tersimpan",
                saving: "Menyimpan…",
                uncertain: "Penyimpanan belum pasti",
                conflict: "Konflik revisi",
              }[state.status]
            }{" "}
            · r{state.revision}
          </span>
        </div>
        <fieldset disabled={busy || !!pendingOperation}>
          <label>
            Judul
            <input
              value={state.fields.title}
              maxLength={200}
              onChange={(e) => edit({ title: e.target.value })}
            />
          </label>
          <label>
            Pendekatan
            <select
              value={state.fields.mode}
              onChange={(e) =>
                edit({ mode: e.target.value as DraftFields["mode"] })
              }
            >
              <option value="blank">Kosong</option>
              <option value="guided">Terpandu</option>
              <option value="assisted">Pendamping</option>
            </select>
          </label>
          <CompanyChoice
            owner={owner}
            id={state.fields.company_id}
            onChange={(company_id) => edit({ company_id })}
          />
          {state.fields.mode === "guided" && (
            <aside>
              <h3>Pertanyaan penuntun · tidak mengubah teks</h3>
              <ul>
                {guidance.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </aside>
          )}
          {state.fields.mode === "assisted" && (
            <p>
              Tulis secara manual atau minta tinjauan di panel AI. Memilih
              pendekatan ini tidak mengirim data.
            </p>
          )}
          <label>
            Isi riset · Markdown
            <textarea
              rows={20}
              value={state.fields.body}
              onChange={(e) => edit({ body: e.target.value })}
              spellCheck
              aria-describedby="research-save-help"
            />
          </label>
        </fieldset>
        <p id="research-save-help">
          Autosave setelah 1 detik tanpa perubahan, satu operasi pada satu
          waktu. Tidak ada rekaman Thought otomatis.
        </p>
        <div className={styles.toolbar}>
          <button
            type="button"
            onClick={() => session.save()}
            disabled={
              busy ||
              state.status === "saving" ||
              state.status === "saved" ||
              state.status === "conflict"
            }
          >
            Simpan / ulangi penyimpanan
          </button>
          <span>
            {state.fields.body.length.toLocaleString("id-ID")} / 100.000
            karakter
          </span>
        </div>
        {state.error && <p role="alert">{state.error}</p>}
        {state.storageError && (
          <p role="alert">
            Perlindungan buffer peramban tidak tersedia. Simpan atau salin teks
            sebelum meninggalkan halaman.
          </p>
        )}
        {(state.status === "conflict" ||
          state.status === "uncertain" ||
          !!server ||
          !!pendingOperation) && (
          <div>
            <button onClick={loadServer}>Periksa versi server</button>
            {server && (
              <details open>
                <summary>
                  Versi server r{server.revision} · teks lokal tetap di editor
                </summary>
                <h3>{server.title}</h3>
                <pre>{server.body}</pre>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Ganti teks lokal dengan versi server? Salin perubahan lokal yang masih dibutuhkan terlebih dahulu.",
                      )
                    ) {
                      session.acceptServer(server, false);
                      setServer(null);
                      operation.current = null;
                      setPendingOperation(null);
                    }
                  }}
                >
                  Gunakan versi server
                </button>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Gunakan teks lokal dengan dasar revisi server terbaru? Penyimpanan tetap harus dikonfirmasi.",
                      )
                    ) {
                      session.acceptServer(server, true);
                      setServer(null);
                      operation.current = null;
                      setPendingOperation(null);
                    }
                  }}
                >
                  Pertahankan teks lokal, pakai dasar server
                </button>
              </details>
            )}
          </div>
        )}
        {source && (
          <details>
            <summary>Capture sumber · asli, tidak diubah</summary>
            <pre>{source.raw_text}</pre>
          </details>
        )}
      </section>
      <section className={styles.panel}>
        <h2>Tinjau & rekam Thought</h2>
        <p>
          {committed
            ? "Konten sesuai Thought terakhir."
            : "Perubahan Working Tree tidak mengubah riwayat."}{" "}
          Rekaman berikutnya terkait dokumen yang sama.
        </p>
        <details>
          <summary>Periksa snapshot yang akan direkam</summary>
          <h3>{state.fields.title}</h3>
          <pre>{state.fields.body}</pre>
        </details>
        <label>
          Pesan singkat · opsional
          <input
            value={message}
            maxLength={500}
            disabled={busy || !!pendingOperation}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
        <button
          onClick={() =>
            mutate(operation.current?.kind === "restore" ? "restore" : "commit")
          }
          disabled={
            busy || state.status !== "saved" || !state.fields.body.trim()
          }
        >
          {busy
            ? "Memproses…"
            : pendingOperation
              ? "Ulangi operasi yang sama"
              : `Rekam Thought v${latest + 1}`}
        </button>
        {feedback && <p role="status">{feedback}</p>}
      </section>
      <section className={styles.panel}>
        <h2>Riwayat Thought</h2>
        {!history.length ? (
          <p>Belum ada Thought. Menyimpan draf tidak membuat riwayat ini.</p>
        ) : (
          <ol>
            {history.map((v) => (
              <li key={v.id}>
                <button disabled={busy} onClick={() => setView(v)}>
                  v{v.number} · {v.title}
                </button>{" "}
                <time dateTime={v.created_at}>
                  {v.created_at.slice(0, 16).replace("T", " ")} UTC
                </time>
                <p>{v.message || "Tanpa pesan"}</p>
                <button onClick={() => setCompare(v)}>
                  Pilih dasar perbandingan
                </button>
              </li>
            ))}
          </ol>
        )}
        <div className={styles.toolbar}>
          <button
            disabled={busy || historyPage === 0}
            onClick={() => loadHistory(historyPage - 1)}
          >
            Versi lebih baru
          </button>
          <button
            disabled={busy || !hasNext}
            onClick={() => loadHistory(historyPage + 1)}
          >
            Versi lebih lama
          </button>
        </div>
        {view && (
          <article>
            <h3>Snapshot v{view.number} · hanya baca</h3>
            <pre>{view.body}</pre>
            <button
              disabled={busy || !!pendingOperation || state.status !== "saved"}
              onClick={() => mutate("restore")}
            >
              Pulihkan versi ini ke Working Tree…
            </button>
            {compare && <VersionDiff before={compare} after={view} />}
          </article>
        )}
      </section>
      <ReasoningPanel
        owner={owner}
        draftId={draft.id}
        revision={state.revision}
        dirty={state.status !== "saved"}
        sourceAvailable={!!source}
        version={view}
      />
    </>
  );
}
function VersionDiff({
  before,
  after,
}: {
  before: ThoughtVersion;
  after: ThoughtVersion;
}) {
  const diff = textChanges(
    before.title + "\n\n" + before.body,
    after.title + "\n\n" + after.body,
  );
  return (
    <section>
      <h3>
        Perubahan v{before.number} → v{after.number}
      </h3>
      <p>
        {diff.unchanged} baris awal dan {diff.trailing} baris akhir sama. Blok
        tengah ditampilkan apa adanya; bukan perbandingan semantik.
      </p>
      <h4>Dihapus / diganti</h4>
      <pre className={styles.removed}>
        {diff.removed.join("\n") || "Tidak ada"}
      </pre>
      <h4>Ditambahkan</h4>
      <pre className={styles.added}>{diff.added.join("\n") || "Tidak ada"}</pre>
    </section>
  );
}
