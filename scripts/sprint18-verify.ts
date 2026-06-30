/**
 * Sprint 18 — Performance + Monitoring
 * Run: npm run sprint18:verify
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { measureAsync } from "../lib/core/monitoring/performance";
import { initMonitoring, recordPerformanceMetric } from "../lib/core/monitoring";

type Check = { name: string; ok: boolean; detail?: string };

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

async function main() {
  const checks: Check[] = [];

  checks.push({
    name: "monitoring.module",
    ok: read("lib/core/monitoring/index.ts").includes("initMonitoring"),
    detail: "monitoring/index"
  });

  checks.push({
    name: "monitoring.performance",
    ok: read("lib/core/monitoring/performance.ts").includes("measureAsync"),
    detail: "performance helper"
  });

  checks.push({
    name: "instrumentation.hook",
    ok: read("instrumentation.ts").includes("initMonitoring"),
    detail: "instrumentation.ts"
  });

  checks.push({
    name: "env.sentry_documented",
    ok: read(".env.example").includes("SENTRY_DSN"),
    detail: "SENTRY_DSN"
  });

  checks.push({
    name: "flag.monitoring_sentry",
    ok: read("prisma/seed.ts").includes("monitoring.sentry"),
    detail: "DB-driven toggle"
  });

  await initMonitoring();
  checks.push({ name: "monitoring.init", ok: true, detail: "no throw" });

  const elapsed = await measureAsync("sprint18.ping", async () => {
    await new Promise((r) => setTimeout(r, 5));
    return 42;
  });
  checks.push({
    name: "perf.measure_async",
    ok: elapsed === 42,
    detail: "measureAsync works"
  });

  recordPerformanceMetric("sprint18.manual", 1.2);
  checks.push({ name: "perf.record_metric", ok: true, detail: "recorded" });

  report(checks);
  process.exit(checks.some((c) => !c.ok) ? 1 : 0);
}

function report(checks: Check[]) {
  console.log("\nSprint 18 verification\n");
  for (const check of checks) {
    console.log(`${check.ok ? "✅" : "❌"} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  }
  const failed = checks.filter((c) => !c.ok).length;
  console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
