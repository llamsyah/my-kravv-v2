import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MY KRAVV — Ruang Pemikiran",
  description:
    "Ruang pribadi untuk menelusuri dan menjaga pemikiran investasi.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0b141c" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
