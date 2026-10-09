"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "./ui/icon";
import styles from "./disclosure-menu.module.css";

/** Native disclosure works without JS; this island only enhances closing/focus. */
export function DisclosureMenu(props: {
  label: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  return <Disclosure key={pathname} {...props} />;
}

function Disclosure({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  const disclosure = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  const panelId = useId();
  useEffect(() => {
    function escape(event: KeyboardEvent) {
      const element = disclosure.current;
      if (event.key === "Escape" && element?.open) {
        event.preventDefault();
        element.open = false;
        trigger.current?.focus();
      }
    }
    function outside(event: PointerEvent) {
      const element = disclosure.current;
      if (
        element?.open &&
        event.target instanceof Node &&
        !element.contains(event.target)
      ) {
        element.open = false;
      }
    }
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", outside);
    };
  }, []);
  return (
    <details
      className={styles.disclosure}
      ref={disclosure}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          event.currentTarget.open = false;
      }}
    >
      <summary className={styles.trigger} ref={trigger} aria-controls={panelId}>
        {label}
        <Icon name="chevronDown" size="small" className={styles.chevron} />
      </summary>
      <div
        className={styles.panel}
        id={panelId}
        onClick={(event) => {
          // Same-page anchors do not change pathname; close their disclosure too.
          if (
            event.target instanceof Element &&
            event.target.closest("a[href]") &&
            disclosure.current
          ) {
            disclosure.current.open = false;
          }
        }}
      >
        {children}
      </div>
    </details>
  );
}
