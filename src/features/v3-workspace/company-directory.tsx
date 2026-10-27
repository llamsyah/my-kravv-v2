"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "../../components/ui/icon";
import { companyInitials, workspaceHref, type WorkspaceCompany } from "./model";
import {
  directoryHref,
  directoryQuery,
  parseDirectorySort,
  type DirectoryState,
} from "./management-contract";
import { CompanyPagination } from "./directory-controls";
import home from "./home-dashboard.module.css";
import shared from "./workspace.module.css";
import styles from "./company-directory.module.css";

const dates = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});
export function CompanyDirectory({
  companies,
  state = { query: "", page: 0, hasNext: false, metadataReady: false },
  failed = false,
}: {
  companies: WorkspaceCompany[];
  state?: DirectoryState;
  failed?: boolean;
}) {
  const router = useRouter();
  const [grid, setGrid] = useState(false);
  const [pending, startTransition] = useTransition();
  const sort = parseDirectorySort(state.sort);
  const navigate = (query: string, nextSort = sort) =>
    startTransition(() =>
      router.push(directoryHref("companies", query, 0, undefined, nextSort)),
    );
  return (
    <div className={styles.directory}>
      <section
        className={`${home.hero} ${styles.hero}`}
        aria-labelledby="directory-title"
      >
        <div className={home.landscape} aria-hidden="true">
          <i />
          <i />
          <i />
          <span />
        </div>
        <div className={home.welcome}>
          <p>Direktori Perusahaan</p>
          <h1 id="directory-title">Perusahaan</h1>
          <p className={styles.intro}>
            Temukan dan kelola perusahaan
            <br />
            yang sedang kamu pelajari.
          </p>
        </div>
        <blockquote>
          “Pemahaman yang mendalam
          <br />
          bermula dari rasa ingin tahu
          <br /> terhadap setiap perusahaan.”
        </blockquote>
      </section>
      <div className={styles.toolbar}>
        <form
          key={state.query}
          className={styles.search}
          action="/foundation"
          method="get"
          onSubmit={(event) => {
            event.preventDefault();
            const query = directoryQuery.safeParse(
              new FormData(event.currentTarget).get("q"),
            );
            if (query.success) navigate(query.data);
          }}
        >
          <input type="hidden" name="view" value="companies" />
          <input type="hidden" name="sort" value={sort} />
          <Icon name="search" />
          <label className="sr-only" htmlFor="directory-search">
            {state.metadataReady
              ? "Cari nama atau ticker"
              : "Cari nama perusahaan"}
          </label>
          <input
            id="directory-search"
            name="q"
            type="search"
            maxLength={200}
            defaultValue={state.query}
            placeholder={
              state.metadataReady
                ? "Cari nama perusahaan atau ticker…"
                : "Cari nama perusahaan…"
            }
          />
          <button type="submit" disabled={pending}>
            Cari
          </button>
        </form>
        <div className={styles.scope}>
          <span className={styles.selectedScope}>Semua</span>
          <details
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.currentTarget.open = false;
                event.currentTarget.querySelector("summary")?.focus();
              }
            }}
          >
            <summary>
              Arsip <Icon name="alert" size="small" />
            </summary>
            <p>
              Arsip belum tersedia. Skema V3 belum memiliki status aktif atau
              diarsipkan; semua perusahaan tersimpan ditampilkan.
            </p>
          </details>
        </div>
        <label className={styles.sort} htmlFor="directory-sort">
          <span className="sr-only">Urutkan perusahaan</span>
          <select
            id="directory-sort"
            value={sort}
            disabled={pending}
            onChange={(event) =>
              navigate(state.query, parseDirectorySort(event.target.value))
            }
          >
            <option value="updated">Terakhir diperbarui</option>
            <option value="created">Paling awal ditambahkan</option>
            <option value="name">Nama A–Z</option>
          </select>
        </label>
        <Link
          className={`${shared.primary} ${styles.add}`}
          href={workspaceHref("new")}
        >
          <Icon name="plus" />
          Tambah perusahaan
        </Link>
      </div>
      <section
        aria-label="Daftar perusahaan"
        aria-busy={pending}
        className={styles.results}
      >
        <div className={styles.resultHeading}>
          <p role="status">
            {pending ? (
              "Memuat perusahaan…"
            ) : failed ? (
              "Daftar belum tersedia"
            ) : (
              <>
                <strong>{companies.length} perusahaan</strong>
                {state.hasNext || state.page ? " di halaman ini" : " tersimpan"}
                {state.query && <> · hasil “{state.query}”</>}
              </>
            )}
          </p>
          <div
            className={styles.views}
            role="group"
            aria-label="Tampilan perusahaan"
          >
            <button
              type="button"
              aria-label="Tampilan daftar"
              aria-pressed={!grid}
              onClick={() => setGrid(false)}
            >
              <Icon name="read" size="small" />
            </button>
            <button
              type="button"
              aria-label="Tampilan grid"
              aria-pressed={grid}
              onClick={() => setGrid(true)}
            >
              <Icon name="overview" size="small" />
            </button>
          </div>
        </div>
        {state.query && (
          <Link
            className={styles.clear}
            href={directoryHref("companies", "", 0, undefined, sort)}
          >
            Hapus pencarian
          </Link>
        )}
        {failed ? (
          <div className={styles.empty} role="alert">
            <Icon name="alert" />
            <h2>Perusahaan belum dapat dimuat.</h2>
            <p>
              Coba muat ulang halaman. Data akun lain tidak ditampilkan sebagai
              pengganti.
            </p>
            <a
              className={shared.secondary}
              href={directoryHref(
                "companies",
                state.query,
                state.page,
                undefined,
                sort,
              )}
            >
              Muat ulang direktori
            </a>
          </div>
        ) : !companies.length ? (
          <div className={styles.empty}>
            <Icon name="building" />
            <h2>
              {state.query
                ? "Tidak ada perusahaan yang cocok."
                : state.page
                  ? "Halaman ini tidak berisi perusahaan."
                  : "Mulai dari satu perusahaan."}
            </h2>
            <p>
              {state.query
                ? "Coba nama atau ticker lain, atau hapus pencarian."
                : state.page
                  ? "Kembali ke halaman pertama untuk melihat perusahaanmu."
                  : "Simpan perusahaan yang ingin kamu pahami lebih dalam."}
            </p>
            {!state.query && !state.page ? (
              <Link className={shared.primary} href={workspaceHref("new")}>
                Tambah perusahaan pertama
              </Link>
            ) : (
              <Link
                className={shared.secondary}
                href={directoryHref("companies", "", 0, undefined, sort)}
              >
                Lihat semua perusahaan
              </Link>
            )}
          </div>
        ) : (
          <ul className={styles.rows} data-view={grid ? "grid" : "list"}>
            {companies.map((company) => (
              <li key={company.id} className={styles.row}>
                <div className={styles.identity}>
                  <span className={styles.monogram} aria-hidden="true">
                    {companyInitials(company.name)}
                  </span>
                  <div>
                    <h2>
                      <Link href={workspaceHref("company", company.id)}>
                        {company.name}
                      </Link>
                      {company.ticker && (
                        <span className={styles.ticker}>{company.ticker}</span>
                      )}
                    </h2>
                    <p>
                      {[company.sector, company.exchange]
                        .filter(Boolean)
                        .join(" · ") || "Workspace pribadi"}
                    </p>
                  </div>
                </div>
                <div className={styles.note}>
                  {company.short_note ? (
                    <>
                      <span>Catatan pribadi</span>
                      <p>{company.short_note}</p>
                    </>
                  ) : (
                    <span className={styles.noNote}>Belum ada catatan</span>
                  )}
                </div>
                <div className={styles.status}>
                  <span>Tersimpan</span>
                </div>
                <div className={styles.updated}>
                  <span>Diperbarui</span>
                  {company.updated_at ? (
                    <time dateTime={company.updated_at}>
                      {dates.format(new Date(company.updated_at))}
                    </time>
                  ) : (
                    <span>Belum tersedia</span>
                  )}
                </div>
                <div className={styles.actions}>
                  <Link
                    className={styles.open}
                    href={workspaceHref("company", company.id)}
                    aria-label={"Buka ruang " + company.name}
                  >
                    Buka workspace
                    <Icon name="arrowRight" size="small" />
                  </Link>
                  <Link
                    className={styles.edit}
                    href={workspaceHref("edit", company.id)}
                    aria-label={"Ubah perusahaan " + company.name}
                  >
                    <Icon name="pencil" size="small" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
        {!failed && (
          <CompanyPagination
            state={{ ...state, sort }}
            view="companies"
            label="Halaman direktori perusahaan"
          />
        )}
      </section>
    </div>
  );
}
