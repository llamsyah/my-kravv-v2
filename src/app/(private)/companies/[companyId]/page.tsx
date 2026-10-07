import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyContext } from "@/server/companies/context";
import { getCompanyById } from "@/server/db/companies";
import { companyStateLabels } from "@/domain/company/company";
import { ArchiveForm } from "@/features/companies/archive-form";
export default async function CompanyPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const { supabase, user } = await getCompanyContext();
  const company = await getCompanyById(supabase, user.id, companyId);
  if (!company) notFound();
  return (
    <>
      <Link
        className="company-back quiet-link"
        href={
          company.state === "ARCHIVED"
            ? "/companies?view=archived"
            : "/companies"
        }
      >
        ← Perusahaan
      </Link>
      <section className="company-intro">
        <div className="company-identity-meta">
          <p className="eyebrow">
            RUANG PERUSAHAAN{company.ticker ? ` · ${company.ticker}` : ""}
          </p>
          <span className="company-state">
            {companyStateLabels[company.state]}
          </span>
        </div>
        <h1>{company.name}</h1>
        {(company.exchange || company.sector) && (
          <p className="intro-copy">
            {[company.exchange, company.sector].filter(Boolean).join(" · ")}
          </p>
        )}
        <Link className="text-link" href={`/companies/${company.id}/edit`}>
          Ubah identitas perusahaan
        </Link>
      </section>
      {company.state === "ARCHIVED" && (
        <p className="archive-notice">
          Perusahaan ini diarsipkan. Identitas dan konteksnya tetap tersimpan di
          ruang pribadimu.
        </p>
      )}
      <section className="company-context" aria-labelledby="context-title">
        <div>
          <p className="section-label">KONTEKS PERUSAHAAN</p>
          <h2 id="context-title">Sebuah ruang untuk mengenal lebih jauh.</h2>
        </div>
        <div>
          <p className="company-note">
            {company.short_note ||
              "Belum ada catatan singkat. Kamu bisa melengkapi konteks perusahaan lewat ubah identitas."}
          </p>
          <p className="auth-help">
            Informasi di sini adalah konteks perusahaan yang kamu masukkan
            sendiri.
          </p>
        </div>
      </section>
      {company.state !== "ARCHIVED" && <ArchiveForm id={company.id} />}
    </>
  );
}
