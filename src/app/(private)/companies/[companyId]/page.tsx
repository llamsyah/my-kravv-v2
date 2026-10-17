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
import { projectThoughts } from "@/server/db/thought-display";

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
  const [originals, total] = await Promise.all([
    getCompanyOverviewThoughts(supabase, user.id, company.id),
    getCompanyThoughtCount(supabase, user.id, company.id),
  ]);
  const thoughts = await projectThoughts(supabase, user.id, originals);
  const [latest, ...earlier] = thoughts;
  const path = `/companies/${company.id}/thoughts`;
  const hasContext = !!company.short_note;
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
              {latest && (
                <span className={styles.sequence} aria-hidden="true">
                  01
                </span>
              )}
              <h2 id="latest-thought-title">Pemikiran terakhir</h2>
              {latest && <ThoughtTime value={latest.created_at} compact />}
            </div>
            {latest ? (
              <article className={styles.latest} id={`thought-${latest.id}`}>
                <StatusBadge
                  tone={
                    latest.display.source === "REFINEMENT"
                      ? "accent"
                      : "neutral"
                  }
                >
                  {latest.display.label}
                </StatusBadge>
                <div className={`${styles.original} ${styles.latestExcerpt}`}>
                  {latest.display.text}
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
              <ol
                className={styles.recent}
                start={2}
                role="list"
                aria-label="Pemikiran terbaru berikutnya"
              >
                {earlier.map((thought, index) => (
                  <li key={thought.id} id={`thought-${thought.id}`}>
                    <Link href={read(thought.id)}>
                      <span className={styles.sequence} aria-hidden="true">
                        {String(index + 2).padStart(2, "0")}
                      </span>
                      <span className={styles.recentBody}>
                        <span
                          className={`${styles.original} ${styles.recentExcerpt}`}
                        >
                          {thought.display.text}
                        </span>
                        <span className={styles.recentMetadata}>
                          <StatusBadge tone="neutral">
                            {thought.display.label}
                          </StatusBadge>
                          <ThoughtTime value={thought.created_at} compact />
                        </span>
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
