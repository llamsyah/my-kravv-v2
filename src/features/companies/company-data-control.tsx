"use client";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./company-overview.module.css";

export function CompanyDataControl({ children }: { children: ReactNode }) {
  const region = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const open = () => {
      if (!region.current) return;
      region.current.open = true;
      region.current.querySelector("summary")?.focus();
      region.current.scrollIntoView({ block: "start" });
    };
    const onHash = () => {
      if (window.location.hash === "#data-control") open();
    };
    // Selecting the same fragment does not emit hashchange.
    const onClick = (event: MouseEvent) => {
      const anchor =
        event.target instanceof Element ? event.target.closest("a") : null;
      if (
        anchor &&
        anchor.origin === window.location.origin &&
        anchor.pathname === window.location.pathname &&
        anchor.hash === "#data-control"
      )
        open();
    };
    onHash();
    // Progressive form errors must remain visible even when a POST has no fragment.
    const revealFeedback = () => {
      if (
        region.current &&
        [...region.current.querySelectorAll(".form-feedback")].some((node) =>
          node.textContent?.trim(),
        )
      )
        region.current.open = true;
    };
    revealFeedback();
    const feedback = new MutationObserver(revealFeedback);
    if (region.current)
      feedback.observe(region.current, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    window.addEventListener("hashchange", onHash);
    document.addEventListener("click", onClick);
    return () => {
      feedback.disconnect();
      window.removeEventListener("hashchange", onHash);
      document.removeEventListener("click", onClick);
    };
  }, []);
  return (
    <details ref={region} id="data-control" className={styles.management}>
      <summary>Kelola ruang · Arsip &amp; hapus</summary>
      <div className={styles.managementBody}>{children}</div>
    </details>
  );
}
