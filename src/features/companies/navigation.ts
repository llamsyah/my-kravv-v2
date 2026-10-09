// Presentation-only route policy. Ownership and IDs are validated on the server.
export function globalNavigationSection(pathname: string) {
  if (pathname === "/") return "home";
  if (pathname === "/companies" || pathname.startsWith("/companies/"))
    return "companies";
  return null;
}

export type CompanySection = "overview" | "thoughts" | "refine";
export function companyNavigationSection(
  pathname: string,
  companyId: string,
): CompanySection | null {
  const root = `/companies/${companyId}`;
  if (pathname === root || pathname === `${root}/`) return "overview";
  if (!pathname.startsWith(`${root}/`)) return null;
  const segments = pathname
    .slice(root.length + 1)
    .replace(/\/$/, "")
    .split("/");
  if (segments[0] === "refinements" && segments.length === 1) return "refine";
  if (segments[0] === "thoughts") {
    if (segments.length === 3 && segments[1] && segments[2] === "refine")
      return "refine";
    if (segments.length === 1 || (segments.length === 2 && segments[1]))
      return "thoughts";
  }
  return null;
}

/** Explicit rollout allowlist: preparation never exposes an unfinished destination. */
export function companyNavigationItems(
  companyId: string,
  enabledSections: readonly CompanySection[],
) {
  const root = `/companies/${companyId}`;
  return [
    {
      section: "overview" as const,
      label: "Overview",
      href: root,
      icon: "overview" as const,
    },
    {
      section: "thoughts" as const,
      label: "Pemikiran",
      href: `${root}/thoughts`,
      icon: "pencil" as const,
    },
    {
      section: "refine" as const,
      label: "Refine",
      href: `${root}/refinements`,
      icon: "read" as const,
    },
  ].filter((item) => enabledSections.includes(item.section));
}

export function companyMonogram(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => Array.from(word)[0])
    .join("")
    .toLocaleUpperCase("id-ID");
}
