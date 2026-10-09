"use client";
import { useActionState } from "react";
import { deleteRecordAction } from "./actions";
import { Icon } from "@/components/ui/icon";

export function DeleteForm({
  companyId,
  thoughtId,
  companyName,
  hasThoughts = false,
  disclosureLabel,
}: {
  companyId: string;
  thoughtId?: string;
  companyName?: string;
  hasThoughts?: boolean;
  disclosureLabel?: string;
}) {
  const [state, action, pending] = useActionState(
    deleteRecordAction,
    { error: null },
    `/companies/${companyId}${thoughtId ? "/thoughts" : ""}`,
  );
  const kind = thoughtId ? "thought" : "company";
  return (
    <details
      className="delete-disclosure"
      open={state.error ? true : undefined}
    >
      <summary>
        {disclosureLabel && <Icon name="more" size="small" />}
        {disclosureLabel ??
          (thoughtId ? "Hapus pemikiran" : "Hapus perusahaan permanen")}
      </summary>
      <form
        id={thoughtId ? `delete-${thoughtId}` : "delete-company-form"}
        action={action}
        aria-busy={pending}
      >
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="company_id" value={companyId} />
        {thoughtId && (
          <input type="hidden" name="thought_id" value={thoughtId} />
        )}
        <p>
          Hapus permanen{" "}
          {thoughtId
            ? "pemikiran asli ini beserta riwayatnya"
            : `“${companyName}” beserta seluruh pemikiran dan riwayatnya`}
          ? Ini tidak dapat dibatalkan.
        </p>
        {!thoughtId && hasThoughts && (
          <div className="company-field">
            <label htmlFor={`delete-name-${companyId}`}>
              Ketik nama perusahaan persis: {companyName}
            </label>
            <input
              id={`delete-name-${companyId}`}
              name="company_name"
              required
              autoComplete="off"
              disabled={pending}
            />
          </div>
        )}
        <label className="archive-confirm">
          <input
            type="checkbox"
            name="confirm_delete"
            value="yes"
            required
            disabled={pending}
          />
          Saya memahami penghapusan permanen ini.
        </label>
        <button type="submit" className="danger-button" disabled={pending}>
          {pending ? "Menghapus…" : "Hapus permanen"}
        </button>
        <p className="form-feedback" role="status">
          {state.error}
        </p>
      </form>
    </details>
  );
}
