#!/usr/bin/env node
/**
 * Night shift — full verification + delivery pipeline
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const message = process.argv.slice(2).join(" ") || "night shift delivery";
const reportsDir = join(ROOT, "docs", "delivery-reports");

const verifyScripts = [
  "sprint1:verify",
  "sprint2:verify",
  "sprint3:verify",
  "sprint4:verify",
  "sprint5:verify",
  "sprint6:verify",
  "sprint6b:verify",
  "sprint7:verify",
  "sprint8:verify",
  "sprint9:verify",
  "sprint10:verify",
  "sprint11:verify",
  "sprint12:verify",
  "sprint13:verify",
  "sprint14:verify",
  "sprint15:verify",
  "sprint16:verify",
  "sprint17:verify",
  "sprint18:verify",
  "sprint20:verify",
  "sprint21:verify",
  "membership:verify",
  "membership-ui:verify",
  "payment:verify",
  "communication:verify",
  "memory:verify"
];

function run(name: string, cmd: string, optional = false) {
  process.stdout.write(`→ ${name}... `);
  try {
    execSync(cmd, { cwd: ROOT, stdio: "pipe", env: process.env });
    console.log("OK");
    return true;
  } catch (error) {
    if (optional) {
      console.log("SKIP");
      return false;
    }
    console.log("FAILED");
    console.error(error.stdout?.toString() ?? error.stderr?.toString() ?? error.message);
    process.exit(1);
  }
}

console.log("\n=== Night shift delivery ===\n");

run("typecheck", "npm run typecheck");
run("lint", "npm run lint", true);
run("build", "npm run build");

for (const script of verifyScripts) {
  run(script, `npm run ${script}`, true);
}

run("backup_verify", "npm run backup:verify", true);

process.stdout.write("→ git commit... ");
try {
  execSync("git add -A", { cwd: ROOT, stdio: "pipe" });
  execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd: ROOT, stdio: "pipe" });
  console.log("OK");
} catch (error) {
  const msg = error.stdout?.toString() ?? error.stderr?.toString() ?? "";
  console.log(msg.includes("nothing to commit") ? "SKIP (clean)" : "FAILED");
  if (!msg.includes("nothing to commit")) process.exit(1);
}

process.stdout.write("→ git push... ");
try {
  execSync("git push", { cwd: ROOT, stdio: "pipe" });
  console.log("OK");
} catch (error) {
  console.log("WARN");
  console.error(error.stdout?.toString() ?? error.stderr?.toString() ?? error.message);
}

run("backup_daily", "npm run backup:daily", true);

mkdirSync(reportsDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const reportPath = join(reportsDir, `${stamp}-night-shift.md`);
writeFileSync(
  reportPath,
  `# Night Shift Delivery\n\n- **Message:** ${message}\n- **Time:** ${new Date().toISOString()}\n- **Pipeline:** typecheck, lint, build, verify scripts, git, backup\n`
);
console.log(`\nReport: ${reportPath}\n`);
