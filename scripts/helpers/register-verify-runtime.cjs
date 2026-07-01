/** Verify/seed runtime: load env + stub server-only for tsx scripts. */
require("./load-env.cjs");

process.env.STUDIOOS_SCRIPT_RUNTIME = process.env.STUDIOOS_SCRIPT_RUNTIME || "verify";

const Module = require("node:module");
const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "server-only") {
    return {};
  }
  return originalLoad.call(this, request, parent, isMain);
};
