import { requireAuthenticatedSession } from "@/server/auth/session";
import { ensureUserSettings } from "@/server/db/user-settings";
import { listFoundationCompanies } from "@/server/foundation/service";
import { FoundationCompanyForm } from "@/features/foundation/company-form";
import { LogoutForm } from "@/features/auth/logout-form";

export const dynamic = "force-dynamic";

export default async function FoundationPage() {
  const { supabase, user } = await requireAuthenticatedSession();
  let companies: Awaited<ReturnType<typeof listFoundationCompanies>> = [];
  let failed = false;
  try {
    await ensureUserSettings(supabase, user.id);
    companies = await listFoundationCompanies(supabase);
  } catch {
    failed = true;
  }
  return (
    <main className="reading-surface">
      <h1>Fondasi Pengembangan V3</h1>
      <p>
        Slice 0: hanya pengujian akses akun dan data sintetis. Ini bukan layar
        produk final.
      </p>
      <LogoutForm />
      {failed ? (
        <p role="alert">Data uji belum dapat dimuat. Coba lagi.</p>
      ) : (
        <>
          <FoundationCompanyForm />
          <h2>Data uji akun ini</h2>
          {companies.length === 0 && <p>Belum ada data uji.</p>}
          {companies.map((company) => (
            <section key={company.id}>
              <h3>{company.name}</h3>
              <FoundationCompanyForm company={company} />
            </section>
          ))}
        </>
      )}
      <p>Penghapusan, arsip, penulisan riset dan AI belum tersedia.</p>
    </main>
  );
}
