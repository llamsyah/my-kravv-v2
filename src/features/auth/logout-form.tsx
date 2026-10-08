"use client";

import { useActionState } from "react";
import { logout } from "./actions";
import { initialAuthState } from "./schema";

export function LogoutForm() {
  const [state, action, pending] = useActionState(logout, initialAuthState);
  return (
    <form action={action} className="logout-form" aria-busy={pending}>
      <button className="quiet-button" disabled={pending} type="submit">
        <svg
          className="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M10 4H4v16h6m5-13 5 5-5 5m-7-5h12" />
        </svg>
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
