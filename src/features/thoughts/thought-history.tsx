import Link from "next/link";
import { thoughtCursor, type Thought } from "@/domain/thought/thought";
import { DeleteForm } from "@/features/data-control/delete-form";

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
          : {
              dateStyle: "long",
              timeStyle: "short",
              timeZone: "Asia/Jakarta",
            },
      ).format(new Date(value))}{" "}
      WIB
    </time>
  );
}
export function ThoughtHistory({
  thoughts,
  companyId,
  hasMore,
  older,
  saved,
  focus,
}: {
  thoughts: Thought[];
  companyId: string;
  hasMore: boolean;
  older: boolean;
  saved?: string;
  focus?: string;
}) {
  const last = thoughts.at(-1);
  return (
    <section
      className="thought-history"
      aria-labelledby="thought-history-title"
    >
      <p className="section-label">RIWAYAT PEMIKIRAN</p>
      <h2 id="thought-history-title">
        Pemikiranmu, tetap seperti saat ditulis.
      </h2>
      <p className="auth-help">
        Pemikiran asli · Terbaru terlebih dahulu · Waktu Indonesia Barat
      </p>
      {!thoughts.length && (
        <p className="company-note">
          {older
            ? "Tidak ada pemikiran yang lebih lama."
            : "Belum ada pemikiran. Mulai dari pengamatan, pertanyaan, atau kesan pertama."}
        </p>
      )}
      {saved && thoughts.some((thought) => thought.id === saved) && (
        <p className="thought-success" role="status">
          Pemikiran asli tersimpan.
        </p>
      )}
      <ol className="thought-list">
        {thoughts.map((thought, index) => (
          <li
            key={thought.id}
            id={`thought-${thought.id}`}
            className="thought-entry"
          >
            <div className="thought-meta">
              <span className="section-label">ASLI</span>
              <ThoughtTime value={thought.created_at} compact />
            </div>
            <div className="thought-body">
              {thought.raw_content.length <= 420 &&
              thought.raw_content.split("\n").length <= 7 ? (
                <div className="thought-original">{thought.raw_content}</div>
              ) : (
                <details
                  className="long-thought"
                  open={thought.id === (saved ?? focus) || index === 0}
                >
                  <summary>
                    Baca pemikiran lengkap ·{" "}
                    {thought.raw_content.length.toLocaleString("id-ID")}{" "}
                    karakter
                  </summary>
                  <div className="thought-original">{thought.raw_content}</div>
                </details>
              )}
              <div className="thought-context-actions">
                <Link
                  className="quiet-link"
                  href={`/companies/${companyId}/thoughts/${thought.id}/refine`}
                >
                  Tinjau & rapikan pemikiran →
                </Link>
                <DeleteForm companyId={companyId} thoughtId={thought.id} />
              </div>
            </div>
          </li>
        ))}
      </ol>
      <nav
        className="thought-history-navigation"
        aria-label="Navigasi riwayat pemikiran"
      >
        {older && (
          <Link
            className="quiet-link"
            href={`/companies/${companyId}#thought-history-title`}
          >
            Kembali ke yang terbaru
          </Link>
        )}
        {hasMore && last && (
          <Link
            className="text-link"
            href={`/companies/${companyId}?before=${encodeURIComponent(thoughtCursor(last))}#thought-history-title`}
          >
            Pemikiran lebih lama →
          </Link>
        )}
      </nav>
    </section>
  );
}
