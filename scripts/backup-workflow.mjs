#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { appendFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOG = join(ROOT, ".backup-workflow.log");

function log(section, text = "") {
  const block = `\n=== ${section} ===\n${text}\n`;
  appendFileSync(LOG, block);
  process.stdout.write(block);
}

function run(label, cmd) {
  log(`RUN: ${label}`, cmd);
  const result = spawnSync(cmd, {
    cwd: ROOT,
    shell: true,
    encoding: "utf8",
    env: process.env,
    maxBuffer: 64 * 1024 * 1024
  });
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
  const exitLine = `exit: ${result.status ?? "null"}${result.signal ? ` signal:${result.signal}` : ""}`;
  log(`${label} RESULT`, `${exitLine}\n${output.slice(-8000)}`);
  return result.status ?? 1;
}

writeFileSync(LOG, `backup workflow started ${new Date().toISOString()}\n`);

const typecheck = run("typecheck", "npm run typecheck");
const build = run("build", "npm run build");
const verify = run("production:verify", "npm run production:verify");

if (typecheck !== 0 || build !== 0 || verify !== 0) {
  log("ABORT", "verification failed — not committing");
  process.exit(1);
}

run("git status", "git status");
run("git diff --stat", "git diff --stat");

const add = run("git add", "git add .");
const commit = run(
  "git commit",
  "git commit -m \"feat: production-ready MVP milestone\""
);
if (add !== 0 || commit !== 0) {
  log("ABORT", "git add/commit failed");
  process.exit(1);
}

run("git remote", "git remote -v");
const branch = spawnSync("git branch --show-current", {
  cwd: ROOT,
  shell: true,
  encoding: "utf8"
});
const branchName = (branch.stdout || "").trim();
log("branch", branchName);

const push = run("git push", "git push -u origin HEAD");
const hash = spawnSync("git log -1 --format=%H", {
  cwd: ROOT,
  shell: true,
  encoding: "utf8"
});
log("commit hash", (hash.stdout || "").trim());

if (push !== 0) {
  log("ABORT", "push failed");
  process.exit(1);
}

log("SUCCESS", "push completed");
process.exit(0);
