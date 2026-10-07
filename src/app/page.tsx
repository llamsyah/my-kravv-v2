export default function HomePage() {
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
      <section className="workspace-note" aria-labelledby="workspace-title">
        <div className="section-label">
          <span className="quiet-node" aria-hidden="true" />
          <p>AWAL SEBUAH RUANG</p>
        </div>
        <div className="workspace-copy">
          <h2 id="workspace-title">Ruang ini sedang disiapkan.</h2>
          <p>
            Ini adalah tampilan awal MY KRAVV. Tempat untuk menyimpan dan
            meninjau pemikiranmu akan hadir secara bertahap.
          </p>
          <p className="availability">Pencatatan belum tersedia.</p>
        </div>
      </section>
    </>
  );
}
