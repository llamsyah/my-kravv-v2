"use client";
import styles from "@/features/v3-workspace/workspace.module.css";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className={styles.workspace}>
      <main className={styles.canvas}>
        <section className={styles.error} role="alert">
          <h1>Ruang belum dapat dibuka.</h1>
          <p>Sesi atau sambungan mungkin tidak tersedia. Data tidak diubah.</p>
          <div className={styles.actions}>
            <button className={styles.primary} onClick={reset}>
              Coba muat ulang
            </button>
            <a className={styles.secondary} href="/auth">
              Kembali ke masuk
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
