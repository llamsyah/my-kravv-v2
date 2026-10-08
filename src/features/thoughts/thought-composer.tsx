"use client";
import { useActionState, useState, useSyncExternalStore } from "react";
import {
  initialThoughtFormState,
  rawContentLimit,
} from "@/domain/thought/thought";
import { createThoughtAction } from "./actions";
import { DraftStore, draftKey } from "./drafts";

export function ThoughtComposer({
  userId,
  initialOperationId,
  companyId,
  companies,
  archived = false,
}: {
  userId: string;
  initialOperationId: string;
  companyId?: string;
  companies?: { id: string; name: string }[];
  archived?: boolean;
}) {
  const [selection] = useState(
    () =>
      new DraftStore(
        draftKey(userId, "selection", ""),
        initialOperationId,
        companies?.[0]?.id ?? "",
      ),
  );
  const selected = useSyncExternalStore(
    selection.subscribe,
    selection.getSnapshot,
    selection.getServerSnapshot,
  );
  const selectedCompany =
    companyId ??
    (companies?.some((c) => c.id === selected.text)
      ? selected.text
      : (companies?.[0]?.id ?? ""));
  return (
    <div className="composer-surface">
      {!companyId && (
        <div className="capture-company-select company-field">
          <label htmlFor="thought-company">Perusahaan</label>
          <select
            id="thought-company"
            form="thought-form"
            value={selectedCompany}
            onChange={(event) => {
              selection.edit(event.target.value);
              selection.flush();
            }}
          >
            {companies?.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <DraftEditor
        key={`${userId}:${selectedCompany}`}
        userId={userId}
        companyId={selectedCompany}
        initialOperationId={initialOperationId}
        context={companyId ? "company" : "home"}
        archived={archived}
      />
    </div>
  );
}
function DraftEditor({
  userId,
  companyId,
  initialOperationId,
  context,
  archived,
}: {
  userId: string;
  companyId: string;
  initialOperationId: string;
  context: "home" | "company";
  archived: boolean;
}) {
  const [state, action, pending] = useActionState(
    createThoughtAction,
    initialThoughtFormState,
    context === "company" ? `/companies/${companyId}` : "/",
  );
  const [store] = useState(
    () =>
      new DraftStore(
        draftKey(userId, context, companyId),
        initialOperationId,
        state.raw_content ?? "",
      ),
  );
  const draft = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
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
        {draft.text && (
          <div className="company-field">
            <label htmlFor="retained-thought">
              Draf belum tersimpan — salin untuk menyimpannya di tempat lain.
            </label>
            <textarea
              id="retained-thought"
              rows={5}
              readOnly
              value={draft.text}
            />
            <button
              className="quiet-button"
              type="button"
              onClick={() => store.discard()}
            >
              Buang draf
            </button>
          </div>
        )}
      </div>
    );
  return (
    <form
      id="thought-form"
      className="thought-composer company-form"
      action={action}
      onSubmit={() => store.markAttempted()}
      aria-busy={pending}
    >
      <fieldset disabled={pending}>
        <legend className="sr-only">Simpan pemikiran asli</legend>
        <input type="hidden" name="company_id" value={companyId} />
        <input
          type="hidden"
          name="capture_operation_id"
          value={draft.operationId}
        />
        <div className="company-field">
          <label htmlFor="raw-content">Apa yang sedang kamu pikirkan?</label>
          <textarea
            id="raw-content"
            name="raw_content"
            rows={3}
            required
            maxLength={rawContentLimit}
            placeholder="Tulis pengamatan, pertanyaan, atau hal yang belum kamu mengerti…"
            value={draft.text}
            onChange={(event) => store.edit(event.target.value)}
            onBlur={store.flush}
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
          <p id="thought-help" className="auth-help">
            Pemikiran asli · Disimpan persis seperti ditulis
          </p>
          <button
            className="quiet-button"
            type="button"
            onClick={() => store.discard()}
            disabled={!draft.text}
          >
            Buang draf
          </button>
          <button className="primary-button" type="submit">
            {pending ? "Menyimpan…" : "Simpan pemikiran"}{" "}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </fieldset>
      <p className="form-feedback" role="status" aria-live="polite">
        {state.error}
      </p>
      {draft.storageError && (
        <p className="form-feedback" role="status">
          Penyimpanan draf browser tidak tersedia atau penuh. Salin teks sebelum
          memuat ulang.
        </p>
      )}
      <details className="draft-privacy">
        <summary>Tentang draf di browser ini</summary>
        <p>
          Draf tersimpan lokal untuk akun dan perusahaan ini, tanpa enkripsi.
          Orang yang memakai profil browser yang sama dapat mengaksesnya. Draf
          dibersihkan setelah simpan terkonfirmasi, saat dibuang, atau setelah
          keluar ke halaman masuk. Hindari menyimpan draf sensitif di browser
          bersama.
        </p>
      </details>
    </form>
  );
}
