import Link from "next/link";
import { Icon, type IconName } from "../../components/ui/icon";
import {
  companyInitials,
  workspaceHref,
  type WorkspaceCompany,
  type CompanySection,
} from "./model";
import { researchHref } from "../research/contract";
import {
  emptyCompanyResearch,
  type CompanyResearchState,
} from "./company-research-contract";
import shared from "./workspace.module.css";
import styles from "./company-overview.module.css";

const date = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});
function Stamp({ value }: { value: string }) {
  return <time dateTime={value}>{date.format(new Date(value))} WIB</time>;
}
function Heading({
  icon,
  children,
  action,
}: {
  icon: IconName;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className={styles.cardHead}>
      <span className={styles.symbol}>
        <Icon name={icon} />
      </span>
      <h2>{children}</h2>
      {action}
    </div>
  );
}
export function CompanyHeader({ company }: { company: WorkspaceCompany }) {
  return (
    <header className={styles.companyHeader}>
      <span className={styles.companyMark} aria-hidden="true">
        {companyInitials(company.name)}
      </span>
      <div>
        <h1>{company.name}</h1>
        <p>
          {[company.ticker, company.sector, company.exchange]
            .filter(Boolean)
            .join(" · ") || "Workspace penelitian pribadi"}
          <span className={styles.badge}>Ruang pribadi</span>
        </p>
      </div>
    </header>
  );
}
export function companyThoughtHref(
  company: string,
  version: { id: string; draft_id: string },
) {
  return (
    workspaceHref("company", company, "thoughts") +
    "&draft=" +
    version.draft_id +
    "&version=" +
    version.id
  );
}
function ThoughtList({
  company,
  state,
  compact = false,
}: {
  company: WorkspaceCompany;
  state: CompanyResearchState;
  compact?: boolean;
}) {
  return !state.versions.length ? (
    <div className={styles.empty}>
      <p>Belum ada Thought yang direkam untuk perusahaan ini.</p>
      <span>Menyimpan draf tidak membuat Thought.</span>
      <Link href={researchHref(undefined, company.id)}>
        Mulai dari ruang tulis <Icon name="arrowRight" size="small" />
      </Link>
    </div>
  ) : (
    <ul className={styles.thoughts}>
      {state.versions.slice(0, compact ? 4 : 20).map((v) => (
        <li key={v.id}>
          <Link href={companyThoughtHref(company.id, v)}>
            <span className={styles.dot} />
            <div>
              <strong>{v.title}</strong>
              <Stamp value={v.created_at} />
            </div>
            <span className={styles.version}>v{v.number}</span>
            <Icon name="arrowRight" size="small" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
function ResearchNotice({ state }: { state: CompanyResearchState }) {
  return state.failed ? (
    <p className={styles.notice} role="alert">
      Riset perusahaan belum dapat dimuat. Catatan perusahaan tetap tersedia.
    </p>
  ) : !state.ready ? (
    <p className={styles.notice}>
      Riset menunggu skema yang terverifikasi. Tidak ada data atau penyimpanan
      yang disimulasikan.
    </p>
  ) : null;
}
export function CompanyOverview({
  company,
  state = emptyCompanyResearch(),
  section,
  metadataReady = false,
}: {
  company: WorkspaceCompany;
  state?: CompanyResearchState;
  section?: CompanySection;
  metadataReady?: boolean;
}) {
  if (section === "explore" || section === "references")
    return (
      <section className={styles.card}>
        <Heading icon={section === "explore" ? "compass" : "book"}>
          {section === "explore" ? "Explore" : "Referensi"}
        </Heading>
        <div className={styles.empty}>
          <h3>
            {section === "explore"
              ? "Explore belum tersedia."
              : "Belum ada koleksi referensi."}
          </h3>
          <p>
            {section === "explore"
              ? "Eksplorasi riset belum memiliki fitur tersimpan dalam V3."
              : "Penyimpanan dokumen dan tautan belum didukung. Tidak ada referensi atau jumlah yang disimulasikan."}
          </p>
          <Link href={workspaceHref("company", company.id)}>
            Kembali ke Overview <Icon name="arrowRight" size="small" />
          </Link>
        </div>
      </section>
    );
  if (section === "thoughts")
    return (
      <div className={styles.overview}>
        <section className={styles.card}>
          <Heading icon="thought">Pemikiran</Heading>
          <p className={styles.caption}>
            Revisi Thought tersimpan untuk perusahaan ini. Draf tetap terpisah.
          </p>
          <ResearchNotice state={state} />
          {state.ready && !state.failed && (
            <>
              <ThoughtList company={company} state={state} />
              {(state.page > 0 || state.versionsHasNext) && (
                <nav
                  className={styles.pagination}
                  aria-label="Halaman revisi Thought"
                >
                  {state.page > 0 && (
                    <Link
                      href={
                        workspaceHref("company", company.id, "thoughts") +
                        "&research_page=" +
                        (state.page - 1)
                      }
                    >
                      Lebih baru
                    </Link>
                  )}
                  <span>Halaman {state.page + 1}</span>
                  {state.versionsHasNext && state.page < 10000 && (
                    <Link
                      href={
                        workspaceHref("company", company.id, "thoughts") +
                        "&research_page=" +
                        (state.page + 1)
                      }
                    >
                      Lebih lama
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </section>
        {state.ready && !state.failed && state.selectedVersion && (
          <section
            className={styles.card}
            aria-label="Revisi Thought tersimpan"
          >
            <Heading icon="read">{state.selectedVersion.title}</Heading>
            <p className={styles.caption}>
              Thought v{state.selectedVersion.number} ·{" "}
              <Stamp value={state.selectedVersion.created_at} /> · hanya baca
            </p>
            <pre className={styles.snapshot}>{state.selectedVersion.body}</pre>
            <Link
              className={shared.secondary}
              href={
                researchHref(state.selectedVersion.draft_id) +
                "#research-history"
              }
            >
              Buka riwayat draf asal <Icon name="arrowRight" size="small" />
            </Link>
          </section>
        )}
      </div>
    );
  return (
    <div className={styles.overview}>
      <section className={`${styles.card} ${styles.summary}`}>
        <Heading
          icon="read"
          action={
            <Link
              className={styles.softAction}
              href={workspaceHref("edit", company.id)}
            >
              <Icon name="pencil" size="small" />
              {metadataReady ? "Edit catatan" : "Ubah nama"}
            </Link>
          }
        >
          Ringkasan perusahaan & catatan saya
        </Heading>
        <div className={styles.summaryBody}>
          {company.short_note ? (
            <p className={styles.note}>{company.short_note}</p>
          ) : (
            <div className={styles.empty}>
              <p>Belum ada catatan perusahaan.</p>
              <span>
                Tulis konteks atau pertanyaan awal, atau langsung mulai draf.
              </span>
            </div>
          )}
          <p className={styles.caption}>
            Catatan pribadi, bukan tesis investasi atau kesimpulan final.
          </p>
          <details className={styles.metadata}>
            <summary>Detail perusahaan</summary>
            <dl>
              <dt>Ticker</dt>
              <dd>{company.ticker || "Belum diisi"}</dd>
              <dt>Bursa</dt>
              <dd>{company.exchange || "Belum diisi"}</dd>
              <dt>Sektor</dt>
              <dd>{company.sector || "Belum diisi"}</dd>
            </dl>
            <Link href={workspaceHref("edit", company.id)}>
              {metadataReady ? "Ubah metadata" : "Ubah nama"}
            </Link>
          </details>
        </div>
      </section>
      <ResearchNotice state={state} />
      <div className={styles.columns}>
        <section className={styles.card}>
          <Heading icon="read">Lanjutan dari ruang tulis</Heading>
          {state.ready && !state.failed ? (
            state.drafts.length ? (
              <div className={styles.draft}>
                <span className={styles.draftIcon}>
                  <Icon name="read" />
                </span>
                <div>
                  <h3>
                    {state.drafts[0].title}{" "}
                    <span className={styles.draftBadge}>Draf</span>
                  </h3>
                  <p>
                    Terakhir diedit <Stamp value={state.drafts[0].updated_at} />
                  </p>
                </div>
                <Link
                  className={shared.primary}
                  href={researchHref(state.drafts[0].id, company.id)}
                >
                  Lanjut menulis <Icon name="arrowRight" size="small" />
                </Link>
              </div>
            ) : (
              <div className={styles.empty}>
                <p>Belum ada draf untuk perusahaan ini.</p>
                <Link
                  className={shared.primary}
                  href={researchHref(undefined, company.id)}
                >
                  Mulai draf baru <Icon name="plus" size="small" />
                </Link>
              </div>
            )
          ) : (
            <p className={styles.caption}>Draf belum tersedia.</p>
          )}
        </section>
        <section className={styles.card}>
          <Heading icon="chart">Ringkasan workspace</Heading>
          {state.ready && !state.failed ? (
            <>
              <div className={styles.metrics}>
                <Link href={researchHref(undefined, company.id)}>
                  <span className={styles.metricIcon}>
                    <Icon name="read" />
                  </span>
                  <strong>
                    {state.drafts.length}
                    {state.draftsHasNext ? "+" : ""}
                  </strong>
                  <span>draf terbaru</span>
                </Link>
                <Link href={workspaceHref("company", company.id, "thoughts")}>
                  <span className={styles.metricIcon}>
                    <Icon name="thought" />
                  </span>
                  <strong>
                    {state.versions.length}
                    {state.versionsHasNext ? "+" : ""}
                  </strong>
                  <span>revisi Thought</span>
                </Link>
              </div>
              <p className={styles.caption}>
                Daftar terbaru yang dimuat, hingga 20 per jenis. Revisi bukan
                jumlah Thought unik.
              </p>
            </>
          ) : (
            <p className={styles.caption}>
              Ringkasan belum tersedia; angka tidak diperkirakan.
            </p>
          )}
        </section>
        <section className={styles.card}>
          <Heading
            icon="thought"
            action={
              <Link
                className={styles.softAction}
                href={workspaceHref("company", company.id, "thoughts")}
              >
                Lihat semua <Icon name="arrowRight" size="small" />
              </Link>
            }
          >
            Pemikiran terbaru
          </Heading>
          {state.ready && !state.failed ? (
            <ThoughtList company={company} state={state} compact />
          ) : (
            <p className={styles.caption}>Revisi tersimpan belum tersedia.</p>
          )}
        </section>
        <section className={styles.card}>
          <Heading icon="book">Referensi terbaru</Heading>
          <div className={styles.empty}>
            <p>Referensi belum tersedia di workspace ini.</p>
            <span>Belum ada penyimpanan dokumen atau tautan dalam V3.</span>
            <Link href={workspaceHref("company", company.id, "references")}>
              Tentang referensi <Icon name="arrowRight" size="small" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
