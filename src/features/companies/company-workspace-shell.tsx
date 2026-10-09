import "server-only";
import Link from "next/link";
import type { ReactNode } from "react";
import { getCompanyWorkspaceContext } from "@/server/companies/workspace";
import { companyStateLabels } from "@/domain/company/company";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { DisclosureMenu } from "@/components/disclosure-menu";
import { companyMonogram } from "./navigation";
import styles from "./company-workspace.module.css";

/** Rendered inside owned leaf pages, so current identity follows page invalidation. */
export async function CompanyWorkspaceShell({
  companyId,
  context,
  children,
}: {
  companyId: string;
  context: "workspace" | "manage" | "refine";
  children: ReactNode;
}) {
  const { company } = await getCompanyWorkspaceContext(companyId);
  const root = `/companies/${company.id}`;
  const library =
    company.state === "ARCHIVED" ? "/companies?view=archived" : "/companies";
  return (
    <div className={styles.workspace}>
      <header className={styles.header}>
        <div className={styles.topline}>
          <nav
            className={styles.breadcrumb}
            aria-label="Jejak ruang perusahaan"
          >
            <Link href={library}>
              <Icon name="arrowLeft" size="small" />
              Perusahaan
            </Link>
            <span aria-hidden="true">/</span>
            {context === "workspace" ? (
              <span aria-current="page">Ruang perusahaan</span>
            ) : (
              <>
                <Link href={root} aria-label="Ruang perusahaan">
                  Ruang
                </Link>
                <span aria-hidden="true">/</span>
                <span aria-current="page">
                  {context === "manage" ? "Kelola" : "Refine"}
                </span>
              </>
            )}
          </nav>
          <DisclosureMenu
            label={
              <>
                <Icon name="pencil" />
                Kelola
              </>
            }
          >
            <Link href={`${root}/edit`}>
              <Icon name="pencil" />
              Ubah identitas
            </Link>
            <Link href={`${root}#data-control`}>
              <Icon name="more" />
              Arsip &amp; hapus
            </Link>
          </DisclosureMenu>
        </div>
        <div className={styles.identity}>
          <span className={styles.monogram} aria-hidden="true">
            {companyMonogram(company.name)}
          </span>
          <div className={styles.nameBlock}>
            <h1>{company.name}</h1>
            {(company.ticker || company.exchange || company.sector) && (
              <p className={styles.metadata}>
                {[company.ticker, company.exchange, company.sector]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>
          <StatusBadge
            tone={company.state === "ARCHIVED" ? "neutral" : "accent"}
          >
            {companyStateLabels[company.state]}
          </StatusBadge>
        </div>
        {/* Future section navigation belongs here once its routes and workflows exist. */}
      </header>
      {children}
    </div>
  );
}
