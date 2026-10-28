import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import {
  formatMarkdown,
  writingAreas,
  writingStatus,
} from "../features/research/writing-tools.ts";
import { WritingSession } from "../features/research/session.ts";
import { A, uuid } from "./helpers/research-fixture.ts";
import type { Draft } from "../features/research/contract.ts";
const draft: Draft = {
  id: uuid(500),
  user_id: A,
  title: "Tulisan sintetis",
  body: "  Teks asli 😀\r\n\nAsumsi belum pasti.  ",
  mode: "guided",
  company_id: null,
  source_capture_id: null,
  revision: 1,
  created_at: "2026-10-28T04:00:00Z",
  updated_at: "2026-10-28T04:00:00Z",
};
function render(mode: Draft["mode"], entry = false) {
  const child = spawnSync(
    process.execPath,
    ["src/tests/helpers/v3-workspace-render.mjs"],
    {
      encoding: "utf8",
      timeout: 20000,
      input: JSON.stringify({
        companies: [],
        ownerId: A,
        location: { view: "research" },
        researchState: {
          ready: true,
          failed: false,
          items: [{ ...draft, mode, company_name: null }],
          hasNext: entry,
          page: 0,
          selected: entry ? null : { ...draft, mode },
          history: [],
          historyHasNext: false,
          source: null,
          unavailable: false,
        },
      }),
    },
  );
  assert.equal(child.status, 0, child.stderr);
  return child.stdout;
}
test("Writing modes share one editable document, optional Companion tabs and explicit save/Thought controls", () => {
  for (const mode of ["blank", "guided", "assisted"] as const) {
    const html = render(mode);
    for (const text of [
      'role="tablist"',
      "Panduan",
      "Bahan",
      "AI Review",
      "Referensi",
      'aria-label="Kanvas penulisan"',
      'role="toolbar"',
      "Rekam Thought v1",
      "Autosave 1 detik",
      "Isi riset · Markdown",
      "Draf saya",
    ])
      assert.ok(html.includes(text), mode + " " + text);
    assert.equal((html.match(/<textarea/g) ?? []).length, 1);
    assert.ok(html.includes("Teks asli 😀"));
    assert.ok(html.includes('aria-label="Tulisan sintetis"'));
    assert.ok(!html.includes('contenteditable="true"'));
    assert.equal(html.includes('class="guidedIntro"'), mode === "guided");
  }
});
test("Markdown controls modify only the deliberate selection/line and preserve all other authored text", () => {
  assert.deepEqual(formatMarkdown("ab cd ef", 3, 5, "bold"), {
    body: "ab **cd** ef",
    start: 5,
    end: 7,
  });
  assert.equal(
    formatMarkdown("😀\nalpha\nbeta", 5, 8, "heading").body,
    "😀\n## alpha\nbeta",
  );
  assert.equal(formatMarkdown("a\nb\nc", 0, 3, "list").body, "- a\n- b\nc");
  assert.equal(formatMarkdown("raw", 0, 3, "code").body, "`raw`");
  assert.equal(formatMarkdown("  raw\r\n", 2, 5, "italic").body, "  _raw_\r\n");
  assert.equal(formatMarkdown("abc", 3, 3, "quote").body, "> abc");
});
test("Switching guidance/mode never rewrites the body, commits, creates or generates AI; existing session saves exact fields", async () => {
  const calls: unknown[] = [];
  const storage = {
    getItem: () => null,
    setItem() {},
    removeItem() {},
    key: () => null,
    length: 0,
  };
  const session = new WritingSession(
    draft,
    async (input) => {
      calls.push(input);
      if (input.kind !== "save") throw Error("Unexpected non-save operation");
      return { ok: true, draft: { ...draft, ...input.fields, revision: 2 } };
    },
    () => storage,
    () => uuid(950),
  );
  const stop = session.subscribe(() => {});
  for (const mode of ["blank", "assisted", "guided"] as const) {
    session.edit({ ...session.getSnapshot().fields, mode });
    assert.equal(session.getSnapshot().fields.body, draft.body);
  }
  assert.equal(calls.length, 0);
  assert.equal(await session.save(), true);
  assert.equal(calls.length, 1);
  assert.equal(session.getSnapshot().status, "saved");
  stop();
  assert.equal(writingAreas.length, 6);
  assert.equal(writingAreas[0].title, "Identitas & model bisnis");
  assert.equal(writingAreas[5].title, "Prospek & sintesis");
  assert.equal(writingStatus("uncertain"), "Penyimpanan belum pasti");
  assert.equal(writingStatus("conflict"), "Konflik versi");
});
test("Companion discloses provider-disabled and follow-up limitations without claiming fabricated live results", () => {
  const html = render("assisted");
  assert.ok(html.includes("draft=" + draft.id));
  assert.ok(!html.includes('value="undefined"'));
  assert.ok(html.includes("Penyedia belum diaktifkan"));
  assert.ok(html.includes("Percakapan lanjutan belum tersedia"));
});

