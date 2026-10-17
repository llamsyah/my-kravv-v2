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
import { ThoughtTime } from "@/features/thoughts/thought-history";
import {
  GenerateRefinementForm,
  ReviewRefinementForm,
  ReloadRefinementStatus,
} from "@/features/refinements/refine-forms";
import { RefineComparison } from "@/features/refinements/refine-comparison";
import {
  refinePresentation,
  comparisonText,
  reviewLabels,
} from "@/features/refinements/presentation";
import styles from "@/features/refinements/refine-workspace.module.css";
import {
  getApprovedDisplayVersions,
  projectThoughts,
} from "@/server/db/thought-display";
import { DisplaySelector } from "@/features/thoughts/display-selector";
import displayStyles from "@/features/thoughts/thought-display.module.css";

import {
  VersionTrail,
  RefinementProvenance,
  RefinementWarnings,
} from "@/features/refinements/version-trail";

export default async function RefinePage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string; thoughtId: string }>;
  searchParams: Promise<{
    before?: string;
    resolved?: string;
    proposal?: string;
    display?: string;
    displayBefore?: string;
    displaySaved?: string;
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
  const [displayed] = await projectThoughts(supabase, user.id, [thought]);
  const approvedCursor = readThoughtCursor(search.displayBefore);
  const approvedRead = await Promise.allSettled([
    getApprovedDisplayVersions(
      supabase,
      user.id,
      company.id,
      thought.id,
      approvedCursor,
    ),
  ]);
  const approved =
    approvedRead[0].status === "fulfilled" ? approvedRead[0].value : null;
  const previewId = z.uuid().safeParse(search.display);
  const preview = previewId.success
    ? await getRefinement(
        supabase,
        user.id,
        company.id,
        thought.id,
        previewId.data,
      ).catch(() => null)
    : null;
  const validPreview =
    preview &&
    ["ACCEPTED", "SUPERSEDED"].includes(preview.status) &&
    preview.resolved_at !== null
      ? preview
      : null;
  const available = [
    ...new Map(
      [
        ...(approved?.versions ?? []),
        ...(displayed.display.selected ? [displayed.display.selected] : []),
        ...(validPreview ? [validPreview] : []),
      ].map((r) => [r.id, r]),
    ).values(),
  ];
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
  const plan = refinePresentation({
    uncertain,
    pending: !!pending,
    target,
    accepted,
    suggested,
    hasHistory:
      !!history.refinements.length ||
      displayed.display.hasApproved ||
      !!rejected,
  });
  const primary = plan.review;
  const path = `/companies/${company.id}/thoughts/${thought.id}/refine`;
  const last = history.refinements.at(-1);
  const disabledReason =
    company.state === "ARCHIVED"
      ? "Perusahaan diarsipkan. Generasi baru tidak tersedia."
      : Buffer.byteLength(thought.raw_content, "utf8") > 2000
        ? "Refine awal mendukung teks sampai 2.000 byte. Asli tetap tersimpan lengkap."
        : undefined;
  const selected = !primary ? displayed.display.selected : null;
  const alternate =
    !primary && accepted && accepted.id !== selected?.id ? accepted : null;
  const represented = new Set([primary?.id, selected?.id, alternate?.id]);
  const otherRows = history.refinements.filter(
    (row) => !represented.has(row.id),
  );
  const related = [
    ...new Map(
      [target, primary ? displayed.display.selected : null]
        .filter(
          (row) =>
            row &&
            !represented.has(row.id) &&
            !otherRows.some((r) => r.id === row.id),
        )
        .map((row) => [row!.id, row!]),
    ).values(),
  ];
  const choiceUnavailable =
    displayed.display.source === "UNAVAILABLE" ||
    (displayed.display.hasApproved && !approved);
  const status = uncertain
    ? "Status belum pasti"
    : pending
      ? "Sedang diproses"
      : primary
        ? reviewLabels.SUGGESTED
        : accepted
          ? reviewLabels.ACCEPTED
          : rejected
            ? reviewLabels.REJECTED
            : "Belum ada usulan";
  const readingChoice = choiceUnavailable ? (
    <section
      id="thought-display"
      className={displayStyles.panel}
      data-secondary={!!primary}
    >
      <h3>
        {displayed.display.source === "UNAVAILABLE"
          ? displayed.display.label
          : `Ditampilkan · ${displayed.display.label}`}
      </h3>
      <div
        id={
          !primary && displayed.display.source !== "REFINEMENT"
            ? "original-title"
            : undefined
        }
        className={displayStyles.reading}
      >
        {displayed.display.text}
      </div>
      {displayed.display.source === "REFINEMENT" && (
        <details>
          <summary>Lihat asli</summary>
          <div
            id={!primary ? "original-title" : undefined}
            className={displayStyles.reading}
          >
            {thought.raw_content}
          </div>
        </details>
      )}
      <p className="form-feedback" role="status">
        Pilihan bacaan belum dapat dimuat.
      </p>
      <ReloadRefinementStatus label="Muat ulang pilihan" />
    </section>
  ) : displayed.display.hasApproved ? (
    <div id={selected ? `refinement-${selected.id}` : undefined}>
      <DisplaySelector
        key={`${thought.id}:${displayed.display.preference?.revision ?? 0}:${search.display ?? "saved"}:${approvedCursor ? search.displayBefore : "latest"}`}
        thought={displayed}
        versions={available}
        compact={!!primary}
        initialPreview={
          search.display === "ORIGINAL" ? "ORIGINAL" : validPreview?.id
        }
        confirmed={
          !!search.displaySaved &&
          search.displaySaved === String(displayed.display.preference?.revision)
        }
        permalink={`${path}${approvedCursor ? `?displayBefore=${encodeURIComponent(search.displayBefore!)}` : ""}`}
      />
      {selected && <RefinementWarnings row={selected} />}
      {selected && <RefinementProvenance row={selected} />}
      {(approved?.hasMore || approvedCursor) && (
        <nav className={styles.pagination} aria-label="Navigasi pilihan bacaan">
          {approved?.hasMore && approved.versions.at(-1) && (
            <Link
              className="quiet-button"
              href={`${path}?displayBefore=${encodeURIComponent(`${approved.versions.at(-1)!.created_at}|${approved.versions.at(-1)!.id}`)}#thought-display`}
            >
              Versi bacaan lebih lama →
            </Link>
          )}
          {approvedCursor && (
            <Link className="quiet-button" href={`${path}#thought-display`}>
              Versi bacaan terbaru
            </Link>
          )}
        </nav>
      )}
    </div>
  ) : primary ? (
    <p id="thought-display" className={styles.choiceSummary}>
      Ditampilkan · {displayed.display.label}
    </p>
  ) : (
    <section
      className={styles.single}
      id="thought-display"
      aria-labelledby="original-title"
    >
      <div className={styles.trailMeta}>
        <h3 id="original-title">Asli</h3>
        <span>Ditampilkan</span>
      </div>
      <div className={styles.reading}>{displayed.display.text}</div>
    </section>
  );
  return (
    <CompanyWorkspaceShell companyId={company.id} context="refine">
      <div className={styles.workspace} data-refine-state={plan.state}>
        <header className={styles.heading}>
          <div>
            <Link
              className={styles.returnLink}
              href={`/companies/${company.id}/refinements`}
            >
              ← Kembali ke Refine
            </Link>
            <h2>Tinjau pemikiran</h2>
            <div className={styles.trailMeta}>
              <span className={styles.badge}>{status}</span>
              <ThoughtTime value={thought.created_at} compact />
            </div>
          </div>
          <Link
            className="quiet-button"
            href={`/companies/${company.id}/thoughts?focus=${thought.id}#thought-${thought.id}`}
          >
            Lihat pemikiran →
          </Link>
        </header>
        <details className={styles.info}>
          <summary>Tentang Refine</summary>
          <p>
            Terima menyimpan keputusan tinjauan. Versi bacaan berubah hanya
            setelah kamu memilih Gunakan versi ini.
          </p>
          <p>
            Usulan AI bukan fakta terverifikasi. Periksa makna dan alasan
            ketidakpastianmu sebelum menerima.
          </p>
        </details>
        {company.state === "ARCHIVED" && (
          <p className="archive-notice">
            Diarsipkan · Tinjauan dan pilihan bacaan tetap tersedia; generasi
            baru tidak tersedia.
          </p>
        )}
        {search.display && search.display !== "ORIGINAL" && !validPreview && (
          <p className="form-feedback" role="status">
            Versi bacaan yang dituju tidak tersedia.
          </p>
        )}
        {targetValue && !target && !uncertain && (
          <p role="status" className="form-feedback">
            Versi yang dituju tidak tersedia untuk pemikiran ini.
          </p>
        )}
        {uncertain && (
          <p role="status" className="form-feedback">
            Status versi belum dapat dipastikan. Muat ulang sebelum membuat atau
            meninjau usulan.
          </p>
        )}
        {pending && (
          <p role="status" className={styles.notice}>
            Permintaan sedang berjalan atau belum pasti. Jangan mengulang; tidak
            ada pengulangan otomatis.
          </p>
        )}
        {(uncertain || pending) && <ReloadRefinementStatus />}
        {target && search.resolved === target.id && (
          <p role="status" className="thought-success">
            Keputusanmu tersimpan. Pilihan bacaan tidak berubah.
          </p>
        )}
        {primary && (
          <section
            id={`refinement-${primary.id}`}
            aria-label="Perbandingan usulan untuk ditinjau"
          >
            <RefineComparison
              original={thought.raw_content}
              proposal={comparisonText(primary)}
              label="Usulan AI"
              originalAnchor
            />
            <p className="auth-help">
              Periksa makna, alasan ketidakpastian, dan suaramu. Usulan AI bukan
              fakta terverifikasi.
            </p>
            <RefinementWarnings row={primary} />
            <ReviewRefinementForm
              companyId={company.id}
              thoughtId={thought.id}
              refinementId={primary.id}
              aiContent={primary.ai_content}
            />
            <RefinementProvenance row={primary} />
            {suggested && suggested.id !== primary.id && (
              <Link
                className={styles.returnLink}
                href={`${path}?proposal=${suggested.id}#refinement-${suggested.id}`}
              >
                Tinjau usulan lain →
              </Link>
            )}
          </section>
        )}
        {readingChoice}
        {alternate && (
          <details
            className={styles.reviewed}
            id={`refinement-${alternate.id}`}
            open={target?.id === alternate.id || undefined}
          >
            <summary>Diterima · Lihat versi yang ditinjau</summary>
            <RefineComparison
              original={thought.raw_content}
              proposal={comparisonText(alternate)}
              label="Versi diterima"
            />
            <RefinementWarnings row={alternate} />
            <Link
              className="quiet-button"
              href={`${path}?display=${alternate.id}#thought-display`}
            >
              Pratinjau untuk bacaan →
            </Link>
            <RefinementProvenance row={alternate} />
          </details>
        )}
        {plan.generation && (
          <GenerateRefinementForm
            companyId={company.id}
            thoughtId={thought.id}
            operationId={randomUUID()}
            disabledReason={disabledReason}
            secondary={plan.generation === "SECONDARY"}
          />
        )}
        {(otherRows.length > 0 ||
          related.length > 0 ||
          history.hasMore ||
          cursor) && (
          <VersionTrail
            rows={otherRows}
            related={related}
            displayedId={displayed.display.selected?.id}
            path={path}
            open={!!cursor || !!(target && !represented.has(target.id))}
            cursor={!!cursor}
            hasMore={history.hasMore}
            last={last}
          />
        )}
      </div>
    </CompanyWorkspaceShell>
  );
}
