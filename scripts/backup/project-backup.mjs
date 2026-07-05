#!/usr/bin/env node
/**
 * Create a ZIP backup of the project (excludes secrets, node_modules, build artifacts).
 * Output: ~/VINCIS-Backups/project/{ProjectName}_Backup_YYYY-MM-DD_HH-mm.zip
 *
 * Usage: npm run backup:project
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BACKUP_DIRS,
  BACKUP_PROJECT_NAME,
  PROJECT_ROOT,
  PROJECT_ZIP_EXCLUDES,
  timestamp
} from "./lib/config.mjs";
import { uploadToCloud } from "./lib/cloud-upload.mjs";
import { logBackup } from "./lib/logger.mjs";
import { applyRetention } from "./lib/retention.mjs";

function buildZipCommand(outPath) {
  const excludeArgs = PROJECT_ZIP_EXCLUDES.flatMap((pattern) => [
    "-x",
    `*${pattern}*`,
    "-x",
    `*/${pattern}/*`
  ]);
  return ["zip", "-r", "-q", outPath, ".", ...excludeArgs];
}

export async function createProjectBackup({ upload = true } = {}) {
  mkdirSync(BACKUP_DIRS.project, { recursive: true });

  const fileName = `${BACKUP_PROJECT_NAME}_Backup_${timestamp()}.zip`;
  const outPath = join(BACKUP_DIRS.project, fileName);

  logBackup(`PROJECT BACKUP START: ${fileName}`);

  if (!existsSync(PROJECT_ROOT)) {
    throw new Error(`Project root not found: ${PROJECT_ROOT}`);
  }

  execSync(buildZipCommand(outPath).join(" "), { cwd: PROJECT_ROOT, stdio: "inherit" });

  const sizeMb = (statSync(outPath).size / (1024 * 1024)).toFixed(2);
  logBackup(`PROJECT BACKUP DONE: ${outPath} (${sizeMb} MB)`);

  let cloud = { uploaded: false };
  if (upload) {
    cloud = await uploadToCloud(outPath, "project");
  }

  const retention = applyRetention("project", ".zip");

  return { path: outPath, fileName, sizeMb, cloud, retention };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createProjectBackup()
    .then((result) => {
      console.log(JSON.stringify({ ok: true, ...result }, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
