"use client";
import { useActionState } from "react";
import Link from "next/link";
import {
  companyStates,
  companyStateLabels,
  initialCompanyFormState,
  type Company,
} from "@/domain/company/company";
import { createCompanyAction, updateCompanyAction } from "./actions";
export function CompanyForm({ company }: { company?: Company }) {
  const operation = company ? updateCompanyAction : createCompanyAction;
  const [state, action, pending] = useActionState(
    operation,
    initialCompanyFormState,
    company ? `/companies/${company.id}/edit` : "/companies/new",
  );
  const fieldError = (field: string) => state.fieldErrors?.[field]?.join(" ");
  const field = (
    name: "name" | "ticker" | "exchange" | "sector",
    label: string,
    max: number,
    required = false,
  ) => (
    <div className="company-field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        defaultValue={state.values?.[name] ?? company?.[name] ?? ""}
        maxLength={max}
        required={required}
        aria-invalid={!!fieldError(name)}
        aria-describedby={fieldError(name) ? `${name}-error` : undefined}
      />
      {fieldError(name) && (
        <p id={`${name}-error`} className="form-feedback">
          {fieldError(name)}
        </p>
      )}
    </div>
  );
  return (
    <form
      id="company-form"
      action={action}
      className="company-form"
      aria-busy={pending}
    >
      <fieldset disabled={pending}>
        {company && (
          <input type="hidden" name="company_id" value={company.id} />
        )}
        <legend className="sr-only">
          {company ? "Ubah perusahaan" : "Tambah perusahaan"}
        </legend>
        {field("name", "Nama perusahaan", 200, true)}
        {!company && (
          <p className="auth-help">
            Nama saja cukup untuk memulai. Identitas lainnya bisa kamu lengkapi
            nanti.
          </p>
        )}
        <details
          className="company-disclosure"
          open={company ? true : undefined}
        >
          <summary>
            {company
              ? "Identitas dan konteks"
              : "Tambahkan identitas dan konteks (opsional)"}
          </summary>
          <div className="company-field-grid">
            {field("ticker", "Ticker (opsional)", 40)}
            {field("exchange", "Bursa / pasar (opsional)", 80)}
            {field("sector", "Sektor (opsional)", 120)}
          </div>
          <div className="company-field">
            <label htmlFor="short_note">Catatan singkat (opsional)</label>
            <textarea
              id="short_note"
              name="short_note"
              rows={4}
              maxLength={2000}
              defaultValue={
                state.values?.short_note ?? company?.short_note ?? ""
              }
              aria-invalid={!!fieldError("short_note")}
              aria-describedby="note-help note-error"
            />
            <p id="note-help" className="auth-help">
              Konteks singkat tentang perusahaan ini.
            </p>
            <p id="note-error" className="form-feedback">
              {fieldError("short_note")}
            </p>
          </div>
          {company && company.state !== "ARCHIVED" && (
            <div className="company-field">
              <label htmlFor="state">Keadaan penelitian</label>
              <select
                id="state"
                name="state"
                defaultValue={state.values?.state ?? company.state}
                aria-describedby="state-help state-error"
                aria-invalid={!!fieldError("state")}
              >
                {companyStates
                  .filter((value) => value !== "ARCHIVED")
                  .map((value) => (
                    <option key={value} value={value}>
                      {companyStateLabels[value]}
                    </option>
                  ))}
              </select>
              <p id="state-help" className="auth-help">
                Penanda pribadi; tidak ada tahapan yang wajib diselesaikan.
              </p>
              <p id="state-error" className="form-feedback">
                {fieldError("state")}
              </p>
            </div>
          )}
          {company?.state === "ARCHIVED" && (
            <input type="hidden" name="state" value="ARCHIVED" />
          )}
        </details>
        <p role="status" aria-live="polite" className="form-feedback">
          {state.error}
        </p>
        <div className="company-form-actions">
          <button type="submit" className="primary-button">
            {pending
              ? "Sedang menyimpan…"
              : company
                ? "Simpan perubahan"
                : "Buat ruang perusahaan"}
          </button>
          <Link
            className="quiet-link"
            href={company ? `/companies/${company.id}` : "/companies"}
          >
            Batal
          </Link>
        </div>
      </fieldset>
    </form>
  );
}
