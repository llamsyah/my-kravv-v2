// Isolated event-level regression: actual workspace/sidebar components, inert effects.
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import * as jsx from "react/jsx-runtime";
import * as model from "../../features/v3-workspace/model.ts";
import * as theme from "../../features/v3-workspace/theme-preference.ts";
import * as management from "../../features/v3-workspace/management-contract.ts";

let compact = false,
  store,
  cursor;
const values = new Map();
const originalRoute =
  "/foundation?view=company&company=10000000-0000-4000-8000-000000000001";
let route = originalRoute,
  directNavigations = 0;
globalThis.window = {
  matchMedia: () => ({ matches: compact }),
  sessionStorage: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  },
  location: {
    get href() {
      return route;
    },
    set href(value) {
      directNavigations++;
      route = value;
    },
  },
};
const preference =
  await import("../../features/v3-workspace/sidebar-preference.ts");
const hooks = {
  useState(initial) {
    const index = cursor++;
    if (!(index in store)) store[index] = initial;
    const current = store;
    return [
      current[index],
      (value) => {
        current[index] = value;
      },
    ];
  },
  useRef(initial) {
    const index = cursor++;
    return (store[index] ??= { current: initial });
  },
  useEffect() {},
  useSyncExternalStore(_subscribe, snapshot) {
    return snapshot();
  },
};
const Link = () => null;
const imports = {
  react: hooks,
  "react/jsx-runtime": jsx,
  "next/link": { __esModule: true, default: Link },
  "../../components/ui/icon": { Icon: () => null },
  "../auth/logout-form": { LogoutForm: () => null },
  "./company-editor": { CompanyEditor: () => null },
  "./model": model,
  "./sidebar-preference": preference,
  "./theme-preference": theme,
  "./management-contract": management,
  "./directory-controls": {
    CompanySearch: () => null,
    CompanyPagination: () => null,
  },
  "../foundation/actions": {
    saveFoundationThemeAction: () => {
      throw Error("Offline actions blocked");
    },
  },
  "./workspace.module.css": {
    __esModule: true,
    default: new Proxy({}, { get: (_, name) => name }),
  },
};
function load(file) {
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exported = {};
  new Function("require", "exports", output)((name) => {
    assert.ok(name in imports, "Unexpected UI dependency: " + name);
    return imports[name];
  }, exported);
  return exported;
}
const { CompanySidebar } = load(
  "src/features/v3-workspace/company-sidebar.tsx",
);
imports["./company-sidebar"] = { CompanySidebar };
const { V3Workspace } = load("src/features/v3-workspace/workspace.tsx");
const company = {
  id: "10000000-0000-4000-8000-000000000001",
  user_id: "20000000-0000-4000-8000-000000000001",
  name: "Perusahaan Sintetis",
};
const location = Object.freeze({ view: "company", companyId: company.id });
function nodes(element) {
  if (Array.isArray(element)) return element.flatMap(nodes);
  if (!element || typeof element !== "object") return [];
  return [element, ...nodes(element.props?.children)];
}
function one(tree, predicate) {
  const matches = nodes(tree).filter(predicate);
  assert.equal(matches.length, 1);
  return matches[0];
}
function draw(component, props, state) {
  store = state;
  cursor = 0;
  return component(props);
}
for (compact of [false, true]) {
  const workspaceState = [],
    sidebarState = [];
  const props = { companies: [company], location };
  const workspace = () => draw(V3Workspace, props, workspaceState);
  let tree = workspace();
  if (compact) {
    one(
      tree,
      (node) => node.props?.["aria-label"] === "Buka navigasi perusahaan",
    ).props.onClick();
    tree = workspace();
  }
  let selected = one(tree, (node) => node.type === CompanySidebar);
  assert.equal(selected.props.open, true);
  let sidebar = draw(CompanySidebar, selected.props, sidebarState);
  const back = one(
    sidebar,
    (node) => node.props?.["aria-label"] === "Semua perusahaan",
  );
  const close = one(
    sidebar,
    (node) => node.props?.["aria-label"] === "Tutup navigasi perusahaan",
  );
  assert.equal(back.type, Link);
  assert.equal(back.props.href, "/foundation?view=companies");
  assert.equal(close.type, "button");
  assert.equal(close.props.type, "button");
  assert.equal(close.props.href, undefined);
  close.props.onClick();
  tree = workspace();
  selected = one(tree, (node) => node.type === CompanySidebar);
  assert.equal(selected.props.open, false);
  assert.equal(selected.props.company.id, company.id);
  assert.equal(selected.props.location, location);
  assert.equal(route, originalRoute);
  assert.equal(directNavigations, 0);
  const collapsedBack = one(
    tree,
    (node) => node.props?.["aria-label"] === "Semua perusahaan",
  );
  assert.equal(collapsedBack.type, Link);
  assert.equal(collapsedBack.props.href, back.props.href);
  const reopen = one(
    tree,
    (node) => node.props?.["aria-label"] === "Buka navigasi perusahaan",
  );
  assert.equal(reopen.type, "button");
  assert.equal(reopen.props.href, undefined);
  reopen.props.onClick();
  tree = workspace();
  selected = one(tree, (node) => node.type === CompanySidebar);
  assert.equal(selected.props.open, true);
  assert.equal(selected.props.company.id, company.id);
  sidebar = draw(CompanySidebar, selected.props, sidebarState);
  const overview = one(
    one(sidebar, (node) => node.type === "nav"),
    (node) => node.type === Link && node.props["aria-current"] === "page",
  );
  assert.equal(overview.props.href, originalRoute);
  assert.equal(route, originalRoute);
  assert.equal(directNavigations, 0);
  // Following the directory link is the sole navigation action; its mobile handler dismisses the drawer.
  back.props.onClick();
  route = back.props.href;
  assert.equal(route, "/foundation?view=companies");
  if (compact)
    assert.equal(
      one(workspace(), (node) => node.type === CompanySidebar).props.open,
      false,
    );
  route = originalRoute;
}
console.log(
  "Directory navigation and sidebar presentation remain independent on desktop/mobile.",
);
