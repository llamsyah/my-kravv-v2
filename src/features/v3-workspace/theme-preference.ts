import type { Theme } from "./management-contract";
const key = "my-kravv:v3:theme";
const listeners = new Set<() => void>();
let fallback: Theme | undefined;
export function readThemePreference(): Theme {
  if (fallback !== undefined) return fallback;
  try {
    const value = window.localStorage.getItem(key);
    if (value === "light" || value === "dark") return value;
  } catch {}
  return fallback ?? "light";
}
export function setThemePreference(theme: Theme) {
  fallback = theme;
  try {
    window.localStorage.setItem(key, theme);
  } catch {}
  listeners.forEach((listener) => listener());
}
export function subscribeThemePreference(listener: () => void) {
  listeners.add(listener);
  const changed = (event: StorageEvent) => {
    if (event.key === key || event.key === null) {
      fallback = undefined;
      listener();
    }
  };
  window.addEventListener("storage", changed);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", changed);
  };
}
