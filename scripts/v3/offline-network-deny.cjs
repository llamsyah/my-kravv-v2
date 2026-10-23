/* eslint-disable @typescript-eslint/no-require-imports -- Node --require preloads require CommonJS. */
// Build-only preload, inherited by Node build workers. Never loaded by the app.
// Fixed evidence only: no destinations, URLs, headers, errors or response bodies.
const fs = require("node:fs");
const path = require("node:path");
const deny = () => {
  const marker = path.join(__dirname, "offline-network-attempt");
  try {
    fs.writeFileSync(marker, "BLOCKED\n", { flag: "wx", mode: 0o600 });
  } catch (error) {
    // A swallowed exception must never turn an unrecorded attempt into PASS.
    if (error?.code !== "EEXIST") process.exit(86);
  }
  throw Error(
    "Network is forbidden during isolated offline build verification.",
  );
};
require("node:net").Socket.prototype.connect = deny;
require("node:net").Server.prototype.listen = deny;
require("node:tls").connect = deny;
require("node:http").request = deny;
require("node:http").get = deny;
require("node:https").request = deny;
require("node:https").get = deny;
require("node:http2").connect = deny;
require("node:dgram").createSocket = deny;
const dns = require("node:dns");
for (const key of Object.keys(dns))
  if (/^(lookup|resolve|reverse)/.test(key) && typeof dns[key] === "function")
    dns[key] = deny;
for (const key of Object.keys(dns.promises))
  if (typeof dns.promises[key] === "function") dns.promises[key] = deny;
for (const resolver of [dns.Resolver, dns.promises.Resolver])
  if (resolver?.prototype)
    for (const key of Object.getOwnPropertyNames(resolver.prototype))
      if (/^(resolve|reverse)/.test(key)) resolver.prototype[key] = deny;
globalThis.fetch = deny;
