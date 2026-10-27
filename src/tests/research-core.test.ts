import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import {
  draftFields,
  textChanges,
  researchHref,
} from "../features/research/contract.ts";
import {
  WritingSession,
  clearResearchRecovery,
} from "../features/research/session.ts";
import {
  mutateResearch,
  getResearchDraft,
  listResearchDrafts,
  researchHistory,
  researchSource,
} from "../server/research/service.ts";
import { researchFixture, A, B, uuid } from "./helpers/research-fixture.ts";
import type { ResearchMutation } from "../server/research/service.ts";
const fields = {
  title: "Pertanyaan",
  body: "  Apa yang berubah?\r\n😀  ",
  mode: "guided" as const,
  company_id: uuid(1),
};
function storage() {
  const values = new Map<string, string>();
  return {
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
    values,
  };
}
async function start(f = researchFixture(), source: string | null = null) {
  const result = await mutateResearch(
    f.client,
    {
      kind: "create",
      operation: uuid(90),
      title: fields.title,
      mode: "blank",
      company_id: source ? uuid(1) : null,
      capture_id: source,
    },
    A,
  );
  assert.ok(result.draft);
  return { f, d: result.draft };
}
test("Authored text and guidance modes preserve exact content; invalid text/bounds/ownership envelopes fail", () => {
  assert.deepEqual(draftFields.parse(fields), fields);
  for (const v of [
    { ...fields, title: " " },
    { ...fields, body: "x".repeat(100001) },
    { ...fields, body: "\ud800" },
    { ...fields, body: "\0" },
    { ...fields, user_id: B },
  ])
    assert.equal(draftFields.safeParse(v).success, false);
  const diff = textChanges("a\nb\nc", "a\nnew\nc");
  assert.deepEqual(diff, {
    unchanged: 1,
    removed: ["b"],
    added: ["new"],
    trailing: 1,
  });
  assert.equal(textChanges("same", "same").removed.length, 0);
  assert.equal(
    researchHref(undefined, undefined, uuid(3)),
    "/foundation?view=research&capture=" + uuid(3),
  );
});
test("Capture → draft preserves source and deduplicates repeated intentional opens without losing later edits", async () => {
  const f = researchFixture(),
    original = structuredClone(f.captures[0]),
    { d } = await start(f, uuid(3));
  assert.equal(d.body, original.raw_text);
  assert.equal(d.source_capture_id, original.id);
  const saved = await mutateResearch(
    f.client,
    { kind: "save", operation: uuid(91), id: d.id, expected: 1, fields },
    A,
  );
  assert.equal(saved.draft?.revision, 2);
  const reopened = await mutateResearch(
    f.client,
    {
      kind: "create",
      operation: uuid(92),
      title: "Other title",
      mode: "assisted",
      company_id: null,
      capture_id: uuid(3),
    },
    A,
  );
  assert.equal(reopened.draft?.id, d.id);
  assert.equal(reopened.draft?.body, fields.body);
  assert.equal(f.drafts.length, 1);
  assert.deepEqual(f.captures[0], original);
});
test("Draft directory resolves only current-page owned Company names and rejects unverified associations", async () => {
  const { f, d } = await start(researchFixture(), uuid(3));
  const page = await listResearchDrafts(f.client, 0);
  assert.equal(page.items[0].id, d.id);
  assert.equal(page.items[0].company_name, "Synthetic A");
  const lookup = f.journal.filter((v) => v.name === "companies").at(-1)!;
  assert.deepEqual(lookup.filters, [
    ["user_id", A],
    ["id", [uuid(1)]],
  ]);
  f.drafts[0].company_id = uuid(2); // Poisoned/foreign projection must not be shown.
  await assert.rejects(() => listResearchDrafts(f.client, 0));
});

