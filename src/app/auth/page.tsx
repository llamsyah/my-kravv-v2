import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { LoginForm } from "@/features/auth/login-form";
import { getVerifiedSession } from "@/server/auth/session";
import { SignedOutDraftCleanup } from "@/features/thoughts/draft-receipt";

export const dynamic = "force-dynamic";

export default async function AuthPage() {
  const { user } = await getVerifiedSession();
  if (user) redirect("/");
  return (
    <AppShell>
      <SignedOutDraftCleanup />
      <section className="auth-layout" aria-labelledby="auth-title">
        <div>
          <p className="eyebrow">RUANG PRIBADI</p>
          <h1 id="auth-title">
            Kembali ke
            <br />
            pemikiranmu.
          </h1>
          <p className="intro-copy">
            Masuk untuk melanjutkan ruang pemikiran investasi milikmu.
          </p>
        </div>
        <LoginForm />
      </section>
    </AppShell>
  );
}
