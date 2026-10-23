"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "../../components/ui/icon";
import {
  companyInitials,
  findWorkspaceCompanies,
  workspaceHref,
  type WorkspaceCompany,
  type WorkspaceLocation,
} from "./model";
import styles from "./workspace.module.css";
import { CompanySearch, CompanyPagination } from "./directory-controls";
import type { DirectoryState } from "./management-contract";

function closeDisclosure(event: KeyboardEvent<HTMLDetailsElement>) {
  if (event.key !== "Escape" || !event.currentTarget.open) return;
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.open = false;
  event.currentTarget.querySelector("summary")?.focus();
}

export function cycleDrawerFocus(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab") return;
  const controls = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), summary, [tabindex="0"]',
    ),
  ).filter((element) => element.getClientRects().length > 0);
  const first = controls[0],
    last = controls.at(-1);
  const active = event.currentTarget.ownerDocument.activeElement;
  if (!first || !last) {
    event.preventDefault();
    event.currentTarget.focus();
  } else if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

export function CompanySidebar({
  company,
  companies,
  location,
  compact,
  open,
  onClose,
  directory,
}: {
  company: WorkspaceCompany;
  companies: WorkspaceCompany[];
  location: WorkspaceLocation;
  compact: boolean;
  open: boolean;
  onClose: () => void;
  directory?: DirectoryState;
}) {
  const [query, setQuery] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const closeControl = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(open);
  useEffect(() => {
    if (!compact && open && !wasOpen.current) closeControl.current?.focus();
    wasOpen.current = open;
  }, [compact, open]);
  useEffect(() => {
    if (!compact || !open || !dialog.current) return;
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    closeControl.current?.focus();
    return () => {
      if (element.open) element.close();
      document.body.style.overflow = overflow;
    };
  }, [compact, open]);
  const filtered = directory
    ? companies
    : findWorkspaceCompanies(companies, query);
  const navigate = () => {
    if (compact) onClose();
  };
  const content = (
    <>
      <div className={styles.sidebarHead}>
        <Link
          href={workspaceHref("companies")}
          className={styles.sideReturn}
          aria-label="Semua perusahaan"
          onClick={navigate}
        >
          <Icon name="arrowLeft" />
          <span>Semua perusahaan</span>
        </Link>
        <button
          ref={closeControl}
          type="button"
          className={styles.iconButton}
          onClick={onClose}
          aria-label="Tutup navigasi perusahaan"
          aria-expanded={open}
          aria-controls="v3-company-sidebar"
          title="Tutup navigasi perusahaan"
        >
          <Icon name="panelLeftClose" />
        </button>
      </div>
      <h2 id="v3-sidebar-title" className={styles.sideLabel}>
        WORKSPACE
      </h2>
      <details className={styles.switcher} onKeyDown={closeDisclosure}>
        <summary aria-label="Ganti perusahaan">
          <span className={styles.monogram} aria-hidden="true">
            {companyInitials(company.name)}
          </span>
          <strong>{company.name}</strong>
          <Icon name="chevronDown" />
        </summary>
        <div className={styles.switcherBody}>
          {directory ? (
            <CompanySearch
              state={directory}
              view={location.view}
              companyId={company.id}
              label="Cari perusahaan milikmu"
            />
          ) : (
            <>
              <label htmlFor="company-switch-search">
                Cari perusahaan milikmu
              </label>
              <input
                id="company-switch-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                maxLength={200}
                placeholder="Cari nama…"
              />
            </>
          )}
          <ul>
            {filtered.map((item) => (
              <li key={item.id}>
                <Link
                  href={workspaceHref("company", item.id)}
                  onClick={navigate}
                  aria-current={item.id === company.id ? "page" : undefined}
                >
                  {item.name}
                  {item.ticker ? ` · ${item.ticker}` : ""}
                </Link>
              </li>
            ))}
          </ul>
          {!filtered.length && <p>Tidak ada nama yang cocok.</p>}
          {directory && (
            <CompanyPagination
              state={directory}
              view={location.view}
              companyId={company.id}
              label="Halaman pemilih perusahaan"
            />
          )}
          <Link
            className={styles.switcherCreate}
            href={workspaceHref("new")}
            onClick={navigate}
          >
            <Icon name="plus" />
            Tambah perusahaan
          </Link>
        </div>
      </details>
      <nav className={styles.companyNav} aria-label="Navigasi perusahaan">
        <Link
          href={workspaceHref("company", company.id)}
          aria-current={location.view === "company" ? "page" : undefined}
          onClick={navigate}
        >
          <Icon name="overview" />
          Overview
        </Link>
        <details className={styles.futureAreas} onKeyDown={closeDisclosure}>
          <summary>
            <Icon name="read" />
            Area penelitian
            <Icon name="chevronDown" />
          </summary>
          <p>Belum tersedia pada tahap ini.</p>
          <ul>
            {["Ruang Tulis", "Pemikiran", "Explore", "Referensi"].map(
              (label) => (
                <li key={label}>
                  <span aria-disabled="true">{label}</span>
                </li>
              ),
            )}
          </ul>
        </details>
      </nav>
      <div className={styles.sidebarFoot}>
        <Icon name="user" />
        <span>Hanya untuk akunmu</span>
      </div>
    </>
  );
  return compact ? (
    <dialog
      ref={dialog}
      id="v3-company-sidebar"
      className={styles.drawer}
      aria-label="Navigasi perusahaan"
      onKeyDown={cycleDrawerFocus}
      onClose={() => {
        if (open) onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < box.left ||
          event.clientX > box.right ||
          event.clientY < box.top ||
          event.clientY > box.bottom
        )
          onClose();
      }}
    >
      <div className={styles.drawerBody}>{content}</div>
    </dialog>
  ) : (
    <aside
      id="v3-company-sidebar"
      className={styles.sidebar}
      aria-label="Sidebar perusahaan"
      hidden={!open}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !event.defaultPrevented) {
          event.preventDefault();
          onClose();
        }
      }}
    >
      {content}
    </aside>
  );
}
