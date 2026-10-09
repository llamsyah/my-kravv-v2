import Link from "next/link";
import { thoughtCursor, type Thought } from "@/domain/thought/thought";
import { DeleteForm } from "@/features/data-control/delete-form";
import { Icon } from "@/components/ui/icon";
import styles from "./thought-workspace.module.css";

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
/** Phase 3 supplies immutable originals; no acceptance is inferred here. */
function ThoughtEntry({
  thought,
  companyId,
  expanded,
  selected,
}: {
  thought: Thought;
  companyId: string;
  expanded: boolean;
  selected: boolean;
}) {
  return (
    <li
      id={`thought-${thought.id}`}
      className={`${styles.entry} ${selected ? styles.selected : ""}`}
    >
      <div className={styles.body}>
        <ThoughtReading text={thought.raw_content} expanded={expanded} />
        <div className={styles.entryFooter}>
          <div className={styles.metadata}>
            <span className={styles.provenance}>
              <Icon name="pencil" size="small" />
              Asli
            </span>
            <ThoughtTime value={thought.created_at} compact />
          </div>
          <div className={styles.actions}>
            <Link
              className={styles.refineLink}
              href={`/companies/${companyId}/thoughts/${thought.id}/refine`}
            >
              Tinjau di Refine
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
  thoughts: Thought[];
  linkedThoughts?: Thought[];
  companyId: string;
  hasMore: boolean;
  older: boolean;
  saved?: string;
  focus?: string;
  total: number;
  archived?: boolean;
}) {
  const last = thoughts.at(-1);
  const entry = (thought: Thought) => (
    <ThoughtEntry
      key={thought.id}
      thought={thought}
      companyId={companyId}
      expanded={thought.id === saved || thought.id === focus}
      selected={thought.id === saved || thought.id === focus}
    />
  );
  return (
    <section className={styles.history} aria-labelledby="thought-history-title">
      <div className={styles.heading}>
        <h2 id="thought-history-title">
          Pemikiran tersimpan{" "}
          <span className={styles.count}>{total.toLocaleString("id-ID")}</span>
        </h2>
        <span>Terbaru terlebih dahulu · WIB</span>
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
          <ol className={styles.list}>{linkedThoughts.map(entry)}</ol>
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
      <ol className={styles.list}>{thoughts.map(entry)}</ol>
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
