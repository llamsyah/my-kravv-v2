"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
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
  const [sidebar, setSidebar] = useState(true);
  const [context, setContext] = useState(true);
  const [query, setQuery] = useState("");
  const company = selectedWorkspaceCompany(companies, location);
  const inCompany = location.view === "company" || location.view === "edit";
  const filtered = findWorkspaceCompanies(companies, query);
  const directory = location.view === "companies";
  const title =
    location.view === "home"
      ? "Ruang untuk memahami."
      : directory
        ? "Perusahaan"
        : location.view === "new"
          ? "Tambah perusahaan"
          : location.view === "edit"
            ? "Ubah nama perusahaan"
            : (company?.name ?? "Perusahaan tidak tersedia");
  return (
    <div className={styles.workspace} data-theme={dark ? "dark" : "light"}>
      <a className={styles.skip} href="#v3-main">
        Lewati ke konten utama
      </a>
      <header className={styles.header}>
        <Link className={styles.brand} href={workspaceHref("home")}>
          <span aria-hidden="true" className={styles.brandMark}>
            ⌁
          </span>{" "}
          MY KRAVV <small>V3</small>
        </Link>
        <nav className={styles.globalNav} aria-label="Navigasi utama">
          <Link
            href={workspaceHref("home")}
            aria-current={location.view === "home" ? "page" : undefined}
          >
            <Icon name="home" />
            Beranda
          </Link>
          <Link
            href={workspaceHref("companies")}
            aria-current={location.view !== "home" ? "page" : undefined}
          >
            <Icon name="building" />
            Perusahaan
          </Link>
        </nav>
        <div className={styles.headerTools}>
          <button
            onClick={() => setDark(!dark)}
            aria-pressed={dark}
            aria-label={
              dark ? "Gunakan tampilan terang" : "Gunakan tampilan gelap"
            }
          >
            {dark ? "☀" : "☾"}
          </button>
          <details className={styles.account}>
            <summary>
              <Icon name="user" />
              <span>Akun</span>
            </summary>
            <div>
              <strong>Ruang pribadi</strong>
              <p>Pengaturan akun belum tersedia.</p>
              <LogoutForm />
            </div>
          </details>
        </div>
      </header>
      <div className={styles.canvas}>
        {inCompany && company && (
          <div className={styles.panelTools}>
            <button
              aria-expanded={sidebar}
              aria-controls="v3-company-sidebar"
              onClick={() => setSidebar(!sidebar)}
            >
              {sidebar ? "Sembunyikan navigasi" : "Tampilkan navigasi"}
            </button>
            <button
              aria-expanded={context}
              aria-controls="v3-company-context"
              onClick={() => setContext(!context)}
            >
              {context ? "Sembunyikan konteks" : "Tampilkan konteks"}
            </button>
          </div>
        )}
        <div
          className={styles.layout}
          data-sidebar={inCompany && !!company && sidebar}
          data-context={inCompany && !!company && context}
        >
          {inCompany && company && (
            <aside
              id="v3-company-sidebar"
              className={styles.sidebar}
              hidden={!sidebar}
            >
              <Link className={styles.back} href={workspaceHref("companies")}>
                ← Semua perusahaan
              </Link>
              <span className={styles.monogram} aria-hidden="true">
                {companyInitials(company.name)}
              </span>
              <h2>{company.name}</h2>
              <details className={styles.switcher}>
                <summary>
                  Ganti perusahaan <Icon name="chevronDown" />
                </summary>
                <div>
                  <label htmlFor="company-switch-search">
                    Cari perusahaan milikmu
                  </label>
                  <input
                    id="company-switch-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    maxLength={200}
                  />
                  <ul>
                    {filtered.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={workspaceHref("company", item.id)}
                          aria-current={
                            item.id === company.id ? "page" : undefined
                          }
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {!filtered.length && <p>Tidak ada nama yang cocok.</p>}
                  <Link href={workspaceHref("new")}>+ Tambah perusahaan</Link>
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
                {["Ruang Tulis", "Pemikiran", "Explore", "Referensi"].map(
                  (label) => (
                    <span key={label} aria-disabled="true">
                      {label}
                      <small>Segera</small>
                    </span>
                  ),
                )}
              </nav>
              <p className={styles.meta}>
                Risetmu tetap milikmu. Tidak ada data pasar atau ringkasan
                otomatis.
              </p>
            </aside>
          )}
          <main className={styles.main} id="v3-main" tabIndex={-1}>
            <p className={styles.eyebrow}>
              {inCompany
                ? "PERUSAHAAN / OVERVIEW"
                : directory
                  ? "DIREKTORI PERUSAHAAN"
                  : location.view === "new"
                    ? "RUANG PENELITIAN BARU"
                    : "RUANG PEMIKIRAN PRIBADI"}
            </p>
            <h1>{title}</h1>
            {failed ? (
              <State title="Perusahaan belum dapat dimuat." error>
                <p>
                  Data tidak ditampilkan sebagai daftar kosong. Coba muat ulang;
                  isi perusahaanmu tidak diubah.
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
            ) : inCompany && company ? (
              <>
                <p className={styles.lead}>
                  Tempat menjaga konteks tentang perusahaan yang sedang kamu
                  pelajari.
                </p>
                <section className={styles.card}>
                  <div className={styles.sectionHeading}>
                    <h2>Identitas perusahaan</h2>
                    <Link
                      className={styles.secondary}
                      href={workspaceHref("edit", company.id)}
                    >
                      <Icon name="pencil" />
                      Ubah nama
                    </Link>
                  </div>
                  <h3>{company.name}</h3>
                  <p>Nama tersimpan di ruang pribadi akun ini.</p>
                  <p className={styles.meta}>
                    Ticker, sektor, dan catatan pribadi belum tersedia. Tidak
                    ada informasi perusahaan yang diisi otomatis.
                  </p>
                </section>
                <section className={styles.card}>
                  <h2>Ruang penelitianmu</h2>
                  <p>
                    Mulai dari rasa ingin tahu. Area berikut akan tersedia pada
                    tahap berikutnya.
                  </p>
                  <div className={styles.destinations}>
                    {["Ruang Tulis", "Pemikiran", "Explore", "Referensi"].map(
                      (label) => (
                        <div key={label}>
                          <Icon name="read" />
                          <h3>{label}</h3>
                          <span className={styles.meta}>Belum tersedia</span>
                        </div>
                      ),
                    )}
                  </div>
                </section>
              </>
            ) : (
              <>
                <p className={styles.lead}>
                  {directory
                    ? "Temukan dan kelola perusahaan yang sedang kamu pelajari."
                    : "Bangun pemahaman, satu perusahaan pada satu waktu."}
                </p>
                {!directory && (
                  <section className={styles.welcome}>
                    <div>
                      <p className={styles.eyebrow}>MULAI DARI PERUSAHAAN</p>
                      <h2>Pemikiran yang baik punya ruang untuk tumbuh.</h2>
                      <p>
                        Pilih perusahaan untuk membuka ruang pribadinya, atau
                        mulai dengan sebuah nama.
                      </p>
                    </div>
                    <Link
                      className={styles.primary}
                      href={workspaceHref("new")}
                    >
                      <Icon name="plus" />
                      Tambah perusahaan
                    </Link>
                  </section>
                )}
                <div className={styles.toolbar}>
                  <div className={styles.search}>
                    <Icon name="search" />
                    <label className="sr-only" htmlFor="company-find">
                      Cari nama perusahaan
                    </label>
                    <input
                      id="company-find"
                      type="search"
                      placeholder="Cari nama perusahaan…"
                      value={query}
                      maxLength={200}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                      <button onClick={() => setQuery("")}>
                        Hapus pencarian
                      </button>
                    )}
                  </div>
                  {directory && (
                    <Link
                      className={styles.primary}
                      href={workspaceHref("new")}
                    >
                      <Icon name="plus" />
                      Tambah perusahaan
                    </Link>
                  )}
                </div>
                <div className={styles.sectionHeading}>
                  <h2>
                    {directory ? "Perusahaanmu" : "Buka ruang perusahaan"}
                  </h2>
                  <span className={styles.meta} role="status">
                    {filtered.length} dari {companies.length} perusahaan dimuat
                  </span>
                </div>
                {companies.length >= 100 && (
                  <p className={styles.notice}>
                    Menampilkan hingga 100 perusahaan pertama. Pencarian dan
                    pemilih perusahaan terbatas pada daftar yang dimuat.
                  </p>
                )}
                {!companies.length ? (
                  <State title="Mulai dari satu perusahaan.">
                    <p>
                      Cukup sebuah nama. Kamu dapat mengubahnya nanti, tanpa
                      harus melengkapi profil.
                    </p>
                    <Link
                      className={styles.primary}
                      href={workspaceHref("new")}
                    >
                      Tambah perusahaan pertama
                    </Link>
                  </State>
                ) : !filtered.length ? (
                  <State title="Tidak ada nama yang cocok.">
                    <p>
                      Coba nama lain atau hapus pencarian untuk melihat semua
                      perusahaan yang dimuat.
                    </p>
                    <button
                      className={styles.secondary}
                      onClick={() => setQuery("")}
                    >
                      Hapus pencarian
                    </button>
                  </State>
                ) : (
                  <ul className={styles.directory}>
                    {filtered.map((item) => (
                      <li key={item.id}>
                        <span className={styles.monogram} aria-hidden="true">
                          {companyInitials(item.name)}
                        </span>
                        <div>
                          <Link
                            className={styles.companyName}
                            href={workspaceHref("company", item.id)}
                          >
                            {item.name}
                          </Link>
                          <p>Ruang penelitian pribadi</p>
                        </div>
                        <Link
                          className={styles.secondary}
                          href={workspaceHref("company", item.id)}
                        >
                          Buka ruang <Icon name="arrowRight" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </main>
          {inCompany && company && (
            <aside
              id="v3-company-context"
              className={styles.context}
              hidden={!context}
            >
              <h2>Tentang ruang ini</h2>
              <p>
                Perusahaan membantu menempatkan penelitianmu dalam konteks yang
                tepat.
              </p>
              <hr />
              <h3>Kontrol data</h3>
              <p>
                Penghapusan perusahaan belum tersedia. Fitur ini memerlukan
                pemeriksaan kosong yang aman di server.
              </p>
              <p className={styles.meta}>
                Tidak ada arsip atau penghapusan beserta seluruh isi.
              </p>
            </aside>
          )}
        </div>
        <footer className={styles.footer}>
          <span>MY KRAVV · Ruang untuk berpikir jernih.</span>
          <span>Tampilan berlaku selama halaman ini terbuka.</span>
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
      <span className={styles.emptyMark} aria-hidden="true">
        <Icon name={error ? "alert" : "building"} />
      </span>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
