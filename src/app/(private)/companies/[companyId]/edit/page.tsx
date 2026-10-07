import Link from "next/link";
import { notFound } from "next/navigation";
import { CompanyForm } from "@/features/companies/company-form";
import { getCompanyContext } from "@/server/companies/context";
import { getCompanyById } from "@/server/db/companies";
export default async function EditCompanyPage({
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
        href={`/companies/${company.id}`}
      >
        ← Ruang perusahaan
      </Link>
      <section className="company-intro">
        <p className="eyebrow">IDENTITAS PERUSAHAAN</p>
        <h1>Ubah {company.name}</h1>
        <p className="intro-copy">
          Perbarui identitas dan konteks seperlunya.
          {company.state === "ARCHIVED"
            ? " Perusahaan ini tetap berada di arsip."
            : ""}
        </p>
      </section>
      <CompanyForm company={company} />
    </>
  );
}
