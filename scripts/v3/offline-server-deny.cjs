/* eslint-disable @typescript-eslint/no-require-imports -- Node startup preload. */
// Closed-gate smoke ONLY. No public credentials and no outbound Node network.
const net = require("node:net");
const listen = net.Server.prototype.listen;
require("./offline-network-deny.cjs");
const deny = net.Server.prototype.listen;
// net.listen resolves even a numeric host through dns.lookup. Resolve this
// fixed literal in memory, never through DNS or an outbound socket.
require("node:dns").lookup = (hostname, options, callback) => {
  if (hostname !== "127.0.0.1") return deny();
  const cb = typeof options === "function" ? options : callback;
  process.nextTick(() =>
    options?.all
      ? cb(null, [{ address: "127.0.0.1", family: 4 }])
      : cb(null, "127.0.0.1", 4),
  );
};
net.Server.prototype.listen = function (...args) {
  if (args[0] !== 3103 || args[1] !== "127.0.0.1") return deny();
  return listen.apply(this, args);
};
if (process.send) process.once("disconnect", () => process.exit(1));
