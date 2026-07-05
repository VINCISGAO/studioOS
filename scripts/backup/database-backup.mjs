#!/usr/bin/env node
/**
 * Export PostgreSQL database to SQL file.
 * Output: ~/VINCIS-Backups/database/Database_Backup_YYYY-MM-DD_HH-mm.sql
 *
 * Usage: npm run backup:database
 */
import { execSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { BACKUP_DIRS, loadEnvFiles, PROJECT_ROOT, timestamp } from "./lib/config.mjs";
import { uploadToCloud } from "./lib/cloud-upload.mjs";
import { logBackup } from "./lib/logger.mjs";
import { applyRetention } from "./lib/retention.mjs";

function parseDatabaseUrl(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port || "5432",
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, "")
  };
}

function runPgDumpViaDocker(outPath, cfg) {
  const result = spawnSync(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      "postgres",
      "pg_dump",
      "-U",
      cfg.user,
      "-d",
      cfg.database,
      "--no-owner",
      "--no-acl"
    ],
    { cwd: PROJECT_ROOT, encoding: "utf8" }
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || "docker pg_dump failed");
  }
  writeFileSync(outPath, result.stdout, "utf8");
}

function runPgDumpLocal(outPath, cfg, databaseUrl) {
  const env = { ...process.env, PGPASSWORD: cfg.password };
  execSync(
    `pg_dump "${databaseUrl}" --no-owner --no-acl -f "${outPath}"`,
    { env, stdio: "inherit" }
  );
}

export async function createDatabaseBackup({ upload = true } = {}) {
  loadEnvFiles();
  mkdirSync(BACKUP_DIRS.database, { recursive: true });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL not set — add it to .env.local");
  }

  const fileName = `Database_Backup_${timestamp()}.sql`;
  const outPath = join(BACKUP_DIRS.database, fileName);

  logBackup(`DATABASE BACKUP START: ${fileName}`);

  const cfg = parseDatabaseUrl(databaseUrl);
  const hasPgDump = spawnSync("which", ["pg_dump"]).status === 0;
  const hasDocker = spawnSync("which", ["docker"]).status === 0;

  if (hasPgDump) {
    runPgDumpLocal(outPath, cfg, databaseUrl);
  } else if (hasDocker && existsSync(join(PROJECT_ROOT, "docker-compose.yml"))) {
    runPgDumpViaDocker(outPath, cfg);
  } else {
    throw new Error("Neither pg_dump nor docker compose available for database export");
  }

  const sizeMb = (statSync(outPath).size / (1024 * 1024)).toFixed(2);
  logBackup(`DATABASE BACKUP DONE: ${outPath} (${sizeMb} MB)`);

  let cloud = { uploaded: false };
  if (upload) {
    cloud = await uploadToCloud(outPath, "database");
  }

  const retention = applyRetention("database", ".sql");

  return { path: outPath, fileName, sizeMb, cloud, retention };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createDatabaseBackup()
    .then((result) => {
      console.log(JSON.stringify({ ok: true, ...result }, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
