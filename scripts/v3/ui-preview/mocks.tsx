import type { AnchorHTMLAttributes } from "react";
function fixtureHref(href: string) {
  const url = new URL(href, window.location.origin);
  if (url.origin !== window.location.origin || url.pathname !== "/foundation")
    throw Error("Unexpected preview navigation");
  const state = new URLSearchParams(window.location.search).get("state");
  if (state === "many" || state === "legacy")
    url.searchParams.set("state", state);
  return url.pathname + url.search;
}
export default function PreviewLink({
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a {...props} href={props.href ? fixtureHref(props.href) : undefined}>
      {children}
    </a>
  );
}
export function useRouter() {
  return {
    push(href: string) {
      window.location.assign(fixtureHref(href));
    },
    replace(href: string) {
      window.location.assign(fixtureHref(href));
    },
    refresh() {},
  };
}
export async function saveFoundationThemeAction(theme: "light" | "dark") {
  window.localStorage.setItem("my-kravv:v3:preview-account-theme", theme);
  return { error: null, theme };
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
