import Link from "next/link";
import { redirect } from "next/navigation";
import { getCompanyWorkspaceContext } from "@/server/companies/workspace";
import { CompanyWorkspaceShell } from "@/features/companies/company-workspace-shell";
import { ArchiveForm } from "@/features/companies/archive-form";
import { DeleteForm } from "@/features/data-control/delete-form";
import { CompanyDataControl } from "@/features/companies/company-data-control";
import { LegacyCompanyHashNavigation } from "@/features/companies/legacy-company-hash-navigation";
import {
  legacyThoughtDestination,
  type ThoughtSearch,
} from "@/features/companies/legacy-navigation";
import { ThoughtTime } from "@/features/thoughts/thought-history";
import {
  getCompanyOverviewThoughts,
  getCompanyThoughtCount,
} from "@/server/db/thoughts";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/status-badge";
import styles from "@/features/companies/company-overview.module.css";

export default async function CompanyPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<ThoughtSearch>;
}) {
  const { companyId } = await params;
  const { supabase, user, company } =
    await getCompanyWorkspaceContext(companyId);
  const destination = legacyThoughtDestination(company.id, await searchParams);
  if (destination) redirect(destination);
  const [thoughts, total] = await Promise.all([
    getCompanyOverviewThoughts(supabase, user.id, company.id),
    getCompanyThoughtCount(supabase, user.id, company.id),
  ]);
  const [latest, ...earlier] = thoughts;
  const path = `/companies/${company.id}/thoughts`;
  const hasContext = !!company.short_note || total > 0;
  const read = (id: string) => `${path}?focus=${id}#thought-${id}`;
  return (
    <CompanyWorkspaceShell companyId={company.id} context="workspace">
      <LegacyCompanyHashNavigation companyId={company.id} />
      {company.state === "ARCHIVED" && (
        <p className="archive-notice">
          Diarsipkan · Pemikiran tetap dapat dibaca. Capture dan generasi AI
          baru tidak tersedia.
        </p>
      )}
      <div className={hasContext ? styles.grid : styles.single}>
        <div className={styles.primary}>
          <section aria-labelledby="latest-thought-title">
            <div className={styles.heading}>
              <h2 id="latest-thought-title">Pemikiran terakhir</h2>
              {latest && <ThoughtTime value={latest.created_at} compact />}
            </div>
            {latest ? (
              <article className={styles.latest} id={`thought-${latest.id}`}>
                <StatusBadge tone="neutral">Asli</StatusBadge>
                <div className={`${styles.original} ${styles.latestExcerpt}`}>
                  {latest.raw_content}
                </div>
                <Link className="secondary-button" href={read(latest.id)}>
                  <Icon name="read" />
                  Baca pemikiran
                  <Icon name="arrowRight" />
                </Link>
              </article>
            ) : (
              <div className={styles.empty}>
                <Icon name="pencil" size="large" />
                <h3>Belum ada pemikiran</h3>
                <p>
                  {company.state === "ARCHIVED"
                    ? "Tidak ada pemikiran tersimpan di ruang arsip ini."
                    : "Mulai dari pengamatan atau pertanyaan pertamamu."}
                </p>
              </div>
            )}
          </section>
          <nav
            id="thought-history-title"
            className={styles.entrances}
            aria-label="Lanjutkan di ruang ini"
          >
            {company.state !== "ARCHIVED" && (
              <Link
                className={styles.entrance}
                href={`${path}#thought-capture-title`}
              >
                <Icon name="pencil" />
                <span>Tambahkan pemikiran</span>
                <Icon name="arrowRight" />
              </Link>
            )}
            <Link
              className={styles.entrance}
              href={`${path}#thought-history-title`}
            >
              <Icon name="read" />
              <span>
                Semua pemikiran{" "}
                <small>{total.toLocaleString("id-ID")} tersimpan</small>
              </span>
              <Icon name="arrowRight" />
            </Link>
          </nav>
          {!!earlier.length && (
            <section aria-labelledby="earlier-title">
              <div className={styles.heading}>
                <h2 id="earlier-title">Sebelumnya di ruang ini</h2>
              </div>
              <ol className={styles.recent}>
                {earlier.map((thought) => (
                  <li key={thought.id} id={`thought-${thought.id}`}>
                    <Link href={read(thought.id)}>
                      <ThoughtTime value={thought.created_at} compact />
                      <span
                        className={`${styles.original} ${styles.recentExcerpt}`}
                      >
                        {thought.raw_content}
                      </span>
                      <Icon name="arrowRight" />
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
        {hasContext && (
          <aside className={styles.context} aria-label="Konteks perusahaan">
            {company.short_note && (
              <section>
                <h2>Konteks dari kamu</h2>
                <p className={styles.note}>{company.short_note}</p>
                <Link
                  className="quiet-link"
                  href={`/companies/${company.id}/edit`}
                >
                  <Icon name="pencil" />
                  Ubah konteks
                </Link>
              </section>
            )}
            {total > 0 && (
              <p className={styles.count}>
                <Icon name="read" />
                <strong>{total.toLocaleString("id-ID")} pemikiran</strong>{" "}
                tersimpan
              </p>
            )}
          </aside>
        )}
      </div>
      <CompanyDataControl>
        {company.state !== "ARCHIVED" && <ArchiveForm id={company.id} />}
        <DeleteForm
          companyId={company.id}
          companyName={company.name}
          hasThoughts={total > 0}
        />
      </CompanyDataControl>
    </CompanyWorkspaceShell>
  );
}
