import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadCompanyResearch } from "../server/research/company-overview.ts";
import { researchFixture, A, B, uuid } from "./helpers/research-fixture.ts";
import {
  workspaceHref,
  workspaceLocation,
} from "../features/v3-workspace/model.ts";
import { directoryHref } from "../features/v3-workspace/management-contract.ts";
import type { Draft, ThoughtVersion } from "../features/research/contract.ts";
test("Offline HTTP Company shell rejects cross-company drafts and preserves owner isolation on Overview, Writing and Thought snapshots", () => {
  const result = spawnSync(
    process.execPath,
    ["src/tests/helpers/v3-application-http.mjs", "--company"],
    {
      encoding: "utf8",
      timeout: 30000,
      windowsHide: true,
      env: {
        SystemRoot: process.env.SystemRoot,
        PATH: process.env.PATH,
        NODE_ENV: "test",
      },
    },
  );
  assert.equal(result.status, 0, result.stderr);
  const evidence = JSON.parse(result.stdout);
  assert.equal(evidence.requests, 54);
  assert.equal(evidence.externalRequests, 0);
  assert.equal(evidence.outcome, "PASS");
});

function draft(n: number, owner = A, company = uuid(1)): Draft {
  return {
    id: uuid(100 + n),
    user_id: owner,
    company_id: company,
    title: "Draft " + n,
    body: "Private draft body",
    mode: "blank",
    revision: 1,
    source_capture_id: null,
    created_at: "2026-10-20T04:00:00Z",
    updated_at: new Date(1800000000000 + n).toISOString(),
  };
}
function version(n: number, owner = A, company = uuid(1)): ThoughtVersion {
  return {
    id: uuid(200 + n),
    user_id: owner,
    company_id: company,
    draft_id: uuid(101),
    thought_id: uuid(900),
    number: n,
    draft_revision: n,
    title: "Committed " + n,
    body: "Immutable private version " + n,
    message: "",
    created_at: new Date(1800000000000 + n).toISOString(),
  };
}

test("Company overview reads bounded newest-first owner/company projections, not bodies or invented totals", async () => {
  const f = researchFixture();
  for (let n = 1; n <= 25; n++) {
    f.drafts.push(draft(n));
    f.versions.push(version(n));
  }
  f.drafts.push(draft(99, B), draft(98, A, uuid(2)));
  f.versions.push(version(99, B), version(98, A, uuid(2)));
  const before = structuredClone({ drafts: f.drafts, versions: f.versions });
  const state = await loadCompanyResearch(f.client, uuid(1));
  assert.equal(state.ready, true);
  assert.equal(state.drafts.length, 20);
  assert.equal(state.draftsHasNext, true);
  assert.equal(state.versions.length, 20);
  assert.equal(state.versionsHasNext, true);
  assert.equal(state.drafts[0].title, "Draft 25");
  assert.equal(state.versions[0].number, 25);
  assert.ok(!("body" in state.drafts[0]));
  assert.ok(!("body" in state.versions[0]));
  assert.ok(
    state.drafts.every((v) => v.company_id === uuid(1) && v.user_id === A),
  );
  for (const entry of f.journal.filter((v) => v.filters))
    assert.ok(
      entry.filters?.some(([k, v]) => k === "user_id" && v === A) &&
        entry.filters.some(([k, v]) => k === "company_id" && v === uuid(1)),
    );
  const second = await loadCompanyResearch(f.client, uuid(1), 1);
  assert.equal(second.versions.length, 5);
  assert.equal(second.versionsHasNext, false);
  assert.equal(second.versions[0].number, 5);
  assert.deepEqual({ drafts: f.drafts, versions: f.versions }, before);
  f.setActor(B);
  assert.equal((await loadCompanyResearch(f.client, uuid(2))).drafts.length, 0);
  f.setActor(null);
  await assert.rejects(() => loadCompanyResearch(f.client, uuid(1)));
});

test("Company Thought snapshots use immutable revision association even after the working draft changes company", async () => {
  const f = researchFixture();
  f.drafts.push(draft(1, A, uuid(2)));
  f.versions.push(version(1));
  const selected = { version: uuid(201), draft: uuid(101) };
  const state = await loadCompanyResearch(f.client, uuid(1), 0, selected);
  assert.equal(state.selectedVersion?.body, "Immutable private version 1");
  assert.equal(state.drafts.length, 0);
  await assert.rejects(() =>
    loadCompanyResearch(f.client, uuid(2), 0, selected),
  );
  f.setActor(B);
  await assert.rejects(() =>
    loadCompanyResearch(f.client, uuid(1), 0, selected),
  );
  assert.equal(f.versions[0].company_id, uuid(1));
});

test("Company summaries reject foreign, wrong-company, duplicate, malformed and oversized responses without partial data", async () => {
  for (const rows of [
    [{ ...draft(1), user_id: B }],
    [{ ...draft(1), company_id: uuid(2) }],
    [draft(1), draft(1)],
    [{ ...draft(1), updated_at: "invalid" }],
    Array.from({ length: 22 }, (_, i) => draft(i)),
  ]) {
    let fields = "";
    const q = {
      select(v: string) {
        fields = v;
        return this;
      },
      eq() {
        return this;
      },
      order() {
        return this;
      },
      range() {
        return this;
      },
      then(resolve: (r: unknown) => void) {
        resolve({
          data: rows.map((row) =>
            Object.fromEntries(
              fields.split(",").map((k) => [k, row[k as keyof Draft]]),
            ),
          ),
          error: null,
        });
      },
    };
    const client = {
      auth: {
        getUser: async () => ({ data: { user: { id: A } }, error: null }),
      },
      rpc: async () => ({ data: 1, error: null }),
      from: () => q,
    } as unknown as SupabaseClient;
    await assert.rejects(() => loadCompanyResearch(client, uuid(1)));
  }
  const f = researchFixture();
  await assert.rejects(() => loadCompanyResearch(f.client, "foreign"));
  await assert.rejects(() => loadCompanyResearch(f.client, uuid(1), 10001));
  assert.equal(f.journal.length, 0);
});

test("Company shell routes preserve context and reject ambiguous or unsupported destinations", () => {
  assert.deepEqual(workspaceLocation({ view: "research", company: uuid(1) }), {
    view: "research",
    companyId: uuid(1),
  });
  assert.deepEqual(
    workspaceLocation({
      view: "company",
      company: uuid(1),
      section: "thoughts",
    }),
    { view: "company", companyId: uuid(1), section: "thoughts" },
  );
  for (const section of [["thoughts", "references"], "foreign"])
    assert.deepEqual(
      workspaceLocation({ view: "company", company: uuid(1), section }),
      { view: "company", companyId: uuid(1) },
    );
  assert.equal(
    workspaceHref("company", uuid(1), "references"),
    "/foundation?view=company&company=" + uuid(1) + "&section=references",
  );
  assert.equal(
    directoryHref("company", "x", 1, uuid(1), undefined, "thoughts"),
    "/foundation?view=company&company=" +
      uuid(1) +
      "&q=x&page=1&section=thoughts",
  );
});
