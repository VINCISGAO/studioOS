#!/usr/bin/env node
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const REPORT = join(ROOT, ".git-deploy-report.txt");
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

lines.push(`=== git-push-all ${new Date().toISOString()} ===`);
run("git branch --show-current");
run("git remote get-url origin");
lines.push("");
run("git status --short");
lines.push("");

run("git add -A");
run('git reset HEAD -- .env .env.local .env.production .env.development ".env.*" .verify-run.log 2>/dev/null || true');

const staged = execSync("git diff --cached --name-only", { cwd: ROOT, encoding: "utf8" }).trim();
if (!staged) {
  lines.push("No staged changes — pushing existing commits only.");
} else {
  lines.push("Staged files:");
  lines.push(staged);
  lines.push("");
  const commitMsg = `Fix portal nav, typecheck, and local verify tooling.

Sidebar active state follows usePathname; mobile nav uses iconKey for client components; typecheck fixes for workspace review, brand order notes, publish form action, and certification dialog; add verify-local, dev:fix, and build:clean scripts.`;
  run(`git commit -m ${JSON.stringify(commitMsg)}`);
}

run("git push -u origin HEAD");
lines.push("");
run("git log -1 --oneline");
run("git show --stat -1");
lines.push("Done.");

writeFileSync(REPORT, `${lines.join("\n")}\n`);
console.log(lines.join("\n"));
