import type { HTMLAttributes } from "react";

/** Tone is presentation only; the caller supplies truthful status text. */
export function StatusBadge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "accent" | "warning" | "error";
}) {
  return (
    <span
      {...props}
      className={["status-badge", className].filter(Boolean).join(" ")}
      data-tone={tone}
    />
  );
}
