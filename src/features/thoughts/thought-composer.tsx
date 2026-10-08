"use client";
import { useActionState, useState } from "react";
import {
  initialThoughtFormState,
  rawContentLimit,
} from "@/domain/thought/thought";
import { createThoughtAction } from "./actions";

export function ThoughtComposer({
  companyId,
  companies,
  archived = false,
}: {
  companyId?: string;
  companies?: { id: string; name: string }[];
  archived?: boolean;
}) {
  const [state, action, pending] = useActionState(
    createThoughtAction,
    initialThoughtFormState,
    companyId ? `/companies/${companyId}` : "/",
  );
  // Controlled text survives React's form reset after a failed action.
  const [text, setText] = useState(state.raw_content ?? "");
  const [selectedCompany, setSelectedCompany] = useState("");
  const fieldError = state.fieldErrors?.raw_content?.join(" ");
  if (archived)
    return (
      <div className="thought-composer">
        <p className="auth-help">
          Ruang ini hanya untuk membaca pemikiran yang sudah tersimpan.
          Pemikiran baru tidak dapat ditambahkan ke perusahaan yang diarsipkan.
        </p>
        <p className="form-feedback" role="status">
          {state.error}
        </p>
        {(state.raw_content || text) && (
          <div className="company-field">
            <label htmlFor="retained-thought">
              Draf belum tersimpan — salin untuk menyimpannya di tempat lain.
            </label>
            <textarea
              id="retained-thought"
              rows={7}
              readOnly
              value={state.raw_content ?? text}
            />
          </div>
        )}
      </div>
    );
  return (
    <form
      id="thought-form"
      className="thought-composer company-form"
      action={action}
      aria-busy={pending}
    >
      <fieldset disabled={pending}>
        <legend className="sr-only">Simpan pemikiran asli</legend>
        {companyId ? (
          <input type="hidden" name="company_id" value={companyId} />
        ) : (
          <div className="company-field">
            <label htmlFor="thought-company">Perusahaan</label>
            <select
              id="thought-company"
              name="company_id"
              required
              value={selectedCompany}
              onChange={(event) => setSelectedCompany(event.target.value)}
              aria-invalid={!!state.fieldErrors?.company_id}
              aria-describedby={
                state.fieldErrors?.company_id
                  ? "thought-company-error"
                  : undefined
              }
            >
              <option value="" disabled>
                Pilih perusahaan
              </option>
              {companies?.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            {state.fieldErrors?.company_id && (
              <p id="thought-company-error" className="form-feedback">
                {state.fieldErrors.company_id.join(" ")}
              </p>
            )}
          </div>
        )}
        <div className="company-field">
          <label htmlFor="raw-content">Apa yang sedang kamu pikirkan?</label>
          <p id="thought-help" className="auth-help">
            Tulis bebas, termasuk yang belum kamu mengerti. Kata-kata dan
            paragrafmu disimpan sebagai pemikiran asli.
          </p>
          <textarea
            id="raw-content"
            name="raw_content"
            rows={7}
            required
            maxLength={rawContentLimit}
            value={text}
            onChange={(event) => setText(event.target.value)}
            aria-invalid={!!fieldError}
            aria-describedby={`thought-help${fieldError ? " thought-field-error" : ""}`}
          />
          {fieldError && (
            <p id="thought-field-error" className="form-feedback">
              {fieldError}
            </p>
          )}
        </div>
        <div className="company-form-actions">
          <button className="primary-button" type="submit" disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan pemikiran"}
          </button>
          <span className="auth-help">
            Simpan sekarang. Baca kembali kapan saja.
          </span>
        </div>
      </fieldset>
      <p className="form-feedback" role="status" aria-live="polite">
        {state.error}
      </p>
    </form>
  );
}
