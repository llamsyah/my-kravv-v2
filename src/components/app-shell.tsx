import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./app-shell.module.css";

export function AppShell({
  children,
  privateNavigation,
  accountMenu,
}: {
  children: ReactNode;
  privateNavigation?: ReactNode;
  accountMenu?: ReactNode;
}) {
  return (
    <div
      className={`app-shell ${styles.shell}`}
      data-private={!!privateNavigation}
    >
      <a className={`skip-link ${styles.skip}`} href="#main-content">
        Lewati ke konten utama
      </a>
      <header className={`site-header ${styles.header}`}>
        <div className={`header-inner ${styles.headerInner}`}>
          <Link
            className={`brand ${styles.brand}`}
            href="/"
            aria-label="MY KRAVV — Beranda"
          >
            <span className={`brand-mark ${styles.mark}`} aria-hidden="true">
              K
            </span>
            <span>MY KRAVV</span>
          </Link>
          {privateNavigation}
          {accountMenu && <div className={styles.account}>{accountMenu}</div>}
          {!privateNavigation && (
            <span className={`edition ${styles.edition}`}>
              Ruang pemikiran investasi <span aria-hidden="true">·</span>{" "}
              {new Intl.DateTimeFormat("id-ID", {
                day: "numeric",
                month: "short",
                timeZone: "Asia/Jakarta",
              }).format(new Date())}
            </span>
          )}
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className={`main-content ${styles.main}`}
      >
        {children}
      </main>
      <footer className={`site-footer ${styles.footer}`}>
        <span>MY KRAVV</span>
        <p>Jaga konteks di balik setiap pemikiran.</p>
      </footer>
    </div>
  );
}
