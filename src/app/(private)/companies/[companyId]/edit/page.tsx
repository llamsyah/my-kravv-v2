import { CompanyForm } from "@/features/companies/company-form";
import { getCompanyWorkspaceContext } from "@/server/companies/workspace";
import { CompanyWorkspaceShell } from "@/features/companies/company-workspace-shell";
import styles from "@/features/companies/company-workspace.module.css";
export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const { company } = await getCompanyWorkspaceContext(companyId);
  return (
    <CompanyWorkspaceShell companyId={company.id} context="manage">
      <section className={styles.taskIntro}>
        <h2>Ubah identitas</h2>
        <p className="intro-copy">
          Perbarui identitas dan konteks seperlunya.
          {company.state === "ARCHIVED"
            ? " Perusahaan ini tetap berada di arsip."
            : ""}
        </p>
      </section>
      <CompanyForm company={company} />
    </CompanyWorkspaceShell>
  );
}
