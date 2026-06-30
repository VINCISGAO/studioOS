import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const log = path.join(root, ".git-push-result.txt");
const lines = [];

function run(cmd) {
  lines.push(`$ ${cmd}`);
  try {
    const out = execSync(cmd, { cwd: root, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
    lines.push(out.trim());
    return 0;
  } catch (e) {
    lines.push(String(e.stdout || ""));
    lines.push(String(e.stderr || ""));
    lines.push(`exit ${e.status}`);
    return e.status ?? 1;
  }
}

lines.push(`=== git push homepage ${new Date().toISOString()} ===`);

run("bash scripts/git-identity.sh");

run("node scripts/copy-marketing-assets.mjs");

const addPaths = [
  "app/globals.css",
  "app/api/login-space-bg",
  "components/marketing/cinematic",
  "components/marketing/landing",
  "components/studioos/login-page-shell.tsx",
  "components/studioos/login-social-buttons.tsx",
  "components/studioos/login-workspace.tsx",
  "lib/marketing",
  "lib/studioos/login-theme.ts",
  "lib/studioos/login-background.ts",
  "scripts/connect-github.sh",
  "scripts/deploy-homepage-github.sh",
  "scripts/start-dev.sh",
  "scripts/copy-marketing-assets.mjs",
  "scripts/git-push-homepage.mjs",
  "package.json",
  "启动本地开发.command",
  "连接GitHub.command",
  "推送首页到GitHub.command",
  "public/images",
  "assets/marketing"
].join(" ");

run(`git add ${addPaths}`);

const status = run("git status -sb");
const diffCached = run("git diff --cached --stat");

if (!lines.some((l) => l.includes("nothing to commit"))) {
  run(
    'git commit -m "Update cinematic homepage to match mockup design." -m "Restore login-space-bg hero, add features row and stats dock, update nav and login shell."'
  );
}

run("git push -u origin HEAD");
run("git log -1 --oneline");
run("git status -sb");

writeFileSync(log, lines.join("\n") + "\n");
console.log(lines.join("\n"));
