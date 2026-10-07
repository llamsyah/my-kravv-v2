import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { PrivateNavigation } from "@/features/companies/private-navigation";
import { requireAuthenticatedSession } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function PrivateLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAuthenticatedSession();
  return (
    <AppShell privateNavigation={<PrivateNavigation />}>{children}</AppShell>
  );
}
