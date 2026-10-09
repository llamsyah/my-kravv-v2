import assert from "node:assert/strict";
import test from "node:test";
import {
  legacyThoughtDestination,
  legacyThoughtHashDestination,
  readThoughtSearch,
} from "../features/companies/legacy-navigation.ts";
const company = "aa95e6ab-9804-4a96-9826-aa4fb12bbd2c";
const first = "7b606b91-0592-4ab2-a370-4e2111c28737";
const second = "a8ec2b0a-23bc-4d12-94d9-c8bbdb6e3f3d";
const before = `2026-10-08T08:00:00.000Z|${first}`;
const root = `/companies/${company}/thoughts`;
test("normal root and management-only context remain Overview", () => {
  assert.equal(legacyThoughtDestination(company, {}), null);
  assert.equal(legacyThoughtDestination(company, { deleted: "company" }), null);
  assert.equal(legacyThoughtHashDestination(company, "#data-control"), null);
});
test("legacy history dispatch preserves validated cursor, focus, saved and deletion context", () => {
  const result = legacyThoughtDestination(company, {
    before,
    focus: first,
    saved: second,
    deleted: "thought",
  });
  const url = new URL(result!, "http://localhost");
  assert.equal(url.pathname, root);
  assert.equal(url.searchParams.get("before"), before);
  assert.equal(url.searchParams.get("focus"), first);
  assert.equal(url.searchParams.get("saved"), second);
  assert.equal(url.searchParams.get("deleted"), "thought");
  assert.equal(url.hash, `#thought-${second}`);
  assert.equal(
    legacyThoughtDestination(company, { focus: first }),
    `${root}?focus=${first}#thought-${first}`,
  );
  assert.equal(
    legacyThoughtDestination(company, { saved: first.toUpperCase() }),
    `${root}?saved=${first}#thought-${first}`,
  );
});
test("invalid/repeated legacy values dispatch to the safe first history page without forwarding input", () => {
  for (const search of [
    { before: "bad" },
    { before: [before, "bad"] },
    { saved: "//outside.test" },
    { focus: [first, second] },
  ])
    assert.equal(
      legacyThoughtDestination(company, search),
      `${root}#thought-history-title`,
    );
  assert.deepEqual(
    readThoughtSearch({
      before: "bad",
      focus: "javascript:alert(1)",
      saved: [first],
      deleted: "other",
    }),
    { cursor: undefined, focus: undefined, saved: undefined, deleted: false },
  );
});
test("hash-only compatibility allowlists exact history and UUID targets; unknown fragments cannot loop", () => {
  assert.equal(
    legacyThoughtHashDestination(company, "#thought-history-title"),
    `${root}#thought-history-title`,
  );
  assert.equal(
    legacyThoughtHashDestination(company, `#thought-${first}`),
    `${root}?focus=${first}#thought-${first}`,
  );
  for (const hash of [
    "",
    "#unknown",
    "#thought-",
    "#thought-history-title-more",
    `#thought-${first}/edit`,
    "#data-control",
    "#thought-//outside.test",
  ])
    assert.equal(legacyThoughtHashDestination(company, hash), null);
});
