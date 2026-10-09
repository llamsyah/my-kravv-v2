import type { SVGProps } from "react";

// Small local vocabulary, shared by Server Components and client islands.
const paths = {
  home: ["m3 10 9-7 9 7v10H3Z", "M9 20v-7h6v7"],
  building: [
    "M3 21h18M5 21V5h8v16M13 10h6v11",
    "M8 8h2m-2 4h2m-2 4h2m6-3h1m-1 4h1",
  ],
  logout: ["M10 4H4v16h6m5-13 5 5-5 5m-7-5h12"],
  user: ["M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0", "M4 21v-2a8 8 0 0 1 16 0v2"],
  chevronDown: ["m6 9 6 6 6-6"],
  arrowLeft: ["M19 12H5m6-6-6 6 6 6"],
  overview: ["M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z"],
  plus: ["M12 5v14M5 12h14"],
  arrowRight: ["M5 12h14m-6-6 6 6-6 6"],
  pencil: ["m16 3 5 5-12 12-6 1 1-6Z", "m14 5 5 5"],
  read: ["M4 3h11l5 5v13H4Z", "M14 3v6h6M8 13h8m-8 4h6"],
  search: ["M21 21l-5-5", "M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0"],
  check: ["m5 12 4 4L19 6"],
  clock: ["M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0", "M12 6v6l4 2"],
  alert: ["M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0", "M12 8v4m0 4h.01"],
  more: ["M4 12h.01M12 12h.01M20 12h.01"],
} as const;
export type IconName = keyof typeof paths;

/** Decorative by default: visible control text or its aria-label supplies the name. */
export function Icon({
  name,
  size = "default",
  className,
  ...props
}: Omit<SVGProps<SVGSVGElement>, "children" | "aria-label" | "role"> & {
  name: IconName;
  size?: "small" | "default" | "large";
}) {
  return (
    <svg
      {...props}
      className={["ui-icon", className].filter(Boolean).join(" ")}
      data-size={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name].map((d, index) => (
        <path key={index} d={d} />
      ))}
    </svg>
  );
}
