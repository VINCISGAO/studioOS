#!/usr/bin/env node
/**
 * Autonomous sprint delivery gate.
 * Usage: npm run sprint:deliver -- "Sprint 15: admin portal"
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const sprintMessage = process.argv.slice(2).join(" ") || "sprint delivery";
const reportsDir = join(ROOT, "docs", "delivery-reports");

const steps = [
  { name: "typecheck", cmd: "npm run typecheck" },
  { name: "build", cmd: "npm run build" },
  { name: "backup_verify", cmd: "npm run backup:verify" }
];

console.log("\n=== Autonomous sprint delivery gate ===\n");

for (const step of steps) {
  process.stdout.write(`→ ${step.name}... `);
  try {
    execSync(step.cmd, { cwd: ROOT, stdio: "pipe" });
    console.log("OK");
  } catch (error) {
    console.log("FAILED");
    console.error(error.stdout?.toString() ?? error.message);
    process.exit(1);
  }
}

if (!existsSync(join(ROOT, "RESTORE_GUIDE.md"))) {
  console.error("RESTORE_GUIDE.md missing");
  process.exit(1);
}

process.stdout.write("→ git commit... ");
try {
  execSync("git add -A", { cwd: ROOT, stdio: "pipe" });
  execSync(`git commit -m "${sprintMessage.replace(/"/g, '\\"')}"`, { cwd: ROOT, stdio: "pipe" });
  console.log("OK");
} catch (error) {
  const msg = error.stdout?.toString() ?? error.stderr?.toString() ?? "";
  if (msg.includes("nothing to commit")) {
    console.log("SKIP (clean)");
  } else {
    console.log("FAILED");
    console.error(msg || error.message);
    process.exit(1);
  }
}

process.stdout.write("→ git push... ");
try {
  execSync("git push", { cwd: ROOT, stdio: "pipe" });
  console.log("OK");
} catch (error) {
  console.log("FAILED");
  console.error(error.stdout?.toString() ?? error.stderr?.toString() ?? error.message);
  process.exit(1);
}

process.stdout.write("→ backup_daily... ");
try {
  execSync("npm run backup:daily", { cwd: ROOT, stdio: "pipe" });
  console.log("OK");
} catch (error) {
  console.log("WARN");
  console.error(error.stdout?.toString() ?? error.message);
}

mkdirSync(reportsDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const reportPath = join(reportsDir, `${stamp}-delivery.md`);
writeFileSync(
  reportPath,
  `# Delivery Report\n\n- **Sprint:** ${sprintMessage}\n- **Time:** ${new Date().toISOString()}\n- **Typecheck:** pass\n- **Build:** pass\n- **Backup verify:** pass\n- **Git push:** attempted\n- **Backup daily:** attempted\n`
);

console.log(`\nDelivery report: ${reportPath}\n`);
