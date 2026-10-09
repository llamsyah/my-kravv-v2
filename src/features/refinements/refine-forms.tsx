"use client";
import Link from "next/link";
import { useActionState } from "react";
import { initialRefineFormState } from "@/domain/refinement/refinement";
import { generateRefinementAction, reviewRefinementAction } from "./actions";

export function GenerateRefinementForm({
  companyId,
  thoughtId,
  operationId,
  disabledReason,
  secondary = false,
}: {
  companyId: string;
  thoughtId: string;
  operationId: string;
  disabledReason?: string;
  secondary?: boolean;
}) {
  const path = `/companies/${companyId}/thoughts/${thoughtId}/refine`;
  const [state, action, pending] = useActionState(
    generateRefinementAction,
    initialRefineFormState,
    path,
  );
  const form = (
    <form action={action} className="refine-generate" aria-busy={pending}>
      <input type="hidden" name="company_id" value={companyId} />
      <input type="hidden" name="thought_id" value={thoughtId} />
      <input type="hidden" name="operation_id" value={operationId} />
      <p className="auth-help">
        AI merapikan kata-katamu; keputusan tetap milikmu.
      </p>
      <div className="company-form-actions">
        <button
          className="primary-button"
          disabled={pending || !!disabledReason || !!state.error}
        >
          {pending ? "Sedang merapikan…" : "Rapikan dengan AI"}
        </button>
        <Link
          className="quiet-link"
          href={`/companies/${companyId}/thoughts?focus=${thoughtId}#thought-${thoughtId}`}
        >
          Lihat pemikiran
        </Link>
      </div>
      <p className="form-feedback" role="status" aria-live="polite">
        {pending
          ? "Asli tetap tersimpan. Tunggu hasil permintaan ini."
          : state.error || disabledReason}
      </p>
      {state.error && (
        <ReloadRefinementStatus label="Muat ulang untuk melihat status" />
      )}
    </form>
  );
  return secondary ? (
    <details
      className="refine-new-proposal"
      open={state.error ? true : undefined}
    >
      <summary>Buat usulan baru</summary>
      {form}
    </details>
  ) : (
    form
  );
}
/** A normal page reload is deliberate: same-URL navigation can retain action state. */
export function ReloadRefinementStatus({
  label = "Muat ulang status permintaan",
}: {
  label?: string;
}) {
  return (
    <button
      type="button"
      className="quiet-button"
      onClick={() => window.location.reload()}
    >
      {label}
    </button>
  );
}
export function ReviewRefinementForm({
  companyId,
  thoughtId,
  refinementId,
  aiContent,
}: {
  companyId: string;
  thoughtId: string;
  refinementId: string;
  aiContent: string;
}) {
  const [state, action, pending] = useActionState(
    reviewRefinementAction,
    initialRefineFormState,
    `/companies/${companyId}/thoughts/${thoughtId}/refine?proposal=${refinementId}#refinement-${refinementId}`,
  );
  return (
    <form
      id={`review-${refinementId}`}
      action={action}
      className="refine-review-form"
      aria-busy={pending}
    >
      <fieldset disabled={pending}>
        <legend className="sr-only">Tinjau usulan AI</legend>
        <input type="hidden" name="company_id" value={companyId} />
        <input type="hidden" name="thought_id" value={thoughtId} />
        <input type="hidden" name="refinement_id" value={refinementId} />
        <details
          className="refine-edit"
          open={state.finalContent !== undefined ? true : undefined}
        >
          <summary>Ubah versi pilihan sebelum menerima</summary>
          <label htmlFor={`final-${refinementId}`}>Versi pilihanmu</label>
          <textarea
            id={`final-${refinementId}`}
            name="user_final_content"
            defaultValue={state.finalContent ?? aiContent}
            maxLength={3000}
            required
            rows={5}
          />
          <p className="auth-help">
            Suntinganmu disimpan terpisah. Teks asli dan usulan AI tetap utuh.
          </p>
        </details>
        <div className="company-form-actions">
          <button className="primary-button" name="status" value="ACCEPTED">
            {pending ? "Sedang menyimpan…" : "Terima versi pilihan"}
          </button>
          <button
            className="quiet-button"
            name="status"
            value="REJECTED"
            formNoValidate
          >
            Tolak usulan
          </button>
        </div>
      </fieldset>
      <p className="form-feedback" role="status" aria-live="polite">
        {state.error}
      </p>
    </form>
  );
}
