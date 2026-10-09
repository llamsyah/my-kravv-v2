import { randomUUID } from "node:crypto";
import Link from "next/link";
import { getCompanyWorkspaceContext } from "@/server/companies/workspace";
import { CompanyWorkspaceShell } from "@/features/companies/company-workspace-shell";
import {
  readThoughtSearch,
  type ThoughtSearch,
} from "@/features/companies/legacy-navigation";
import { DraftReceipt } from "@/features/thoughts/draft-receipt";
import { ThoughtComposer } from "@/features/thoughts/thought-composer";
import { ThoughtHistory } from "@/features/thoughts/thought-history";
import {
  getCompanyThoughts,
  getCompanyThoughtCount,
  getThoughtById,
} from "@/server/db/thoughts";
import { Icon } from "@/components/ui/icon";
import styles from "@/features/thoughts/thought-workspace.module.css";

export default async function CompanyThoughtsPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<ThoughtSearch>;
}) {
  const { companyId } = await params;
  const { supabase, user, company } =
    await getCompanyWorkspaceContext(companyId);
  const { cursor, focus, saved, deleted } = readThoughtSearch(
    await searchParams,
  );
  const [history, total] = await Promise.all([
    getCompanyThoughts(supabase, user.id, company.id, cursor),
    getCompanyThoughtCount(supabase, user.id, company.id),
  ]);
  const targetIds = [
    ...new Set([saved, focus].filter((id): id is string => !!id)),
  ];
  const missingIds = targetIds.filter(
    (id) => !history.thoughts.some((thought) => thought.id === id),
  );
  const targets = await Promise.all(
    missingIds.map((id) => getThoughtById(supabase, user.id, company.id, id)),
  );
  const linkedThoughts = targets.filter((thought) => thought !== null);
  const receipt = [...history.thoughts, ...linkedThoughts].find(
    (thought) => thought.id === saved && thought.capture_operation_id,
  );
  return (
    <CompanyWorkspaceShell companyId={company.id} context="thoughts">
      {receipt?.capture_operation_id && (
        <DraftReceipt
          userId={user.id}
          companyId={company.id}
          operationId={receipt.capture_operation_id}
          original={receipt.raw_content}
        />
      )}
      <div className={styles.workspace}>
        {company.state === "ARCHIVED" && (
          <p className="archive-notice">
            Diarsipkan · Pemikiran tetap dapat dibaca. Capture dan generasi AI
            baru tidak tersedia.
          </p>
        )}
        {deleted && (
          <p className="thought-success" role="status">
            Pemikiran dan riwayatnya telah dihapus permanen.
          </p>
        )}
        {targets.some((thought) => thought === null) && (
          <p className="form-feedback" role="status">
            Pemikiran yang dituju tidak tersedia di perusahaan ini.
          </p>
        )}
        {!cursor && company.state === "ARCHIVED" ? (
          <ThoughtComposer
            key={`${company.id}:${saved ?? "capture"}`}
            userId={user.id}
            initialOperationId={randomUUID()}
            companyId={company.id}
            archived
          />
        ) : !cursor ? (
          <section
            className={styles.capture}
            aria-labelledby="thought-capture-title"
          >
            <div className={styles.heading}>
              <h2 id="thought-capture-title">Tambahkan pemikiran</h2>
            </div>
            <ThoughtComposer
              key={`${company.id}:${saved ?? "capture"}`}
              userId={user.id}
              initialOperationId={randomUUID()}
              companyId={company.id}
            />
          </section>
        ) : (
          <div className={styles.olderEntrance}>
            <span>Riwayat lebih lama</span>
            <Link
              className="secondary-button"
              href={`/companies/${company.id}/thoughts#${company.state === "ARCHIVED" ? "thought-history-title" : "thought-capture-title"}`}
            >
              <Icon name="pencil" />
              {company.state === "ARCHIVED"
                ? "Kembali ke yang terbaru"
                : "Tulis pemikiran"}
            </Link>
          </div>
        )}
        <ThoughtHistory
          {...history}
          linkedThoughts={linkedThoughts}
          companyId={company.id}
          total={total}
          archived={company.state === "ARCHIVED"}
          older={!!cursor}
          saved={saved}
          focus={focus}
        />
      </div>
    </CompanyWorkspaceShell>
  );
}
