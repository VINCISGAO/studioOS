#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOG_DIR = join(ROOT, ".verify-logs");

mkdirSync(LOG_DIR, { recursive: true });

const steps = [
  ["typecheck", "npm run typecheck"],
  ["public-layout:verify", "npm run public-layout:verify"],
  ["production:verify", "npm run production:verify"],
  ["build", "npm run build"]
];

const summary = [];

for (const [name, cmd] of steps) {
  const logPath = join(LOG_DIR, `${name.replace(/:/g, "-")}.log`);
  writeFileSync(logPath, `▶ ${cmd}\n\n`, "utf8");
  const started = Date.now();
  const result = spawnSync(cmd, {
    cwd: ROOT,
    shell: true,
    encoding: "utf8",
    env: process.env,
    maxBuffer: 64 * 1024 * 1024
  });
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  const output = [result.stdout ?? "", result.stderr ?? ""].filter(Boolean).join("\n");
  appendFileSync(logPath, output, "utf8");
  appendFileSync(logPath, `\n\nEXIT_CODE=${result.status ?? "null"} (${elapsed}s)\n`, "utf8");
  summary.push({ name, ok: result.status === 0, status: result.status, elapsed, logPath });
  console.log(`${result.status === 0 ? "✅" : "❌"} ${name} — exit ${result.status} (${elapsed}s) → ${logPath}`);
}

const reportPath = join(LOG_DIR, "summary.json");
writeFileSync(reportPath, JSON.stringify(summary, null, 2), "utf8");
console.log(`\nSummary → ${reportPath}`);
process.exit(summary.every((item) => item.ok) ? 0 : 1);
