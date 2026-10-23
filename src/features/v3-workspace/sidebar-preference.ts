// A presentation preference only: no account, company, or authorization data.
const key = "my-kravv:v3:company-sidebar";
const listeners = new Set<() => void>();
let memory: boolean | undefined;

export function readSidebarPreference() {
  if (memory !== undefined) return memory;
  try {
    const value = window.sessionStorage.getItem(key);
    if (value === "open" || value === "closed") return value === "open";
  } catch {
    // Storage restrictions must not break navigation within the mounted app.
  }
  return memory ?? true;
}

export function subscribeSidebarPreference(changed: () => void) {
  listeners.add(changed);
  return () => {
    listeners.delete(changed);
  };
}

export function setSidebarPreference(open: boolean) {
  memory = open;
  try {
    window.sessionStorage.setItem(key, open ? "open" : "closed");
  } catch {
    // Retain a module-memory fallback when session storage is unavailable.
  }
  listeners.forEach((changed) => changed());
}
