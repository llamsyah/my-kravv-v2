"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { globalNavigationSection } from "./navigation";
export function PrivateNavigation() {
  const path = usePathname();
  const active = globalNavigationSection(path);
  return (
    <nav className="private-navigation" aria-label="Navigasi utama">
      <Link
        className="nav-link"
        href="/"
        aria-current={active === "home" ? "page" : undefined}
      >
        <Icon name="home" />
        Beranda
      </Link>
      <Link
        className="nav-link"
        href="/companies"
        aria-current={active === "companies" ? "page" : undefined}
      >
        <Icon name="building" />
        Perusahaan
      </Link>
    </nav>
  );
}
