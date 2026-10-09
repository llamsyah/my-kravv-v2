import { z } from "zod";
import { readThoughtCursor } from "../../domain/thought/thought.ts";

export type ThoughtSearch = {
  before?: string | string[];
  focus?: string | string[];
  saved?: string | string[];
  deleted?: string | string[];
};
export function readThoughtId(value: unknown): string | undefined {
  const result = z.uuid().safeParse(value);
  return result.success ? result.data.toLowerCase() : undefined;
}
export function readThoughtSearch(search: ThoughtSearch) {
  return {
    cursor: readThoughtCursor(search.before),
    focus: readThoughtId(search.focus),
    saved: readThoughtId(search.saved),
    deleted: search.deleted === "thought",
  };
}
/** Owned Company ID comes from the authenticated leaf, never a return URL. */
export function legacyThoughtDestination(
  companyId: string,
  search: ThoughtSearch,
) {
  if (
    search.before === undefined &&
    search.focus === undefined &&
    search.saved === undefined &&
    search.deleted !== "thought"
  )
    return null;
  const { cursor, focus, saved, deleted } = readThoughtSearch(search);
  const query = new URLSearchParams();
  if (cursor) query.set("before", `${cursor.created_at}|${cursor.id}`);
  if (focus) query.set("focus", focus);
  if (saved) query.set("saved", saved);
  if (deleted) query.set("deleted", "thought");
  const target = saved ?? focus;
  return `/companies/${companyId}/thoughts${query.size ? `?${query}` : ""}#${target ? `thought-${target}` : "thought-history-title"}`;
}
export function legacyThoughtHashDestination(companyId: string, hash: string) {
  if (hash === "#thought-history-title")
    return `/companies/${companyId}/thoughts${hash}`;
  if (!hash.startsWith("#thought-")) return null;
  const id = readThoughtId(hash.slice("#thought-".length));
  return id
    ? `/companies/${companyId}/thoughts?focus=${id}#thought-${id}`
    : null;
}
