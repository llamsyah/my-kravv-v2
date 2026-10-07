"use client";
export default function CompaniesError({ reset }: { reset: () => void }) {
  return (
    <section className="company-intro" role="alert">
      <p className="eyebrow">RUANG PRIBADI</p>
      <h1>Belum bisa membuka perusahaan.</h1>
      <p className="intro-copy">
        Coba lagi sebentar. Isian perusahaan yang sudah tersimpan tetap berada
        di ruangmu.
      </p>
      <button className="primary-button retry-button" onClick={reset}>
        Coba lagi
      </button>
    </section>
  );
}
