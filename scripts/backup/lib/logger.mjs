import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { BACKUP_DIRS } from "./config.mjs";

export function ensureLogDir() {
  mkdirSync(BACKUP_DIRS.logs, { recursive: true });
}

export function logRetention(message) {
  ensureLogDir();
  const line = `[${new Date().toISOString()}] ${message}\n`;
  appendFileSync(join(BACKUP_DIRS.logs, "retention.log"), line, "utf8");
  console.log(message);
}

export function logBackup(message) {
  ensureLogDir();
  const line = `[${new Date().toISOString()}] ${message}\n`;
  appendFileSync(join(BACKUP_DIRS.logs, "backup.log"), line, "utf8");
  console.log(message);
}
