"use client";
import { useSyncExternalStore, type ReactNode } from "react";
const query = "(min-width: 851px)";
function subscribe(listener: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
const desktopSnapshot = () => window.matchMedia(query).matches;
const serverSnapshot = () => false;
export function ResponsiveDetails({
  title,
  titleId,
  className,
  children,
}: {
  title: string;
  titleId?: string;
  className: string;
  children: ReactNode;
}) {
  const desktop = useSyncExternalStore(
    subscribe,
    desktopSnapshot,
    serverSnapshot,
  );
  return (
    <details className={className} open={desktop || undefined}>
      <summary id={titleId}>{title}</summary>
      {children}
    </details>
  );
}
