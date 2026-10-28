import {
  draftRow,
  draftFields,
  type Draft,
  type DraftFields,
} from "./contract.ts";
import type { ResearchMutation } from "../../server/research/service.ts";
const prefix = "my-kravv:v3:kjcvgjfwlmyfroiqlbmw:research:";
const liveSessions = new Set<WritingSession>();
type StoragePort = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem" | "key" | "length"
>;
export function clearResearchRecovery(owner?: string, storage?: StoragePort) {
  // Revoke before removing storage: an unmount or a late save must not resurrect
  // the previous account's recovery data after logout/account switching.
  for (const session of liveSessions) {
    if (!owner || session.row.user_id !== owner) session.revoke();
  }
  try {
    const s = storage ?? window.sessionStorage;
    const keys = [];
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (
        k?.startsWith(prefix) &&
        (!owner || !k.startsWith(prefix + owner + ":"))
      )
        keys.push(k);
    }
    for (const k of keys) s.removeItem(k);
    return true;
  } catch {
    return false;
  }
}
type Reply = { ok: boolean; draft?: Draft; code?: string; error?: string };
export type WritingState = {
  fields: DraftFields;
  revision: number;
  status: "saved" | "dirty" | "saving" | "uncertain" | "conflict";
  error: string | null;
  storageError: boolean;
};
const same = (a: DraftFields, b: DraftFields) =>
  JSON.stringify(a) === JSON.stringify(b);
