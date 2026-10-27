"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "../../components/ui/icon";
import { CaptureInbox } from "../captures/inbox";
import {
  captureHref,
  captureTime,
  type CaptureInboxState,
  type CaptureItem,
} from "../captures/contract";
import { researchHref } from "../research/contract";
import type { ResearchPageState } from "../../server/research/service";
import { workspaceHref, type WorkspaceCompany } from "./model";
import styles from "./home-dashboard.module.css";

const unavailableCaptures: CaptureInboxState = {
  ready: false,
  failed: true,
  items: [],
  page: 0,
  hasNext: false,
};
export function HomeDashboard({
  owner,
  companies,
  companiesFailed,
  captureState = unavailableCaptures,
  researchState,
}: {
  owner: string;
  companies: WorkspaceCompany[];
  companiesFailed: boolean;
  captureState?: CaptureInboxState;
  researchState?: ResearchPageState;
}) {
  const [confirmed, setConfirmed] = useState<CaptureItem | null>(null);
  // Only a validated action result enters this optimistic-free projection. A
  // refreshed server projection takes precedence for the same immutable Capture.
  const captures =
    confirmed && !captureState.items.some((c) => c.id === confirmed.id)
      ? [confirmed, ...captureState.items]
      : captureState.items;
  const recent = researchState?.items[0];
  return (
    <div className={styles.home}>
      <section className={styles.hero} aria-labelledby="home-welcome">
        <div className={styles.landscape} aria-hidden="true">
          <i />
          <i />
          <i />
          <span />
        </div>
        <div className={styles.welcome}>
          <p>Selamat datang kembali</p>
          <h1 id="home-welcome">
            Ruang berpikirmu,
            <br />
            <span>lebih terarah.</span>
          </h1>
          <p className={styles.intro}>
            Tangkap ide baru, lanjutkan penelitian,
            <br /> atau buka perusahaan untuk melanjutkan.
          </p>
        </div>
        <blockquote>
          “Pemikiran yang baik
          <br /> berawal dari catatan kecil.”
        </blockquote>
      </section>

      <CaptureInbox
        key={owner}
        ownerId={owner}
        state={captureState}
        variant="home"
        onConfirmed={setConfirmed}
      />

      <div className={styles.modules}>
        <section
          className={`${styles.card} ${styles.continue}`}
          aria-labelledby="home-research-title"
          data-dashboard-module="research"
        >
          <div className={styles.heading}>
            <span className={styles.symbol}>
              <Icon name="clock" />
            </span>
            <div>
              <h2 id="home-research-title">Lanjutkan dari terakhir</h2>
              <p>Penelitian yang sedang kamu kerjakan.</p>
            </div>
            <Link className={styles.softLink} href={researchHref()}>
              Buka ruang riset <Icon name="arrowRight" />
            </Link>
          </div>
          {researchState?.failed || !researchState ? (
            <div className={styles.empty} role="alert">
              <h3>Riset belum dapat dimuat.</h3>
              <p>Draf tersimpan tidak diubah.</p>
              <a href={workspaceHref("home")}>Muat ulang Beranda</a>
            </div>
          ) : !researchState.ready ? (
            <div className={styles.empty} role="status">
              <h3>Ruang riset belum tersedia.</h3>
              <p>Penyimpanan menunggu skema yang terverifikasi.</p>
              <Link href={researchHref()}>Buka ruang riset</Link>
            </div>
          ) : recent ? (
            <article className={styles.researchCard}>
              <div className={styles.researchMeta}>
                <span className={styles.document}>
                  <Icon name="read" />
                </span>
                <div>
                  <strong>{recent.company_name ?? "Riset mandiri"}</strong>
                  <p>
                    {recent.company_id
                      ? "Ruang perusahaan"
                      : "Tanpa perusahaan"}
                  </p>
                </div>
                <span className={styles.badge}>
                  Draf tersimpan · r{recent.revision}
                </span>
              </div>
              <h3>{recent.title}</h3>
              <p className={styles.preview}>
                {recent.body ||
                  "Dokumen kosong. Lanjutkan pertanyaan pertamamu."}
              </p>
              <div className={styles.cardFooter}>
                <time dateTime={recent.updated_at}>
                  Terakhir diedit {captureTime(recent.updated_at)}
                </time>
                <Link className={styles.primary} href={researchHref(recent.id)}>
                  Lanjutkan menulis <Icon name="arrowRight" />
                </Link>
              </div>
            </article>
          ) : (
            <div className={styles.empty}>
              <h3>Mulai dari pertanyaanmu sendiri.</h3>
              <p>
                Tulis langsung, dengan atau tanpa perusahaan. Tidak perlu
                membuat Capture lebih dulu.
              </p>
              <Link className={styles.primary} href={researchHref()}>
                Buat draf <Icon name="pencil" />
              </Link>
            </div>
          )}
        </section>

        <section
          className={`${styles.card} ${styles.captures}`}
          aria-labelledby="home-captures-title"
          data-dashboard-module="captures"
        >
          <div className={styles.heading}>
            <span className={styles.symbol}>
              <Icon name="read" />
            </span>
            <div>
              <h2 id="home-captures-title">Penampungan terbaru</h2>
              <p>Catatan cepat yang kamu simpan.</p>
            </div>
            <Link className={styles.softLink} href={captureHref()}>
              Lihat semua <Icon name="arrowRight" />
            </Link>
          </div>
          {captureState.failed ? (
            <div className={styles.empty} role="alert">
              <h3>Catatan belum dapat dimuat.</h3>
              <a href={workspaceHref("home")}>Muat ulang Beranda</a>
            </div>
          ) : !captureState.ready ? (
            <div className={styles.empty} role="status">
              Penampungan menunggu pembaruan skema.
            </div>
          ) : !captures.length ? (
            <div className={styles.empty}>
              <h3>Ruang untuk ide kecil.</h3>
              <p>
                Catatan pertamamu akan muncul di sini setelah penyimpanan
                dikonfirmasi.
              </p>
            </div>
          ) : (
            <ol className={styles.captureList}>
              {captures.slice(0, 3).map((c, index) => (
                <li key={c.id}>
                  <span className={styles.document}>
                    <Icon name="read" />
                  </span>
                  <div>
                    <strong>{c.company_name ?? "Catatan mandiri"}</strong>
                    <p className={styles.capturePreview}>{c.raw_text}</p>
                    <time dateTime={c.created_at}>
                      {captureTime(c.created_at)}
                    </time>
                  </div>
                  <Link
                    className={styles.develop}
                    href={researchHref(
                      undefined,
                      c.company_id ?? undefined,
                      c.id,
                    )}
                    aria-label={`Kembangkan catatan ${index + 1} menjadi draf`}
                  >
                    <Icon name="arrowRight" />
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section
          className={`${styles.card} ${styles.review}`}
          aria-labelledby="home-review-title"
          data-dashboard-module="review"
        >
          <div className={styles.heading}>
            <span className={styles.symbol}>
              <Icon name="alert" />
            </span>
            <div>
              <h2 id="home-review-title">Perlu ditinjau</h2>
              <p>Ruang untuk meninjau kembali.</p>
            </div>
          </div>
          <div className={styles.empty}>
            <h3>Status tinjauan belum tersedia.</h3>
            <p>
              Umpan balik AI berada di dokumen terkait. Belum ada penanda usulan
              menunggu keputusan.
            </p>
            <Link href={researchHref()}>
              Buka ruang riset <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </div>

      <section
        className={`${styles.card} ${styles.companies}`}
        aria-labelledby="home-companies-title"
        data-dashboard-module="companies"
      >
        <div className={styles.heading}>
          <span className={styles.symbol}>
            <Icon name="building" />
          </span>
          <div>
            <h2 id="home-companies-title">Perusahaanmu</h2>
            <p>Akses cepat ke ruang penelitian setiap perusahaan.</p>
          </div>
          <Link className={styles.softLink} href={workspaceHref("companies")}>
            Lihat semua perusahaan <Icon name="arrowRight" />
          </Link>
        </div>
        {companiesFailed ? (
          <div className={styles.empty} role="alert">
            <h3>Perusahaan belum dapat dimuat.</h3>
            <Link href={workspaceHref("companies")}>Buka direktori</Link>
          </div>
        ) : !companies.length ? (
          <div className={styles.empty}>
            <h3>Mulai dari satu perusahaan.</h3>
            <p>Riset dan catatan mandiri tetap bisa dimulai sekarang.</p>
            <Link className={styles.primary} href={workspaceHref("new")}>
              Tambah perusahaan <Icon name="plus" />
            </Link>
          </div>
        ) : (
          <ul className={styles.companyGrid}>
            {companies.slice(0, 4).map((c) => (
              <li key={c.id}>
                <Link
                  href={workspaceHref("company", c.id)}
                  aria-label={`Buka ruang ${c.name}`}
                >
                  <span className={styles.companyIcon}>
                    <Icon name="building" />
                  </span>
                  <div>
                    <strong>{c.ticker || c.name}</strong>
                    {c.ticker && <p>{c.name}</p>}
                    <small>
                      {[c.exchange, c.sector].filter(Boolean).join(" · ") ||
                        "Workspace pribadi"}
                    </small>
                  </div>
                  <Icon name="arrowRight" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {!companiesFailed && companies.length > 0 && (
          <Link className={styles.addCompany} href={workspaceHref("new")}>
            <Icon name="plus" /> Tambah perusahaan
          </Link>
        )}
      </section>
    </div>
  );
}
