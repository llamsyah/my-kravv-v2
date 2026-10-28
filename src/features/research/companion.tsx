"use client";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Icon } from "../../components/ui/icon";
import { writingAreas } from "./writing-tools";
import type { ResearchPageState } from "../../server/research/service";
import { cycleDrawerFocus } from "../v3-workspace/company-sidebar";
import styles from "./workspace.module.css";
function subscribe(fn: () => void) {
  const query = window.matchMedia("(max-width: 1250px)");
  query.addEventListener("change", fn);
  return () => query.removeEventListener("change", fn);
}
function compact() {
  return window.matchMedia("(max-width: 1250px)").matches;
}
export function useCompactCompanion() {
  return useSyncExternalStore(subscribe, compact, () => false);
}
export function WritingCompanion({
  id,
  open,
  onClose,
  opener,
  area,
  onArea,
  source,
  ai,
}: {
  id: string;
  open: boolean;
  onClose: () => void;
  opener: React.RefObject<HTMLButtonElement | null>;
  area: number;
  onArea: (n: number) => void;
  source: ResearchPageState["source"];
  ai?: ReactNode;
}) {
  const [tab, setTab] = useState("Panduan");
  const narrow = useCompactCompanion();
  const dialog = useRef<HTMLDialogElement>(null),
    close = useRef<HTMLButtonElement>(null),
    wasOpen = useRef(open);
  useEffect(() => {
    if (narrow && open && dialog.current) {
      const el = dialog.current;
      const overflow = document.body.style.overflow;
      el.showModal();
      document.body.style.overflow = "hidden";
      close.current?.focus();
      return () => {
        if (el.open) el.close();
        document.body.style.overflow = overflow;
      };
    }
  }, [narrow, open]);
  useEffect(() => {
    if (!open && wasOpen.current) opener.current?.focus();
    wasOpen.current = open;
  }, [open, opener]);
  const choose = (label: string) => {
    setTab(label);
  };
  const content = (
    <>
      <div className={styles.companionHead}>
        <div role="tablist" aria-label="Companion">
          {["Panduan", "Bahan", "AI Review", "Referensi"].map(
            (label, index) => (
              <button
                id={id + "-tab-" + index}
                key={label}
                type="button"
                role="tab"
                aria-selected={tab === label}
                aria-controls={id + "-pane-" + index}
                tabIndex={tab === label ? 0 : -1}
                onClick={() => choose(label)}
                onKeyDown={(e) => {
                  const labels = ["Panduan", "Bahan", "AI Review", "Referensi"];
                  let next = index;
                  if (e.key === "ArrowRight") next = (index + 1) % 4;
                  else if (e.key === "ArrowLeft") next = (index + 3) % 4;
                  else if (e.key === "Home") next = 0;
                  else if (e.key === "End") next = 3;
                  else return;
                  e.preventDefault();
                  choose(labels[next]);
                  e.currentTarget.parentElement
                    ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
                    [next]?.focus();
                }}
              >
                {label}
              </button>
            ),
          )}
        </div>
        <button
          ref={close}
          type="button"
          onClick={onClose}
          className={styles.closeCompanion}
          aria-label="Tutup Companion"
        >
          ×
        </button>
      </div>
      <section
        role="tabpanel"
        id={id + "-pane-0"}
        aria-labelledby={id + "-tab-0"}
        hidden={tab !== "Panduan"}
        tabIndex={0}
      >
        <div className={styles.companionCard}>
          <h3>Panduan aktif</h3>
          <div className={styles.template}>
            <Icon name="read" />
            <div>
              <strong>Fundamental Deep Dive</strong>
              <p>Enam area penelitian, tanpa kewajiban mengisi.</p>
            </div>
          </div>
        </div>
        <div className={styles.companionCard}>
          <h3>Area penelitian</h3>
          <p className={styles.muted}>
            Pilih area untuk membuka pertanyaan, bukan menilai kualitas riset.
          </p>
          <ol className={styles.areaList}>
            {writingAreas.map((item, n) => (
              <li key={item.title}>
                <button
                  type="button"
                  aria-pressed={area === n}
                  onClick={() => onArea(n)}
                >
                  <span>{n + 1}</span>
                  <strong>{item.title}</strong>
                  <Icon name="arrowRight" size="small" />
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div className={styles.companionCard}>
          <h3>
            <Icon name="thought" size="small" /> Pertanyaan pemandu · Area{" "}
            {area + 1}
          </h3>
          <ul className={styles.questions}>
            {writingAreas[area].questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
        <p className={styles.guideNote}>
          Panduan ini opsional. Membuka area tidak mengubah teks, membuat skor,
          atau menjalankan AI.
        </p>
      </section>
      <section
        role="tabpanel"
        id={id + "-pane-1"}
        aria-labelledby={id + "-tab-1"}
        hidden={tab !== "Bahan"}
        tabIndex={0}
      >
        <div className={styles.companionCard}>
          <h3>Bahan tulisan</h3>
          {source ? (
            <>
              <p>Capture sumber · asli, tidak diubah</p>
              <pre>{source.raw_text}</pre>
              <p className={styles.muted}>
                Draf adalah salinan untuk dikembangkan. Capture tetap tersimpan.
              </p>
            </>
          ) : (
            <p>Belum ada Capture sumber untuk dokumen ini.</p>
          )}
        </div>
        <div className={styles.companionCard}>
          <h3>Material tambahan</h3>
          <p>
            Explore dan pemilihan material tersimpan belum tersedia. Tidak ada
            sumber yang ditambahkan otomatis.
          </p>
        </div>
      </section>
      <section
        role="tabpanel"
        id={id + "-pane-2"}
        aria-labelledby={id + "-tab-2"}
        hidden={tab !== "AI Review"}
        tabIndex={0}
      >
        {ai ?? (
          <div className={styles.companionCard}>
            <h3>AI Review</h3>
            <p>
              Buka draf tersimpan terlebih dahulu. Penyedia AI belum diaktifkan.
            </p>
          </div>
        )}
      </section>
      <section
        role="tabpanel"
        id={id + "-pane-3"}
        aria-labelledby={id + "-tab-3"}
        hidden={tab !== "Referensi"}
        tabIndex={0}
      >
        <div className={styles.companionCard}>
          <h3>Referensi</h3>
          <p>
            Penyimpanan dan pemilihan dokumen atau tautan belum tersedia di V3.
          </p>
          <p className={styles.muted}>
            Tidak ada PDF, kutipan, atau jumlah referensi yang disimulasikan.
          </p>
        </div>
      </section>
    </>
  );
  // Both branches retain the same content while hidden; tab/panel toggles never remount the editor.
  return narrow ? (
    <dialog
      ref={dialog}
      id={id}
      className={styles.companionDrawer}
      aria-label="Companion penulisan"
      onKeyDown={cycleDrawerFocus}
      onClose={() => {
        if (open) onClose();
      }}
    >
      {content}
    </dialog>
  ) : (
    <aside
      id={id}
      className={styles.companion}
      hidden={!open}
      aria-label="Companion penulisan"
    >
      {content}
    </aside>
  );
}
