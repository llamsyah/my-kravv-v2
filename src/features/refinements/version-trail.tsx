import Link from "next/link";
import type { Refinement } from "@/domain/refinement/refinement";
import { ThoughtTime } from "@/features/thoughts/thought-history";
import { comparisonText, reviewLabels } from "./presentation";
import styles from "./refine-workspace.module.css";

export function RefinementProvenance({ row }: { row: Refinement }) {
  return (
    <details className={styles.provenance}>
      <summary>Asal versi & waktu keputusan</summary>
      <p>
        {row.provider} · {row.model} · {row.prompt_version} ·{" "}
        {row.output_schema_version}
      </p>
      <p>AI Run: {row.ai_run_id ?? "Rekam proses tidak tersedia"}</p>
      {row.resolved_at && (
        <p>
          Ditinjau: <ThoughtTime value={row.resolved_at} compact />
        </p>
      )}
      {row.user_final_content !== null && (
        <details>
          <summary>Usulan AI sebelum suntinganmu</summary>
          <div className={styles.reading}>{row.ai_content}</div>
        </details>
      )}
    </details>
  );
}
export function RefinementWarnings({ row }: { row: Refinement }) {
  return row.warnings.length ? (
    <ul className="refine-warnings">
      {row.warnings.map((w, i) => (
        <li key={i}>{w}</li>
      ))}
    </ul>
  ) : null;
}
export function VersionTrail({
  rows,
  related,
  displayedId,
  path,
  open,
  cursor,
  hasMore,
  last,
}: {
  rows: Refinement[];
  related: Refinement[];
  displayedId?: string;
  path: string;
  open: boolean;
  cursor: boolean;
  hasMore: boolean;
  last?: Refinement;
}) {
  const entry = (row: Refinement) => (
    <li key={row.id} id={`refinement-${row.id}`} className={styles.trailEntry}>
      <span className={styles.trailMarker} aria-hidden="true" />
      <div className={styles.trailBody}>
        <div className={styles.trailMeta}>
          <span data-status={row.status}>{reviewLabels[row.status]}</span>
          {row.id === displayedId && (
            <span className={styles.displayMark}>Ditampilkan</span>
          )}
          <ThoughtTime value={row.created_at} compact />
        </div>
        <details className={styles.versionReading}>
          <summary>
            <span className={styles.versionExcerpt} aria-hidden="true">
              {comparisonText(row)}
            </span>
            <span className={styles.versionReadAction}>Lihat selengkapnya</span>
          </summary>
          <div className={styles.reading}>{comparisonText(row)}</div>
          <RefinementWarnings row={row} />
          <RefinementProvenance row={row} />
        </details>
        <div className={styles.versionActions}>
          {row.status === "SUGGESTED" && (
            <Link href={`${path}?proposal=${row.id}#refinement-${row.id}`}>
              Tinjau usulan →
            </Link>
          )}
          {["ACCEPTED", "SUPERSEDED"].includes(row.status) &&
            row.id !== displayedId && (
              <Link href={`${path}?display=${row.id}#thought-display`}>
                Pratinjau untuk bacaan →
              </Link>
            )}
        </div>
      </div>
    </li>
  );
  return (
    <details className={styles.history} open={open || undefined}>
      <summary id="refine-history-title">Jejak versi</summary>
      {!!related.length && (
        <section aria-label="Versi terkait di luar halaman ini">
          <p className={styles.trailMeta}>
            Versi terkait · di luar halaman ini
          </p>
          <ol role="list" className={styles.trail}>
            {related.map(entry)}
          </ol>
        </section>
      )}
      <ol
        role="list"
        className={styles.trail}
        aria-label="Versi halaman ini, terbaru terlebih dahulu"
      >
        {rows.map(entry)}
      </ol>
      {!rows.length && cursor && (
        <p className="auth-help">Tidak ada versi lain pada halaman ini.</p>
      )}
      <nav className={styles.pagination} aria-label="Navigasi versi dirapikan">
        {cursor && (
          <Link className="quiet-button" href={path}>
            Kembali ke versi terbaru
          </Link>
        )}
        {hasMore && last && (
          <Link
            className="secondary-button"
            href={`${path}?before=${encodeURIComponent(`${last.created_at}|${last.id}`)}#refine-history-title`}
          >
            Versi lebih lama →
          </Link>
        )}
      </nav>
    </details>
  );
}
