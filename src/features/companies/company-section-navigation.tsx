"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import {
  companyNavigationItems,
  companyNavigationSection,
  type CompanySection,
} from "./navigation";
import styles from "./company-workspace.module.css";

/** Unmounted in Phase 2. Enable each section only when its leaf workflow ships. */
export function CompanySectionNavigation({
  companyId,
  enabledSections,
}: {
  companyId: string;
  enabledSections: readonly CompanySection[];
}) {
  const pathname = usePathname();
  const items = companyNavigationItems(companyId, enabledSections);
  if (!items.length) return null;
  const active = companyNavigationSection(pathname, companyId);
  return (
    <nav className={styles.sections} aria-label="Bagian ruang perusahaan">
      {items.map((item) => (
        <Link
          key={item.section}
          href={item.href}
          aria-current={active === item.section ? "page" : undefined}
          onFocus={(event) =>
            event.currentTarget.scrollIntoView({
              block: "nearest",
              inline: "nearest",
            })
          }
        >
          <Icon name={item.icon} />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
