// Optional loopback-only viewer. Serves this artifact folder, never the app.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, extname, sep } from "node:path";
const root = fileURLToPath(new URL(".", import.meta.url));
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".jpg": "image/jpeg",
  ".md": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};
createServer(async (req, res) => {
  try {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405);
      res.end();
      return;
    }
    const path = resolve(
      root,
      "." +
        decodeURIComponent(
          new URL(req.url, "http://localhost").pathname === "/"
            ? "/index.html"
            : new URL(req.url, "http://localhost").pathname,
        ),
    );
    if (
      !path.startsWith(root.endsWith(sep) ? root : root + sep) ||
      !types[extname(path)]
    ) {
      res.writeHead(404);
      res.end();
      return;
    }
    const data = await readFile(path);
    res.writeHead(200, {
      "Content-Type": types[extname(path)],
      "Cache-Control": "no-store",
      "Content-Security-Policy":
        "default-src 'none'; style-src 'self'; font-src 'self'; img-src 'self'; script-src 'none'; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'",
    });
    res.end(req.method === "HEAD" ? undefined : data);
  } catch {
    res.writeHead(404);
    res.end();
  }
}).listen(4175, "127.0.0.1", () =>
  console.log("Static design viewer: http://127.0.0.1:4175/"),
);
