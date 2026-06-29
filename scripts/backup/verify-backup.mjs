#!/usr/bin/env node
/**
 * Verify backup & git safety infrastructure.
 * Usage: npm run backup:verify
 */
import { execSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BACKUP_DIRS, BACKUP_ROOT, PROJECT_ROOT } from "./lib/config.mjs";
import { verifyCloudConfig } from "./lib/cloud-upload.mjs";
import { createDatabaseBackup } from "./database-backup.mjs";
import { createProjectBackup } from "./project-backup.mjs";

const checks = [];

function push(name, ok, detail) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
}

function run(cmd) {
  return execSync(cmd, { cwd: PROJECT_ROOT, encoding: "utf8" }).trim();
}

async function main() {
  console.log("\nBackup & safety verification\n");

  // Git
  try {
    const inside = run("git rev-parse --is-inside-work-tree");
    push("git.initialized", inside === "true", "repository exists");
  } catch {
    push("git.initialized", false, "not a git repository");
  }

  try {
    const remotes = run("git remote -v");
    const hasOrigin = remotes.includes("origin");
    push("git.remote_connected", hasOrigin, hasOrigin ? "origin configured" : "no origin remote");
  } catch {
    push("git.remote_connected", false, "git remote check failed");
  }

  try {
    const branch = run("git branch --show-current");
    const status = run("git status -sb");
    const ahead = /ahead (\d+)/.exec(status)?.[1] ?? "0";
    const unpushed = Number(ahead) > 0;
    push("git.latest_pushed", !unpushed, unpushed ? `${ahead} commit(s) ahead of origin` : `branch ${branch} synced`);
  } catch {
    push("git.latest_pushed", false, "could not determine push status");
  }

  // Secrets not tracked
  try {
    const trackedEnv = spawnSync("git", ["ls-files", ".env", ".env.local"], {
      cwd: PROJECT_ROOT,
      encoding: "utf8"
    });
    const tracked = trackedEnv.stdout.trim();
    push("git.secrets_excluded", tracked.length === 0, tracked || "no .env tracked");
  } catch {
    push("git.secrets_excluded", false, "check failed");
  }

  // Restore guide
  const guidePath = join(PROJECT_ROOT, "RESTORE_GUIDE.md");
  push("restore.guide_exists", existsSync(guidePath), guidePath);

  // Backup dirs
  push("backup.root_configured", Boolean(BACKUP_ROOT), BACKUP_ROOT);

  // Project ZIP (dry run — actually create, small overhead)
  try {
    const result = await createProjectBackup({ upload: false });
    push("backup.project_zip", existsSync(result.path), result.fileName);
  } catch (error) {
    push("backup.project_zip", false, error instanceof Error ? error.message : String(error));
  }

  // Database export
  try {
    const result = await createDatabaseBackup({ upload: false });
    push("backup.database_sql", existsSync(result.path), result.fileName);
  } catch (error) {
    push(
      "backup.database_sql",
      false,
      error instanceof Error ? error.message : String(error)
    );
  }

  // Cloud
  const cloud = await verifyCloudConfig();
  if (cloud.mode === "disabled") {
    push("cloud.upload", true, "disabled (set BACKUP_CLOUD_ENABLED=1 to enable)");
  } else {
    push("cloud.upload", cloud.ok, cloud.detail ?? `${cloud.mode} bucket=${cloud.bucket}`);
  }

  // .gitignore coverage
  try {
    const ignore = readFileSync(join(PROJECT_ROOT, ".gitignore"), "utf8");
    const required = [".env", "node_modules", ".next"];
    const missing = required.filter((item) => !ignore.includes(item));
    push("gitignore.complete", missing.length === 0, missing.length ? `missing: ${missing.join(", ")}` : "core patterns present");
  } catch {
    push("gitignore.complete", false, ".gitignore missing");
  }

  console.log(`\nBackup storage: ${BACKUP_DIRS.project} | ${BACKUP_DIRS.database}`);

  const failed = checks.filter((c) => !c.ok).length;
  console.log(failed ? `\n${failed} check(s) need attention` : "\nAll checks passed");
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
