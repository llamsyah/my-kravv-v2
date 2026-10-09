import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: "../styles/fonts/InterVariable.woff2",
  variable: "--font-inter",
  weight: "100 900",
  style: "normal",
  display: "swap",
  fallback: ["Segoe UI", "Arial", "sans-serif"],
});
const sourceSerif = localFont({
  src: "../styles/fonts/SourceSerif4-Regular.woff2",
  variable: "--font-source-serif",
  weight: "400",
  style: "normal",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
  adjustFontFallback: "Times New Roman",
});

export const metadata: Metadata = {
  title: "MY KRAVV — Ruang Pemikiran",
  description:
    "Ruang pribadi untuk menelusuri dan menjaga pemikiran investasi.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0b141c" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${sourceSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
