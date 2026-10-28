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
import { WritingCompanion, useCompactCompanion } from "./companion";
import { Icon } from "../../components/ui/icon";
import {
  writingAreas,
  writingStatus,
  formatMarkdown,
  type MarkdownCommand,
} from "./writing-tools";
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
  companyName,
}: {
  owner: string;
  state: ResearchPageState;
  company?: string;
  companyName?: string;
}) {
  if (state.failed)
    return (
      <section className={styles.panel} role="alert">
        <h2>Ruang riset belum dapat dimuat.</h2>
        <a href={researchHref(undefined, company)}>Muat ulang</a>
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
          directory={state}
          companyName={companyName}
        />
      ) : (
        <DraftEditor
          key={
            "entry:" +
            owner +
            ":" +
            (company ?? "personal") +
            ":" +
            (state.source?.id ?? "blank")
          }
          draft={{
            id:
              "entry:" +
              (company ?? "personal") +
              ":" +
              (state.source?.id ?? "blank"),
            user_id: owner,
            title: "Catatan tanpa judul",
            body: state.source?.raw_text ?? "",
            mode: "blank",
            company_id: company ?? state.source?.company_id ?? null,
            source_capture_id: state.source?.id ?? null,
            revision: 1,
            created_at: "",
            updated_at: "",
          }}
          entry
          owner={owner}
          initialHistory={[]}
          historyHasNext={false}
          source={state.source}
          directory={state}
          companyName={companyName}
        />
      )}
    </div>
  );
}
function DraftNavigation({
  state,
  current,
  company,
  onLeave,
}: {
  state: ResearchPageState;
  current?: string;
  company?: string;
  onLeave: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <details
      className={styles.draftPicker}
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        e.preventDefault();
        e.currentTarget.open = false;
        e.currentTarget.querySelector("summary")?.focus();
      }}
    >
      <summary>
        <Icon name="read" size="small" />
        Draf saya
        <Icon name="chevronDown" size="small" />
      </summary>
      <div>
        <Link onClick={onLeave} href={researchHref(undefined, company)}>
          + Draf baru / semua draf
        </Link>
        <ul>
          {state.items.map((d) => (
            <li key={d.id}>
              <Link
                onClick={onLeave}
                aria-current={d.id === current ? "page" : undefined}
                href={researchHref(d.id, d.company_id ?? undefined)}
              >
                <strong>{d.title}</strong>
                <small>Revisi kerja {d.revision}</small>
              </Link>
            </li>
          ))}
        </ul>
        {!state.items.length && <p>Belum ada draf lain yang dimuat.</p>}
        <nav aria-label="Halaman pemilih draf">
          {state.page > 0 && (
            <Link
              onClick={onLeave}
              href={researchHref(current, company, undefined, state.page - 1)}
            >
              Lebih baru
            </Link>
          )}
          {state.hasNext && state.page < 10000 && (
            <Link
              onClick={onLeave}
              href={researchHref(current, company, undefined, state.page + 1)}
            >
              Lebih lama
            </Link>
          )}
        </nav>
        <p>Perubahan yang belum tersimpan tetap memerlukan konfirmasi.</p>
      </div>
    </details>
  );
}
function DraftEditor({
  draft: initialDraft,
  entry = false,
  owner,
  initialHistory,
  historyHasNext,
  source,
  directory,
  companyName,
}: {
  draft: Draft;
  entry?: boolean;
  owner: string;
  initialHistory: ThoughtVersion[];
  historyHasNext: boolean;
  source: ResearchPageState["source"];
  directory: ResearchPageState;
  companyName?: string;
}) {
  const router = useRouter();
  const [session] = useState(
    () =>
      new WritingSession(
        initialDraft,
        (m) => researchMutationAction(m, owner),
        undefined,
        undefined,
        entry
          ? {
              capture: initialDraft.source_capture_id,
              onSaved: (row) => {
                router.replace(
                  researchHref(row.id, row.company_id ?? undefined),
                );
                router.refresh();
              },
            }
          : undefined,
      ),
  );
  const state = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getServerSnapshot,
  );
  const draft = session.row;
  const unsavedEntry = session.isEntry;
  const [desktopCompanion, setDesktopCompanion] = useState(true),
    [mobileCompanion, setMobileCompanion] = useState(false),
    [area, setArea] = useState(0);
  const compactCompanion = useCompactCompanion(),
    companion = compactCompanion ? mobileCompanion : desktopCompanion;
  const setCompanion = (value: boolean) =>
    compactCompanion ? setMobileCompanion(value) : setDesktopCompanion(value);
  const companionControl = useRef<HTMLButtonElement>(null),
    textarea = useRef<HTMLTextAreaElement>(null);
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
    if (sending.current || busy || unsavedEntry) return;
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
  const blocked = busy || !!pendingOperation;
  function format(command: MarkdownCommand) {
    if (blocked || !textarea.current) return;
    const changed = formatMarkdown(
      state.fields.body,
      textarea.current.selectionStart,
      textarea.current.selectionEnd,
      command,
    );
    edit({ body: changed.body });
    requestAnimationFrame(() => {
      textarea.current?.focus();
      textarea.current?.setSelectionRange(changed.start, changed.end);
    });
  }
  function insertHeading() {
    if (blocked) return;
    const pos = textarea.current?.selectionStart ?? state.fields.body.length;
    edit({
      body:
        state.fields.body.slice(0, pos) +
        "\n\n## " +
        writingAreas[area].title +
        "\n\n" +
        state.fields.body.slice(pos),
    });
    textarea.current?.focus();
  }
  const leaveDraft = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      state.status !== "saved" &&
      !window.confirm(
        state.storageError
          ? "Buffer peramban tidak tersedia. Salin teks sebelum berpindah. Tetap tinggalkan draf ini?"
          : "Penyimpanan belum terkonfirmasi. Buffer lokal dipertahankan bila tersedia. Berpindah draf sekarang?",
      )
    )
      event.preventDefault();
  };
  return (
    <div className={styles.writingLayout} data-companion={companion}>
      <div className={styles.writingMain} data-mode={state.fields.mode}>
        <header className={styles.documentHead}>
          <div className={styles.documentTrail}>
            <DraftNavigation
              state={directory}
              current={unsavedEntry ? undefined : draft.id}
              company={draft.company_id ?? undefined}
              onLeave={leaveDraft}
            />
            <span>{companyName ?? "Ruang pribadi"} / Ruang Tulis</span>
          </div>
          <div className={styles.documentActions}>
            <a href="#research-history">
              <Icon name="clock" size="small" />
              Lihat versi
            </a>
            <a className={styles.recordAction} href="#research-commit">
              <Icon name="check" size="small" />
              Rekam Thought…
            </a>
            <button
              ref={companionControl}
              type="button"
              aria-label={
                companion ? "Sembunyikan Companion" : "Buka Companion"
              }
              aria-expanded={companion}
              aria-controls="writing-companion"
              onClick={() => setCompanion(!companion)}
            >
              <Icon name="panelLeftOpen" size="small" />
              Companion
            </button>
          </div>
          <h1 className={styles.documentTitle} aria-label={state.fields.title}>
            <label>
              <span className="sr-only">Judul</span>
              <input
                value={state.fields.title}
                maxLength={200}
                disabled={blocked}
                onChange={(e) => edit({ title: e.target.value })}
              />
            </label>
          </h1>
          <div className={styles.documentMeta}>
            <span role="status" data-status={state.status}>
              <i />
              {unsavedEntry ? "Belum tersimpan" : writingStatus(state.status)}
              {!unsavedEntry && ` · r${state.revision}`}
            </span>
            <label>
              <span className="sr-only">Pendekatan</span>
              <select
                value={state.fields.mode}
                disabled={blocked}
                onChange={(e) =>
                  edit({ mode: e.target.value as DraftFields["mode"] })
                }
              >
                <option value="blank">Kosong</option>
                <option value="guided">Terpandu</option>
                <option value="assisted">Pendamping</option>
              </select>
            </label>
            <details className={styles.documentOptions}>
              <summary>Konteks dokumen</summary>
              <CompanyChoice
                owner={owner}
                id={state.fields.company_id}
                disabled={blocked}
                onChange={(company_id) => edit({ company_id })}
              />
            </details>
          </div>
        </header>
        <section className={styles.editorSurface} aria-label="Kanvas penulisan">
          <div
            className={styles.markdownToolbar}
            role="toolbar"
            aria-label="Format Markdown"
          >
            <label>
              <span className="sr-only">Format paragraf</span>
              <select
                disabled={blocked}
                value="paragraph"
                onChange={(e) => {
                  if (e.target.value === "heading") format("heading");
                }}
              >
                <option value="paragraph">Paragraf</option>
                <option value="heading">Judul bagian · H2</option>
              </select>
            </label>
            {(
              [
                ["bold", "Tebal", "B"],
                ["italic", "Miring", "I"],
                ["list", "Daftar", "☷"],
                ["quote", "Kutipan", "❞"],
                ["code", "Kode", "{ }"],
              ] as const
            ).map(([command, label, symbol]) => (
              <button
                type="button"
                key={command}
                disabled={blocked}
                aria-label={label}
                title={label}
                onClick={() => format(command)}
              >
                {symbol}
              </button>
            ))}
          </div>
          {state.fields.mode === "guided" && (
            <div className={styles.guidedIntro}>
              <div className={styles.areaTitle}>
                <span>{area + 1}</span>
                <div>
                  <h3>{writingAreas[area].title}</h3>
                  <p>{writingAreas[area].description}</p>
                </div>
              </div>
              <div className={styles.guidingQuestions}>
                <h4>
                  <Icon name="thought" size="small" />
                  Pertanyaan pemandu
                </h4>
                <ul>
                  {writingAreas[area].questions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={blocked}
                  onClick={insertHeading}
                >
                  Tambahkan judul bagian ke teks
                </button>
              </div>
            </div>
          )}
          <label className={styles.bodyLabel}>
            <span className="sr-only">Isi riset · Markdown</span>
            <textarea
              ref={textarea}
              rows={state.fields.mode === "guided" ? 5 : 22}
              value={state.fields.body}
              disabled={blocked}
              onChange={(e) => edit({ body: e.target.value })}
              onKeyDown={(e) => {
                if (
                  (e.ctrlKey || e.metaKey) &&
                  ["b", "i", "s"].includes(e.key.toLowerCase())
                ) {
                  e.preventDefault();
                  if (e.key.toLowerCase() === "s") {
                    if (
                      !blocked &&
                      !["saving", "conflict"].includes(state.status)
                    )
                      void session.save();
                  } else
                    format(e.key.toLowerCase() === "b" ? "bold" : "italic");
                }
              }}
              placeholder={
                companyName
                  ? "Mulai menulis pemikiranmu tentang " + companyName + "…"
                  : "Mulai dari pengamatan, pertanyaan, atau hipotesismu…"
              }
              spellCheck
              aria-describedby="research-save-help"
            />
          </label>
          {state.fields.mode === "guided" && (
            <nav
              className={styles.guidedSections}
              aria-label="Area panduan dalam kanvas"
            >
              {writingAreas.map(
                (item, n) =>
                  n !== area && (
                    <button
                      type="button"
                      key={item.title}
                      onClick={() => setArea(n)}
                    >
                      <span>{n + 1}</span>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.description}</small>
                      </div>
                      <Icon name="arrowRight" size="small" />
                    </button>
                  ),
              )}
            </nav>
          )}
          <footer className={styles.editorFooter}>
            <span>
              {state.fields.body.trim()
                ? state.fields.body.trim().split(/\s+/u).length
                : 0}{" "}
              kata · {state.fields.body.length.toLocaleString("id-ID")} karakter
            </span>
            <span id="research-save-help">
              {unsavedEntry
                ? "Simpan untuk membuat draf · buffer lokal aktif"
                : "Autosave 1 detik · tanpa Thought otomatis"}
            </span>
            <button
              type="button"
              onClick={() => session.save()}
              disabled={
                blocked ||
                ["saving", "conflict"].includes(state.status) ||
                (!unsavedEntry && state.status === "saved")
              }
            >
              Simpan / ulangi penyimpanan
            </button>
          </footer>
        </section>
        <div className={styles.recovery}>
          {state.error && <p role="alert">{state.error}</p>}
          {state.storageError && (
            <p role="alert">
              Perlindungan buffer peramban tidak tersedia. Simpan atau salin
              teks sebelum meninggalkan halaman.
            </p>
          )}
          {(state.status === "conflict" ||
            state.status === "uncertain" ||
            !!server ||
            !!pendingOperation) && (
            <div>
              <button disabled={unsavedEntry} onClick={loadServer}>
                Periksa versi server
              </button>
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
        </div>
        <section className={styles.panel} id="research-commit">
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
              mutate(
                operation.current?.kind === "restore" ? "restore" : "commit",
              )
            }
            disabled={
              unsavedEntry ||
              busy ||
              state.status !== "saved" ||
              !state.fields.body.trim()
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
        <section className={styles.panel} id="research-history">
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
                disabled={
                  busy || !!pendingOperation || state.status !== "saved"
                }
                onClick={() => mutate("restore")}
              >
                Pulihkan versi ini ke Working Tree…
              </button>
              {compare && <VersionDiff before={compare} after={view} />}
            </article>
          )}
        </section>
      </div>
      <WritingCompanion
        id="writing-companion"
        open={companion}
        onClose={() => setCompanion(false)}
        opener={companionControl}
        area={area}
        onArea={setArea}
        source={source}
        ai={
          unsavedEntry ? (
            <p>
              Simpan draf untuk membuka AI Review. Penyedia belum diaktifkan.
            </p>
          ) : (
            <ReasoningPanel
              owner={owner}
              draftId={draft.id}
              revision={state.revision}
              dirty={state.status !== "saved"}
              sourceAvailable={!!source}
              companyAvailable={!!state.fields.company_id}
              version={view}
            />
          )
        }
      />
    </div>
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
