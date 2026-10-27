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
import { researchHref } from "../research/contract";

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
  draftId,
}: {
  company: WorkspaceCompany;
  companies: WorkspaceCompany[];
  location: WorkspaceLocation;
  compact: boolean;
  open: boolean;
  onClose: () => void;
  directory?: DirectoryState;
  draftId?: string;
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
      <h2 id="v3-sidebar-title" className="sr-only">
        Workspace perusahaan
      </h2>
      <details className={styles.switcher} onKeyDown={closeDisclosure}>
        <summary aria-label="Ganti perusahaan">
          <span className={styles.monogram} aria-hidden="true">
            {companyInitials(company.name)}
          </span>
          <span className={styles.sideIdentity}>
            <strong>{company.name}</strong>
            <small>
              {[company.ticker, company.sector].filter(Boolean).join(" · ") ||
                "Workspace pribadi"}
            </small>
          </span>
          <Icon name="chevronDown" />
        </summary>
        <div className={styles.switcherBody}>
          {directory ? (
            <CompanySearch
              state={directory}
              view={location.view}
              companyId={company.id}
              section={location.section}
              draftId={draftId}
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
                  href={
                    location.view === "research"
                      ? researchHref(undefined, item.id)
                      : workspaceHref("company", item.id, location.section)
                  }
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
              section={location.section}
              draftId={draftId}
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
          aria-current={
            location.view === "company" && !location.section
              ? "page"
              : undefined
          }
          onClick={navigate}
        >
          <Icon name="overview" />
          Overview
        </Link>
        <Link
          href={researchHref(undefined, company.id)}
          aria-current={location.view === "research" ? "page" : undefined}
          onClick={navigate}
        >
          <Icon name="read" />
          Ruang Tulis
        </Link>
        <Link
          href={workspaceHref("company", company.id, "thoughts")}
          aria-current={location.section === "thoughts" ? "page" : undefined}
          onClick={navigate}
        >
          <Icon name="thought" />
          Pemikiran
        </Link>
        <Link
          href={workspaceHref("company", company.id, "explore")}
          aria-current={location.section === "explore" ? "page" : undefined}
          onClick={navigate}
        >
          <Icon name="compass" />
          Explore
        </Link>
        <Link
          href={workspaceHref("company", company.id, "references")}
          aria-current={location.section === "references" ? "page" : undefined}
          onClick={navigate}
        >
          <Icon name="book" />
          Referensi
        </Link>
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