test("Save uses expected revision and stable operation receipts; concurrent stale writes never overwrite", async () => {
  const { f, d } = await start();
  const m = {
    kind: "save" as const,
    operation: uuid(91),
    id: d.id,
    expected: 1,
    fields,
  };
  const [one, two] = await Promise.all([
    mutateResearch(f.client, m, A),
    mutateResearch(f.client, m, A),
  ]);
  assert.equal(one.draft?.revision, 2);
  assert.equal(two.draft?.revision, 2);
  await assert.rejects(
    () =>
      mutateResearch(
        f.client,
        { ...m, operation: uuid(92), fields: { ...fields, body: "stale" } },
        A,
      ),
    (e) => e instanceof Error && e.message.includes("Versi server"),
  );
  await assert.rejects(() =>
    mutateResearch(
      f.client,
      { ...m, fields: { ...fields, body: "changed-key" } },
      A,
    ),
  );
  assert.equal(f.drafts[0].body, fields.body);
});
test("Explicit Thought commits create immutable ordered versions; restore changes only the Working Tree", async () => {
  const { f, d } = await start();
  await mutateResearch(
    f.client,
    { kind: "save", operation: uuid(91), id: d.id, expected: 1, fields },
    A,
  );
  const commit = {
    kind: "commit" as const,
    operation: uuid(92),
    id: d.id,
    expected: 2,
    latest: 0,
    message: "Premis awal",
  };
  const first = await mutateResearch(f.client, commit, A),
    replay = await mutateResearch(f.client, commit, A);
  assert.equal(first.version?.id, replay.version?.id);
  assert.equal(f.versions.length, 1);
  const snapshot = structuredClone(first.version!);
  await mutateResearch(
    f.client,
    {
      kind: "save",
      operation: uuid(93),
      id: d.id,
      expected: 2,
      fields: { ...fields, body: "Interpretasi baru" },
    },
    A,
  );
  await assert.rejects(() =>
    mutateResearch(
      f.client,
      { ...commit, operation: uuid(94), expected: 3 },
      A,
    ),
  );
  const second = await mutateResearch(
    f.client,
    {
      ...commit,
      operation: uuid(95),
      expected: 3,
      latest: 1,
      message: "Tesis berkembang",
    },
    A,
  );
  assert.equal(second.version?.number, 2);
  assert.equal(second.version?.thought_id, first.version?.thought_id);
  const restored = await mutateResearch(
    f.client,
    {
      kind: "restore",
      operation: uuid(96),
      id: d.id,
      expected: 3,
      version: first.version!.id,
    },
    A,
  );
  assert.equal(restored.draft?.revision, 4);
  assert.equal(restored.draft?.body, fields.body);
  assert.deepEqual(f.versions[0], snapshot);
  assert.equal(f.versions.length, 2);
  const history = await researchHistory(f.client, d.id);
  assert.deepEqual(
    history.items.map((v) => v.number),
    [2, 1],
  );
});
test("Foreign/anonymous reads, mutations, company links and capture sources fail without disclosure", async () => {
  const { f, d } = await start();
  f.setActor(B);
  assert.equal(await getResearchDraft(f.client, d.id), null);
  assert.equal((await listResearchDrafts(f.client, 0)).items.length, 0);
  await assert.rejects(() =>
    mutateResearch(
      f.client,
      { kind: "save", operation: uuid(91), id: d.id, expected: 1, fields },
      B,
    ),
  );
  await assert.rejects(() =>
    mutateResearch(
      f.client,
      {
        kind: "create",
        operation: uuid(92),
        title: "Foreign",
        mode: "blank",
        company_id: uuid(1),
        capture_id: null,
      },
      B,
    ),
  );
  await assert.rejects(() =>
    mutateResearch(
      f.client,
      {
        kind: "create",
        operation: uuid(93),
        title: "Foreign",
        mode: "blank",
        company_id: null,
        capture_id: uuid(3),
      },
      B,
    ),
  );
  await assert.rejects(() => researchSource(f.client, uuid(3)));
  await assert.rejects(() =>
    mutateResearch(
      f.client,
      {
        kind: "create",
        operation: uuid(94),
        title: "stale A form",
        mode: "blank",
        company_id: null,
        capture_id: null,
      },
      A,
    ),
  );
  f.setActor(null);
  await assert.rejects(() => getResearchDraft(f.client, d.id));
  assert.equal(f.drafts.length, 1);
});
test("Single-flight save does not erase newer input; uncertain retries retain exact payload and operation", async () => {
  const { d } = await start();
  const s = storage(),
    sent: ResearchMutation[] = [];
  let resolve!: (v: { ok: boolean; draft: typeof d }) => void;
  const session = new WritingSession(
    d,
    async (m) => {
      sent.push(structuredClone(m));
      return await new Promise<{ ok: boolean; draft: typeof d }>((r) => {
        resolve = r;
      });
    },
    () => s,
    () => uuid(91),
  );
  const stop = session.subscribe(() => {});
  session.edit(fields);
  const pending = session.save();
  await session.save();
  assert.equal(sent.length, 1);
  session.edit({ ...fields, body: "newer" });
  resolve({ ok: true, draft: { ...d, ...fields, revision: 2 } });
  await pending;
  assert.equal(session.getSnapshot().fields.body, "newer");
  assert.equal(session.getSnapshot().status, "dirty");
  assert.equal(session.getSnapshot().revision, 2);
  stop();
  const s2 = storage(),
    attempts: ResearchMutation[] = [];
  const uncertain = new WritingSession(
    d,
    async (m) => {
      attempts.push(structuredClone(m));
      throw Error("PRIVATE");
    },
    () => s2,
    () => uuid(92),
  );
  const end = uncertain.subscribe(() => {});
  uncertain.edit(fields);
  await uncertain.save();
  uncertain.edit({ ...fields, body: "later" });
  await uncertain.save();
  assert.deepEqual(attempts[0], attempts[1]);
  assert.equal(uncertain.getSnapshot().fields.body, "later");
  assert.equal(uncertain.getSnapshot().status, "uncertain");
  end();
});
test("Recovery is owner/project scoped, preserves pending writes, handles conflicts and reports storage failure", async () => {
  const { d } = await start();
  const s = storage();
  const session = new WritingSession(
    d,
    async () => ({ ok: false, code: "conflict", error: "conflict" }),
    () => s,
    () => uuid(91),
  );
  const stop = session.subscribe(() => {});
  session.edit(fields);
  await session.save();
  stop();
  const recovered = new WritingSession(
    { ...d, revision: 2 },
    async () => ({ ok: false }),
    () => s,
  );
  const end = recovered.subscribe(() => {});
  assert.equal(recovered.getSnapshot().fields.body, fields.body);
  assert.equal(recovered.getSnapshot().status, "uncertain");
  recovered.acceptServer({ ...d, revision: 3 }, true);
  assert.equal(recovered.getSnapshot().revision, 3);
  assert.equal(recovered.getSnapshot().status, "dirty");
  end();
  const b = new WritingSession(
    { ...d, user_id: B },
    async () => ({ ok: false }),
    () => s,
  );
  const leave = b.subscribe(() => {});
  assert.equal(b.getSnapshot().fields.body, d.body);
  leave();
  assert.ok(clearResearchRecovery(B, s));
  assert.ok(![...s.values.keys()].some((k) => k.includes(A)));
  const broken = new WritingSession(
    d,
    async () => ({ ok: false }),
    () => {
      throw Error("quota");
    },
  );
  const done = broken.subscribe(() => {});
  broken.edit(fields);
  assert.equal(broken.getSnapshot().storageError, true);
  assert.equal(broken.getSnapshot().fields.body, fields.body);
  done();
});
test("Logout revokes in-flight recovery before unmount and a late response cannot resurrect the prior account buffer", async () => {
  const { d } = await start();
  const s = storage();
  let finish!: (value: { ok: boolean; draft: typeof d }) => void;
  const session = new WritingSession(
    d,
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
    () => s,
  );
  const stop = session.subscribe(() => {});
  session.edit(fields);
  const flight = session.save();
  assert.equal(s.length, 1);
  assert.ok(clearResearchRecovery(undefined, s));
  assert.equal(s.length, 0);
  stop();
  finish({ ok: true, draft: { ...d, ...fields, revision: 2 } });
  await flight;
  session.edit({ ...fields, body: "late old account edit" });
  assert.equal(s.length, 0);
  assert.equal(await session.save(), false);
});

