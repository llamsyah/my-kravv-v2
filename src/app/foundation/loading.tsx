import styles from "@/features/v3-workspace/workspace.module.css";
export default function Loading() {
  return (
    <div className={styles.workspace}>
      <main className={styles.canvas} role="status" aria-live="polite">
        <h1>Menyiapkan ruang pribadi…</h1>
        <p>Memuat data akun ini.</p>
      </main>
    </div>
  );
}
