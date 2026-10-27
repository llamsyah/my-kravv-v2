// Offline event regression: actual capture component/actions; synthetic hooks and service.
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import * as jsx from "react/jsx-runtime";
import * as contract from "../../features/captures/contract.ts";
import * as model from "../../features/v3-workspace/model.ts";
import * as researchContract from "../../features/research/contract.ts";
let store = [],
  cursor = 0,
  fail = true,
  currentOwner = "20000000-0000-4000-8000-000000000001";
const A = currentOwner,
  B = "20000000-0000-4000-8000-000000000002";
let writes = 0,
  invalidations = 0;
const sent = [],
  routes = [];
globalThis.fetch = () => {
  throw Error("Network forbidden");
};
globalThis.window = { addEventListener() {}, removeEventListener() {} };
const hooks = {
  useState(initial) {
    const index = cursor++;
    if (!(index in store)) store[index] = initial;
    const ownerStore = store;
    return [
      ownerStore[index],
      (value) => {
        ownerStore[index] = value;
      },
    ];
  },
  useRef(initial) {
    const index = cursor++;
    return (store[index] ??= { current: initial });
  },
  useEffect() {},
};
function load(file, imports) {
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    fileName: file,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exported = {};
  new Function("require", "exports", output)((name) => {
    assert.ok(name in imports, "Unexpected dependency: " + name);
    return imports[name];
  }, exported);
  return exported;
}
const actions = load("src/features/captures/actions.ts", {
  "next/cache": {
    revalidatePath() {
      invalidations++;
    },
  },
  "../../server/auth/client.ts": {
    createSupabaseServerClient: async () => ({}),
  },
  "../../server/foundation/service.ts": {
    verifiedOwner: async () => currentOwner,
    FoundationError: class extends Error {},
  },
  "../../server/foundation/management.ts": {
    companyManagementReady: async () => true,
    loadCompanyDirectory: async () => ({ items: [], hasNext: false }),
  },
  "../../server/captures/service.ts": {
    createCapture: async (_, input) => {
      writes++;
      return {
        ...input,
        id: "30000000-0000-4000-8000-000000000001",
        user_id: currentOwner,
        created_at: "2026-10-26T01:00:00.000Z",
      };
    },
  },
});
const { CaptureInbox } = load("src/features/captures/inbox.tsx", {
  react: hooks,
  "react/jsx-runtime": jsx,
  "next/link": { __esModule: true, default: () => null },
  "next/navigation": {
    useRouter: () => ({ replace: (href) => routes.push(href), refresh() {} }),
  },
  "./contract": contract,
  "../research/contract": researchContract,
  "../v3-workspace/model": model,
  "./inbox.module.css": {
    __esModule: true,
    default: new Proxy({}, { get: (_, k) => k }),
  },
  "./actions": {
    saveCaptureAction: async (input, owner) => {
      sent.push(structuredClone(input));
      return fail
        ? { error: "Offline uncertain response" }
        : actions.saveCaptureAction(input, owner);
    },
    findCaptureCompaniesAction: actions.findCaptureCompaniesAction,
  },
});
const state = {
  ready: true,
  failed: false,
  items: [],
  page: 0,
  hasNext: false,
};
function draw(ownerId = A, stateValue = state) {
  cursor = 0;
  return CaptureInbox({ ownerId, state: stateValue });
}
function nodes(value) {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object") return [];
  return [value, ...nodes(value.props?.children)];
}
function one(tree, predicate) {
  const found = nodes(tree).filter(predicate);
  assert.equal(found.length, 1);
  return found[0];
}
const text = (tree) => one(tree, (n) => n.type === "textarea");
const form = (tree) => one(tree, (n) => n.type === "form");
const event = { preventDefault() {} };
let tree = draw();
const raw = "  Pertanyaan 😀\n\nApa yang berubah?  ";
text(tree).props.onChange({ target: { value: raw } });
tree = draw();
await Promise.all([
  form(tree).props.onSubmit(event),
  form(tree).props.onSubmit(event),
]);
assert.equal(sent.length, 1, "Double submit is locked synchronously");
assert.equal(sent[0].raw_text, raw);
tree = draw();
assert.equal(text(tree).props.value, raw);
assert.equal(text(tree).props.readOnly, true);
await form(tree).props.onSubmit(event);
assert.equal(sent.length, 2);
assert.deepEqual(
  sent[0],
  sent[1],
  "Uncertain save retries identical payload/key",
);
fail = false;
tree = draw();
await form(tree).props.onSubmit(event);
assert.equal(writes, 1);
assert.equal(invalidations, 1);
tree = draw();
assert.equal(text(tree).props.value, "");
assert.equal(text(tree).props.readOnly, false);
assert.deepEqual(routes, ["/foundation?view=captures"]);
// Stale mounted A form cannot create a capture in B's authenticated session.
currentOwner = B;
const denied = await actions.saveCaptureAction(sent[0], A);
assert.ok(denied.error);
assert.equal(writes, 1);
assert.equal(invalidations, 1);
const deniedPicker = await actions.findCaptureCompaniesAction("", 0, A);
assert.ok(deniedPicker.error);
// Real page keys the entire workspace by user.id; fresh B component state has no A draft.
store = [];
tree = draw(B);
assert.equal(text(tree).props.value, "");
assert.equal(
  nodes(tree).some(
    (n) =>
      typeof n.props?.children === "string" && n.props.children.includes(raw),
  ),
  false,
);
text(tree).props.onChange({ target: { value: "B draft" } });
tree = draw(B, { ...state, ready: false });
const count = sent.length;
await form(tree).props.onSubmit(event);
assert.equal(sent.length, count);
console.log("CAPTURE_INTERACTIONS_PASS");
