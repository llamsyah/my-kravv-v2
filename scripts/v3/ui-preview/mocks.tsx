import type { AnchorHTMLAttributes } from "react";
export default function PreviewLink({
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props}>{children}</a>;
}
export function useRouter() {
  return {
    replace(href: string) {
      window.location.assign(href);
    },
    refresh() {},
  };
}
export async function logout() {
  return { error: "Pratinjau sintetis: tidak ada sesi atau permintaan Auth." };
}
export async function saveFoundationCompanyAction(
  _previous: unknown,
  form: FormData,
) {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const name = String(form.get("name") ?? "");
  if (!name.trim() || name.trim().length > 200)
    return { error: "Isi nama paling banyak 200 karakter." };
  return {
    error:
      "Simulasi kegagalan penyimpanan. Tidak ada data dikirim atau disimpan.",
  };
}
