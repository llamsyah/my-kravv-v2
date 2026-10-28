/** Presentation guidance from references 04/05. It never becomes authored text implicitly. */
export const writingAreas = [
  {
    title: "Identitas & model bisnis",
    description: "Memahami bagaimana perusahaan menghasilkan uang.",
    questions: [
      "Apa lini bisnis utama dan bagaimana cara menghasilkan pendapatan?",
      "Bagaimana struktur biaya dan sumber pendanaannya?",
      "Apa yang membuat model bisnis ini menarik atau justru menantang?",
    ],
  },
  {
    title: "Ekonomi bisnis & pasar",
    description: "Revenue driver, struktur biaya, pelanggan, dan kompetitor.",
    questions: [
      "Apa penggerak pendapatan, biaya, dan kebutuhan modal?",
      "Siapa pelanggan dan kompetitor yang paling relevan?",
      "Bukti apa yang mendukung gambaran pasar ini?",
    ],
  },
  {
    title: "Keunggulan & ketahanan",
    description: "Moat, hubungan sebab-akibat, dan keberlanjutan keunggulan.",
    questions: [
      "Keunggulan apa yang terlihat dan bagaimana mekanismenya?",
      "Apa yang dapat mengikis keunggulan tersebut?",
      "Mana bukti dan mana asumsi yang masih harus diuji?",
    ],
  },
  {
    title: "Manajemen & alokasi modal",
    description: "Rekam jejak, insentif, dan penggunaan modal.",
    questions: [
      "Bagaimana modal dialokasikan dan apa hasilnya?",
      "Apakah insentif manajemen selaras dengan pemilik?",
      "Informasi apa yang belum tersedia?",
    ],
  },
  {
    title: "Risiko & alternatif",
    description: "Risiko internal, makro, dan skenario tandingan.",
    questions: [
      "Apa risiko utama dan tanda peringatannya?",
      "Penjelasan alternatif apa yang masuk akal?",
      "Apa yang dapat membantah pandangan saat ini?",
    ],
  },
  {
    title: "Prospek & sintesis",
    description: "Katalis, skenario, dan kesimpulan sementara.",
    questions: [
      "Skenario apa yang perlu dipertimbangkan?",
      "Apa kesimpulan sementara dan batas keyakinannya?",
      "Bukti tambahan apa yang dapat mengubah kesimpulan?",
    ],
  },
] as const;
export type MarkdownCommand =
  "bold" | "italic" | "heading" | "list" | "quote" | "code";
export function formatMarkdown(
  body: string,
  start: number,
  end: number,
  command: MarkdownCommand,
) {
  let a = Math.max(0, Math.min(body.length, start));
  const b = Math.max(a, Math.min(body.length, end));
  if (["heading", "list", "quote"].includes(command))
    a = a === 0 ? 0 : body.lastIndexOf("\n", a - 1) + 1;
  const selected = body.slice(a, b);
  const pair =
    command === "bold"
      ? "**"
      : command === "italic"
        ? "_"
        : command === "code"
          ? "`"
          : "";
  const prefix =
    command === "heading"
      ? "## "
      : command === "list"
        ? "- "
        : command === "quote"
          ? "> "
          : "";
  const content = pair
    ? pair + selected + pair
    : selected
        .split("\n")
        .map((line) => prefix + line)
        .join("\n");
  return {
    body: body.slice(0, a) + content + body.slice(b),
    start: a + (pair ? pair.length : prefix.length),
    end: a + content.length - (pair ? pair.length : 0),
  };
}
export function writingStatus(
  status: "saved" | "dirty" | "saving" | "uncertain" | "conflict",
) {
  return {
    saved: "Tersimpan",
    dirty: "Belum tersimpan",
    saving: "Menyimpan…",
    uncertain: "Penyimpanan belum pasti",
    conflict: "Konflik versi",
  }[status];
}
