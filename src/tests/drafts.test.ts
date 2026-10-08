import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import {
  DraftStore,
  draftKey,
  readDraft,
  clearAcknowledgedDraft,
  clearPrivateDrafts,
} from "../features/thoughts/drafts.ts";

test("browser CRLF transport acknowledgement clears LF draft without normalizing stored originals or newer content", () => {
  const storage = new MemoryStorage();
  const key = draftKey("a", "company", "c");
  const draft = store(storage, key);
  const browserText = "\n  Browser original.\n\nTrailing spaces.  ";
  draft.edit(browserText);
  draft.markAttempted();
  const operation = draft.getSnapshot().operationId;
  const transported = browserText.replace(/\n/g, "\r\n");
  clearAcknowledgedDraft(storage, "a", "c", operation, transported);
  assert.equal(storage.getItem(key), null);
  assert.ok(transported.includes("\r\n"));
  draft.edit("different original");
  draft.flush();
  clearAcknowledgedDraft(storage, "a", "c", operation, transported);
  assert.equal(readDraft(storage, key)?.text, "different original");
});

class MemoryStorage {
  values = new Map<string, string>();
  writes = 0;
  get length() {
    return this.values.size;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.writes++;
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
}
const text = "\n  Pemikiran asli.\r\n\nBelum yakin.  ";
function store(storage: MemoryStorage, key: string) {
  return new DraftStore(key, randomUUID(), "", () => storage, randomUUID);
}
test("refresh restores exact text and attempted operation, isolated by user, Company and Home context", () => {
  const storage = new MemoryStorage();
  const key = draftKey("owner-a", "company", "company-a");
  const draft = store(storage, key);
  draft.edit(text);
  draft.markAttempted();
  const operation = draft.getSnapshot().operationId;
  const refreshed = store(storage, key);
  refreshed.restore();
  assert.equal(refreshed.getSnapshot().text, text);
  assert.equal(refreshed.getSnapshot().operationId, operation);
  assert.equal(refreshed.getSnapshot().attempted, true);
  for (const other of [
    draftKey("owner-b", "company", "company-a"),
    draftKey("owner-a", "company", "company-b"),
    draftKey("owner-a", "home", "company-a"),
  ]) {
    const isolated = store(storage, other);
    isolated.restore();
    assert.equal(isolated.getSnapshot().text, "");
  }
});
test("only a matching confirmed receipt clears its draft; failure and stale receipts retain it", () => {
  const storage = new MemoryStorage();
  const key = draftKey("a", "home", "c");
  const draft = store(storage, key);
  draft.edit(text);
  draft.markAttempted();
  const operation = draft.getSnapshot().operationId;
  clearAcknowledgedDraft(storage, "b", "c", operation, text);
  clearAcknowledgedDraft(storage, "a", "other", operation, text);
  clearAcknowledgedDraft(storage, "a", "c", randomUUID(), text);
  clearAcknowledgedDraft(storage, "a", "c", operation, "changed");
  assert.equal(readDraft(storage, key)?.text, text);
  // An ambiguous failure leaves the same request identity available on retry.
  draft.markAttempted();
  assert.equal(draft.getSnapshot().operationId, operation);
  draft.edit("new draft");
  draft.flush();
  clearAcknowledgedDraft(storage, "a", "c", operation, text);
  assert.equal(readDraft(storage, key)?.text, "new draft");
  const newer = draft.getSnapshot().operationId;
  clearAcknowledgedDraft(storage, "a", "c", newer, "new draft");
  draft.restore();
  draft.flush();
  assert.equal(readDraft(storage, key), undefined);
  assert.equal(draft.getSnapshot().text, "");
});
test("debounced edits flush once, editing an attempted request rotates identity, discard starts a distinct identical Thought", () => {
  const storage = new MemoryStorage();
  const draft = store(storage, "draft");
  for (let i = 1; i <= 10; i++) draft.edit(text.slice(0, i));
  assert.equal(storage.writes, 0);
  draft.flush();
  draft.flush();
  assert.equal(storage.writes, 1);
  const operation = draft.getSnapshot().operationId;
  draft.markAttempted();
  draft.edit(text);
  assert.notEqual(draft.getSnapshot().operationId, operation);
  draft.flush();
  const intentional = draft.getSnapshot().operationId;
  draft.discard();
  draft.edit(text);
  draft.flush();
  assert.notEqual(draft.getSnapshot().operationId, intentional);
  assert.equal(draft.getSnapshot().text, text);
  draft.discard();
  assert.equal(storage.getItem("draft"), null);
});
test("storage failures preserve memory text; malformed/oversize drafts are ignored; signed-out cleanup touches only app drafts", () => {
  const storage = new MemoryStorage();
  const draft = new DraftStore(
    "key",
    randomUUID(),
    "",
    () => {
      throw Error("quota or disabled");
    },
    randomUUID,
  );
  draft.edit(text);
  draft.flush();
  assert.equal(draft.getSnapshot().text, text);
  assert.equal(draft.getSnapshot().storageError, true);
  for (const malformed of [
    "null",
    "invalid",
    JSON.stringify({
      text: "x".repeat(100001),
      operationId: randomUUID(),
      attempted: false,
    }),
  ]) {
    storage.setItem("key", malformed);
    assert.equal(readDraft(storage, "key"), undefined);
  }
  storage.setItem(draftKey("a", "company", "c"), "draft");
  storage.setItem(draftKey("b", "home", "c"), "draft");
  storage.setItem("unrelated", "preserve");
  clearPrivateDrafts(storage);
  assert.equal(storage.getItem("unrelated"), "preserve");
  assert.equal(storage.getItem(draftKey("a", "company", "c")), null);
  assert.equal(storage.getItem(draftKey("b", "home", "c")), null);
});
