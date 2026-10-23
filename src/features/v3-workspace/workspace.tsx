"use client";
import Link from "next/link";
import {
  useState,
  useRef,
  useSyncExternalStore,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import { Icon } from "../../components/ui/icon";
import { LogoutForm } from "../auth/logout-form";
import { CompanyEditor } from "./company-editor";
import {
  companyInitials,
  findWorkspaceCompanies,
  selectedWorkspaceCompany,
  workspaceHref,
  type WorkspaceCompany,
  type WorkspaceLocation,
} from "./model";
import styles from "./workspace.module.css";
function subscribeViewport(changed: () => void) {
  const query = window.matchMedia("(max-width: 720px)");
  query.addEventListener("change", changed);
  return () => query.removeEventListener("change", changed);
}
function compactViewport() {
  return window.matchMedia("(max-width: 720px)").matches;
}
function closeDisclosure(event: KeyboardEvent<HTMLDetailsElement>) {
  if (event.key !== "Escape" || !event.currentTarget.open) return;
  event.preventDefault();
  event.currentTarget.open = false;
  event.currentTarget.querySelector("summary")?.focus();
}
const futureAreas = ["Ruang Tulis", "Pemikiran", "Explore", "Referensi"];

export function V3Workspace({
  companies,
  location,
  failed = false,
}: {
  companies: WorkspaceCompany[];
  location: WorkspaceLocation;
  failed?: boolean;
}) {
  const [dark, setDark] = useState(false);
  const compact = useSyncExternalStore(
    subscribeViewport,
    compactViewport,
    () => false,
  );
  const [sidebarChoice, setSidebar] = useState<boolean | null>(null);
  const sidebar = sidebarChoice ?? !compact;
  const [context, setContext] = useState(false);
  const contextControl = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState("");
  const [switchQuery, setSwitchQuery] = useState("");
  const company = selectedWorkspaceCompany(companies, location);
  const inCompany = location.view === "company" || location.view === "edit";
  const workspace = inCompany && !!company && !failed;
  const home = location.view === "home",
    directory = location.view === "companies";
  const filtered = findWorkspaceCompanies(companies, query),
    switchCompanies = findWorkspaceCompanies(companies, switchQuery);
  const title = home
    ? "Ruang penelitianmu."
    : directory
      ? "Perusahaan"
      : location.view === "new"
        ? "Tambah perusahaan"
        : location.view === "edit"
          ? "Ubah nama perusahaan"
          : (company?.name ?? "Perusahaan tidak tersedia");
  const createLink = (
    <Link className={styles.primary} href={workspaceHref("new")}>
      <Icon name="plus" />
      Tambah perusahaan
    </Link>
  );
  return (
    <div className={styles.workspace} data-theme={dark ? "dark" : "light"}>
      <a className={styles.skip} href="#v3-main">
        Lewati ke konten utama
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href={workspaceHref("home")}>
            <span className={styles.brandMark} aria-hidden="true">
              K
            </span>
            MY KRAVV <small>V3</small>
          </Link>
          <nav className={styles.globalNav} aria-label="Navigasi utama">
            <Link
              href={workspaceHref("home")}
              aria-current={home ? "page" : undefined}
            >
              <Icon name="home" />
              Beranda
            </Link>
            <Link
              href={workspaceHref("companies")}
              aria-current={!home ? "page" : undefined}
            >
              <Icon name="building" />
              Perusahaan
            </Link>
          </nav>
          <div className={styles.headerTools}>
            <button
              className={styles.iconButton}
              onClick={() => setDark(!dark)}
              aria-pressed={dark}
              aria-label={
                dark ? "Gunakan tampilan terang" : "Gunakan tampilan gelap"
              }
            >
              {dark ? "☀" : "☾"}
            </button>
            <details className={styles.account} onKeyDown={closeDisclosure}>
              <summary aria-label="Akun">
                <span className={styles.avatar}>
                  <Icon name="user" />
                </span>
                <span>Akun</span>
                <Icon name="chevronDown" />
              </summary>
              <div className={styles.popover}>
                <strong>Ruang pribadi</strong>
                <p>Tampilan dan panel berlaku selama halaman ini terbuka.</p>
                <p>Pengaturan akun belum tersedia.</p>
                <LogoutForm />
              </div>
            </details>
          </div>
        </div>
      </header>
      <div className={styles.canvas} data-workspace={workspace}>
        <div
          className={styles.layout}
          data-workspace={workspace}
          data-expanded={sidebar}
          data-context={workspace && context}
        >
          {workspace && company && (
            <aside
              className={styles.sidebar}
              aria-label="Sidebar perusahaan"
              data-expanded={sidebar}
            >
              <div className={styles.sidebarHead}>
                <Link
                  href={workspaceHref("companies")}
                  className={styles.sideReturn}
                  aria-label="Semua perusahaan"
                  title="Semua perusahaan"
                >
                  <Icon name="building" />
                  <span>Perusahaan</span>
                </Link>
                <button
                  className={styles.iconButton}
                  onClick={() => setSidebar(!sidebar)}
                  aria-expanded={sidebar}
                  aria-controls="v3-company-sidebar"
                  aria-label={
                    sidebar ? "Ciutkan sidebar" : "Buka navigasi perusahaan"
                  }
                  title={
                    sidebar ? "Ciutkan sidebar" : "Buka navigasi perusahaan"
                  }
                >
                  <Icon name={sidebar ? "arrowLeft" : "arrowRight"} />
                </button>
              </div>
              {!sidebar && (
                <span className={styles.railIdentity} aria-hidden="true">
                  {companyInitials(company.name)}
                </span>
              )}
              <div id="v3-company-sidebar" hidden={!sidebar}>
                <p className={styles.sideLabel}>WORKSPACE</p>
                <details
                  className={styles.switcher}
                  onKeyDown={closeDisclosure}
                >
                  <summary aria-label="Ganti perusahaan">
                    <span className={styles.monogram} aria-hidden="true">
                      {companyInitials(company.name)}
                    </span>
                    <strong>{company.name}</strong>
                    <Icon name="chevronDown" />
                  </summary>
                  <div className={styles.switcherBody}>
                    <label htmlFor="company-switch-search">
                      Cari perusahaan milikmu
                    </label>
                    <input
                      id="company-switch-search"
                      type="search"
                      value={switchQuery}
                      onChange={(e) => setSwitchQuery(e.target.value)}
                      maxLength={200}
                      placeholder="Cari nama…"
                    />
                    <ul>
                      {switchCompanies.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={workspaceHref("company", item.id)}
                            onClick={() => {
                              if (compact) setSidebar(false);
                            }}
                            aria-current={
                              item.id === company.id ? "page" : undefined
                            }
                          >
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {!switchCompanies.length && (
                      <p>Tidak ada nama yang cocok.</p>
                    )}
                    <Link
                      className={styles.switcherCreate}
                      href={workspaceHref("new")}
                    >
                      <Icon name="plus" />
                      Tambah perusahaan
                    </Link>
                  </div>
                </details>
                <nav
                  className={styles.companyNav}
                  aria-label="Navigasi perusahaan"
                >
                  <Link
                    href={workspaceHref("company", company.id)}
                    aria-current={
                      location.view === "company" ? "page" : undefined
                    }
                  >
                    <Icon name="overview" />
                    Overview
                  </Link>
                  <details
                    className={styles.futureAreas}
                    onKeyDown={closeDisclosure}
                  >
                    <summary>
                      <Icon name="read" />
                      Area penelitian
                      <Icon name="chevronDown" />
                    </summary>
                    <p>Belum tersedia pada tahap ini.</p>
                    <ul>
                      {futureAreas.map((label) => (
                        <li key={label}>
                          <span aria-disabled="true">{label}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </nav>
                <div className={styles.sidebarFoot}>
                  <Icon name="user" />
                  <span>Hanya untuk akunmu</span>
                </div>
              </div>
            </aside>
          )}
          <main id="v3-main" tabIndex={-1} className={styles.main}>
            <div className={styles.breadcrumb}>
              <span>
                {home
                  ? "BERANDA"
                  : directory
                    ? "DIREKTORI PERUSAHAAN"
                    : location.view === "new"
                      ? "PERUSAHAAN / BARU"
                      : "PERUSAHAAN / OVERVIEW"}
              </span>
              {workspace && (
                <button
                  ref={contextControl}
                  className={styles.contextToggle}
                  onClick={() => setContext(!context)}
                  aria-expanded={context}
                  aria-controls="v3-company-context"
                >
                  <Icon name="alert" />
                  Tentang workspace
                </button>
              )}
            </div>
            <div className={styles.pageHeading}>
              <div>
                <h1>{title}</h1>
                {home && (
                  <p className={styles.lead}>
                    Tempat menata perusahaan yang ingin kamu pahami lebih dalam.
                  </p>
                )}
                {directory && (
                  <p className={styles.lead}>
                    Seluruh ruang perusahaanmu, dalam satu tempat.
                  </p>
                )}
                {workspace && (
                  <p className={styles.lead}>
                    {location.view === "edit"
                      ? "Perbarui identitas, tanpa mengubah isi ruangmu."
                      : "Overview · Ruang penelitian pribadi"}
                  </p>
                )}
              </div>
              {directory && !failed && createLink}
            </div>
            {failed ? (
              <State title="Perusahaan belum dapat dimuat." error>
                <p>
                  Sambungan belum tersedia. Daftar perusahaanmu tidak diubah.
                </p>
                <a
                  className={styles.secondary}
                  href={workspaceHref("companies")}
                >
                  Muat ulang daftar
                </a>
              </State>
            ) : inCompany && !company ? (
              <State title="Ruang ini tidak dapat dibuka.">
                <p>
                  Perusahaan mungkin tidak tersedia atau bukan milik akun ini.
                </p>
                <Link
                  className={styles.secondary}
                  href={workspaceHref("companies")}
                >
                  Kembali ke daftar
                </Link>
              </State>
            ) : location.view === "new" || location.view === "edit" ? (
              <section className={styles.card}>
                <CompanyEditor
                  key={company?.id ?? "new"}
                  company={location.view === "edit" ? company : undefined}
                />
              </section>
            ) : workspace && company ? (
              <>
                <section className={styles.overviewCard}>
                  <div className={styles.sectionHeading}>
                    <span className={styles.sectionIcon}>
                      <Icon name="building" />
                    </span>
                    <h2>Detail perusahaan</h2>
                  </div>
                  <div className={styles.identityRow}>
                    <div>
                      <h3>Nama tampilan</h3>
                      <p>Ubah nama yang ditampilkan di seluruh ruangmu.</p>
                    </div>
                    <Link
                      className={styles.secondary}
                      href={workspaceHref("edit", company.id)}
                    >
                      <Icon name="pencil" />
                      Ubah nama
                    </Link>
                  </div>
                  <details
                    className={styles.capabilities}
                    onKeyDown={closeDisclosure}
                  >
                    <summary>
                      Informasi tambahan
                      <Icon name="chevronDown" />
                    </summary>
                    <p>
                      Saat ini hanya nama perusahaan. Ticker, sektor, dan
                      catatan pribadi belum tersedia.
                    </p>
                  </details>
                </section>
                <section className={styles.researchNote}>
                  <span className={styles.sectionIcon}>
                    <Icon name="read" />
                  </span>
                  <div>
                    <h2>Ruang penelitian</h2>
                    <p>
                      Penulisan, pemikiran, eksplorasi, dan referensi belum
                      tersedia di tahap ini.
                    </p>
                  </div>
                </section>
              </>
            ) : (
              <div className={styles.dashboard} data-home={home}>
                <section
                  className={styles.companySection}
                  aria-labelledby="company-list-title"
                >
                  <div className={styles.sectionHeading}>
                    <div>
                      <h2 id="company-list-title">
                        Perusahaanmu{" "}
                        <span className={styles.count}>{companies.length}</span>
                      </h2>
                      {home && (
                        <p>Buka sebuah ruang untuk menjaga konteksnya.</p>
                      )}
                    </div>
                    {home && (
                      <Link
                        className={styles.textLink}
                        href={workspaceHref("companies")}
                      >
                        Lihat direktori <Icon name="arrowRight" />
                      </Link>
                    )}
                  </div>
                  <div className={styles.directoryTools}>
                    <div className={styles.search}>
                      <Icon name="search" />
                      <label className="sr-only" htmlFor="company-find">
                        Cari nama perusahaan
                      </label>
                      <input
                        id="company-find"
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        maxLength={200}
                        placeholder="Cari nama perusahaan…"
                      />
                      {query && (
                        <button
                          onClick={() => setQuery("")}
                          aria-label="Hapus pencarian"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <span className={styles.meta} role="status">
                      {filtered.length} dari {companies.length} dimuat
                    </span>
                  </div>
                  {companies.length >= 100 && (
                    <p className={styles.notice}>
                      Menampilkan hingga 100 perusahaan pertama. Pencarian
                      terbatas pada daftar yang dimuat.
                    </p>
                  )}
                  {!companies.length ? (
                    <State title="Mulai dari satu perusahaan.">
                      <p>Cukup sebuah nama. Informasi lainnya bisa menyusul.</p>
                      <Link
                        className={styles.primary}
                        href={workspaceHref("new")}
                      >
                        Tambah perusahaan pertama
                      </Link>
                    </State>
                  ) : !filtered.length ? (
                    <State title="Tidak ada nama yang cocok.">
                      <p>Coba nama lain atau hapus pencarian.</p>
                    </State>
                  ) : (
                    <ul
                      className={home ? styles.companyGrid : styles.directory}
                    >
                      {(home ? filtered.slice(0, 6) : filtered).map(
                        (item, index) => (
                          <li key={item.id}>
                            {home ? (
                              <Link
                                className={styles.companyTile}
                                href={workspaceHref("company", item.id)}
                                aria-label={"Buka ruang " + item.name}
                              >
                                <span
                                  className={styles.monogram}
                                  aria-hidden="true"
                                >
                                  {companyInitials(item.name)}
                                </span>
                                <h3>{item.name}</h3>
                                <span className={styles.meta}>
                                  Workspace perusahaan
                                </span>
                                <span className={styles.tileFoot}>
                                  Buka ruang
                                  <Icon name="arrowRight" />
                                </span>
                              </Link>
                            ) : (
                              <>
                                <span
                                  className={styles.rowNumber}
                                  aria-hidden="true"
                                >
                                  {String(index + 1).padStart(2, "0")}
                                </span>
                                <span
                                  className={styles.monogram}
                                  aria-hidden="true"
                                >
                                  {companyInitials(item.name)}
                                </span>
                                <div>
                                  <Link
                                    className={styles.companyName}
                                    href={workspaceHref("company", item.id)}
                                  >
                                    {item.name}
                                  </Link>
                                  <p>Workspace pribadi</p>
                                </div>
                                <Link
                                  className={styles.rowAction}
                                  href={workspaceHref("company", item.id)}
                                  aria-label={"Buka ruang " + item.name}
                                >
                                  Buka ruang
                                  <Icon name="arrowRight" />
                                </Link>
                              </>
                            )}
                          </li>
                        ),
                      )}
                    </ul>
                  )}
                  {home && filtered.length > 6 && (
                    <Link
                      className={styles.moreLink}
                      href={workspaceHref("companies")}
                    >
                      Lihat seluruh perusahaan di direktori
                      <Icon name="arrowRight" />
                    </Link>
                  )}
                </section>
                {home && (
                  <aside className={styles.homeAside}>
                    <section className={styles.createPanel}>
                      <span className={styles.sectionIcon}>
                        <Icon name="plus" />
                      </span>
                      <p className={styles.eyebrow}>RUANG BARU</p>
                      <h2>Ada perusahaan yang ingin kamu pahami?</h2>
                      <p>
                        Mulai dengan namanya. Bangun ruang penelitianmu sedikit
                        demi sedikit.
                      </p>
                      {createLink}
                    </section>
                    <details
                      className={styles.homeHelp}
                      onKeyDown={closeDisclosure}
                    >
                      <summary>
                        Tentang ruang penelitianmu
                        <Icon name="chevronDown" />
                      </summary>
                      <p>
                        Perusahaan tersimpan untuk akunmu. Pengelolaan nama
                        tersedia; area penulisan dan penelitian belum
                        diaktifkan.
                      </p>
                    </details>
                  </aside>
                )}
              </div>
            )}
          </main>
          {workspace && (
            <aside
              className={styles.context}
              id="v3-company-context"
              hidden={!context}
            >
              <div className={styles.sectionHeading}>
                <h2>Tentang workspace</h2>
                <button
                  className={styles.iconButton}
                  aria-label="Tutup informasi workspace"
                  onClick={() => {
                    setContext(false);
                    contextControl.current?.focus();
                  }}
                >
                  ×
                </button>
              </div>
              <p>
                Ruang perusahaan pribadi, dengan identitas yang dapat kamu ubah.
              </p>
              <details onKeyDown={closeDisclosure}>
                <summary>Kontrol dan ketersediaan</summary>
                <p>
                  Penghapusan perusahaan belum tersedia. Tidak ada arsip atau
                  penghapusan beserta seluruh isi.
                </p>
              </details>
            </aside>
          )}
        </div>
        <footer className={styles.footer}>
          <span>
            MY KRAVV <span aria-hidden="true">/</span> Ruang riset pribadi
          </span>
          <span>Jaga konteks. Bangun pemahaman.</span>
        </footer>
      </div>
    </div>
  );
}
function State({
  title,
  children,
  error = false,
}: {
  title: string;
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <section
      className={error ? styles.error : styles.empty}
      role={error ? "alert" : undefined}
    >
      <span className={styles.sectionIcon} aria-hidden="true">
        <Icon name={error ? "alert" : "building"} />
      </span>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
