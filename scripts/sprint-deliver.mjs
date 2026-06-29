#!/usr/bin/env node
/**
 * Sprint delivery gate — run before marking a sprint complete.
 * Usage: npm run sprint:deliver -- "sprint 12: campaign wizard"
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const sprintMessage = process.argv.slice(2).join(" ") || "sprint delivery";

const steps = [
  { name: "typecheck", cmd: "npm run typecheck" },
  { name: "build", cmd: "npm run build" },
  { name: "backup_verify", cmd: "npm run backup:verify" },
  { name: "backup_daily", cmd: "npm run backup:daily" }
];

console.log("\n=== Sprint delivery gate ===\n");

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

console.log("\nManual steps (require your approval):");
console.log(`  1. git add -A && git commit -m "${sprintMessage}"`);
console.log("  2. git push origin main");
console.log("  3. Review RESTORE_GUIDE.md if env or infra changed");
console.log("  4. Wait for project owner approval before next sprint\n");

if (!existsSync(join(ROOT, "RESTORE_GUIDE.md"))) {
  console.error("RESTORE_GUIDE.md missing");
  process.exit(1);
}

console.log("Automated checks passed. Complete git push manually if not done.\n");
