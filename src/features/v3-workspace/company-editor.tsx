"use client";
import { useActionState, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { saveFoundationCompanyAction } from "../foundation/actions";
import type { WorkspaceCompany } from "./model";
import { workspaceHref } from "./model";
import styles from "./workspace.module.css";

export function CompanyEditor({ company }: { company?: WorkspaceCompany }) {
  const router = useRouter();
  const id = useId();
  const [name, setName] = useState(company?.name ?? "");
  const [state, action, pending] = useActionState(saveFoundationCompanyAction, {
    error: null,
  });
  useEffect(() => {
    if (state.company) {
      router.replace(workspaceHref("company", state.company.id));
      router.refresh();
    }
  }, [state, router]);
  return (
    <form className={styles.editor} action={action}>
      {company && <input type="hidden" name="company_id" value={company.id} />}
      <label htmlFor={id}>
        Nama perusahaan <span aria-hidden="true">*</span>
      </label>
      <p id={id + "-hint"}>Gunakan nama yang mudah kamu kenali.</p>
      <input
        id={id}
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={200}
        required
        readOnly={pending}
        autoComplete="off"
        aria-describedby={
          id + "-hint" + (state.error ? " " + id + "-error" : "")
        }
      />
      <span className={styles.meta}>
        Maksimal 200 karakter. Nama tidak mengubah pemilik atau isi perusahaan.
      </span>
      <details className={styles.capabilities}>
        <summary>Informasi lainnya</summary>
        <p>Ticker, bursa, sektor, dan catatan pribadi belum tersedia.</p>
      </details>
      {state.error && (
        <div className={styles.error} role="alert" id={id + "-error"}>
          <strong>Nama belum terkonfirmasi tersimpan.</strong>
          <p>{state.error}</p>
          <p>
            Jika sambungan terputus, periksa daftar perusahaan sebelum mengirim
            ulang agar tidak membuat duplikat.
          </p>
          <a href={workspaceHref("companies")}>Periksa daftar perusahaan →</a>
        </div>
      )}
      <div className={styles.actions}>
        <button
          className={styles.primary}
          type="submit"
          disabled={pending || !name.trim()}
        >
          {pending
            ? "Menyimpan…"
            : company
              ? "Simpan perubahan"
              : "Buat perusahaan"}
        </button>
        <a
          className={styles.secondary}
          href={workspaceHref(company ? "company" : "companies", company?.id)}
        >
          Batal
        </a>
      </div>
      <p role="status" aria-live="polite">
        {pending
          ? "Menunggu konfirmasi penyimpanan…"
          : state.company
            ? "Nama berhasil disimpan."
            : ""}
      </p>
    </form>
  );
}
