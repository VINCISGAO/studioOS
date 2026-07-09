import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const logPath = path.join(root, ".homepage-golden-anchor.log");
const lines = [];

function run(cmd) {
  lines.push(`$ ${cmd}`);
  try {
    const out = execSync(cmd, { cwd: root, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
    if (out.trim()) lines.push(out.trim());
    return 0;
  } catch (error) {
    const e = error;
    if (e.stdout) lines.push(String(e.stdout).trim());
    if (e.stderr) lines.push(String(e.stderr).trim());
    lines.push(`exit ${e.status ?? 1}`);
    return e.status ?? 1;
  }
}

lines.push(`=== homepage golden anchor ${new Date().toISOString()} ===`);

run("bash scripts/git-identity.sh");
run("node scripts/copy-marketing-assets.mjs");

const paths = [
  "AGENT.md",
  "docs/HOMEPAGE_GOLDEN.md",
  ".cursor/rules/agent.mdc",
  "app/page.tsx",
  "app/globals.css",
  "app/api/home-hero-space",
  "components/marketing",
  "components/language-switcher.tsx",
  "lib/marketing",
  "lib/studioos/home-hero-space-asset.ts",
  "lib/studioos/marketing-headline-font.ts",
  "scripts/copy-marketing-assets.mjs",
  "scripts/anchor-homepage-golden.mjs",
  "public/images/home-hero-space.png",
  "public/images/login-space-bg.png",
  "public/images/login",
  "public/images/social-sources",
  "scripts/upload-home-hero-videos-r2.mjs",
  "assets/marketing"
];

run(`git add ${paths.join(" ")}`);
run("git status -sb");
run("git diff --cached --stat");

if (run("git diff --cached --quiet") !== 0) {
  run(
    'git commit -m "chore(homepage): re-anchor golden baseline (homepage-v1)." -m "2026-07-09: multilingual hero videos, footer redesign, landing section polish, social SVGs, and freeze docs."'
  );
} else {
  lines.push("(no staged changes — tagging current HEAD)");
}

run("git tag -f homepage-v1");
run("git branch -f homepage-golden HEAD");

const branch = execSync("git branch --show-current", { cwd: root, encoding: "utf8" }).trim();
lines.push(`current branch: ${branch}`);

run(`git push -u origin ${branch} --force-with-lease`);
run("git push origin homepage-golden --force-with-lease");
run("git push origin refs/tags/homepage-v1 --force");

run("git rev-parse HEAD");
run("git show-ref homepage-v1 homepage-golden");
run("git remote get-url origin");
run("git log -1 --oneline");

writeFileSync(logPath, `${lines.join("\n")}\n`);
console.log(lines.join("\n"));
console.log(`\nLog: ${logPath}`);
