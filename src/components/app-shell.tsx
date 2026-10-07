import Link from "next/link";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
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
          <nav aria-label="Navigasi utama">
            <Link className="nav-link" href="/">
              Beranda
            </Link>
          </nav>
          <span className="edition">Ruang pemikiran investasi</span>
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