export class WritingSession {
  private listeners = new Set<() => void>();
  private timer?: ReturnType<typeof setTimeout>;
  private flight = false;
  private active = true;
  private restored = false;
  private revoked = false;
  private attempt: Extract<ResearchMutation, { kind: "save" }> | null = null;
  private entry?: { capture: string | null; onSaved: (row: Draft) => void };
  private creation: Extract<ResearchMutation, { kind: "create" }> | null = null;
  private created: Draft | null = null;
  get isEntry() {
    return !!this.entry && !this.created;
  }
  private snapshot: WritingState;
  readonly initial: WritingState;
  readonly key: string;
  readonly row: Draft;
  private send: (m: ResearchMutation) => Promise<Reply>;
  private storage: () => StoragePort;
  private uuid: () => string;
  constructor(
    row: Draft,
    send: (m: ResearchMutation) => Promise<Reply>,
    storage: () => StoragePort = () => window.sessionStorage,
    uuid = () => crypto.randomUUID(),
    entry?: { capture: string | null; onSaved: (row: Draft) => void },
  ) {
    this.entry = entry;
    this.row = { ...row };
    this.send = send;
    this.storage = storage;
    this.uuid = uuid;
    this.key = prefix + row.user_id + ":" + row.id;
    this.initial = {
      fields: {
        title: row.title,
        body: row.body,
        mode: row.mode,
        company_id: row.company_id,
      },
      revision: row.revision,
      status: "saved",
      error: null,
      storageError: false,
    };
    this.snapshot = this.initial;
  }
  getSnapshot = () => this.snapshot;
  getServerSnapshot = () => this.initial;
  private emit() {
    for (const fn of this.listeners) fn();
  }
  private persist() {
    if (this.revoked) return;
    try {
      const s = this.storage();
      if (this.snapshot.status === "saved") {
        s.removeItem(this.key);
        return;
      }
      const data = JSON.stringify({
        fields: this.snapshot.fields,
        revision: this.snapshot.revision,
        attempt: this.attempt,
        ...(this.entry
          ? { creation: this.creation, created: this.created }
          : {}),
      });
      let bytes = data.length,
        slots = 0;
      for (let i = 0; i < s.length; i++) {
        const key = s.key(i);
        if (key?.startsWith(prefix) && key !== this.key) {
          slots++;
          bytes += (s.getItem(key) ?? "").length;
        }
      }
      if (bytes > 1048576 || slots >= 10) throw Error();
      s.setItem(this.key, data);
    } catch {
      this.snapshot = { ...this.snapshot, storageError: true };
    }
  }
  private restore() {
    if (this.restored) return;
    this.restored = true;
    try {
      const value = this.storage().getItem(this.key);
      if (!value) return;
      if (value.length > 1100000) throw Error();
      const v = JSON.parse(value),
        parsed = draftFields.safeParse(v.fields);
      if (!parsed.success || !Number.isInteger(v.revision) || v.revision < 1)
        throw Error();
      if (this.entry) {
        if (v.creation) {
          const c = v.creation;
          if (
            c.kind !== "create" ||
            !isUuid(c.operation) ||
            c.capture_id !== this.entry.capture ||
            !draftFields.safeParse({
              title: c.title,
              body: "",
              mode: c.mode,
              company_id: c.company_id,
            }).success
          )
            throw Error();
          this.creation = {
            kind: "create",
            operation: c.operation,
            title: c.title,
            mode: c.mode,
            company_id: c.company_id,
            capture_id: c.capture_id,
          };
        }
        if (v.created) {
          const parsedRow = draftRow.parse(v.created);
          if (
            !this.creation ||
            parsedRow.user_id !== this.row.user_id ||
            parsedRow.source_capture_id !== this.entry.capture
          )
            throw Error();
          this.created = parsedRow;
          Object.assign(this.row, parsedRow);
        }
      }
      // Recovered operations never gain authority: service independently verifies user,
      // ID, payload and expected revision. Only exact own-draft save envelopes enter.
      if (v.attempt) {
        if (
          v.attempt.kind !== "save" ||
          v.attempt.id !== this.row.id ||
          v.attempt.expected !== v.revision ||
          !isUuid(v.attempt.operation) ||
          !draftFields.safeParse(v.attempt.fields).success
        )
          throw Error();
        this.attempt = v.attempt;
      }
      this.snapshot = {
        fields: parsed.data,
        revision: v.revision,
        status:
          this.attempt || (this.entry && this.creation && !this.created)
            ? "uncertain"
            : v.revision !== this.row.revision
              ? "conflict"
              : same(parsed.data, this.initial.fields)
                ? "saved"
                : "dirty",
        error: "Buffer lokal ditemukan. Periksa isinya sebelum menyimpan.",
        storageError: false,
      };
    } catch {
      this.snapshot = {
        ...this.snapshot,
        storageError: true,
        error: "Buffer lokal tidak dapat dibaca. Teks server tetap tersedia.",
      };
    }
    this.emit();
  }
  subscribe = (fn: () => void) => {
    if (this.revoked) return () => {};
    this.active = true;
    liveSessions.add(this);
    this.listeners.add(fn);
    this.restore();
    return () => {
      this.listeners.delete(fn);
      if (!this.listeners.size) {
        this.active = false;
        liveSessions.delete(this);
        clearTimeout(this.timer);
        this.persist();
      }
    };
  };
  edit(fields: DraftFields) {
    if (this.revoked) return;
    this.snapshot = {
      ...this.snapshot,
      fields,
      status: this.flight ? "saving" : this.attempt ? "uncertain" : "dirty",
      error: this.attempt ? this.snapshot.error : null,
    };
    this.persist();
    this.emit();
    if (!this.attempt) this.schedule();
  }
  private schedule() {
    clearTimeout(this.timer);
    if (!this.isEntry && this.active && this.snapshot.status === "dirty")
      this.timer = setTimeout(() => {
        void this.save();
      }, 1000);
  }
  async save() {
    clearTimeout(this.timer);
    if (this.flight || !this.active) return false;
    if (!this.isEntry && !this.attempt && this.snapshot.status === "saved")
      return true;
    if (!this.attempt && !draftFields.safeParse(this.snapshot.fields).success) {
      this.snapshot = {
        ...this.snapshot,
        error: "Judul wajib; teks maksimal 100.000 karakter / 256 KiB.",
      };
      this.emit();
      return false;
    }
    if (!this.attempt && this.snapshot.status === "conflict") return false;
    if (this.isEntry) {
      if (!this.snapshot.fields.body.trim()) {
        this.snapshot = {
          ...this.snapshot,
          error: "Tulis catatan sebelum menyimpan draf baru.",
        };
        this.emit();
        return false;
      }
      this.creation ??= {
        kind: "create",
        operation: this.uuid(),
        title: this.snapshot.fields.title,
        mode: this.snapshot.fields.mode,
        company_id: this.snapshot.fields.company_id,
        capture_id: this.entry!.capture,
      };
      this.flight = true;
      this.snapshot = { ...this.snapshot, status: "saving", error: null };
      this.persist();
      this.emit();
      // Recovery evidence must exist before a new persistent document can be requested.
      if (this.snapshot.storageError) {
        this.flight = false;
        this.snapshot = {
          ...this.snapshot,
          status: "uncertain",
          error: "Buffer lokal wajib tersedia sebelum membuat draf.",
        };
        this.emit();
        return false;
      }
      try {
        const result = await this.send(this.creation);
        if (!this.active) return false;
        if (!result.ok || !result.draft) throw Error();
        const row = draftRow.parse(result.draft);
        if (
          row.user_id !== this.row.user_id ||
          row.source_capture_id !== this.entry!.capture
        )
          throw Error();
        this.created = row;
        Object.assign(this.row, row);
        this.snapshot = {
          ...this.snapshot,
          revision: row.revision,
          status: "dirty",
        };
        this.persist();
        if (this.snapshot.storageError) throw Error();
      } catch {
        if (this.active) {
          this.snapshot = {
            ...this.snapshot,
            status: "uncertain",
            error:
              "Pembuatan belum terkonfirmasi. Teks dan identitas operasi dipertahankan; simpan ulang operasi yang sama.",
          };
          this.persist();
          this.emit();
        }
        return false;
      } finally {
        this.flight = false;
      }
    }
    const attempt = this.attempt ?? {
      kind: "save" as const,
      operation: this.uuid(),
      id: this.row.id,
      expected: this.snapshot.revision,
      fields: structuredClone(this.snapshot.fields),
    };
    this.attempt = attempt;
    this.flight = true;
    this.snapshot = { ...this.snapshot, status: "saving", error: null };
    this.persist();
    this.emit();
    if (this.entry && this.snapshot.storageError) {
      this.flight = false;
      this.snapshot = {
        ...this.snapshot,
        status: "uncertain",
        error: "Buffer lokal belum terkonfirmasi; permintaan ditahan.",
      };
      this.emit();
      return false;
    }
    try {
      const result = await this.send(attempt);
      if (!this.active) return false;
      if (!result.ok || !result.draft) {
        this.snapshot = {
          ...this.snapshot,
          status: result.code === "conflict" ? "conflict" : "uncertain",
          error: result.error ?? "Penyimpanan belum terkonfirmasi.",
        };
        this.persist();
        this.emit();
        return false;
      }
      const saved = result.draft;
      if (
        saved.id !== this.row.id ||
        saved.user_id !== this.row.user_id ||
        saved.revision <= attempt.expected ||
        !same(
          {
            title: saved.title,
            body: saved.body,
            mode: saved.mode,
            company_id: saved.company_id,
          },
          attempt.fields,
        )
      )
        throw Error();
      this.attempt = null;
      const clean = same(this.snapshot.fields, attempt.fields);
      this.snapshot = {
        ...this.snapshot,
        revision: saved.revision,
        status: clean ? "saved" : "dirty",
        error: null,
      };
      this.persist();
      this.emit();
      if (clean && this.entry) this.entry.onSaved(saved);
      return clean;
    } catch {
      if (this.active) {
        this.snapshot = {
          ...this.snapshot,
          status: "uncertain",
          error:
            "Sambungan terputus. Teks dan operasi dipertahankan; ulangi operasi yang sama.",
        };
        this.persist();
        this.emit();
      }
      return false;
    } finally {
      this.flight = false;
      if (this.active) this.schedule();
    }
  }
  acceptServer(row: Draft, preserveLocal: boolean) {
    if (
      this.revoked ||
      row.id !== this.row.id ||
      row.user_id !== this.row.user_id ||
      this.flight
    )
      return;
    this.attempt = null;
    this.snapshot = {
      ...this.snapshot,
      revision: row.revision,
      fields: preserveLocal
        ? this.snapshot.fields
        : {
            title: row.title,
            body: row.body,
            mode: row.mode,
            company_id: row.company_id,
          },
      status: preserveLocal ? "dirty" : "saved",
      error: null,
    };
    this.persist();
    this.emit(); // Deliberate resolution, never automatic merge/save.
  }
  revoke() {
    this.revoked = true;
    this.active = false;
    clearTimeout(this.timer);
    liveSessions.delete(this);
  }
}
function isUuid(v: unknown) {
  return (
    typeof v === "string" &&
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v)
  );
}
