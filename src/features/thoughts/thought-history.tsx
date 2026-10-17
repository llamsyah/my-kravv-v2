import Link from "next/link";
import { thoughtCursor } from "@/domain/thought/thought";
import type { DisplayedThought } from "@/domain/thought/display";
import { DeleteForm } from "@/features/data-control/delete-form";
import { Icon } from "@/components/ui/icon";
import styles from "./thought-workspace.module.css";
import displayStyles from "./thought-display.module.css";

export function ThoughtTime({
  value,
  compact = false,
}: {
  value: string;
  compact?: boolean;
}) {
  return (
    <time dateTime={value}>
      {new Intl.DateTimeFormat(
        "id-ID",
        compact
          ? {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Asia/Jakarta",
            }
          : { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Jakarta" },
      ).format(new Date(value))}{" "}
      WIB
    </time>
  );
}
/** Text-only reading seam; version selection and provenance belong to its caller. */
function ThoughtReading({
  text,
  expanded,
}: {
  text: string;
  expanded: boolean;
}) {
  if (text.length <= 420 && text.split("\n").length <= 7)
    return <div className="thought-original">{text}</div>;
  return (
    <details className={styles.longThought} open={expanded}>
      <summary aria-label="Baca pemikiran lengkap">
        <span className={styles.excerpt} aria-hidden="true">
          {text}
        </span>
        <span className={styles.readAction}>
          <Icon name="read" size="small" />
          <span className={styles.readClosed}>Baca lengkap</span>
          <span className={styles.readOpen}>Tutup bacaan lengkap</span>
          <Icon name="chevronDown" size="small" />
        </span>
      </summary>
      <div className="thought-original">{text}</div>
    </details>
  );
}
/** Reading uses the owned persisted projection; originals and receipts stay exact. */
function ThoughtEntry({
  thought,
  companyId,
  expanded,
  selected,
  position,
}: {
  thought: DisplayedThought;
  companyId: string;
  expanded: boolean;
  selected: boolean;
  position: number;
}) {
  return (
    <li
      id={`thought-${thought.id}`}
      className={`${styles.entry} ${selected ? styles.selected : ""}`}
    >
      <span className={styles.sequence} aria-hidden="true">
        {String(position).padStart(2, "0")}
      </span>
      <div className={styles.body}>
        <ThoughtReading text={thought.display.text} expanded={expanded} />
        {thought.display.source === "REFINEMENT" && (
          <details className={displayStyles.original}>
            <summary>Lihat asli</summary>
            <div className="thought-original">{thought.raw_content}</div>
          </details>
        )}
        <div className={styles.entryFooter}>
          <div className={styles.metadata}>
            <span className={styles.provenance}>
              <Icon name="pencil" size="small" />
              {thought.display.label}
            </span>
            <ThoughtTime value={thought.created_at} compact />
          </div>
          <div className={styles.actions}>
            <Link
              className={styles.refineLink}
              href={`/companies/${companyId}/thoughts/${thought.id}/refine`}
            >
              {thought.display.hasApproved ||
              thought.display.source === "UNAVAILABLE"
                ? "Ubah versi di Refine"
                : "Tinjau di Refine"}
              <Icon name="arrowRight" size="small" />
            </Link>
            <DeleteForm
              companyId={companyId}
              thoughtId={thought.id}
              disclosureLabel="Opsi pemikiran"
            />
          </div>
        </div>
      </div>
    </li>
  );
}
export function ThoughtHistory({
  thoughts,
  linkedThoughts = [],
  companyId,
  hasMore,
  older,
  saved,
  focus,
  total,
  archived = false,
}: {
  thoughts: DisplayedThought[];
  linkedThoughts?: DisplayedThought[];
  companyId: string;
  hasMore: boolean;
  older: boolean;
  saved?: string;
  focus?: string;
  total: number;
  archived?: boolean;
}) {
  const last = thoughts.at(-1);
  const entry = (thought: DisplayedThought, index: number) => (
    <ThoughtEntry
      key={thought.id}
      thought={thought}
      companyId={companyId}
      expanded={thought.id === saved || thought.id === focus}
      selected={thought.id === saved || thought.id === focus}
      position={index + 1}
    />
  );
  return (
    <section className={styles.history} aria-labelledby="thought-history-title">
      <div className={styles.heading}>
        <h2 id="thought-history-title">
          Pemikiran tersimpan{" "}
          <span className={styles.count}>{total.toLocaleString("id-ID")}</span>
        </h2>
        <span>Urutan halaman ini · Terbaru dahulu</span>
      </div>
      {saved &&
        [...thoughts, ...linkedThoughts].some(
          (thought) => thought.id === saved,
        ) && (
          <p className="thought-success" role="status">
            Pemikiran asli tersimpan.
          </p>
        )}
      {!!linkedThoughts.length && (
        <section aria-labelledby="linked-thought-title">
          <h3 id="linked-thought-title" className={styles.linkedTitle}>
            Pemikiran yang dituju <span>Di luar halaman riwayat ini</span>
          </h3>
          <ol
            className={styles.list}
            role="list"
            aria-labelledby="linked-thought-title"
          >
            {linkedThoughts.map(entry)}
          </ol>
        </section>
      )}
      {!thoughts.length && (
        <p className={styles.empty}>
          {older
            ? "Tidak ada pemikiran yang lebih lama."
            : archived
              ? "Tidak ada pemikiran tersimpan di ruang arsip ini."
              : "Belum ada pemikiran. Mulai dari pengamatan atau pertanyaan pertamamu."}
        </p>
      )}
      <ol
        className={styles.list}
        role="list"
        aria-label="Pemikiran halaman ini, terbaru terlebih dahulu"
      >
        {thoughts.map(entry)}
      </ol>
      <nav
        className={styles.pagination}
        aria-label="Navigasi riwayat pemikiran"
      >
        {older && (
          <Link
            className="quiet-link"
            href={`/companies/${companyId}/thoughts#thought-history-title`}
          >
            <Icon name="arrowLeft" />
            Kembali ke yang terbaru
          </Link>
        )}
        {hasMore && last && (
          <Link
            className="secondary-button"
            href={`/companies/${companyId}/thoughts?before=${encodeURIComponent(thoughtCursor(last))}#thought-history-title`}
          >
            Pemikiran lebih lama
            <Icon name="arrowRight" />
          </Link>
        )}
      </nav>
    </section>
  );
}