function entryFixture() {
  const values = new Map<string, string>();
  const storage = {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => {
      values.set(k, v);
    },
    removeItem: (k: string) => {
      values.delete(k);
    },
    key: (i: number) => [...values.keys()][i] ?? null,
    get length() {
      return values.size;
    },
  };
  const row = {
    ...draft,
    id: "entry:personal:blank",
    title: "Catatan tanpa judul",
    body: "",
    mode: "blank" as const,
  };
  return { storage, row };
}
test("Empty entry is editable without creation; explicit save uses create then exact save, never Thought", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { row, storage } = entryFixture();
  const calls: import("../server/research/service.ts").ResearchMutation[] = [];
  let opened = "";
  const session = new WritingSession(
    row,
    async (m) => {
      calls.push(m);
      return {
        ok: true,
        draft:
          m.kind === "create"
            ? { ...draft, body: "", mode: "blank" }
            : { ...draft, ...(m.kind === "save" ? m.fields : {}), revision: 2 },
      };
    },
    () => storage,
    () => uuid(960),
    {
      capture: null,
      onSaved: (r) => {
        opened = r.id;
      },
    },
  );
  const stop = session.subscribe(() => {});
  assert.equal(await session.save(), false);
  assert.equal(calls.length, 0);
  session.edit({ ...session.getSnapshot().fields, body: "  raw\ntext 😀  " });
  assert.equal(calls.length, 0);
  assert.equal(session.isEntry, true);
  t.mock.timers.tick(2000);
  assert.equal(
    calls.length,
    0,
    "Typing past the autosave delay must not create a record",
  );
  assert.equal(await session.save(), true);
  assert.deepEqual(
    calls.map((m) => m.kind),
    ["create", "save"],
  );
  assert.equal(
    calls[1].kind === "save" && calls[1].fields.body,
    "  raw\ntext 😀  ",
  );
  assert.equal(opened, draft.id);
  assert.equal(session.getSnapshot().status, "saved");
  stop();
});
test("Uncertain entry creation recovers the same operation and body on reopen; account switch revokes it", async () => {
  const { row, storage } = entryFixture();
  let first: unknown;
  const a = new WritingSession(
    row,
    async (m) => {
      first = m;
      throw Error();
    },
    () => storage,
    () => uuid(961),
    { capture: null, onSaved: () => {} },
  );
  const stop = a.subscribe(() => {});
  a.edit({ ...a.getSnapshot().fields, body: "recover me" });
  assert.equal(await a.save(), false);
  stop();
  let retry: unknown;
  const b = new WritingSession(
    row,
    async (m) => {
      retry = m;
      return { ok: false };
    },
    () => storage,
    () => uuid(962),
    { capture: null, onSaved: () => {} },
  );
  const end = b.subscribe(() => {});
  assert.equal(b.getSnapshot().fields.body, "recover me");
  await b.save();
  assert.deepEqual(retry, first);
  b.revoke();
  assert.equal(await b.save(), false);
  end();
});
test("Entry recovery retains the confirmed ID after a lost save response; blocked storage prevents creation", async () => {
  const { row, storage } = entryFixture();
  let created = 0;
  const a = new WritingSession(
    row,
    async (m) => {
      if (m.kind === "create") {
        created++;
        return { ok: true, draft };
      }
      throw Error();
    },
    () => storage,
    () => uuid(963),
    { capture: null, onSaved: () => {} },
  );
  const stop = a.subscribe(() => {});
  a.edit({ ...a.getSnapshot().fields, body: "persist me" });
  await a.save();
  stop();
  const b = new WritingSession(
    row,
    async (m) => {
      assert.equal(m.kind, "save");
      return { ok: false };
    },
    () => storage,
    () => uuid(964),
    { capture: null, onSaved: () => {} },
  );
  const end = b.subscribe(() => {});
  assert.equal(b.row.id, draft.id);
  await b.save();
  assert.equal(created, 1);
  end();
  const blocked = new WritingSession(
    row,
    async () => {
      throw Error("must not transmit");
    },
    () => ({
      ...storage,
      setItem() {
        throw Error();
      },
    }),
    () => uuid(965),
    { capture: null, onSaved: () => {} },
  );
  const off = blocked.subscribe(() => {});
  blocked.edit({ ...blocked.getSnapshot().fields, body: "retain" });
  assert.equal(await blocked.save(), false);
  assert.equal(blocked.getSnapshot().storageError, true);
  off();
});

test("Entry immediately renders one blank editor and draft-picker paging never exposes a local entry ID", () => {
  const html = render("blank", true);
  assert.equal((html.match(/<textarea/g) ?? []).length, 1);
  assert.ok(html.includes("Catatan tanpa judul"));
  assert.ok(!html.includes("Buka draf"));
  assert.ok(!html.includes("draft=entry"));
  assert.ok(html.includes("Lebih lama"));
});
