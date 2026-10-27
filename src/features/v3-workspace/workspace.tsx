"use client";
import Link from "next/link";
import {
  useState,
  useRef,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import { Icon } from "../../components/ui/icon";
import { LogoutForm } from "../auth/logout-form";
import { CompanyEditor } from "./company-editor";
import { CompanySidebar } from "./company-sidebar";
import { CompanySearch, CompanyPagination } from "./directory-controls";
import {
  directoryHref,
  type DirectoryState,
  type Theme,
} from "./management-contract";
import {
  readThemePreference,
  setThemePreference,
  subscribeThemePreference,
} from "./theme-preference";
import { saveFoundationThemeAction } from "../foundation/actions";
import {
  readSidebarPreference,
  setSidebarPreference,
  subscribeSidebarPreference,
} from "./sidebar-preference";
import {
  companyInitials,
  findWorkspaceCompanies,
  selectedWorkspaceCompany,
  workspaceHref,
  type WorkspaceCompany,
  type WorkspaceLocation,
} from "./model";
import styles from "./workspace.module.css";
import { CaptureInbox } from "../captures/inbox";
import type { CaptureInboxState } from "../captures/contract";
import { ResearchWorkspace } from "../research/workspace";
import { researchHref } from "../research/contract";
import { clearResearchRecovery } from "../research/session";
import type { ResearchPageState } from "../../server/research/service";
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

export function V3Workspace({
  companies,
  location,
  failed = false,
  directory: directoryState,
  selectedCompany,
  initialTheme = "light",
  ownerId,
  captureState,
  researchState,
  researchCompany,
}: {
  companies: WorkspaceCompany[];
  location: WorkspaceLocation;
  failed?: boolean;
  directory?: DirectoryState;
  selectedCompany?: WorkspaceCompany | null;
  initialTheme?: Theme;
  ownerId?: string;
  captureState?: CaptureInboxState;
  researchState?: ResearchPageState;
  researchCompany?: string;
}) {
  const browserTheme = useSyncExternalStore(
    subscribeThemePreference,
    readThemePreference,
    () => "light" as const,
  );
  const [themeChoice, setThemeChoice] = useState<Theme | null>(null);
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeError, setThemeError] = useState<string | null>(null);
  const metadataReady = directoryState?.metadataReady ?? false;
  const dark =
    (themeChoice ?? (metadataReady ? initialTheme : browserTheme)) === "dark";
  async function toggleTheme() {
    const next = dark ? "light" : "dark";
    setThemeChoice(next);
    setThemePreference(next);
    setThemeError(null);
    if (!metadataReady) return;
    setThemeSaving(true);
    try {
      const result = await saveFoundationThemeAction(next);
      if (result.error || result.theme !== next)
        setThemeError(
          "Tema di perangkat ini berubah, tetapi penyimpanan akun belum terkonfirmasi.",
        );
    } catch {
      setThemeError(
        "Tema di perangkat ini berubah, tetapi penyimpanan akun belum terkonfirmasi.",
      );
    } finally {
      setThemeSaving(false);
    }
  }
  const compact = useSyncExternalStore(
    subscribeViewport,
    compactViewport,
    () => false,
  );
  const desktopSidebar = useSyncExternalStore(
    subscribeSidebarPreference,
    readSidebarPreference,
    () => true,
  );
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const sidebar = compact ? mobileSidebar : desktopSidebar;
  const sidebarControl = useRef<HTMLButtonElement>(null);
  const restoreSidebarFocus = useRef(false);
  const closeSidebar = () => {
    restoreSidebarFocus.current = true;
    if (compact) setMobileSidebar(false);
    else setSidebarPreference(false);
  };
  useEffect(() => {
    if (!sidebar && restoreSidebarFocus.current) {
      sidebarControl.current?.focus();
      restoreSidebarFocus.current = false;
    }
  }, [sidebar]);
  const [context, setContext] = useState(false);
  const contextControl = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState("");
  const company =
    selectedCompany === undefined
      ? selectedWorkspaceCompany(companies, location)
      : (selectedCompany ?? undefined);
  const inCompany = location.view === "company" || location.view === "edit";
  const workspace = inCompany && !!company && !failed;
  const captures = location.view === "captures";
  const research = location.view === "research";
  useEffect(() => {
    if (ownerId) clearResearchRecovery(ownerId);
  }, [ownerId]);
  const home = location.view === "home",
    directory = location.view === "companies";
  const filtered = directoryState
    ? companies
    : findWorkspaceCompanies(companies, query);
  const title = home
    ? "Ruang berpikirmu,"
    : research
      ? "Ruang riset"
      : captures
        ? "Penampungan"
        : directory
          ? "Perusahaan"
          : location.view === "new"
            ? "Tambah perusahaan"
            : location.view === "edit"
              ? metadataReady
                ? "Ubah perusahaan"
                : "Ubah nama perusahaan"
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
              aria-current={
                !home && !captures && !research ? "page" : undefined
              }
            >
              <Icon name="building" />
              Perusahaan
            </Link>
            <Link
              href={workspaceHref("captures")}
              aria-current={captures ? "page" : undefined}
            >
              <Icon name="plus" /> Quick Capture
            </Link>
            <Link
              href={researchHref()}
              aria-current={research ? "page" : undefined}
            >
              <Icon name="pencil" /> Ruang Riset
            </Link>
          </nav>
          <div className={styles.headerTools}>
            <button
              className={styles.iconButton}
              onClick={toggleTheme}
              disabled={themeSaving}
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
                <p>
                  {metadataReady
                    ? "Tema disimpan untuk akunmu."
                    : "Tema diingat di perangkat ini. Sinkronisasi akun menunggu pembaruan skema."}
                </p>
                <p>Pengaturan akun belum tersedia.</p>
                <div
                  onSubmitCapture={() => {
                    if (!clearResearchRecovery())
                      setThemeError(
                        "Buffer riset lokal belum dapat dibersihkan. Periksa perangkat bersama sebelum menyerahkannya.",
                      );
                  }}
                >
                  <LogoutForm />
                </div>
              </div>
            </details>
          </div>
        </div>
      </header>
      <div
        className={styles.canvas}
        data-workspace={workspace}
        data-home={home}
      >
        <div
          className={styles.layout}
          data-workspace={workspace}
          data-expanded={sidebar}
          data-context={workspace && context}
        >
          {workspace && company && (
            <CompanySidebar
              company={company}
              companies={companies}
              location={location}
              compact={compact}
              open={sidebar}
              onClose={closeSidebar}
              directory={directoryState}
            />
          )}
          <main id="v3-main" tabIndex={-1} className={styles.main}>
            {themeError && (
              <p role="status" className={styles.notice}>
                {themeError}
              </p>
            )}
            <div className={styles.breadcrumb}>
              <div className={styles.workspaceTrail}>
                {workspace && (compact || !sidebar) && (
                  <button
                    ref={sidebarControl}
                    type="button"
                    className={styles.navigationToggle}
                    aria-label="Buka navigasi perusahaan"
                    aria-expanded={sidebar}
                    aria-controls="v3-company-sidebar"
                    onClick={() => {
                      if (compact) setMobileSidebar(true);
                      else setSidebarPreference(true);
                    }}
                  >
                    <Icon name="panelLeftOpen" />
                    <span>Navigasi</span>
                  </button>
                )}
                <span>
                  {workspace && !sidebar ? (
                    <Link
                      className={styles.sideReturn}
                      href={workspaceHref("companies")}
                      aria-label="Semua perusahaan"
                    >
                      <Icon name="arrowLeft" />
                      Semua perusahaan
                    </Link>
                  ) : research ? (
                    "RUANG PRIBADI / RISET"
                  ) : captures ? (
                    "RUANG PRIBADI / PENAMPUNGAN"
                  ) : home ? (
                    "BERANDA"
                  ) : directory ? (
                    "DIREKTORI PERUSAHAAN"
                  ) : location.view === "new" ? (
                    "PERUSAHAAN / BARU"
                  ) : (
                    "PERUSAHAAN / OVERVIEW"
                  )}
                </span>
              </div>
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
            <div className={home ? styles.homeHeading : styles.pageHeading}>
              <div>
                <h1>
                  {title}
                  {home && <span>lebih terarah.</span>}
                </h1>
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
            {research ? (
              <ResearchWorkspace
                key={ownerId ?? "unavailable"}
                owner={ownerId ?? ""}
                company={researchCompany}
                state={
                  researchState ?? {
                    ready: false,
                    failed: true,
                    items: [],
                    hasNext: false,
                    page: 0,
                    selected: null,
                    history: [],
                    historyHasNext: false,
                    source: null,
                    unavailable: false,
                  }
                }
              />
            ) : captures ? (
              <CaptureInbox
                key={ownerId ?? "unavailable"}
                ownerId={ownerId ?? ""}
                state={
                  captureState ?? {
                    ready: false,
                    failed: true,
                    items: [],
                    page: 0,
                    hasNext: false,
                  }
                }
              />
            ) : failed ? (
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
                  metadataReady={metadataReady}
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
                      {metadataReady ? "Ubah metadata" : "Ubah nama"}
                    </Link>
                  </div>
                  {metadataReady && (
                    <dl className={styles.metadataSummary}>
                      <div>
                        <dt>Ticker</dt>
                        <dd>{company.ticker || "Belum diisi"}</dd>
                      </div>
                      <div>
                        <dt>Bursa</dt>
                        <dd>{company.exchange || "Belum diisi"}</dd>
                      </div>
                      <div>
                        <dt>Sektor</dt>
                        <dd>{company.sector || "Belum diisi"}</dd>
                      </div>
                      <div>
                        <dt>Catatan pribadi</dt>
                        <dd className={styles.privateNote}>
                          {company.short_note || "Belum diisi"}
                        </dd>
                      </div>
                    </dl>
                  )}
                  {!metadataReady && (
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
                  )}
                </section>
                <section className={styles.researchNote}>
                  <span className={styles.sectionIcon}>
                    <Icon name="read" />
                  </span>
                  <div>
                    <h2>Ruang penelitian</h2>
                    <p>
                      Kembangkan riset, rekam Thought, dan baca riwayat tanpa
                      mengubah catatan asli.
                    </p>
                    <Link
                      className={styles.secondary}
                      href={researchHref(undefined, company.id)}
                    >
                      Buka Ruang Riset
                    </Link>
                  </div>
                </section>
              </>
            ) : (
              <div className={styles.dashboard} data-home={home}>
                <section
                  className={styles.companySection}
                  data-dashboard-module={home ? "companies" : undefined}
                  aria-labelledby="company-list-title"
                >
                  <div className={styles.sectionHeading}>
                    <div>
                      <h2 id="company-list-title">
                        Perusahaanmu{" "}
                        <span className={styles.count}>
                          {companies.length}
                          {directoryState?.hasNext ? "+" : ""}
                        </span>
                      </h2>
                    </div>
                    {home && createLink}
                  </div>
                  <div className={styles.directoryTools}>
                    {directoryState ? (
                      <CompanySearch
                        state={directoryState}
                        view={home ? "home" : "companies"}
                        label={
                          metadataReady
                            ? "Cari nama atau ticker"
                            : "Cari nama perusahaan"
                        }
                      />
                    ) : (
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
                    )}
                    <span className={styles.meta} role="status">
                      {directoryState
                        ? `${companies.length} perusahaan di halaman ini`
                        : `${filtered.length} dari ${companies.length} dimuat`}
                    </span>
                    {home && (
                      <Link
                        className={styles.textLink}
                        href={directoryHref(
                          "companies",
                          directoryState?.query ?? "",
                          0,
                        )}
                      >
                        Lihat direktori <Icon name="arrowRight" />
                      </Link>
                    )}
                  </div>
                  {!directoryState && companies.length >= 100 && (
                    <p className={styles.notice}>
                      Menampilkan hingga 100 perusahaan pertama. Pencarian
                      terbatas pada daftar yang dimuat.
                    </p>
                  )}
                  {!companies.length &&
                  !directoryState?.query &&
                  !directoryState?.page ? (
                    <State title="Mulai dari satu perusahaan.">
                      <p>Cukup sebuah nama. Informasi lainnya bisa menyusul.</p>
                      {!home && (
                        <Link
                          className={styles.primary}
                          href={workspaceHref("new")}
                        >
                          Tambah perusahaan pertama
                        </Link>
                      )}
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
                                <div className={styles.tileIdentity}>
                                  <h3>{item.name}</h3>
                                  <span className={styles.meta}>
                                    {[item.ticker, item.exchange]
                                      .filter(Boolean)
                                      .join(" · ") || "Overview perusahaan"}
                                  </span>
                                </div>
                                <Icon name="arrowRight" />
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
                                  <p>
                                    {[item.ticker, item.exchange, item.sector]
                                      .filter(Boolean)
                                      .join(" · ") || "Workspace pribadi"}
                                  </p>
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
                  {directory && directoryState && (
                    <CompanyPagination
                      state={directoryState}
                      view="companies"
                      label="Halaman direktori perusahaan"
                    />
                  )}
                  {home && (filtered.length > 6 || directoryState?.hasNext) && (
                    <Link
                      className={styles.moreLink}
                      href={directoryHref(
                        "companies",
                        directoryState?.query ?? "",
                        0,
                      )}
                    >
                      Lihat seluruh perusahaan di direktori
                      <Icon name="arrowRight" />
                    </Link>
                  )}
                </section>
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
