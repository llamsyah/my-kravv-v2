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
        <svg
          className="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="m3 10 9-7 9 7v10H3Z" />
          <path d="M9 20v-7h6v7" />
        </svg>
        Beranda
      </Link>
      <Link
        className="nav-link"
        href="/companies"
        aria-current={path.startsWith("/companies") ? "page" : undefined}
      >
        <svg
          className="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M3 21h18M5 21V5h8v16M13 10h6v11M8 8h2m-2 4h2m-2 4h2m6-3h1m-1 4h1" />
        </svg>
        Perusahaan
      </Link>
      <LogoutForm />
    </nav>
  );
}
