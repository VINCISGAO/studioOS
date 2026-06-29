import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BACKUP_DIRS, RETENTION_COUNT } from "./config.mjs";
import { logRetention } from "./logger.mjs";

function isProtected(fileName, category) {
  const markerInDir = join(BACKUP_DIRS.protected, `${category}__${fileName}`);
  const sidecar = join(BACKUP_DIRS[category], `${fileName}.protected`);
  return existsSync(markerInDir) || existsSync(sidecar);
}

/**
 * Keep latest N non-protected backups; never delete protected files; log every deletion.
 */
export function applyRetention(category, extension) {
  const dir = BACKUP_DIRS[category];
  if (!existsSync(dir)) return { deleted: [], kept: 0 };

  const files = readdirSync(dir)
    .filter((name) => name.endsWith(extension) && !name.endsWith(".protected"))
    .map((name) => {
      const full = join(dir, name);
      return {
        name,
        full,
        mtime: statSync(full).mtimeMs,
        protected: isProtected(name, category)
      };
    })
    .sort((a, b) => b.mtime - a.mtime);

  const protectedFiles = files.filter((f) => f.protected);
  const unprotected = files.filter((f) => !f.protected);
  const toDelete = unprotected.slice(RETENTION_COUNT);

  for (const file of toDelete) {
    logRetention(
      `RETENTION DELETE [${category}]: ${file.name} (keeping latest ${RETENTION_COUNT} non-protected, ${protectedFiles.length} protected)`
    );
    unlinkSync(file.full);
    const sidecar = `${file.full}.protected`;
    if (existsSync(sidecar)) unlinkSync(sidecar);
  }

  return {
    deleted: toDelete.map((f) => f.name),
    kept: protectedFiles.length + Math.min(unprotected.length, RETENTION_COUNT)
  };
}

/** Mark a backup as protected — never auto-deleted. */
export function protectBackup(category, fileName) {
  mkdirSync(BACKUP_DIRS.protected, { recursive: true });
  const marker = join(BACKUP_DIRS.protected, `${category}__${fileName}`);
  writeFileSync(marker, new Date().toISOString(), "utf8");
  logRetention(`PROTECTED [${category}]: ${fileName}`);
}
