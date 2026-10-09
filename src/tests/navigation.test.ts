import assert from "node:assert/strict";
import { test } from "node:test";
import {
  companyMonogram,
  companyNavigationItems,
  companyNavigationSection,
  globalNavigationSection,
} from "../features/companies/navigation.ts";

const company = "33333333-3333-4333-8333-333333333333";
const root = `/companies/${company}`;

test("global selection keeps all real Company routes in Perusahaan without prefix collisions", () => {
  assert.equal(globalNavigationSection("/"), "home");
  for (const path of [
    "/companies",
    "/companies/new",
    root,
    `${root}/edit`,
    `${root}/thoughts/t/refine`,
  ]) {
    assert.equal(globalNavigationSection(path), "companies");
  }
  for (const path of ["/auth", "/companies-other", "/company", "/settings"]) {
    assert.equal(globalNavigationSection(path), null);
  }
});

test("nested Refine selects review before general Thought reading; management selects neither", () => {
  const cases = [
    [root, "overview"],
    [`${root}/`, "overview"],
    [`${root}/thoughts`, "thoughts"],
    [`${root}/thoughts/t`, "thoughts"],
    [`${root}/thoughts/t/refine`, "refine"],
    [`${root}/thoughts/t/refine/`, "refine"],
    [`${root}/refinements`, "refine"],
    [`${root}/edit`, null],
    [`${root}/thoughts/t/refine-other`, null],
    [`${root}/thoughts/t/refine/extra`, null],
    [`${root}/thoughts-other`, null],
    [`${root}-other/thoughts`, null],
    ["/companies/another/thoughts/t/refine", null],
    ["/companies/new", null],
  ] as const;
  for (const [path, expected] of cases)
    assert.equal(companyNavigationSection(path, company), expected, path);
});

test("section rollout is explicit and does not add unfinished or future destinations", () => {
  assert.deepEqual(companyNavigationItems(company, []), []);
  assert.deepEqual(
    companyNavigationItems(company, ["overview"]).map(({ href }) => href),
    [root],
  );
  assert.deepEqual(
    companyNavigationItems(company, [
      "refine",
      "overview",
      "thoughts",
      "thoughts",
    ]).map(({ href }) => href),
    [root, `${root}/thoughts`, `${root}/refinements`],
  );
  assert.deepEqual(
    companyNavigationItems(company, ["thoughts"]).map(({ section }) => section),
    ["thoughts"],
  );
});

test("monograms derive only from supplied names and retain Unicode code points", () => {
  assert.equal(companyMonogram("  Rimba   Nusa Pangan  "), "RN");
  assert.equal(companyMonogram("Arunika"), "A");
  assert.equal(companyMonogram("Élan 😀"), "É😀");
});
