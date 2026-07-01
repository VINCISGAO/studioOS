/**
 * Runs happy-path transaction verify with script runtime flag set before module load.
 */
process.env.STUDIOOS_SCRIPT_RUNTIME = "verify";

import("../happy-path-transaction-verify").catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
