"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveCaptureAction, findCaptureCompaniesAction } from "./actions";
import {
  captureInput,
  rawCaptureText,
  captureTextLimit,
  captureHref,
  captureTime,
  type CaptureInboxState,
  type CaptureItem,
} from "./contract";
import { workspaceHref } from "../v3-workspace/model";
import styles from "./inbox.module.css";
import { researchHref } from "../research/contract";

type Choice = { id: string; name: string; ticker?: string | null };
export function CaptureInbox({
  ownerId,
  state,
  variant = "inbox",
  onConfirmed,
}: {
  ownerId: string;
  state: CaptureInboxState;
  variant?: "inbox" | "home";
  onConfirmed?: (capture: CaptureItem) => void;
}) {
  const home = variant === "home";
  const router = useRouter();
  const [text, setText] = useState("");
  const [company, setCompany] = useState<Choice | null>(null);
  const [query, setQuery] = useState("");
  const [choices, setChoices] = useState<Choice[]>([]);
  const [choicePage, setChoicePage] = useState(0),
    [hasNext, setHasNext] = useState(false);
  const [searching, setSearching] = useState(false),
    [searched, setSearched] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null),
    [saved, setSaved] = useState(false);
  const [attempt, setAttempt] = useState<ReturnType<
    typeof captureInput.parse
  > | null>(null);
  const mounted = useRef(true),
    sequence = useRef(0),
    sending = useRef(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (text.length) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [text]);
  async function searchCompanies(page = 0) {
    const ticket = ++sequence.current;
    setSearching(true);
    setPickerError(null);
    try {
      const result = await findCaptureCompaniesAction(query, page, ownerId);
      if (!mounted.current || ticket !== sequence.current) return;
      if (result.error || !result.items) {
        setChoices([]);
        setPickerError(result.error ?? "Perusahaan belum tersedia.");
      } else {
        setChoices(result.items);
        setChoicePage(page);
        setHasNext(result.hasNext);
        setSearched(true);
      }
    } catch {
      if (mounted.current && ticket === sequence.current)
        setPickerError("Pencarian belum dapat diselesaikan.");
    } finally {
      if (mounted.current && ticket === sequence.current) setSearching(false);
    }
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || !state.ready || state.failed) return;
    const input =
      attempt ??
      captureInput.safeParse({
        request_id: crypto.randomUUID(),
        raw_text: text,
        company_id: company?.id ?? null,
      }).data;
    if (!input) {
      setError("Isi catatan 1–8.000 karakter sebelum menyimpan.");
      return;
    }
    sending.current = true;
    setPending(true);
    setAttempt(input);
    setError(null);
    setSaved(false);
    try {
      const result = await saveCaptureAction(input, ownerId);
      if (!mounted.current) return;
      if (result.error || !result.capture) {
        setError(result.error ?? "Penyimpanan belum terkonfirmasi.");
        return;
      }
      setText("");
      setCompany(null);
      setAttempt(null);
      setSaved(true);
      if (home)
        onConfirmed?.({
          ...result.capture,
          company_name: company?.name ?? null,
        });
      else router.replace(captureHref());
      router.refresh();
      textarea.current?.focus();
    } catch {
      if (mounted.current)
        setError(
          "Penyimpanan belum terkonfirmasi. Coba ulang catatan yang sama; jangan membuat salinan baru.",
        );
    } finally {
      sending.current = false;
      if (mounted.current) setPending(false);
    }
  }
  return (
    <div className={styles.inbox} data-home-composer={home || undefined}>
      <section
        className={styles.composer}
        aria-labelledby="capture-compose-title"
      >
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="capture-compose-title">
              {home ? "Catat cepat" : "Tangkap dulu, susun nanti."}
            </h2>
            <span>Quick Capture</span>
          </div>
          {home && (
            <Link href={captureHref()}>
              Lihat penampungan <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
        <p>
          {home
            ? "Tulis apa saja yang sedang kamu pikirkan. Catatan masuk ke penampungan, bukan otomatis menjadi Thought."
            : "Observasi, pertanyaan, atau hipotesis. Simpan apa adanya, tanpa AI."}
        </p>
        {!state.ready && !state.failed && (
          <p className={styles.notice} role="status">
            Penampungan menunggu pembaruan skema. Penyimpanan belum tersedia.
          </p>
        )}
        <form onSubmit={save} aria-busy={pending}>
          <label
            htmlFor="capture-text"
            className={home ? "sr-only" : undefined}
          >
            Catatan mentah <span aria-hidden="true">*</span>
          </label>
          <textarea
            ref={textarea}
            id="capture-text"
            name="raw_text"
            rows={home ? 2 : 6}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setSaved(false);
            }}
            readOnly={pending || !!attempt}
            required
            aria-describedby="capture-text-hint capture-save-status"
            placeholder={
              home
                ? "Apa yang sedang kamu pikirkan?"
                : "Apa yang sedang kamu perhatikan?"
            }
          />
          <div className={styles.hint} id="capture-text-hint">
            <span>Teks asli dipertahankan. Bukan rekaman Thought.</span>
            <span>
              {Array.from(text).length.toLocaleString("id-ID")} /{" "}
              {captureTextLimit.toLocaleString("id-ID")}
            </span>
          </div>
          <details className={styles.picker}>
            <summary>
              Perusahaan · {company ? company.name : "opsional"}
            </summary>
            <div className={styles.pickerBody}>
              {company && (
                <p>
                  Dipilih: <strong>{company.name}</strong>{" "}
                  <button
                    type="button"
                    disabled={pending || !!attempt}
                    onClick={() => setCompany(null)}
                  >
                    Lepaskan pilihan
                  </button>
                </p>
              )}
              <label htmlFor="capture-company-query">Cari perusahaanmu</label>
              <div className={styles.search}>
                <input
                  id="capture-company-query"
                  value={query}
                  maxLength={200}
                  disabled={pending || !!attempt || searching}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSearched(false);
                    setChoices([]);
                  }}
                />
                <button
                  type="button"
                  disabled={pending || !!attempt || searching}
                  onClick={() => searchCompanies()}
                >
                  {searching ? "Mencari…" : "Cari"}
                </button>
              </div>
              {pickerError && <p role="alert">{pickerError}</p>}
              {searched && !choices.length && (
                <p>Tidak ada perusahaan yang cocok.</p>
              )}
              <ul className={styles.choices}>
                {choices.map((choice) => (
                  <li key={choice.id}>
                    <button
                      type="button"
                      disabled={pending || !!attempt}
                      aria-pressed={company?.id === choice.id}
                      onClick={() => setCompany(choice)}
                    >
                      {choice.name}
                      {choice.ticker ? ` · ${choice.ticker}` : ""}
                    </button>
                  </li>
                ))}
              </ul>
              {searched && (
                <div className={styles.paging}>
                  <button
                    type="button"
                    disabled={
                      choicePage === 0 || searching || pending || !!attempt
                    }
                    onClick={() => searchCompanies(choicePage - 1)}
                  >
                    Sebelumnya
                  </button>
                  <span>Halaman {choicePage + 1}</span>
                  <button
                    type="button"
                    disabled={!hasNext || searching || pending || !!attempt}
                    onClick={() => searchCompanies(choicePage + 1)}
                  >
                    Berikutnya
                  </button>
                </div>
              )}
            </div>
          </details>
          {error && (
            <div className={styles.error} role="alert">
              <p>{error}</p>
              <p>
                Teks dan identitas pengiriman dipertahankan. Pengiriman ulang
                memakai identitas yang sama; periksa inbox sebelum meninggalkan
                halaman.
              </p>
            </div>
          )}
          <div className={styles.footer}>
            <button
              className={styles.save}
              type="submit"
              disabled={
                pending ||
                !state.ready ||
                state.failed ||
                !rawCaptureText.safeParse(text).success
              }
            >
              {pending
                ? "Menyimpan…"
                : attempt
                  ? "Coba ulang catatan ini"
                  : home
                    ? "Simpan catatan"
                    : "Simpan ke Penampungan"}
            </button>
            <span id="capture-save-status" role="status" aria-live="polite">
              {pending
                ? "Menunggu konfirmasi…"
                : saved
                  ? "Catatan tersimpan."
                  : ""}
            </span>
          </div>
        </form>
      </section>
      {!home && (
        <section
          aria-labelledby="capture-list-title"
          className={styles.listSection}
        >
          <div className={styles.sectionHeading}>
            <h2 id="capture-list-title">Penampungan</h2>
            <span>TERBARU DAHULU</span>
          </div>
          {state.failed ? (
            <div className={styles.error} role="alert">
              <h3>Penampungan belum dapat dimuat.</h3>
              <p>
                Catatan tersimpan tidak diubah. Muat ulang untuk memeriksa
                sambungan.
              </p>
              <a href={captureHref(state.page)}>Muat ulang inbox</a>
            </div>
          ) : !state.ready ? null : !state.items.length ? (
            <div className={styles.empty}>
              <h3>
                {state.page
                  ? "Tidak ada catatan di halaman ini."
                  : "Ruang untuk ide yang belum selesai."}
              </h3>
              <p>
                {state.page
                  ? "Kembali ke halaman sebelumnya."
                  : "Catatan pertamamu akan muncul di sini. Tidak harus rapi atau punya perusahaan."}
              </p>
            </div>
          ) : (
            <ol className={styles.list}>
              {state.items.map((item) => (
                <li key={item.id}>
                  <article className={styles.capture}>
                    <div className={styles.captureMeta}>
                      <span>
                        {item.company_id ? (
                          <Link
                            href={workspaceHref("company", item.company_id)}
                          >
                            {item.company_name}
                          </Link>
                        ) : (
                          "Tanpa perusahaan"
                        )}
                      </span>
                      <time dateTime={item.created_at}>
                        {captureTime(item.created_at)}
                      </time>
                    </div>
                    <p className={styles.raw}>{item.raw_text}</p>
                    <Link
                      href={researchHref(
                        undefined,
                        item.company_id ?? undefined,
                        item.id,
                      )}
                    >
                      Kembangkan menjadi draf →
                    </Link>
                  </article>
                </li>
              ))}
            </ol>
          )}
          {state.ready &&
            !state.failed &&
            (state.page > 0 || state.hasNext) && (
              <nav className={styles.paging} aria-label="Halaman Penampungan">
                {state.page > 0 && (
                  <Link href={captureHref(state.page - 1)}>Lebih baru</Link>
                )}
                <span>Halaman {state.page + 1}</span>
                {state.hasNext && state.page < 10000 && (
                  <Link href={captureHref(state.page + 1)}>Lebih lama</Link>
                )}
              </nav>
            )}
        </section>
      )}
    </div>
  );
}
