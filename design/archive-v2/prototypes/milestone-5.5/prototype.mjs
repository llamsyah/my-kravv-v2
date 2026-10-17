// Generates static design artifacts only. No application imports, runtime scripts,
// remote requests, persistence, provider SDKs, or production routes.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const icons = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  building:
    '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 21v-4h6v4M8 7h1m6 0h1M8 11h1m6 0h1"/>',
  overview:
    '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="12" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 19h7"/>',
  notebook:
    '<path d="M8 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM3 6h5M3 12h5M3 18h5M11 8h6m-6 4h6"/>',
  sparkle:
    '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4m-2-2h4"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="m16 3 5 5-13 13H3v-5zM13 6l5 5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  user: '<circle cx="12" cy="8" r="3"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  source:
    '<path d="M14 2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9zM14 2v7h7M7 13h10m-10 4h7"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  shield:
    '<path d="m12 3 8 3v6c0 4-8 9-8 9s-8-5-8-9V6z"/><path d="m8 12 3 3 5-6"/>',
  archive:
    '<rect x="3" y="3" width="18" height="4" rx="1"/><path d="M5 7v14h14V7M10 11h4"/>',
};
const ico = (name) =>
  `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
const btn = (label, name = "", cls = "secondary", href) =>
  href
    ? `<a class="button ${cls}" href="${href}">${name ? ico(name) : ""}${label}</a>`
    : `<button type="button" class="button ${cls}" title="Kontrol visual saja; tidak menyimpan data">${name ? ico(name) : ""}${label}</button>`;
const badge = (label, cls = "", name = "") =>
  `<span class="badge ${cls}">${name ? ico(name) : ""}${label}</span>`;
const sectionHead = (title, extra = "") =>
  `<div class="section-head"><h2>${title}</h2>${extra}</div>`;
const raw =
  "ekspansi Rimba Nusa menarik, tapi kayaknya terlalu cepat. aku belum cek apakah arus kasnya cukup buat dukung rencana ini. mau baca laporan keuangannya dulu sebelum menarik kesimpulan.";
const proposal =
  "Menurutku ekspansi Rimba Nusa menarik, tapi kayaknya terlalu cepat. Aku belum cek apakah arus kasnya cukup untuk mendukung rencana ini. Aku mau baca laporan keuangannya dulu sebelum menarik kesimpulan.";
const accepted =
  "Aku tertarik dengan jaringan distribusi Rimba Nusa. Tapi aku masih perlu cari tahu seberapa bergantung penjualannya pada beberapa mitra besar sebelum menilai ketahanannya.";
const second =
  "Aku belum punya gambaran jelas soal biaya bahan baku. Catatan soal pemasoknya perlu kubaca lagi, terutama bagian kontrak dan perubahan harga.";
const companies = [
  {
    initials: "RN",
    name: "Rimba Nusa Pangan",
    meta: "RNP · Pangan & minuman",
    state: "Menjelajah",
    note: "Mencari tahu daya tahan distribusi dan rencana ekspansinya.",
    tint: "green",
    date: "8 Okt 2026",
  },
  {
    initials: "AL",
    name: "Arunika Logistik",
    meta: "Transportasi & logistik",
    state: "Menjelajah",
    note: "Ingin memahami jaringan pelanggan dan kebutuhan modalnya.",
    tint: "blue",
    date: "7 Okt 2026",
  },
  {
    initials: "SK",
    name: "Sagara Karya Energi",
    meta: "SKE · Energi",
    state: "Menjelajah",
    note: "Belum cukup membaca. Mulai dari model bisnisnya dulu.",
    tint: "ochre",
    date: "5 Okt 2026",
  },
];
const brand = `<a class="brand" href="home.html"><span class="brand-mark">K<span></span></span><span>MY KRAVV<small>ruang untuk berpikir</small></span></a>`;
function globalNav(page) {
  return `<header class="global-header"><div class="global-inner">${brand}<nav class="global-nav" aria-label="Navigasi utama"><a class="${page === "home" ? "selected" : ""}" href="home.html" ${page === "home" ? 'aria-current="page"' : ""}>${ico("home")}Beranda</a><a class="${page !== "home" ? "selected" : ""}" href="companies.html" ${page !== "home" ? 'aria-current="page"' : ""}>${ico("building")}Perusahaan</a></nav><div class="account"><span class="edition">Catatan pribadi</span><button class="account-button" type="button" aria-label="Menu akun (prototipe statis)">${ico("user")}${ico("down")}</button></div></div></header>`;
}
function mobileNav(page) {
  return `<nav class="mobile-global" aria-label="Navigasi utama seluler"><a href="home.html" class="${page === "home" ? "selected" : ""}">${ico("home")}Beranda</a><a href="companies.html" class="${page !== "home" ? "selected" : ""}">${ico("building")}Perusahaan</a></nav>`;
}
function companyHeader(section) {
  return `<div class="company-header"><div class="breadcrumb"><a href="companies.html">Perusahaan</a>${ico("chevron")}<span>Rimba Nusa Pangan</span><button class="manage" type="button">Kelola ${ico("down")}</button></div><div class="company-identity"><span class="monogram large green">RN</span><div><h1>Rimba Nusa Pangan</h1><div class="identity-meta">RNP <span>·</span> Pangan & minuman</div></div>${badge("Menjelajah", "state")}</div><nav class="local-nav" aria-label="Bagian perusahaan">${[
    ["overview", "Overview", "overview.html"],
    ["notebook", "Pemikiran", "thoughts.html"],
    ["sparkle", "Refine", "refine.html"],
  ]
    .map(
      ([i, t, h]) =>
        `<a href="${h}" class="${section === h ? "selected" : ""}" ${section === h ? 'aria-current="page"' : ""}>${ico(i)}${t}</a>`,
    )
    .join("")}</nav></div>`;
}
function companyRow(c, compact = false) {
  return `<article class="company-row ${compact ? "compact" : ""}"><span class="monogram ${c.tint}">${c.initials}</span><div class="company-row-identity"><a href="overview.html" class="company-name">${c.name}</a><span class="meta">${c.meta}</span></div>${badge(c.state, "state")}<p class="company-note">${c.note}</p><div class="row-date"><span class="meta">Identitas diperbarui</span><span>${c.date}</span></div><a class="open-company" href="overview.html">Buka ${ico("arrow")}</a><button class="icon-button more-company" type="button" aria-label="Pilihan ${c.name}">${ico("more")}</button></article>`;
}
function composer(home = false) {
  return `<section class="composer"><div class="composer-heading"><span class="tool-icon">${ico("edit")}</span><div><h2>Catat pemikiran</h2><p>Belum perlu punya kesimpulan.</p></div>${home ? `<label class="company-select"><span class="sr-only">Perusahaan</span><select aria-label="Perusahaan"><option>Rimba Nusa Pangan</option><option>Arunika Logistik</option></select></label>` : badge("Draf di perangkat ini", "quiet", "edit")}</div><label class="sr-only" for="draft">Pemikiran baru</label><textarea id="draft" readonly>${home ? "aku ingin memahami rencana ekspansi Rimba Nusa sebelum menarik kesimpulan." : "aku perlu cek laporan keuangannya dulu, terutama arus kas dari operasional. belum mau buru-buru menyimpulkan."}</textarea><div class="composer-bottom"><span class="draft-caption">${ico("shield")}Draf belum disimpan sebagai pemikiran</span>${btn("Simpan pemikiran", "plus", "primary")}</div></section>`;
}
function home() {
  return `<main class="shell home-shell"><section class="home-hero"><div class="hero-copy"><p class="eyebrow">RUANG BERPIKIRMU</p><h1>Lanjutkan dari pemikiranmu.</h1><p>Simpan alasanmu. Beri ruang untuk memahami.</p></div><img class="hero-landscape" src="assets/quiet-landscape.svg" alt=""/><span class="hero-date">Kamis, 8 Oktober 2026</span></section><section class="continue-strip"><span class="continue-icon">${ico("clock")}</span><div><span class="eyebrow">LANJUTKAN MEMBACA</span><h2>Rimba Nusa Pangan</h2><p>Aku tertarik dengan jaringan distribusinya, tapi masih perlu cari tahu…</p></div>${badge("Versi pilihan", "accepted", "check")}${btn("Lanjutkan", "arrow", "secondary", "overview.html")}</section><div class="home-grid">${composer(true)}<aside class="recent-desk">${sectionHead("Pemikiran terbaru", badge("3", "quiet"))}<article class="recent-item"><div class="recent-meta"><span class="small-monogram green">RN</span><a href="thoughts.html">Rimba Nusa Pangan</a><span>Hari ini</span></div>${badge("Kamu sunting & terima", "accepted", "check")}<p>${accepted}</p><a href="thoughts.html" class="text-link">Baca pemikiran ${ico("arrow")}</a></article><article class="recent-item"><div class="recent-meta"><span class="small-monogram blue">AL</span><a href="thoughts.html">Arunika Logistik</a><span>Kemarin</span></div>${badge("Asli", "quiet", "source")}<p>Bisnisnya menarik, tapi aku belum tahu seberapa terkonsentrasi pelanggannya. Ini perlu kubaca lebih dulu.</p></article><article class="recent-item"><div class="recent-meta"><span class="small-monogram green">RN</span><a href="thoughts.html">Rimba Nusa Pangan</a><span>6 Okt</span></div>${badge("Asli", "quiet", "source")}<p>${second}</p></article></aside><section class="research-spaces">${sectionHead("Ruang penelitian", `<a class="text-link" href="companies.html">Semua perusahaan ${ico("arrow")}</a>`)}${companies.map((c) => companyRow(c, true)).join("")}</section></div></main>`;
}
function library() {
  return `<main class="shell library-shell"><div class="page-heading"><div><p class="eyebrow">RUANG PENELITIAN</p><h1>Perusahaan</h1><p>Satu ruang untuk setiap perusahaan yang ingin kamu pahami.</p></div>${btn("Tambah perusahaan", "plus", "primary")}</div><div class="library-toolbar"><label class="search"><span class="sr-only">Cari perusahaan</span>${ico("search")}<input placeholder="Cari nama, ticker, atau sektor" readonly/></label><div class="segmented"><button class="active" type="button">Aktif <span>3</span></button><button type="button">Diarsipkan</button></div></div><div class="library-heading"><span>3 perusahaan aktif</span><span class="meta">Konteks dan catatan dari kamu</span></div><section class="company-list">${companies.map((c) => companyRow(c)).join("")}</section><div class="library-footnote">${ico("notebook")}Belum perlu kesimpulan. Mulai dari rasa ingin tahu.</div><section class="library-empty-sample"><span class="tool-icon">${ico("plus")}</span><div><h2>Ada perusahaan lain yang ingin dipahami?</h2><p>Buat ruang baru dan mulai dengan pemikiran pertama.</p></div>${btn("Tambah ruang", "plus", "secondary")}</section></main>`;
}
function overview() {
  return `<main class="shell company-shell">${companyHeader("overview.html")}<div class="overview-grid"><section><div class="section-head"><div><p class="eyebrow">PEMIKIRAN TERAKHIR</p><h2 class="section-title">Titik lanjutmu di ruang ini</h2></div><span class="meta">8 Okt · 09.40</span></div><article class="chosen-reading"><div class="reading-status">${badge("Versi pilihan", "accepted", "check")}<span class="meta">Kamu sunting & terima</span></div><p>${accepted}</p><div class="reading-actions">${btn("Baca pemikiran", "arrow", "secondary", "thoughts.html")}<a class="text-link" href="thoughts.html">Lihat asli ${ico("source")}</a></div></article><div class="overview-entrances"><a href="thoughts.html"><span class="tool-icon">${ico("edit")}</span><div><strong>Tambahkan pemikiran</strong><span>Tangkap hal yang sedang kamu pikirkan.</span></div>${ico("arrow")}</a><a href="refine.html"><span class="tool-icon">${ico("sparkle")}</span><div><strong>Tinjau usulan Refine</strong><span>Ada satu usulan yang belum kamu terima.</span></div>${badge("1", "suggested")}${ico("arrow")}</a></div><section class="earlier-thinking">${sectionHead("Sebelumnya di ruang ini", `<a class="text-link" href="thoughts.html">Semua ${ico("arrow")}</a>`)}<div class="small-reading-row"><span class="meta">7 Okt</span><p>${second}</p>${ico("chevron")}</div><div class="small-reading-row"><span class="meta">5 Okt</span><p>Ekspansinya menarik. Aku belum cek apakah arus kasnya cukup mendukung rencana ini.</p>${ico("chevron")}</div></section></section><aside class="context-panel"><p class="eyebrow">KONTEKS DARI KAMU</p><h2>Kenapa ruang ini kubuat</h2><p>Aku ingin memahami daya tahan distribusi Rimba Nusa dan bagaimana mereka mendanai ekspansi.</p><div class="context-facts"><div>${ico("notebook")}<strong>4 pemikiran</strong><span>tersimpan</span></div><div>${ico("check")}<strong>1 versi diterima</strong><span>dari pemikiranmu</span></div></div><section class="activity">${sectionHead("Aktivitas terbaru")}<div class="activity-event">${ico("check")}<div><strong>Versi pilihan diterima</strong><span>Hari ini · 09.40</span></div></div><div class="activity-event">${ico("edit")}<div><strong>Pemikiran ditambahkan</strong><span>Hari ini · 09.12</span></div></div><div class="activity-event">${ico("edit")}<div><strong>Pemikiran ditambahkan</strong><span>7 Okt · 16.20</span></div></div></section><p class="context-note">Catatanmu tentang perusahaan ini, bukan ringkasan atau penilaian AI.</p></aside></div></main>`;
}
function thoughtEntry(text, status, date, kind = "", extra = "") {
  return `<article class="thought-entry"><div class="thought-entry-meta">${badge(status, kind, kind === "accepted" ? "check" : "source")}<span>${date}</span><button class="icon-button" type="button" aria-label="Pilihan pemikiran">${ico("more")}</button></div><p>${text}</p>${extra}<div class="thought-entry-actions"><a class="text-link" href="refine.html">${ico("sparkle")}Tinjau di Refine</a><details><summary>${ico("source")}Lihat asli ${ico("down")}</summary><p class="source-text">${kind === "accepted" ? "aku tertarik sama distribusi Rimba Nusa, tapi masih perlu cari tahu apakah penjualannya bergantung sama beberapa mitra besar. belum bisa nilai ketahanannya." : text}</p></details></div></article>`;
}
function thoughts() {
  return `<main class="shell company-shell">${companyHeader("thoughts.html")}<div class="thoughts-grid"><section>${composer()}<section class="reading-stream">${sectionHead("Pemikiran tersimpan", `<span class="meta">Terbaru terlebih dahulu</span>`)}${thoughtEntry(accepted, "Versi pilihan · Kamu sunting", "8 Okt 2026 · 09.12", "accepted")}${thoughtEntry(second, "Asli", "7 Okt 2026 · 16.20")}${thoughtEntry(raw, "Asli", "5 Okt 2026 · 11.05", "", `<span class="suggestion-entrance">${ico("sparkle")}Usulan Refine belum ditinjau</span>`)}</section></section><aside class="writing-context"><span class="large-outline-icon">${ico("notebook")}</span><h2>Ruang untuk pikiran yang belum selesai.</h2><p>Pemikiran baru disimpan persis seperti yang kamu tulis.</p><div class="context-rule">${ico("source")}<div><strong>Asli tetap tersimpan</strong><span>Kamu bisa membacanya kapan saja.</span></div></div><div class="context-rule">${ico("check")}<div><strong>Versi pilihan tampil dulu</strong><span>Hanya setelah kamu menerimanya.</span></div></div><a href="refine.html" class="button secondary">${ico("sparkle")}Buka ruang Refine ${ico("arrow")}</a></aside></div></main>`;
}
function refine() {
  return `<main class="shell company-shell refine-shell">${companyHeader("refine.html")}<div class="refine-heading"><div><h2>Refine</h2><p>Tinjau kata-katanya. Pastikan maksudmu tetap sama.</p></div>${badge("1 usulan perlu ditinjau", "suggested", "sparkle")}</div><div class="review-desk"><aside class="review-queue"><div class="queue-heading"><h3>Pemikiran untuk ditinjau</h3><span class="meta">3</span></div><a href="refine.html" class="queue-item active"><span class="queue-indicator">${ico("sparkle")}</span><div>${badge("Usulan baru", "suggested")}<strong>Rencana ekspansi</strong><span>5 Okt · belum diterima</span></div>${ico("chevron")}</a><div class="queue-item"><span class="queue-indicator resolved">${ico("check")}</span><div>${badge("Diterima", "accepted")}<strong>Jaringan distribusi</strong><span>8 Okt · versi pilihan</span></div></div><div class="queue-item"><span class="queue-indicator">${ico("source")}</span><div>${badge("Belum dirapikan", "quiet")}<strong>Biaya bahan baku</strong><span>7 Okt · teks asli</span></div></div><div class="queue-note">${ico("shield")}Membuka pemikiran tidak menjalankan AI.</div></aside><section class="review-main"><div class="mobile-picker-trigger">${btn("Pilih pemikiran", "notebook", "secondary")}</div><div class="review-title"><div><p class="eyebrow">USULAN UNTUK PEMIKIRANMU</p><h2>Rencana ekspansi</h2></div>${badge("Belum diterima", "suggested", "clock")}</div><div class="review-guidance">${ico("source")}Periksa apakah alasan dan hal yang belum kamu cek tetap sama.</div><details class="mobile-original"><summary>${ico("source")}Bandingkan dengan asli ${ico("down")}</summary><p>${raw}</p></details><div class="comparison"><section class="original-panel"><div class="comparison-label">${ico("source")}ASLI <span>5 Okt · 11.05</span></div><p>${raw}</p><span class="panel-caption">Sumber asli tetap tersimpan.</span></section><section class="proposal-panel"><div class="comparison-label">${ico("sparkle")}USULAN AI ${badge("Untuk ditinjau", "suggested")}</div><p>${proposal}</p><span class="panel-caption">Belum menjadi versi pilihanmu.</span></section></div><div class="review-actions"><div>${btn("Sunting usulan", "edit", "secondary")}</div><div class="decision-actions">${btn("Tolak usulan", "close", "tertiary")}${btn("Terima versi ini", "check", "primary")}</div></div><div class="acceptance-note">${ico("shield")}Hanya versi yang kamu terima menjadi bacaan utama. Teks asli tidak berubah.</div><div class="review-history"><details><summary>${ico("clock")}Riwayat versi <span class="meta">1 usulan</span>${ico("down")}</summary><p class="meta">Usulan ini belum diputuskan. Belum ada versi diterima untuk pemikiran ini.</p></details><details><summary>${ico("source")}Asal usulan ${ico("down")}</summary><p class="meta">Contoh usulan fiktif untuk review desain. Tidak dibuat melalui layanan AI.</p></details></div><a class="text-link return-writing" href="thoughts.html">Kembali ke pemikiran ${ico("arrow")}</a></section></div></main>`;
}
function document(title, page, content) {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="dark"/><title>${title} — MY KRAVV · Prototipe visual</title><link rel="stylesheet" href="prototype.css"/></head><body>${globalNav(page)}${content}<footer class="design-footer"><a href="index.html">Prototipe visual · data fiktif</a><span>Tidak menyimpan atau menjalankan AI</span></footer>${mobileNav(page)}</body></html>`;
}
for (const [file, title, page, render] of [
  ["home", "Beranda", "home", home],
  ["companies", "Perusahaan", "companies", library],
  ["overview", "Overview", "overview", overview],
  ["thoughts", "Pemikiran", "thoughts", thoughts],
  ["refine", "Refine", "refine", refine],
]) {
  const html = document(title, page, render());
  writeFileSync(`${root}${file}.html`, html);
  // Long mobile presentation sheet uses a flow footer; default page retains
  // fixed bottom navigation. This avoids overlay duplication in full-page capture.
  writeFileSync(
    `${root}${file}-sheet.html`,
    html.replace("<body>", '<body class="full-sheet">'),
  );
}
const pages = [
  ["home", "Beranda", "Meja pribadi: lanjutkan, catat, baca."],
  [
    "companies",
    "Perusahaan",
    "Daftar ruang penelitian dengan identitas yang jelas.",
  ],
  [
    "overview",
    "Company Overview",
    "Orientasi, konteks tersimpan, dan pintu masuk kerja.",
  ],
  ["thoughts", "Pemikiran", "Menulis dan membaca versi yang kamu pilih."],
  ["refine", "Refine", "Antrean review dan perbandingan usulan."],
];
writeFileSync(
  `${root}index.html`,
  `<!doctype html><html lang="id"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>MY KRAVV — Review visual Milestone 5.5</title><link rel="stylesheet" href="prototype.css"/></head><body class="gallery-body"><main class="shell"><p class="eyebrow">MILESTONE 5.5 · DESIGN REVIEW</p><h1>Ruang berpikir, terlihat lebih jelas.</h1><p class="gallery-intro">Lima prototipe visual responsif. Seluruh perusahaan, catatan, usulan, dan aktivitas adalah fiktif. Navigasi lokal dan disclosure dapat dibuka; tombol simpan, akun, kelola, dan keputusan hanya memperlihatkan rancangan, tanpa efek atau koneksi aplikasi.</p><p class="gallery-note">Desktop 1440 × 1000 · Mobile 390 × 844 · Source Serif 4 + Inter · dark ink & mineral green</p>${pages.map(([id, title, desc], n) => `<section class="gallery-section"><div class="section-head"><div><p class="eyebrow">0${n + 1}</p><h2>${title}</h2><p class="meta">${desc}</p></div><a class="button primary" href="${id}.html">Buka prototipe ${ico("arrow")}</a></div><div class="screenshot-pair"><a href="screenshots/${id}-desktop.jpg"><img src="screenshots/${id}-desktop.jpg" alt="${title}, screenshot desktop"/></a><a href="screenshots/${id}-mobile-full.jpg"><img src="screenshots/${id}-mobile.jpg" alt="${title}, screenshot mobile; klik untuk halaman penuh"/></a></div><div class="screenshot-links"><a href="screenshots/${id}-desktop.jpg">Desktop</a><a href="screenshots/${id}-desktop-full.jpg">Desktop · lengkap</a><a href="screenshots/${id}-mobile.jpg">Mobile · layar pertama</a><a href="screenshots/${id}-mobile-full.jpg">Mobile · halaman penuh</a></div></section>`).join("")}<p class="gallery-note">Belum merupakan implementasi atau persetujuan desain. Tidak ada data pribadi, Supabase, layanan AI, atau runtime aplikasi.</p></main></body></html>`,
);

