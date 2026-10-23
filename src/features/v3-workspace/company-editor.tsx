"use client";
import { useActionState, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveFoundationCompanyAction } from "../foundation/actions";
import type { WorkspaceCompany } from "./model";
import { workspaceHref } from "./model";
import styles from "./workspace.module.css";
import { companyMetadataInput } from "./management-contract";

export function CompanyEditor({
  company,
  metadataReady = false,
}: {
  company?: WorkspaceCompany;
  metadataReady?: boolean;
}) {
  const router = useRouter();
  const id = useId();
  const [name, setName] = useState(company?.name ?? "");
  const [metadata, setMetadata] = useState({
    ticker: company?.ticker ?? "",
    exchange: company?.exchange ?? "",
    sector: company?.sector ?? "",
    short_note: company?.short_note ?? "",
  });
  const valid = metadataReady
    ? companyMetadataInput.safeParse({ name, ...metadata }).success
    : !!name.trim();
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
      {metadataReady ? (
        <fieldset disabled={pending} className={styles.metadataFields}>
          <legend>Informasi tambahan · opsional</legend>
          {(
            [
              ["ticker", "Ticker", 32],
              ["exchange", "Bursa", 80],
              ["sector", "Sektor", 120],
            ] as const
          ).map(([field, label, max]) => (
            <label key={field}>
              {label}
              <input
                name={field}
                value={metadata[field]}
                maxLength={max}
                onChange={(event) =>
                  setMetadata({ ...metadata, [field]: event.target.value })
                }
                autoComplete="off"
              />
            </label>
          ))}
          <label>
            Catatan pribadi
            <textarea
              name="short_note"
              value={metadata.short_note}
              maxLength={2000}
              rows={4}
              onChange={(event) =>
                setMetadata({ ...metadata, short_note: event.target.value })
              }
            />
          </label>
          <p className={styles.meta}>
            Catatan pribadi tidak dikirim ke AI. Maksimal 2.000 karakter.
          </p>
        </fieldset>
      ) : (
        <details className={styles.capabilities}>
          <summary>Informasi lainnya</summary>
          <p>
            Ticker, bursa, sektor, dan catatan pribadi menunggu pembaruan skema
            yang disetujui.
          </p>
        </details>
      )}
      {state.error && (
        <div className={styles.error} role="alert" id={id + "-error"}>
          <strong>Perubahan belum terkonfirmasi tersimpan.</strong>
          <p>{state.error}</p>
          <p>
            Jika sambungan terputus, periksa daftar perusahaan sebelum mengirim
            ulang agar tidak membuat duplikat.
          </p>
          <Link href={workspaceHref("companies")}>
            Periksa daftar perusahaan →
          </Link>
        </div>
      )}
      <div className={styles.actions}>
        <button
          className={styles.primary}
          type="submit"
          disabled={pending || !valid}
        >
          {pending
            ? "Menyimpan…"
            : company
              ? "Simpan perubahan"
              : "Buat perusahaan"}
        </button>
        <Link
          className={styles.secondary}
          href={workspaceHref(company ? "company" : "companies", company?.id)}
        >
          Batal
        </Link>
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
