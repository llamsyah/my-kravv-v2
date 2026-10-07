"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutForm } from "@/features/auth/logout-form";
export function PrivateNavigation() {
  const path = usePathname();
  return (
    <nav className="private-navigation" aria-label="Navigasi utama">
      <Link
        className="nav-link"
        href="/"
        aria-current={path === "/" ? "page" : undefined}
      >
        Beranda
      </Link>
      <Link
        className="nav-link"
        href="/companies"
        aria-current={path.startsWith("/companies") ? "page" : undefined}
      >
        Perusahaan
      </Link>
      <LogoutForm />
    </nav>
  );
}
