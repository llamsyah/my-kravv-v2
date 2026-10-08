import Link from "next/link";
import { getCompanyContext } from "@/server/companies/context";
import { getCompanies } from "@/server/db/companies";
import { getRecentThoughts } from "@/server/db/thoughts";
import { ThoughtComposer } from "@/features/thoughts/thought-composer";
import { ThoughtTime } from "@/features/thoughts/thought-history";

export default async function HomePage() {
  const { supabase, user } = await getCompanyContext();
  const [companies, recent] = await Promise.all([
    getCompanies(supabase, user.id),
    getRecentThoughts(supabase, user.id),
  ]);
  return (
    <>
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">RUANG UNTUK BERPIKIR</p>
        <h1 id="page-title">
          Pemikiran yang jernih
          <br />
          butuh ruang.
        </h1>
        <p className="intro-copy">
          Tempat untuk menelusuri alasan, memberi ruang pada keraguan, dan
          memahami bagaimana pandanganmu berubah.
        </p>
      </section>
      <section className="thought-capture" aria-labelledby="workspace-title">
        <p className="section-label">CATAT PEMIKIRAN</p>
        <h2 id="workspace-title">Satu pemikiran cukup untuk memulai.</h2>
        {companies.length ? (
          <ThoughtComposer
            companies={companies.map(({ id, name }) => ({ id, name }))}
          />
        ) : (
          <p className="company-note">
            Buat perusahaan terlebih dahulu, lalu tulis apa pun yang sedang kamu
            pikirkan.{" "}
            <Link className="text-link" href="/companies/new">
              Tambah perusahaan →
            </Link>
          </p>
        )}
      </section>
      <section
        className="thought-history"
        aria-labelledby="recent-thinking-title"
      >
        <p className="section-label">PEMIKIRAN TERBARU</p>
        <h2 id="recent-thinking-title">Kembali ke pemikiranmu.</h2>
        {!recent.length && (
          <p className="company-note">
            Pemikiran yang kamu simpan akan muncul di sini.
          </p>
        )}
        <ol className="thought-list">
          {recent.map((thought) => (
            <li className="thought-entry" key={thought.id}>
              <div className="thought-meta">
                <span>ASLI · {thought.companyName}</span>
                <ThoughtTime value={thought.created_at} />
              </div>
              <p className="company-note">
                {thought.raw_content.slice(0, 180)}
                {thought.raw_content.length > 180 ? "…" : ""}
              </p>
              <Link
                className="text-link"
                href={`/companies/${thought.company_id}?focus=${thought.id}#thought-${thought.id}`}
              >
                Buka ruang perusahaan →
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
