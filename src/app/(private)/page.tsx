import Link from "next/link";
import { randomUUID } from "node:crypto";
import { getCompanyContext } from "@/server/companies/context";
import { getCompanies } from "@/server/db/companies";
import { getRecentThoughts } from "@/server/db/thoughts";
import { ThoughtComposer } from "@/features/thoughts/thought-composer";
import { ThoughtTime } from "@/features/thoughts/thought-history";

export default async function HomePage() {
  const { supabase, user } = await getCompanyContext();
  const [companies, recent] = await Promise.all([
    getCompanies(supabase, user.id),
    getRecentThoughts(supabase, user.id),
  ]);
  const latest = recent[0];
  const continuation = latest
    ? { id: latest.company_id, name: latest.companyName }
    : companies[0];
  return (
    <>
      <section
        className="intro atmospheric-hero home-hero"
        aria-labelledby="page-title"
      >
        <p className="eyebrow">RUANG UNTUK BERPIKIR</p>
        <h1 id="page-title">
          Sampai di mana<span className="desktop-space"> </span>
          <br className="mobile-break" />
          pemikiranmu?
        </h1>
        <p className="intro-copy">
          Kembali ke alasan, pengamatan, dan pertanyaanmu.
          <br className="desktop-break" /> Sedikit demi sedikit, pahami apa yang
          kamu pikirkan.
        </p>
      </section>
      <section className="continuation" aria-labelledby="continue-title">
        <div>
          <p className="section-label" id="continue-title">
            LANJUTKAN DARI SINI
          </p>
          <h2>{continuation?.name ?? "Satu perusahaan. Satu awal."}</h2>
        </div>
        <div className="continuation-copy">
          <p>
            {latest
              ? `${latest.raw_content.slice(0, 150).replace(/\s+/g, " ").trim()}${latest.raw_content.length > 150 ? "…" : ""}`
              : continuation
                ? "Buka kembali ruang penelitian yang terakhir diperbarui."
                : "Beri ruang untuk perusahaan yang ingin kamu pahami."}
          </p>
          {latest && <ThoughtTime value={latest.created_at} />}
        </div>
        <Link
          className="primary-button"
          href={
            continuation ? `/companies/${continuation.id}` : "/companies/new"
          }
        >
          {continuation ? "Lanjutkan pemikiran" : "Tambah perusahaan"}{" "}
          <span aria-hidden="true">→</span>
        </Link>
      </section>
      <section
        className="thought-capture home-capture"
        aria-labelledby="workspace-title"
      >
        <div className="section-heading">
          <h2 id="workspace-title">Catat pemikiran</h2>
          <span className="auth-help">Tidak perlu rapi untuk mulai.</span>
        </div>
        {companies.length ? (
          <ThoughtComposer
            userId={user.id}
            initialOperationId={randomUUID()}
            companies={companies.map(({ id, name }) => ({ id, name }))}
          />
        ) : (
          <p className="company-note">
            Buat perusahaan terlebih dahulu, lalu tulis apa pun yang sedang kamu
            pikirkan.{" "}
            <Link className="text-link" href="/companies/new">
              Tambah perusahaan →
            </Link>
          </p>
        )}
      </section>
      <div className="home-activity-grid">
        <section
          className="recent-thinking"
          aria-labelledby="recent-thinking-title"
        >
          <div className="section-heading">
            <h2 id="recent-thinking-title">Pemikiran terbaru</h2>
            <span className="section-label">ASLI</span>
          </div>
          {!recent.length && (
            <p className="company-note empty-inline">
              Pemikiran yang kamu simpan akan muncul di sini.
            </p>
          )}
          <ol className="recent-list">
            {recent.map((thought) => (
              <li key={thought.id}>
                <div className="recent-identity">
                  <Link href={`/companies/${thought.company_id}`}>
                    {thought.companyName}
                  </Link>
                  <ThoughtTime value={thought.created_at} compact />
                </div>
                <Link
                  className="recent-content"
                  href={`/companies/${thought.company_id}?focus=${thought.id}#thought-${thought.id}`}
                >
                  <span>
                    {thought.raw_content.slice(0, 200)}
                    {thought.raw_content.length > 200 ? "…" : ""}
                  </span>
                  <span className="recent-arrow" aria-hidden="true">
                    ↗
                  </span>
                  <span className="sr-only">Buka ruang perusahaan</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
        <aside
          className="research-spaces"
          aria-labelledby="research-spaces-title"
        >
          <div className="section-heading">
            <h2 id="research-spaces-title">Ruang penelitian</h2>
            <Link className="quiet-link" href="/companies">
              Semua →
            </Link>
          </div>
          {companies.length ? (
            <ul>
              {companies.slice(0, 3).map((company) => (
                <li key={company.id}>
                  <Link href={`/companies/${company.id}`}>
                    <strong>{company.name}</strong>
                    <span>
                      {company.sector || company.ticker || "Ruang perusahaan"}
                    </span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="company-note empty-inline">
              Ruang perusahaanmu akan tersusun di sini.
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
