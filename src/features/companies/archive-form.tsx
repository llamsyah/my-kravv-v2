"use client";
import { useActionState } from "react";
import { initialCompanyFormState } from "@/domain/company/company";
import { archiveCompanyAction } from "./actions";
export function ArchiveForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(
    archiveCompanyAction,
    initialCompanyFormState,
    `/companies/${id}`,
  );
  return (
    <details
      className="company-disclosure archive-disclosure"
      open={state.error ? true : undefined}
    >
      <summary>Arsipkan perusahaan</summary>
      <p className="auth-help">
        Perusahaan tetap tersimpan dan dapat dibuka dari arsip. Pengarsipan
        tidak menghapus data.
      </p>
      <form id="archive-company-form" action={action} aria-busy={pending}>
        <fieldset disabled={pending}>
          <input type="hidden" name="company_id" value={id} />
          <legend className="sr-only">Konfirmasi arsip</legend>
          <label className="archive-confirm">
            <input
              type="checkbox"
              name="confirm_archive"
              value="yes"
              required
            />
            Saya ingin memindahkan perusahaan ini ke arsip.
          </label>
          <p className="form-feedback" role="status" aria-live="polite">
            {state.error}
          </p>
          <button type="submit" className="primary-button">
            {pending ? "Sedang mengarsipkan…" : "Arsipkan perusahaan"}
          </button>
        </fieldset>
      </form>
    </details>
  );
}
