import Link from "next/link";
import { thoughtCursor, type Thought } from "@/domain/thought/thought";

export function ThoughtTime({ value }: { value: string }) {
  return (
    <time dateTime={value}>
      {new Intl.DateTimeFormat("id-ID", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "Asia/Jakarta",
      }).format(new Date(value))}{" "}
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
              <ThoughtTime value={thought.created_at} />
            </div>
            <details open={thought.id === (saved ?? focus) || index === 0}>
              <summary>
                <span>
                  {thought.raw_content.slice(0, 160)}
                  {thought.raw_content.length > 160 ? "…" : ""}
                </span>
                <span className="text-link">Baca pemikiran lengkap</span>
              </summary>
              <div className="thought-original">{thought.raw_content}</div>
            </details>
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
