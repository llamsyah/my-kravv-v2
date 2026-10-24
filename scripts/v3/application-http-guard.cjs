/* eslint-disable @typescript-eslint/no-require-imports -- Node startup preload. */
// Parent and every Next worker use the same private, exclusive ledger.
const http = require("node:http");
const { applicationAuthority } = require("./application-authority.ts");
const emit = http.Server.prototype.emit;
http.Server.prototype.emit = function (event, ...args) {
  if (event !== "request") return emit.call(this, event, ...args);
  const [request, response] = args;
  const deny = () => {
    response.writeHead(503, { "Cache-Control": "private, no-store" });
    response.end("Application window unavailable.");
  };
  try {
    if (
      (request.headers["x-forwarded-host"] &&
        request.headers["x-forwarded-host"] !== "127.0.0.1:3103") ||
      (request.headers["x-forwarded-proto"] &&
        request.headers["x-forwarded-proto"] !== "http")
    )
      throw Error();
    const url = new URL(request.url, "http://127.0.0.1:3103");
    if (url.origin !== "http://127.0.0.1:3103") throw Error();
    applicationAuthority()
      .http(
        request.method,
        request.headers.host ?? "",
        request.headers.origin,
        url.pathname,
      )
      .then(() => {
        // Prevent browser SDK or other browser Cloud calls; only Server Actions.
        response.setHeader(
          "Content-Security-Policy",
          "connect-src 'self'; form-action 'self'; frame-ancestors 'none'",
        );
        response.setHeader("Referrer-Policy", "no-referrer");
        emit.call(this, event, ...args);
      })
      .catch(deny);
  } catch {
    deny();
  }
  return true;
};
// The owned root process has an IPC channel. Parent death closes that process;
// the shared heartbeat independently denies Cloud I/O in any surviving worker.
if (process.send) process.once("disconnect", () => process.exit(1));
