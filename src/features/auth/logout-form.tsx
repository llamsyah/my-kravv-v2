"use client";

import { useActionState } from "react";
import { logout } from "./actions";
import { initialAuthState } from "./schema";

export function LogoutForm() {
  const [state, action, pending] = useActionState(logout, initialAuthState);
  return (
    <form action={action} className="logout-form" aria-busy={pending}>
      <button className="quiet-button" disabled={pending} type="submit">
        {pending ? "Sedang keluar…" : "Keluar"}
      </button>
      {state.error && (
        <p role="alert" className="form-feedback">
          {state.error}
        </p>
      )}
    </form>
  );
}
