import Link from "next/link";
import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getCompanyWorkspaceContext } from "@/server/companies/workspace";
import { CompanyWorkspaceShell } from "@/features/companies/company-workspace-shell";
import { getThoughtById } from "@/server/db/thoughts";
import {
  getRefinements,
  getPendingRefinement,
  getActiveRefinement,
  getRefinement,
} from "@/server/db/refinements";
import { readThoughtCursor } from "@/domain/thought/thought";
import {
  refinementLabels,
  type Refinement,
} from "@/domain/refinement/refinement";
import { ThoughtTime } from "@/features/thoughts/thought-history";
import {
  GenerateRefinementForm,
  ReviewRefinementForm,
  ReloadRefinementStatus,
} from "@/features/refinements/refine-forms";
import { RefineComparison } from "@/features/refinements/refine-comparison";
import {
  comparisonVersion,
  comparisonText,
} from "@/features/refinements/presentation";
import styles from "@/features/refinements/refine-workspace.module.css";

function Provenance({ row }: { row: Refinement }) {
  return (
    <details className="refine-provenance">
      <summary>Asal versi & waktu keputusan</summary>
      <p>
        {row.provider} · {row.model} · {row.prompt_version} ·{" "}
        {row.output_schema_version}
      </p>
      <p>AI Run: {row.ai_run_id ?? "Rekam proses tidak tersedia"}</p>
      {row.resolved_at && (
        <p>
          Ditinjau: <ThoughtTime value={row.resolved_at} compact />
        </p>
      )}
      {row.user_final_content !== null && (
        <details>
          <summary>Usulan AI sebelum suntinganmu</summary>
          <div className={styles.reading}>{row.ai_content}</div>
        </details>
      )}
    </details>
  );
}
export default async function RefinePage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string; thoughtId: string }>;
  searchParams: Promise<{
    before?: string;
    resolved?: string;
    proposal?: string;
  }>;
}) {
  const { companyId, thoughtId } = await params;
  const { supabase, user, company } =
    await getCompanyWorkspaceContext(companyId);
  const thought = await getThoughtById(
    supabase,
    user.id,
    company.id,
    thoughtId,
  );
  if (!thought) notFound();
  const search = await searchParams;
  const cursor = readThoughtCursor(search.before);
  const targetValue = search.resolved ?? search.proposal;
  const targetId = z.uuid().safeParse(targetValue);
  const reads = await Promise.allSettled([
    getRefinements(supabase, user.id, company.id, thought.id, cursor),
    getPendingRefinement(supabase, user.id, company.id, thought.id),
    getActiveRefinement(supabase, user.id, company.id, thought.id, "ACCEPTED"),
    getActiveRefinement(supabase, user.id, company.id, thought.id, "SUGGESTED"),
    targetId.success
      ? getRefinement(supabase, user.id, company.id, thought.id, targetId.data)
      : Promise.resolve(null),
    getActiveRefinement(supabase, user.id, company.id, thought.id, "REJECTED"),
  ] as const);
  const uncertain = reads.some((read) => read.status === "rejected");
  const history =
    reads[0].status === "fulfilled"
      ? reads[0].value
      : { refinements: [], hasMore: false };
  const pending = reads[1].status === "fulfilled" ? reads[1].value : null;
  const accepted = reads[2].status === "fulfilled" ? reads[2].value : null;
  const suggested = reads[3].status === "fulfilled" ? reads[3].value : null;
  const target = reads[4].status === "fulfilled" ? reads[4].value : null;
  const rejected = reads[5].status === "fulfilled" ? reads[5].value : null;
  const primary = uncertain
    ? null
    : comparisonVersion(target, accepted, suggested);
  const path = `/companies/${company.id}/thoughts/${thought.id}/refine`;
  const last = history.refinements.at(-1);
  const disabledReason = uncertain
    ? "Status versi belum dapat dipastikan. Muat ulang sebelum melanjutkan."
    : pending
      ? "Permintaan sedang berjalan atau belum pasti. Muat ulang untuk melihat hasil; jangan mengulang."
      : company.state === "ARCHIVED"
        ? "Perusahaan diarsipkan. Usulan tersimpan tetap bisa ditinjau; generasi baru tidak tersedia."
        : Buffer.byteLength(thought.raw_content, "utf8") > 2000
          ? "Refine awal mendukung teks sampai 2.000 byte. Asli tetap tersimpan lengkap."
          : undefined;
  const otherRows = history.refinements.filter((row) => row.id !== primary?.id);
  if (
    target &&
    target.id !== primary?.id &&
    !otherRows.some((row) => row.id === target.id)
  )
    otherRows.unshift(target);
  return (
    <CompanyWorkspaceShell companyId={company.id} context="refine">
      <div className={styles.workspace}>
        <Link
          className="quiet-button"
          href={`/companies/${company.id}/refinements`}
        >
          ← Kembali ke Refine
        </Link>
        <header className={styles.heading}>
          <div>
            <p className="eyebrow">BANDINGKAN & PUTUSKAN</p>
            <h2>Tetap suaramu.</h2>
            <ThoughtTime value={thought.created_at} compact />
          </div>
          <Link
            className="quiet-button"
            href={`/companies/${company.id}/thoughts?focus=${thought.id}#thought-${thought.id}`}
          >
            Lihat pemikiran →
          </Link>
        </header>
        {targetValue && !target && !uncertain && (
          <p role="status" className="form-feedback">
            Versi yang dituju tidak tersedia untuk pemikiran ini.
          </p>
        )}
        {uncertain && (
          <p role="status" className="form-feedback">
            Status versi belum dapat dipastikan. Asli tetap dapat dibaca; muat
            ulang sebelum membuat atau meninjau usulan.
          </p>
        )}
        {pending && (
          <p role="status" className="form-feedback">
            Sedang diproses · Hasil permintaan belum selesai. Tidak ada
            pengulangan otomatis.
          </p>
        )}
        {(uncertain || pending) && <ReloadRefinementStatus />}
        {!uncertain && rejected && primary?.status !== "SUGGESTED" && (
          <p className={styles.decision}>
            Usulan pernah kamu tolak.{" "}
            {accepted
              ? "Versi pilihanmu tetap digunakan."
              : "Pemikiran asli tetap digunakan."}
          </p>
        )}
        {target && search.resolved === target.id && (
          <p
            role="status"
            className="thought-success"
            id={
              target.id !== primary?.id ? `refinement-${target.id}` : undefined
            }
          >
            {target.status === "ACCEPTED"
              ? "Versi pilihan tersimpan. Asli tetap utuh."
              : "Keputusanmu tersimpan. Versi pilihan sebelumnya atau asli tetap digunakan."}
          </p>
        )}
        {primary ? (
          <section
            id={`refinement-${primary.id}`}
            aria-label="Perbandingan versi aktif"
          >
            <div className={styles.motif}>
              Asli → Usulan AI →{" "}
              <span>
                {primary.status === "ACCEPTED"
                  ? "Diterima oleh kamu"
                  : "Menunggu keputusanmu"}
              </span>
            </div>
            <span className={styles.badge}>
              {refinementLabels[primary.status]}
            </span>
            <RefineComparison
              original={thought.raw_content}
              proposal={comparisonText(primary)}
              label={
                primary.status === "ACCEPTED" ? "Versi pilihan" : "Usulan AI"
              }
            />
            {primary.status === "SUGGESTED" && !pending && (
              <>
                <p className="auth-help">
                  Periksa makna, alasan keraguan, dan suaramu sebelum menerima.
                  Usulan AI bukan fakta terverifikasi.
                </p>
                <ReviewRefinementForm
                  companyId={company.id}
                  thoughtId={thought.id}
                  refinementId={primary.id}
                  aiContent={primary.ai_content}
                />
              </>
            )}
            {!!primary.warnings.length && (
              <ul className="refine-warnings">
                {primary.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            )}
            <Provenance row={primary} />
            {suggested && suggested.id !== primary.id && (
              <p>
                <Link
                  className="secondary-button"
                  href={`${path}?proposal=${suggested.id}#refinement-${suggested.id}`}
                >
                  Tinjau usulan lain →
                </Link>
              </p>
            )}
          </section>
        ) : (
          <section className={styles.single} aria-labelledby="original-title">
            <h3 id="original-title">Pemikiran asli</h3>
            <div className={styles.reading}>{thought.raw_content}</div>
          </section>
        )}
        {primary && !uncertain && !pending ? (
          <GenerateRefinementForm
            companyId={company.id}
            thoughtId={thought.id}
            operationId={randomUUID()}
            disabledReason={disabledReason}
            secondary
          />
        ) : (
          <GenerateRefinementForm
            companyId={company.id}
            thoughtId={thought.id}
            operationId={randomUUID()}
            disabledReason={disabledReason}
          />
        )}
        <details
          className={styles.history}
          open={
            cursor || (target && target.id !== primary?.id) ? true : undefined
          }
        >
          <summary id="refine-history-title">Riwayat versi & keputusan</summary>
          {!history.refinements.length && !uncertain && (
            <p>Belum ada versi pada halaman riwayat ini.</p>
          )}
          <ol>
            {otherRows.map((row) => (
              <li
                key={row.id}
                id={
                  search.resolved === row.id
                    ? undefined
                    : `refinement-${row.id}`
                }
              >
                <div className="thought-meta">
                  <span>{refinementLabels[row.status]}</span>
                  <ThoughtTime value={row.created_at} compact />
                </div>
                {row.status === "SUGGESTED" ? (
                  <Link
                    className="secondary-button"
                    href={`${path}?proposal=${row.id}#refinement-${row.id}`}
                  >
                    Bandingkan usulan →
                  </Link>
                ) : (
                  <details>
                    <summary>Baca versi ini</summary>
                    <div className={styles.reading}>{comparisonText(row)}</div>
                  </details>
                )}
                <Provenance row={row} />
              </li>
            ))}
          </ol>
          <nav
            className={styles.pagination}
            aria-label="Navigasi versi dirapikan"
          >
            {cursor && (
              <Link className="quiet-button" href={path}>
                Kembali ke versi terbaru
              </Link>
            )}
            {history.hasMore && last && (
              <Link
                className="secondary-button"
                href={`${path}?before=${encodeURIComponent(`${last.created_at}|${last.id}`)}#refine-history-title`}
              >
                Versi lebih lama →
              </Link>
            )}
          </nav>
        </details>
      </div>
    </CompanyWorkspaceShell>
  );
}
