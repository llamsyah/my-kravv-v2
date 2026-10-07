"use client";

export default function WorkspaceError({ reset }: { reset: () => void }) {
  return (
    <section className="intro" role="alert">
      <p className="eyebrow">RUANG PRIBADI</p>
      <h1>
        Ruangmu belum
        <br />
        bisa dibuka.
      </h1>
      <p className="intro-copy">
        Kami belum bisa menyiapkan ruangmu sekarang. Coba lagi sebentar.
      </p>
      <button className="primary-button retry-button" onClick={reset}>
        Coba lagi
      </button>
    </section>
  );
}
