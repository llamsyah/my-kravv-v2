"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { CompanyOverview, CompanyHeader } from "./company-overview";
import type { CompanyResearchState } from "./company-research-contract";
import { CompanyDirectory } from "./company-directory";
import {
  directoryHref,
  directoryQuery,
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
  selectedWorkspaceCompany,
  workspaceHref,
  type WorkspaceCompany,
  type WorkspaceLocation,
} from "./model";
import styles from "./workspace.module.css";
import { CaptureInbox } from "../captures/inbox";
import { HomeDashboard } from "./home-dashboard";
import type { CaptureInboxState } from "../captures/contract";
import { ResearchWorkspace } from "../research/workspace";
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
  companyResearch,
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
  companyResearch?: CompanyResearchState;
}) {
  const router = useRouter();
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
  const company =
    selectedCompany === undefined
      ? selectedWorkspaceCompany(companies, location)
      : (selectedCompany ?? undefined);
  const inCompany =
    location.view === "company" ||
    location.view === "edit" ||
    (location.view === "research" && !!location.companyId);
  const workspace = inCompany && !!company && !failed;
  const captures = location.view === "captures";
  const research = location.view === "research";
  useEffect(() => {
    if (ownerId) clearResearchRecovery(ownerId);
  }, [ownerId]);
  const home = location.view === "home",
    directory = location.view === "companies";
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
              aria-current={home || captures ? "page" : undefined}
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
          </nav>
          <form
            className={styles.headerSearch}
            action="/foundation"
            method="get"
            role="search"
            aria-label="Pencarian perusahaan"
            onSubmit={(event) => {
              event.preventDefault();
              const parsed = directoryQuery.safeParse(
                new FormData(event.currentTarget).get("q"),
              );
              if (parsed.success)
                router.push(directoryHref("companies", parsed.data, 0));
            }}
          >
            <input type="hidden" name="view" value="companies" />
            <label className="sr-only" htmlFor="header-company-search">
              Cari perusahaan
            </label>
            <input
              id="header-company-search"
              type="search"
              name="q"
              placeholder="Cari perusahaan atau ticker…"
              maxLength={200}
            />
            <button type="submit" aria-label="Cari perusahaan">
              <Icon name="search" />
            </button>
          </form>
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
        data-directory={directory}
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
              draftId={research ? researchState?.selected?.id : undefined}
            />
          )}
          <main id="v3-main" tabIndex={-1} className={styles.main}>
            {themeError && (
              <p role="status" className={styles.notice}>
                {themeError}
              </p>
            )}
            {!home && !directory && (
              <>
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
                      ) : workspace && company ? (
                        <>
                          <Link href={workspaceHref("companies")}>
                            Perusahaan
                          </Link>
                          <span aria-hidden="true"> › </span>
                          <Link href={workspaceHref("company", company.id)}>
                            {company.name}
                          </Link>
                          {location.view === "research"
                            ? " / Ruang Tulis"
                            : location.section
                              ? " / " +
                                {
                                  thoughts: "Pemikiran",
                                  explore: "Explore",
                                  references: "Referensi",
                                }[location.section]
                              : ""}
                        </>
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
                {workspace && company && location.view !== "edit" ? (
                  <CompanyHeader company={company} />
                ) : (
                  <div
                    className={home ? styles.homeHeading : styles.pageHeading}
                  >
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
                )}
              </>
            )}
            {home ? (
              <HomeDashboard
                key={ownerId ?? "unavailable"}
                owner={ownerId ?? ""}
                companies={companies}
                companiesFailed={failed}
                captureState={captureState}
                researchState={researchState}
              />
            ) : directory ? (
              <CompanyDirectory
                key={ownerId ?? "unavailable"}
                companies={companies}
                state={directoryState}
                failed={failed}
              />
            ) : research && (!inCompany || (!failed && company)) ? (
              <ResearchWorkspace
                key={
                  (ownerId ?? "unavailable") + ":" + (company?.id ?? "personal")
                }
                owner={ownerId ?? ""}
                company={company?.id ?? researchCompany}
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
              <CompanyOverview
                company={company}
                state={companyResearch}
                section={location.section}
                metadataReady={metadataReady}
              />
            ) : null}
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
