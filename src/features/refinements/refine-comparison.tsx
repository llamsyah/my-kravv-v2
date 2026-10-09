"use client";
import { useSyncExternalStore, useId, useState, type ReactNode } from "react";
import styles from "./refine-workspace.module.css";
const subscribe = () => () => {};
const hydrated = () => true;
const server = () => false;

/** Both documents render on the server. Focused reading is progressive enhancement. */
export function RefineComparison({
  original,
  proposal,
  label,
}: {
  original: ReactNode;
  proposal: ReactNode;
  label: string;
}) {
  const enhanced = useSyncExternalStore(subscribe, hydrated, server);
  const [view, setView] = useState("proposal");
  const id = useId();
  return (
    <div
      data-enhanced={enhanced}
      data-view={view}
      className={styles.comparison}
    >
      <div
        className={styles.switcher}
        role="group"
        aria-label="Tampilan perbandingan"
      >
        {[
          ["original", "Asli"],
          ["proposal", label],
          ["both", "Lihat keduanya"],
        ].map(([value, text]) => (
          <button
            type="button"
            key={value}
            aria-pressed={view === value}
            aria-controls={`${id}-original ${id}-proposal`}
            onClick={() => setView(value)}
          >
            {text}
          </button>
        ))}
      </div>
      <section id={`${id}-original`} className={styles.original}>
        <h3 id="original-title">Asli</h3>
        <div className={styles.reading}>{original}</div>
      </section>
      <section id={`${id}-proposal`} className={styles.proposal}>
        <h3>{label}</h3>
        <div className={styles.reading}>{proposal}</div>
      </section>
    </div>
  );
}
