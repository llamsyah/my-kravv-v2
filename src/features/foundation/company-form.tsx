"use client";
import { useActionState, useId } from "react";
import { saveFoundationCompanyAction } from "./actions";

export function FoundationCompanyForm({
  company,
}: {
  company?: { id: string; name: string };
}) {
  const id = useId();
  const [state, action, pending] = useActionState(saveFoundationCompanyAction, {
    error: null,
  });
  return (
    <form
      id={company ? `rename-${company.id}` : "foundation-create"}
      action={action}
    >
      {company && <input type="hidden" name="company_id" value={company.id} />}
      <label htmlFor={id}>
        {company ? "Nama catatan uji" : "Perusahaan uji sintetis"}
      </label>
      <input
        id={id}
        name="name"
        defaultValue={company?.name}
        maxLength={200}
        required
      />
      <button type="submit" disabled={pending}>
        {pending ? "Menyimpan…" : "Simpan"}
      </button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}
