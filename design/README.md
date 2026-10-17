# Referensi visual V2 yang dipertahankan

Kurasi checkpoint **17 Oktober 2026**. Folder ini menyimpan sumber desain dan bukti visual terpilih; bukan tempat keluaran QA rutin. V2 berhenti di Milestone 5.5 Phase 4B, yang masih menunggu persetujuan visual akhir. Lihat [checkpoint V2](../CHECKPOINT-V2.md).

## Referensi asli dan sumber desain

- [Referensi visual asli](../public/visual-references/) beserta [panduan referensi](../public/visual-references/visual-references-README.md): dipertahankan utuh, bukan screenshot QA aplikasi.
- [Prototipe Milestone 5.5](milestone-5.5/index.html) dan [petunjuknya](milestone-5.5/README.md): HTML/CSS, generator, viewer, SVG, font/lisensi dan 23 render desain desktop/mobile tetap utuh. Render tersebut merupakan paket referensi desain yang digunakan saat review, bukan hasil QA aplikasi.
- [Blueprint UX](../docs/15-milestone-5.5-ux-blueprint.md): keputusan produk, navigasi, desain dan batas scope tetap menjadi acuan. Screenshot ilustratif tidak membuktikan fitur telah diimplementasikan.

## Bukti aplikasi terpilih — 13 gambar

Semua memakai data fiktif. Lebar yang disebut adalah CSS viewport pada pengambilan sebelumnya; bukan bukti native zoom atau pengujian telepon fisik. Gambar mencatat keadaan historis dan tidak menggantikan kode maupun pengujian.

| Konteks                          | Desktop                                                                    | Mobile                                                            |
| -------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Company Index, Phase 2           | [1440](milestone-5.5-phase-2/companies-1440.jpg)                           | [390](milestone-5.5-phase-2/companies-390.jpg)                    |
| Home, Phase 4A                   | [1440](milestone-5.5-phase-4a/1440-home.jpg)                               | [390](milestone-5.5-phase-4a/390-home.jpg)                        |
| Overview, final polish Phase 4A  | [1440](milestone-5.5-phase-4a-final-polish/after-overview-1440.png)        | [390](milestone-5.5-phase-4a-final-polish/after-overview-390.png) |
| Pemikiran, final polish Phase 4A | [1440](milestone-5.5-phase-4a-final-polish/after-thoughts-1440.png)        | [390](milestone-5.5-phase-4a-final-polish/after-thoughts-390.png) |
| Refine comparison, Phase 4B      | [1440, viewport](milestone-5.5-phase-4b/after-suggested-1440-viewport.png) | [390, full page](milestone-5.5-phase-4b/after-suggested-390.png)  |

- [Versi SUPERSEDED tetap dipilih untuk bacaan](milestone-5.5-phase-4b/after-selected-superseded-1440.png): membedakan provenance review dari pilihan display.
- [Jejak versi terbuka](milestone-5.5-phase-4b/version-trail-expanded-desktop.png): referensi disclosure dan hierarki riwayat.
- [Suntingan lokal dipertahankan](milestone-5.5-phase-4b/editing-retained-mobile.png): referensi ruang edit mobile; bukan jaminan penyimpanan draft Refine lintas reload.

Full-page export dapat menggambar navigasi tetap pada pita viewport awal. Jangan menganggap posisi itu sebagai bukti kontrol tertutup ketika halaman digulir. Referensi Company Index lebih lama daripada implementasi akhir; gunakan untuk komposisi, bukan inventaris perilaku terbaru.

## Keluaran QA yang dihentikan

Matriks screenshot sebelum/sesudah, variasi viewport berulang, capture interaksi sementara, log browser, JSON pengukuran/manifest capture, snapshot hash QA dan daftar status sementara telah dihapus dari working tree, termasuk keluaran yang sebelumnya terlacak Git. Ringkasan hasil, batasan dan catatan implementasi di `docs/12`–`docs/22` tetap disimpan. Angka jumlah capture di laporan lama menyatakan pengujian historis, bukan jumlah gambar yang masih tersedia sekarang. File yang pernah di-commit tetap dapat ada dalam riwayat Git; tidak dilakukan rewrite history.

Catatan tahap di subfolder tetap menunjuk laporan implementasi dan bukti yang sengaja dipilih. [Manifest pembersihan](../docs/checkpoints/2026-10-17-v2-cleanup.json) mencatat jumlah/ukuran yang dihapus, inventaris gambar aplikasi terpilih dan pemeriksaan preservasi. Manifest checkpoint sebelum pembersihan adalah catatan historis, bukan tautan download atau backup.

## Aturan keluaran QA berikutnya

Simpan hasil baru di `.qa/<nama-pekerjaan>/`, yang diabaikan Git. Kedua runner QA aktif kini menulis ke `.qa/milestone-5.5-phase-4a-final-polish/` dan `.qa/milestone-5.5-phase-4b/`. Tempat lama juga memiliki aturan ignore spesifik agar penggunaan instruksi historis tidak menambah screenshot/log baru ke Git. `test-results/`, `playwright-report/` dan `blob-report/` diabaikan sebagai keluaran alat pengujian.

Untuk menyimpan bukti jangka panjang, pilih sedikit gambar yang menjelaskan keputusan penting, pindahkan secara sengaja ke lokasi referensi, dokumentasikan data fiktif/viewport/batasannya, lalu tinjau whitelist ignore jika memakai folder milestone lama. Jangan menambah aturan ignore menyeluruh untuk kode, JSON produk, migrasi, pengujian, aset referensi atau dokumentasi.
