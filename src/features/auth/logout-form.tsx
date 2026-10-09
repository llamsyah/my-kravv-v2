"use client";

import { useActionState } from "react";
import { logout } from "./actions";
import { initialAuthState } from "./schema";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

export function LogoutForm() {
  const [state, action, pending] = useActionState(logout, initialAuthState);
  return (
    <form action={action} className="logout-form" aria-busy={pending}>
      <Button variant="tertiary" disabled={pending} type="submit">
        <Icon name="logout" />
        {pending ? "Sedang keluar…" : "Keluar"}
      </Button>
      {state.error && (
        <p role="alert" className="form-feedback">
          {state.error}
        </p>
      )}
    </form>
  );
}
