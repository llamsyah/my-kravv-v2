import { rawContentLimit } from "../../domain/thought/thought.ts";

export const draftPrefix = "my-kravv:draft:v1:";
export const draftEvent = "my-kravv-drafts-changed";
export type Draft = {
  text: string;
  operationId: string;
  attempted: boolean;
  storageError: boolean;
};
type StoredDraft = Pick<Draft, "text" | "operationId" | "attempted">;
type StoragePort = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem" | "key" | "length"
>;
const uuidPattern =
  /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
export function draftKey(
  userId: string,
  context: "home" | "company" | "selection",
  companyId: string,
) {
  return `${draftPrefix}${userId}:${context}:${companyId}`;
}
export function readDraft(
  storage: StoragePort,
  key: string,
): StoredDraft | undefined {
  try {
    const raw = storage.getItem(key);
    if (!raw) return undefined;
    const value = JSON.parse(raw);
    if (
      typeof value.text !== "string" ||
      value.text.length > rawContentLimit ||
      typeof value.operationId !== "string" ||
      !uuidPattern.test(value.operationId) ||
      typeof value.attempted !== "boolean"
    )
      return undefined;
    return {
      text: value.text,
      operationId: value.operationId,
      attempted: value.attempted,
    };
  } catch {
    return undefined;
  }
}
export function clearAcknowledgedDraft(
  storage: StoragePort,
  userId: string,
  companyId: string,
  operationId: string,
  original: string,
) {
  for (const context of ["home", "company"] as const) {
    const key = draftKey(userId, context, companyId);
    const draft = readDraft(storage, key);
    // HTML form submission canonicalizes textarea line endings to CRLF.
    // Compare only for acknowledgement; never rewrite the saved original.
    if (
      draft?.operationId === operationId &&
      draft.text.replace(/\r\n?/g, "\n") === original.replace(/\r\n?/g, "\n")
    )
      storage.removeItem(key);
  }
}
export function clearPrivateDrafts(storage: StoragePort) {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith(draftPrefix)) keys.push(key);
  }
  for (const key of keys) storage.removeItem(key);
}

// External snapshots hydrate without an effect-driven React state update.
// Disk writes are debounced, then flushed on blur, submission and pagehide.
export class DraftStore {
  private listeners = new Set<() => void>();
  private timer?: ReturnType<typeof setTimeout>;
  private dirty = false;
  private snapshot: Draft;
  readonly initial: Draft;
  readonly key: string;
  private storage: () => StoragePort;
  private uuid: () => string;
  constructor(
    key: string,
    seed: string,
    text = "",
    storage: () => StoragePort = () => window.localStorage,
    uuid: () => string = () => crypto.randomUUID(),
  ) {
    this.key = key;
    this.storage = storage;
    this.uuid = uuid;
    this.initial = {
      text,
      operationId: seed,
      attempted: false,
      storageError: false,
    };
    this.snapshot = this.initial;
  }
  getSnapshot = () => this.snapshot;
  getServerSnapshot = () => this.initial;
  private emit() {
    for (const listener of this.listeners) listener();
  }
  restore = () => {
    try {
      const stored = readDraft(this.storage(), this.key);
      this.snapshot = { ...this.initial, operationId: this.uuid(), ...stored };
      this.dirty = !stored && !!this.initial.text;
    } catch {
      this.snapshot = { ...this.snapshot, storageError: true };
    }
    this.emit();
  };
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    this.restore();
    const reload = () => {
      clearTimeout(this.timer);
      this.restore();
    };
    window.addEventListener(draftEvent, reload);
    window.addEventListener("pagehide", this.flush);
    return () => {
      this.flush();
      this.listeners.delete(listener);
      clearTimeout(this.timer);
      window.removeEventListener(draftEvent, reload);
      window.removeEventListener("pagehide", this.flush);
    };
  };
  edit(text: string) {
    if (text === this.snapshot.text) return;
    this.snapshot = {
      ...this.snapshot,
      text,
      operationId: this.snapshot.attempted
        ? this.uuid()
        : this.snapshot.operationId,
      attempted: false,
    };
    this.dirty = true;
    this.emit();
    clearTimeout(this.timer);
    this.timer = setTimeout(this.flush, 250);
  }
  markAttempted() {
    this.snapshot = { ...this.snapshot, attempted: true };
    this.dirty = true;
    this.emit();
    this.flush();
  }
  flush = () => {
    clearTimeout(this.timer);
    if (!this.dirty) return;
    try {
      const { text, operationId, attempted } = this.snapshot;
      if (text)
        this.storage().setItem(
          this.key,
          JSON.stringify({ text, operationId, attempted }),
        );
      else this.storage().removeItem(this.key);
      this.dirty = false;
    } catch {
      if (!this.snapshot.storageError) {
        this.snapshot = { ...this.snapshot, storageError: true };
        this.emit();
      }
    }
  };
  discard() {
    clearTimeout(this.timer);
    this.snapshot = { ...this.initial, text: "", operationId: this.uuid() };
    this.dirty = true;
    this.flush();
    this.emit();
  }
}
