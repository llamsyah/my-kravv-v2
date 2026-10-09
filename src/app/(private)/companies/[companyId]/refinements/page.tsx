import Link from "next/link";
import { getCompanyWorkspaceContext } from "@/server/companies/workspace";
import { CompanyWorkspaceShell } from "@/features/companies/company-workspace-shell";
import { getCompanyThoughts } from "@/server/db/thoughts";
import { getRefinementQueue } from "@/server/db/refinements";
import { readThoughtCursor } from "@/domain/thought/thought";
import { queueLabel } from "@/features/refinements/presentation";
import { ThoughtTime } from "@/features/thoughts/thought-history";
import styles from "@/features/refinements/refine-workspace.module.css";

export default async function CompanyRefinementsPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ before?: string }>;
}) {
  const { companyId } = await params;
  const { supabase, user, company } =
    await getCompanyWorkspaceContext(companyId);
  const cursor = readThoughtCursor((await searchParams).before);
  const history = await getCompanyThoughts(
    supabase,
    user.id,
    company.id,
    cursor,
  );
  const queue = await getRefinementQueue(
    supabase,
    user.id,
    company.id,
    history.thoughts.map((t) => t.id),
  );
  const root = `/companies/${company.id}/refinements`;
  const last = history.thoughts.at(-1);
  return (
    <CompanyWorkspaceShell companyId={company.id} context="refine">
      <section className={styles.workspace} aria-labelledby="refine-title">
        <header className={styles.heading}>
          <div>
            <p className="eyebrow">REFINE</p>
            <h2 id="refine-title">Tinjau kata, jaga makna.</h2>
          </div>
          <Link
            className="secondary-button"
            href={`/companies/${company.id}/thoughts`}
          >
            Buka Pemikiran →
          </Link>
        </header>
        {company.state === "ARCHIVED" && (
          <p className="archive-notice">
            Diarsipkan · Versi tersimpan tetap bisa ditinjau. Generasi baru
            tidak tersedia.
          </p>
        )}
        {!history.thoughts.length && (
          <div className={styles.empty}>
            <h3>Belum ada pemikiran untuk ditinjau.</h3>
            <p>Tulis pemikiran di Pemikiran terlebih dahulu.</p>
            <Link
              className="secondary-button"
              href={`/companies/${company.id}/thoughts`}
            >
              Ke Pemikiran →
            </Link>
          </div>
        )}
        <ol className={styles.queue}>
          {history.thoughts.map((thought) => {
            const state = queue.get(thought.id)!;
            return (
              <li key={thought.id}>
                <Link
                  className={styles.queueLink}
                  href={`/companies/${company.id}/thoughts/${thought.id}/refine`}
                >
                  <div>
                    <div className={styles.queueMeta}>
                      <span className={styles.badge}>
                        {queueLabel(state.statuses, state.pending)}
                      </span>
                      {state.statuses?.includes("ACCEPTED") &&
                        state.statuses.includes("SUGGESTED") && (
                          <span className={styles.badge}>Versi diterima</span>
                        )}
                      <ThoughtTime value={thought.created_at} compact />
                    </div>
                    <p className={styles.excerpt}>{thought.raw_content}</p>
                  </div>
                  <span className={styles.entrance}>
                    Buka Refine <span aria-hidden="true">→</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
        <nav className={styles.pagination} aria-label="Navigasi antrean Refine">
          {cursor && (
            <Link className="quiet-button" href={root}>
              Pemikiran terbaru
            </Link>
          )}
          {history.hasMore && last && (
            <Link
              className="secondary-button"
              href={`${root}?before=${encodeURIComponent(`${last.created_at}|${last.id}`)}`}
            >
              Pemikiran lebih lama →
            </Link>
          )}
        </nav>
      </section>
    </CompanyWorkspaceShell>
  );
}
