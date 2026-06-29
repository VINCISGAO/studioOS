#!/usr/bin/env node
/**
 * Full daily backup: project ZIP + database SQL + optional cloud upload + retention.
 * Usage: npm run backup:daily
 */
import { createDatabaseBackup } from "./database-backup.mjs";
import { createProjectBackup } from "./project-backup.mjs";
import { logBackup } from "./lib/logger.mjs";

async function main() {
  logBackup("=== DAILY BACKUP START ===");
  const project = await createProjectBackup();
  let database = null;
  try {
    database = await createDatabaseBackup();
  } catch (error) {
    logBackup(`DATABASE BACKUP SKIPPED: ${error instanceof Error ? error.message : String(error)}`);
  }
  logBackup("=== DAILY BACKUP COMPLETE ===");
  console.log(JSON.stringify({ ok: true, project, database }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
