import { randomUUID } from "node:crypto";
import { getCompanyWorkspaceContext } from "@/server/companies/workspace";
import { CompanyWorkspaceShell } from "@/features/companies/company-workspace-shell";
import { companyStateLabels } from "@/domain/company/company";
import { ArchiveForm } from "@/features/companies/archive-form";
import { DeleteForm } from "@/features/data-control/delete-form";
import { DraftReceipt } from "@/features/thoughts/draft-receipt";
import { ThoughtComposer } from "@/features/thoughts/thought-composer";
import {
  ThoughtHistory,
  ThoughtTime,
} from "@/features/thoughts/thought-history";
import {
  getCompanyThoughts,
  getCompanyThoughtCount,
} from "@/server/db/thoughts";
import { readThoughtCursor } from "@/domain/thought/thought";
import { ResponsiveDetails } from "@/components/responsive-details";

export default async function CompanyPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{
    before?: string;
    saved?: string;
    focus?: string;
    deleted?: string;
  }>;
}) {
  const { companyId } = await params;
  const { supabase, user, company } =
    await getCompanyWorkspaceContext(companyId);
  const search = await searchParams;
  const cursor = readThoughtCursor(search.before);
  const [history, total] = await Promise.all([
    getCompanyThoughts(supabase, user.id, company.id, cursor),
    getCompanyThoughtCount(supabase, user.id, company.id),
  ]);
  const receipt = history.thoughts.find(
    (thought) => thought.id === search.saved && thought.capture_operation_id,
  );
  return (
    <CompanyWorkspaceShell companyId={company.id} context="workspace">
      {receipt?.capture_operation_id && (
        <DraftReceipt
          userId={user.id}
          companyId={company.id}
          operationId={receipt.capture_operation_id}
          original={receipt.raw_content}
        />
      )}
      {company.state === "ARCHIVED" && (
        <p className="archive-notice">
          Perusahaan ini diarsipkan. Identitas dan konteksnya tetap tersimpan di
          ruang pribadimu.
        </p>
      )}
      {search.deleted === "thought" && (
        <p className="thought-success" role="status">
          Pemikiran dan riwayatnya telah dihapus permanen.
        </p>
      )}
      <section
        className="company-context workspace-context"
        aria-labelledby="context-title"
      >
        <ResponsiveDetails
          className="context-disclosure"
          title="Konteks dari kamu"
          titleId="context-title"
        >
          <p className="company-note">
            {company.short_note ||
              "Belum ada catatan singkat. Kamu bisa melengkapi konteks perusahaan lewat ubah identitas."}
          </p>
        </ResponsiveDetails>
      </section>
      <div className="workspace-grid">
        <div className="thinking-column">
          <section
            className="thought-capture"
            aria-labelledby="thought-capture-title"
          >
            <div className="section-heading">
              <h2 id="thought-capture-title">Tambahkan pemikiran</h2>
              <span className="section-label">KATA-KATAMU SENDIRI</span>
            </div>
            <ThoughtComposer
              key={`${company.id}:${search.saved ?? "capture"}`}
              userId={user.id}
              initialOperationId={randomUUID()}
              companyId={company.id}
              archived={company.state === "ARCHIVED"}
            />
          </section>
          <ThoughtHistory
            {...history}
            companyId={company.id}
            older={!!cursor}
            saved={search.saved}
            focus={search.focus}
          />
        </div>
        <aside className="workspace-sidebar">
          <ResponsiveDetails
            className="workspace-facts"
            title="Tentang ruang ini"
          >
            <dl>
              <div>
                <dt>Pemikiran tersimpan</dt>
                <dd>{total}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{companyStateLabels[company.state]}</dd>
              </div>
              <div>
                <dt>Dibuat</dt>
                <dd>
                  <ThoughtTime value={company.created_at} />
                </dd>
              </div>
              <div>
                <dt>Identitas diperbarui</dt>
                <dd>
                  <ThoughtTime value={company.updated_at} />
                </dd>
              </div>
            </dl>
            <p className="auth-help">
              Identitas dan catatan perusahaan berasal dari informasi yang kamu
              masukkan sendiri.
            </p>
          </ResponsiveDetails>
          <section
            id="data-control"
            className="workspace-data-control"
            aria-labelledby="data-control-title"
          >
            <h2 id="data-control-title">Kelola ruang</h2>
            {company.state !== "ARCHIVED" && <ArchiveForm id={company.id} />}
            <DeleteForm
              companyId={company.id}
              companyName={company.name}
              hasThoughts={total > 0}
            />
          </section>
        </aside>
      </div>
    </CompanyWorkspaceShell>
  );
}
