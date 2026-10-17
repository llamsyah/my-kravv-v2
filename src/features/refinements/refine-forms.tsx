"use client";
import Link from "next/link";
import { useActionState, useState, useSyncExternalStore } from "react";
import { initialRefineFormState } from "@/domain/refinement/refinement";
import { generateRefinementAction, reviewRefinementAction } from "./actions";
const subscribe = () => () => {};
const hydrated = () => true;
const server = () => false;

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
        Permintaan AI dicatat dalam batas anggaran aplikasi.
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
          ? "Tunggu hasil permintaan ini; jangan mengulang."
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
      <summary>Buat usulan baru dari asli</summary>
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
  const enhanced = useSyncExternalStore(subscribe, hydrated, server);
  const [editing, setEditing] = useState(state.finalContent !== undefined);
  const [draft, setDraft] = useState(state.finalContent ?? aiContent);
  return (
    <form
      id={`review-${refinementId}`}
      action={action}
      className="refine-review-form"
      aria-busy={pending}
      onReset={(event) => event.preventDefault()}
    >
      <fieldset disabled={pending}>
        <legend className="sr-only">Tinjau usulan AI</legend>
        <input type="hidden" name="company_id" value={companyId} />
        <input type="hidden" name="thought_id" value={thoughtId} />
        <input type="hidden" name="refinement_id" value={refinementId} />
        <details
          className="refine-edit"
          open={editing}
          onToggle={(event) => setEditing(event.currentTarget.open)}
        >
          <summary>Sunting</summary>
          <label htmlFor={`final-${refinementId}`}>Suntingan usulan</label>
          <textarea
            id={`final-${refinementId}`}
            name="user_final_content"
            value={editing ? draft : aiContent}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={3000}
            required
            rows={5}
          />
          <p className="auth-help">
            Suntingan belum diterima. Periksa makna sebelum menyimpan keputusan.
          </p>
          {enhanced && (
            <button
              type="button"
              className="quiet-button"
              onClick={() => setEditing(false)}
            >
              Batal sunting
            </button>
          )}
        </details>
        {!editing && draft !== aiContent && (
          <p className="auth-help">Draf suntingan tersedia di Sunting.</p>
        )}
        <div className="company-form-actions">
          <button className="primary-button" name="status" value="ACCEPTED">
            {pending
              ? "Sedang menyimpan…"
              : editing
                ? "Terima suntingan"
                : "Terima"}
          </button>
          <button
            className="quiet-button"
            name="status"
            value="REJECTED"
            formNoValidate
          >
            Tolak
          </button>
        </div>
      </fieldset>
      <p className="form-feedback" role="status" aria-live="polite">
        {state.error}
      </p>
    </form>
  );
}
