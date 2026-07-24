/**
 * Generation stale job policy verification (static + optional DB smoke).
 * Run: npm run generation:stale:verify
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { generationStaleJobPolicy } from "../features/generation/concurrency/generation-stale-job-policy";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");

type Check = { name: string; ok: boolean; detail?: string };

function read(relPath: string) {
  return readFileSync(join(ROOT, relPath), "utf8");
}

function report(checks: Check[]) {
  for (const check of checks) {
    console.log(`${check.ok ? "OK" : "FAIL"} ${check.name}${check.detail ? `: ${check.detail}` : ""}`);
  }
  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) throw new Error(`${failed.length} generation stale job check(s) failed`);
}

function main() {
  const checks: Check[] = [];
  const service = read("features/generation/concurrency/generation-stale-job.service.ts");
  const spec = read("docs/AI_GENERATION_CONCURRENCY_SPEC.md");
  const canvasService = read("features/canvas/canvas.service.ts");

  checks.push({
    name: "stale.policy.queue_timeout_12h",
    ok: generationStaleJobPolicy.queueTimeoutMs === 12 * 60 * 60 * 1000,
    detail: String(generationStaleJobPolicy.queueTimeoutMs)
  });
  checks.push({
    name: "stale.policy.dispatch_timeout_10m",
    ok: generationStaleJobPolicy.dispatchTimeoutMs === 10 * 60 * 1000,
    detail: String(generationStaleJobPolicy.dispatchTimeoutMs)
  });
  checks.push({
    name: "stale.service.sweep_and_reconcile",
    ok:
      service.includes("sweepStaleJobs") &&
      service.includes("reconcileJobIfStale") &&
      service.includes("QUEUE_TIMEOUT") &&
      service.includes("DISPATCH_TIMEOUT") &&
      service.includes("syncJobBilling")
  });
  checks.push({
    name: "stale.service.dispatch_requeue",
    ok: service.includes("requeueStaleDispatchJob") && service.includes("dispatchAfterTerminal")
  });
  checks.push({
    name: "stale.canvas.get_job_hook",
    ok: canvasService.includes("generationStaleJobService.reconcileJobIfStale")
  });
  checks.push({
    name: "stale.spec.documented",
    ok: spec.includes("Queue timeout") && spec.includes("Dispatch timeout")
  });
  checks.push({
    name: "stale.reaper.script",
    ok: read("scripts/generation-stale-job-reaper.ts").includes("sweepStaleJobs")
  });

  report(checks);
}

main();
