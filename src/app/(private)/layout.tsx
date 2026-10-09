import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { PrivateNavigation } from "@/features/companies/private-navigation";
import { requireAuthenticatedSession } from "@/server/auth/session";
import { DisclosureMenu } from "@/components/disclosure-menu";
import { LogoutForm } from "@/features/auth/logout-form";
import { Icon } from "@/components/ui/icon";

export const dynamic = "force-dynamic";

export default async function PrivateLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAuthenticatedSession();
  return (
    <AppShell
      privateNavigation={<PrivateNavigation />}
      accountMenu={
        <DisclosureMenu
          label={
            <>
              <Icon name="user" />
              Akun
            </>
          }
        >
          <LogoutForm />
        </DisclosureMenu>
      }
    >
      {children}
    </AppShell>
  );
}
