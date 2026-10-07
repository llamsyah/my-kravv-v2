import Link from "next/link";
import { CompanyForm } from "@/features/companies/company-form";
import { getCompanyContext } from "@/server/companies/context";
export default async function NewCompanyPage() {
  await getCompanyContext();
  return (
    <>
      <Link className="company-back quiet-link" href="/companies">
        ← Perusahaan
      </Link>
      <section className="company-intro">
        <p className="eyebrow">RUANG PENELITIAN BARU</p>
        <h1>Mulai dari perusahaan.</h1>
        <p className="intro-copy">
          Tidak perlu tahu semuanya untuk mulai mengenal perusahaan ini.
        </p>
      </section>
      <CompanyForm />
    </>
  );
}
