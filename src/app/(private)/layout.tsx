import type { ReactNode } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { LogoutForm } from "@/features/auth/logout-form";
import { requireAuthenticatedSession } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function PrivateLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAuthenticatedSession();
  return (
    <AppShell
      privateNavigation={
        <nav className="private-navigation" aria-label="Navigasi utama">
          <Link className="nav-link" href="/" aria-current="page">
            Beranda
          </Link>
          <LogoutForm />
        </nav>
      }
    >
      {children}
    </AppShell>
  );
}