test("Research UI is reachable with no fake persistence, escaped snapshots and functional commit/AI controls", async () => {
  const { d } = await start();
  const state = {
    ready: true,
    failed: false,
    items: [],
    hasNext: false,
    page: 0,
    selected: { ...d, body: "<script>untrusted</script>" },
    history: [],
    historyHasNext: false,
    source: null,
    unavailable: false,
  };
  const child = spawnSync(
    process.execPath,
    ["src/tests/helpers/v3-workspace-render.mjs"],
    {
      input: JSON.stringify({
        companies: [],
        ownerId: A,
        location: { view: "research" },
        researchState: state,
      }),
      encoding: "utf8",
      timeout: 20000,
    },
  );
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /Ruang Tulis/);
  assert.match(child.stdout, /Rekam Thought v1/);
  assert.match(child.stdout, /Clarify/);
  assert.match(child.stdout, /&lt;script&gt;untrusted/);
  assert.doesNotMatch(child.stdout, /<script>untrusted/);
});
test("Research SQL has separate Thought identity, CAS/receipt writes, immutable trigger and no ordinary raw writes", () => {
  const sql = fs.readFileSync(
    "supabase/v3-research-core/001-research-core.sql",
    "utf8",
  );
  assert.match(sql, /create table public.research_thoughts/);
  assert.match(sql, /unique\(draft_id,number\)/);
  assert.match(sql, /before update or delete on public.research_versions/);
  assert.match(sql, /d.revision is distinct from p_expected/);
  assert.match(sql, /latest is distinct from p_latest/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /sha256\(/);
  assert.match(sql, /Research capture owner mismatch/);
  assert.doesNotMatch(
    sql,
    /on delete cascade|grant (?:insert|update|delete|all)|drop table|truncate table/i,
  );
  assert.match(sql, /foreign key\(thought_id,draft_id,user_id\)/);
});
