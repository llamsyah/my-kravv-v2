// Offline SSR harness: real UI components, synthetic props, inert Next navigation/actions.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const root = process.cwd();
const require = createRequire(path.join(root, "package.json"));
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const loadedModule = { exports: {} };
  cache.set(file, loadedModule);
  const customRequire = (name) => {
    if (name === "next/link")
      return {
        __esModule: true,
        default: ({ children, ...props }) =>
          React.createElement("a", props, children),
      };
    if (name === "next/navigation")
      return {
        useRouter: () => ({
          replace() {
            throw Error("Unexpected navigation during SSR");
          },
          refresh() {
            throw Error("Unexpected refresh during SSR");
          },
        }),
      };
    if (
      (name === "./actions" &&
        file.endsWith(path.join("captures", "inbox.tsx"))) ||
      name.endsWith("/auth/actions") ||
      name.endsWith("/foundation/actions") ||
      (name === "./actions" &&
        file.endsWith(path.join("auth", "logout-form.tsx")))
    )
      return {
        saveCaptureAction: async () => {
          throw Error("Offline actions blocked");
        },
        findCaptureCompaniesAction: async () => {
          throw Error("Offline actions blocked");
        },
        logout: async () => {
          throw Error("Offline actions blocked");
        },
        saveFoundationCompanyAction: async () => {
          throw Error("Offline actions blocked");
        },
      };
    if (name.endsWith(".module.css"))
      return {
        __esModule: true,
        default: new Proxy({}, { get: (_, key) => String(key) }),
      };
    if (name.startsWith(".") || name.startsWith("@/")) {
      const base = name.startsWith("@/")
        ? path.join(root, "src", name.slice(2))
        : path.resolve(path.dirname(file), name);
      const target = [base, base + ".tsx", base + ".ts"].find((candidate) =>
        fs.existsSync(candidate),
      );
      if (!target) throw Error("Missing UI module");
      return load(target);
    }
    return require(name);
  };
  const source = fs.readFileSync(file, "utf8");
  const output = ts.transpileModule(source, {
    fileName: file,
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  new Function("require", "module", "exports", output)(
    customRequire,
    loadedModule,
    loadedModule.exports,
  );
  return loadedModule.exports;
}
const props = JSON.parse(fs.readFileSync(0, "utf8"));
const { V3Workspace } = load(
  path.join(root, "src/features/v3-workspace/workspace.tsx"),
);
process.stdout.write(
  renderToStaticMarkup(React.createElement(V3Workspace, props)),
);
