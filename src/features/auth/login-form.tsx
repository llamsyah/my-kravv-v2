"use client";

import { useActionState } from "react";
import { login } from "./actions";
import { initialAuthState } from "./schema";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initialAuthState);
  return (
    <form action={action} className="auth-form" aria-busy={pending}>
      <fieldset disabled={pending}>
        <legend className="sr-only">Masuk ke MY KRAVV</legend>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          maxLength={254}
          required
          aria-describedby={state.error ? "login-error" : undefined}
        />
        <label htmlFor="password">Kata sandi</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          maxLength={4096}
          required
          aria-describedby={state.error ? "login-error" : undefined}
        />
        <p
          id="login-error"
          className="form-feedback"
          role="status"
          aria-live="polite"
        >
          {state.error}
        </p>
        <button className="primary-button" type="submit">
          {pending ? "Sedang masuk…" : "Masuk ke ruang pribadi"}
        </button>
      </fieldset>
      <p className="auth-help">Gunakan akun MY KRAVV yang sudah terdaftar.</p>
    </form>
  );
}
