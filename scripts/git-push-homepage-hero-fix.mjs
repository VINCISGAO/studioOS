#!/usr/bin/env node
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const REPORT = join(ROOT, ".git-hero-fix-report.txt");
const lines = [];

function run(cmd) {
  lines.push(`$ ${cmd}`);
  try {
    const out = execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    if (out.trim()) lines.push(out.trimEnd());
    return 0;
  } catch (error) {
    const stdout = error.stdout?.toString?.() ?? "";
    const stderr = error.stderr?.toString?.() ?? "";
    if (stdout.trim()) lines.push(stdout.trimEnd());
    if (stderr.trim()) lines.push(stderr.trimEnd());
    lines.push(`exit: ${error.status ?? 1}`);
    return error.status ?? 1;
  }
}

lines.push(`=== homepage hero fix deploy ${new Date().toISOString()} ===`);
run("node scripts/copy-marketing-assets.mjs");
run("node scripts/fix-home-hero-space-asset.mjs");
run("git add -A");
run("git reset HEAD -- .DS_Store");
run(
  `git commit -m ${JSON.stringify(
    "fix: restore clean homepage hero earth asset and serve via API.\n\nPrefer bundled night-earth PNG over stale public file; anchor iPad/desktop backdrop from right; remove typo @2x asset."
  )}`
);
run("git push origin main");
run("git log -1 --oneline");
run("git status -sb");

writeFileSync(REPORT, `${lines.join("\n")}\n`);
console.log(lines.join("\n"));
