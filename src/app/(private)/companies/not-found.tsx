import Link from "next/link";
export default function CompanyNotFound() {
  return (
    <section className="company-intro">
      <p className="eyebrow">RUANG PRIBADI</p>
      <h1>Perusahaan tidak tersedia.</h1>
      <p className="intro-copy">
        Kembali ke arsip perusahaanmu untuk melanjutkan.
      </p>
      <Link className="text-link" href="/companies">
        Kembali ke perusahaan →
      </Link>
    </section>
  );
}
