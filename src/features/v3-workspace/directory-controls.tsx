"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  directoryHref,
  directoryQuery,
  type DirectoryState,
} from "./management-contract";
import styles from "./workspace.module.css";
import type { CompanySection } from "./model";
export function CompanySearch({
  state,
  view,
  companyId,
  section,
  draftId,
  label = "Cari perusahaan",
}: {
  state: DirectoryState;
  view: string;
  companyId?: string;
  section?: CompanySection;
  draftId?: string;
  label?: string;
}) {
  const router = useRouter();
  return (
    <form
      action="/foundation"
      method="get"
      key={state.query}
      className={styles.remoteSearch}
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = directoryQuery.safeParse(
          new FormData(event.currentTarget).get("q"),
        );
        if (parsed.success)
          router.push(
            directoryHref(
              view,
              parsed.data,
              0,
              companyId,
              state.sort,
              section,
              draftId,
            ),
          );
      }}
    >
      <input type="hidden" name="view" value={view} />
      {companyId && <input type="hidden" name="company" value={companyId} />}
      <label>
        {label}
        <input
          type="search"
          name="q"
          defaultValue={state.query}
          maxLength={200}
          placeholder={
            state.metadataReady ? "Nama atau ticker…" : "Nama perusahaan…"
          }
        />
      </label>
      <button type="submit" className={styles.secondary}>
        Cari
      </button>
      {state.query && (
        <Link
          href={directoryHref(
            view,
            "",
            0,
            companyId,
            state.sort,
            section,
            draftId,
          )}
          className={styles.textLink}
        >
          Hapus pencarian
        </Link>
      )}
    </form>
  );
}
export function CompanyPagination({
  state,
  view,
  companyId,
  section,
  draftId,
  label,
}: {
  state: DirectoryState;
  view: string;
  companyId?: string;
  section?: CompanySection;
  draftId?: string;
  label: string;
}) {
  if (!state.hasNext && !state.page) return null;
  return (
    <nav className={styles.pagination} aria-label={label}>
      {state.page > 0 && (
        <Link
          className={styles.secondary}
          href={directoryHref(
            view,
            state.query,
            state.page - 1,
            companyId,
            state.sort,
            section,
            draftId,
          )}
        >
          Sebelumnya
        </Link>
      )}
      <span>Halaman {state.page + 1}</span>
      {state.hasNext && state.page < 10000 && (
        <Link
          className={styles.secondary}
          href={directoryHref(
            view,
            state.query,
            state.page + 1,
            companyId,
            state.sort,
            section,
            draftId,
          )}
        >
          Berikutnya
        </Link>
      )}
    </nav>
  );
}