// Review boards contain thumbnails of actual browser captures; not drawn mockups.
for (const layout of ["desktop", "mobile"]) {
  writeFileSync(
    `${root}board-${layout}.html`,
    `<!doctype html><html lang="id"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>MY KRAVV — ${layout} visual review</title><link rel="stylesheet" href="prototype.css"/></head><body class="review-board ${layout}-board"><main class="shell"><p class="eyebrow">MY KRAVV · MILESTONE 5.5 · VISUAL REVIEW</p><div class="board-heading"><h1>${layout === "desktop" ? "Lima ruang, lima tujuan." : "Tetap fokus di layar kecil."}</h1><a class="button secondary" href="index.html">Buka galeri lengkap ${ico("arrow")}</a></div><p class="meta">${layout === "desktop" ? "Desktop 1440 × 1000" : "Mobile 390 × 844"} · tangkapan browser dari prototipe statis · seluruh data fiktif</p><div class="board-tiles">${pages.map(([id, title]) => `<section><h2>${title}</h2><a href="screenshots/${id}-${layout}.jpg"><img src="screenshots/${id}-${layout}.jpg" alt="${title} ${layout}"/></a></section>`).join("")}</div><p class="board-caption">Pemikiran: menulis & membaca. Refine: meninjau usulan. Belum untuk implementasi.</p></main></body></html>`,
  );
}
