#!/usr/bin/env node
/**
 * Protect a backup from automatic retention deletion.
 * Usage: node scripts/backup/protect-backup.mjs project VINCIS_Backup_2026-06-30_12-00.zip
 */
import { protectBackup } from "./lib/retention.mjs";

const [category, fileName] = process.argv.slice(2);
if (!category || !fileName || !["project", "database"].includes(category)) {
  console.error("Usage: node scripts/backup/protect-backup.mjs <project|database> <filename>");
  process.exit(1);
}

protectBackup(category, fileName);
console.log(JSON.stringify({ ok: true, category, fileName, protected: true }));
