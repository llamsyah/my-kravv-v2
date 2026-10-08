import Link from "next/link";
import type { ReactNode } from "react";

export function AppShell({
  children,
  privateNavigation,
}: {
  children: ReactNode;
  privateNavigation?: ReactNode;
}) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Lewati ke konten utama
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" href="/" aria-label="MY KRAVV — Beranda">
            <span className="brand-mark" aria-hidden="true">
              K
            </span>
            <span>MY KRAVV</span>
          </Link>
          {privateNavigation}
          <span className="edition">
            Ruang pemikiran investasi <span aria-hidden="true">·</span>{" "}
            {new Intl.DateTimeFormat("id-ID", {
              day: "numeric",
              month: "short",
              timeZone: "Asia/Jakarta",
            }).format(new Date())}
          </span>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="main-content">
        {children}
      </main>
      <footer className="site-footer">
        <span>MY KRAVV</span>
        <p>Jaga konteks di balik setiap pemikiran.</p>
      </footer>
    </div>
  );
}
