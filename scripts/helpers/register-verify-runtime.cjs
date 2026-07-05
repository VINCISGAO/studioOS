/** Verify/seed runtime: load env + stub server-only for tsx scripts. */
require("./load-env.cjs");

process.env.STUDIOOS_SCRIPT_RUNTIME = process.env.STUDIOOS_SCRIPT_RUNTIME || "verify";

/** Verify scripts run long sequential flows — allow more time to acquire interactive transactions. */
if (!process.env.PRISMA_TX_MAX_WAIT) {
  process.env.PRISMA_TX_MAX_WAIT = "30000";
}
if (!process.env.PRISMA_TX_TIMEOUT) {
  process.env.PRISMA_TX_TIMEOUT = "120000";
}

const Module = require("node:module");
const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "server-only") {
    return {};
  }
  return originalLoad.call(this, request, parent, isMain);
};
