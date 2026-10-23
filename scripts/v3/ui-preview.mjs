// Offline fixture preview, separate from Next app execution. No environment/credential loader.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { createRequire } from "node:module";
const args = process.argv.slice(2);
if (args.length > 1 || (args.length === 1 && args[0] !== "--check"))
  throw Error("Only an optional offline --check is supported.");
const require = createRequire(import.meta.url);
const { webpack } = require("next/dist/compiled/webpack/webpack");
const root = path.resolve(import.meta.dirname, "../..");
const fixtures = path.join(root, "scripts/v3/ui-preview");
const output = fs.mkdtempSync(path.join(os.tmpdir(), "my-kravv-v3-ui-"));
const cleanup = () => {
  const target = path.resolve(output);
  if (
    path.dirname(target) !== path.resolve(os.tmpdir()) ||
    !path.basename(target).startsWith("my-kravv-v3-ui-")
  )
    throw Error("Refusing unexpected preview cleanup path");
  fs.rmSync(target, { recursive: true, force: true });
};
const mock = path.join(fixtures, "mocks.tsx");
const actions = new Set(
  ["src/features/foundation/actions", "src/features/auth/actions"].map((file) =>
    path.join(root, file),
  ),
);
const compiler = webpack({
  mode: "development",
  devtool: false,
  target: "web",
  context: root,
  entry: path.join(fixtures, "entry.tsx"),
  output: { path: output, filename: "preview.js" },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "@": path.join(root, "src"),
      "next/link$": mock,
      "next/navigation$": mock,
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: path.join(fixtures, "loader.cjs"),
      },
      {
        test: /\.module\.css$/,
        use: [
          path.join(fixtures, "style.cjs"),
          {
            loader: path.join(fixtures, "loader.cjs"),
            options: {
              modules: {
                exportLocalsConvention: "asIs",
                getLocalIdent: (_context, _ident, name) => "v3preview_" + name,
              },
              esModule: true,
              import: false,
              url: false,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new webpack.NormalModuleReplacementPlugin(
      /actions(?:\.ts)?$/,
      (resource) => {
        const resolved = path
          .resolve(resource.context, resource.request)
          .replace(/\.ts$/, "");
        if (!actions.has(resolved))
          throw Error("Unreviewed preview action import");
        resource.request = mock;
      },
    ),
    new webpack.NormalModuleReplacementPlugin(
      /server-only|supabase|v3-cloud-execution/,
      () => {
        throw Error("Backend code forbidden in fixture bundle");
      },
    ),
  ],
});
try {
  await new Promise((resolve, reject) =>
    compiler.run((error, stats) => {
      if (error || stats.hasErrors())
        reject(
          Error(error?.message ?? stats.toString({ all: false, errors: true })),
        );
      else resolve();
    }),
  );
} catch (error) {
  cleanup();
  throw error;
} finally {
  await new Promise((resolve) => compiler.close(resolve));
}
if (args[0] === "--check") {
  cleanup();
  console.log(
    "Offline UI fixture bundle verified; no server or backend started.",
  );
  process.exit(0);
}
const css = [
  "src/styles/tokens.css",
  "src/styles/typography.css",
  "src/styles/controls.css",
  "src/app/globals.css",
]
  .map((file) =>
    fs
      .readFileSync(path.join(root, file), "utf8")
      .replace(/^@import[^;]+;/gm, ""),
  )
  .join("\n");
const html =
  '<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MY KRAVV V3 — Pratinjau UI sintetis</title><style>@font-face{font-family:InterPreview;src:url(/font.woff2)}:root{--font-inter:InterPreview;--font-source-serif:Georgia}' +
  css +
  '</style><div style="padding:8px;text-align:center;background:#e8f0e8;color:#294832;font:12px sans-serif">Pratinjau UI lokal · data sintetis · semua operasi server dimock</div><div id="preview"></div><script src="/preview.js"></script></html>';
const server = http.createServer((req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; font-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'",
  );
  if (req.method !== "GET") {
    res.writeHead(405);
    res.end();
    return;
  }
  const url = new URL(req.url, "http://127.0.0.1");
  if (url.pathname === "/preview.js") {
    res.setHeader("Content-Type", "text/javascript");
    res.end(fs.readFileSync(path.join(output, "preview.js")));
    return;
  }
  if (url.pathname === "/font.woff2") {
    res.setHeader("Content-Type", "font/woff2");
    res.end(
      fs.readFileSync(path.join(root, "src/styles/fonts/InterVariable.woff2")),
    );
    return;
  }
  if (!["/", "/foundation"].includes(url.pathname)) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(html);
});
server.listen(3104, "127.0.0.1", () =>
  console.log(
    "Synthetic UI preview: http://127.0.0.1:3104/foundation?view=companies",
  ),
);
const stop = () =>
  server.close(() => {
    cleanup();
    process.exit();
  });
server.on("error", () => {
  cleanup();
  console.error("Synthetic preview could not bind its loopback port.");
  process.exitCode = 1;
});
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setTimeout(stop, 30 * 60 * 1000).unref();
