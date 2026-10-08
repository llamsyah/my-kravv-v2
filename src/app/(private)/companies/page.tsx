import Link from "next/link";
import { getCompanyContext } from "@/server/companies/context";
import { getCompanies } from "@/server/db/companies";
import { companyStateLabels } from "@/domain/company/company";
export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; deleted?: string; q?: string }>;
}) {
  const search = await searchParams;
  const archived = search.view === "archived";
  const { supabase, user } = await getCompanyContext();
  const allCompanies = await getCompanies(supabase, user.id, archived);
  const query =
    typeof search.q === "string" ? search.q.slice(0, 200).trim() : "";
  const companies = allCompanies.filter((company) =>
    [company.name, company.ticker, company.sector].some((value) =>
      value
        ?.toLocaleLowerCase("id-ID")
        .includes(query.toLocaleLowerCase("id-ID")),
    ),
  );
  return (
    <>
      <section className="company-intro atmospheric-hero archive-hero">
        <p className="eyebrow">ARSIP PENELITIAN PRIBADI</p>
        <h1>Perusahaan</h1>
        <p className="intro-copy">
          Ruang untuk perusahaan yang sedang kamu pelajari, kembangkan, dan
          tinjau dari waktu ke waktu.
        </p>
      </section>
      <div className="company-toolbar">
        <form className="company-search" action="/companies">
          <label className="sr-only" htmlFor="company-search">
            Cari perusahaan
          </label>
          <input
            id="company-search"
            name="q"
            type="search"
            placeholder="Cari perusahaan…"
            defaultValue={query}
            maxLength={200}
          />
          {archived && <input type="hidden" name="view" value="archived" />}
          <button className="quiet-button" type="submit">
            Cari
          </button>
        </form>
        <nav className="company-views" aria-label="Tampilan perusahaan">
          <Link href="/companies" aria-current={!archived ? "page" : undefined}>
            Aktif
          </Link>
          <Link
            href="/companies?view=archived"
            aria-current={archived ? "page" : undefined}
          >
            Diarsipkan
          </Link>
        </nav>
        <Link className="primary-button" href="/companies/new">
          Tambah perusahaan <span aria-hidden="true">+</span>
        </Link>
      </div>
      {search.deleted === "company" && (
        <p className="thought-success" role="status">
          Perusahaan beserta pemikiran dan riwayatnya telah dihapus permanen.
        </p>
      )}
      <section aria-labelledby="company-list-title">
        <h2 id="company-list-title" className="archive-heading">
          {archived ? "Diarsipkan" : "Perusahaan aktif"}{" "}
          <span>({companies.length})</span>
        </h2>
        {companies.length === 0 ? (
          <div className="company-empty">
            <h2>
              {query
                ? "Tidak ada perusahaan yang cocok."
                : archived
                  ? "Belum ada perusahaan di arsip."
                  : "Mulai dari satu perusahaan."}
            </h2>
            <p>
              {archived
                ? "Perusahaan yang kamu arsipkan akan tetap tersimpan di sini."
                : "Cukup beri nama. Informasi yang belum kamu tahu bisa dilengkapi nanti."}
            </p>
            {!archived && (
              <Link className="text-link" href="/companies/new">
                Tambah perusahaan pertamamu <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
        ) : (
          <ul className="company-list">
            {companies.map((company) => (
              <li
                key={company.id}
                className={
                  archived ? "company-row archived-row" : "company-row"
                }
              >
                <div className="company-row-identity">
                  <h2>
                    <Link href={`/companies/${company.id}`}>
                      {company.name}
                    </Link>
                  </h2>
                  <p>
                    {[company.ticker, company.exchange, company.sector]
                      .filter(Boolean)
                      .join(" · ") || "Identitas dapat dilengkapi nanti"}
                  </p>
                </div>
                <span className="company-state">
                  {companyStateLabels[company.state]}
                </span>
                <p className="company-row-note">
                  {company.short_note || "Belum ada catatan singkat."}
                </p>
                <div className="company-row-open">
                  <time dateTime={company.updated_at}>
                    Diperbarui{" "}
                    {new Intl.DateTimeFormat("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      timeZone: "Asia/Jakarta",
                    }).format(new Date(company.updated_at))}
                  </time>
                  <Link
                    href={`/companies/${company.id}`}
                    className="quiet-link"
                    aria-label={`Buka ruang ${company.name}`}
                  >
                    Buka ruang <span aria-hidden="true">→</span>
                  </Link>
                  <details className="company-row-more">
                    <summary aria-label={`Kelola ${company.name}`}>⋯</summary>
                    <div>
                      <Link href={`/companies/${company.id}/edit`}>
                        Ubah identitas
                      </Link>
                      <Link href={`/companies/${company.id}#data-control`}>
                        Arsip / hapus perusahaan
                      </Link>
                    </div>
                  </details>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
