import Link from "next/link";
import { AppShell } from "@/components/app-shell";

export default function NotFound() {
  return (
    <AppShell>
      <section className="intro">
        <p className="eyebrow">HALAMAN TIDAK DITEMUKAN</p>
        <h1>
          Sepertinya kita
          <br />
          belum sampai di sini.
        </h1>
        <p className="intro-copy">Halaman yang kamu cari belum tersedia.</p>
        <Link className="text-link" href="/">
          Kembali ke beranda <span aria-hidden="true">→</span>
        </Link>
      </section>
    </AppShell>
  );
}
