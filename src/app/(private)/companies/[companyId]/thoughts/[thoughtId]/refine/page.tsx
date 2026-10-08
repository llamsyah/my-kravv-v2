import Link from "next/link";
import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { getCompanyContext } from "@/server/companies/context";
import { getCompanyById } from "@/server/db/companies";
import { getThoughtById } from "@/server/db/thoughts";
import { getRefinements, getPendingRefinement } from "@/server/db/refinements";
import { readThoughtCursor } from "@/domain/thought/thought";
import { refinementLabels } from "@/domain/refinement/refinement";
import { ThoughtTime } from "@/features/thoughts/thought-history";
import {
  GenerateRefinementForm,
  ReviewRefinementForm,
  ReloadRefinementStatus,
} from "@/features/refinements/refine-forms";

export default async function RefinePage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string; thoughtId: string }>;
  searchParams: Promise<{ before?: string; resolved?: string }>;
}) {
  const { companyId, thoughtId } = await params;
  const { supabase, user } = await getCompanyContext();
  const company = await getCompanyById(supabase, user.id, companyId);
  const thought =
    company && (await getThoughtById(supabase, user.id, company.id, thoughtId));
  if (!company || !thought) notFound();
  const search = await searchParams;
  const cursor = readThoughtCursor(search.before);
  const [history, pending] = await Promise.all([
    getRefinements(supabase, user.id, company.id, thought.id, cursor),
    getPendingRefinement(supabase, user.id, company.id, thought.id),
  ]);
  const path = `/companies/${company.id}/thoughts/${thought.id}/refine`;
  const last = history.refinements.at(-1);
  const disabledReason = pending
    ? "Permintaan ini sedang berjalan atau statusnya belum pasti. Muat ulang untuk melihat hasil. Tidak ada pengulangan otomatis."
    : company.state === "ARCHIVED"
      ? "Perusahaan diarsipkan. Usulan yang tersimpan tetap bisa ditinjau; pembuatan versi baru tidak tersedia."
      : Buffer.byteLength(thought.raw_content, "utf8") > 2000
        ? "Refine awal mendukung teks sampai 2.000 byte. Asli tetap tersimpan lengkap; pilih pemikiran yang lebih pendek."
        : undefined;
  return (
    <>
      <Link
        className="company-back quiet-link"
        href={`/companies/${company.id}?focus=${thought.id}#thought-${thought.id}`}
      >
        ← {company.name}
      </Link>
      <section className="refine-intro">
        <p className="eyebrow">RUANG PEMIKIRAN · {company.name}</p>
        <h1>Lebih jelas, tetap pemikiranmu.</h1>
        <p className="intro-copy">
          Asli selalu tersimpan. Kamu yang menentukan versi mana yang ingin
          digunakan.
        </p>
      </section>
      <section className="refine-original" aria-labelledby="original-title">
        <div className="thought-meta">
          <h2 id="original-title">Pemikiran asli</h2>
          <ThoughtTime value={thought.created_at} compact />
        </div>
        <div className="thought-original">{thought.raw_content}</div>
      </section>
      <GenerateRefinementForm
        companyId={company.id}
        thoughtId={thought.id}
        operationId={randomUUID()}
        disabledReason={disabledReason}
      />
      {pending && <ReloadRefinementStatus />}
      <section
        className="refine-history"
        aria-labelledby="refine-history-title"
      >
        <div className="section-heading">
          <h2 id="refine-history-title">Versi dirapikan</h2>
          <span className="section-label">TERPISAH DARI ASLI</span>
        </div>
        {!history.refinements.length && (
          <p className="company-note">
            Belum ada usulan AI. Pemikiran asli sudah tersimpan dan tetap dapat
            digunakan.
          </p>
        )}
        <ol className="refine-versions">
          {history.refinements.map((row) => (
            <li
              className="refine-version"
              key={row.id}
              id={`refinement-${row.id}`}
            >
              <div className="thought-meta">
                <span className="section-label">
                  {refinementLabels[row.status]}
                </span>
                <ThoughtTime value={row.created_at} compact />
              </div>
              {search.resolved === row.id && (
                <p className="thought-success" role="status">
                  {row.status === "ACCEPTED"
                    ? "Versi pilihan tersimpan. Asli tetap utuh."
                    : "Keputusanmu tersimpan. Asli tetap utuh."}
                </p>
              )}
              <p className="refine-content-label">
                USULAN AI · BUKAN FAKTA TERVERIFIKASI
              </p>
              <div className="thought-original refine-ai-content">
                {row.ai_content}
              </div>
              {!!row.warnings.length && (
                <div className="refine-warnings">
                  <p className="auth-help">Catatan dari AI:</p>
                  <ul>
                    {row.warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              {row.user_final_content !== null && (
                <div className="refine-user-final">
                  <p className="section-label">
                    VERSI PILIHAN · DISUNTING OLEH KAMU
                  </p>
                  <div className="thought-original">
                    {row.user_final_content}
                  </div>
                </div>
              )}
              {row.status === "SUGGESTED" && (
                <ReviewRefinementForm
                  companyId={company.id}
                  thoughtId={thought.id}
                  refinementId={row.id}
                  aiContent={row.ai_content}
                />
              )}
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
              </details>
            </li>
          ))}
        </ol>
        <nav
          className="thought-history-navigation"
          aria-label="Navigasi versi dirapikan"
        >
          {cursor && (
            <Link className="quiet-link" href={path}>
              Kembali ke versi terbaru
            </Link>
          )}
          {history.hasMore && last && (
            <Link
              className="text-link"
              href={`${path}?before=${encodeURIComponent(`${last.created_at}|${last.id}`)}#refine-history-title`}
            >
              Versi lebih lama →
            </Link>
          )}
        </nav>
      </section>
    </>
  );
}
