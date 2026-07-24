/**
 * Sprint C — Video Engine audit layer verification
 * Run: npm run video-engine:sprint-c:verify
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { VIDEO_ENGINE_AUDIT_WRITE_FAILED } from "../features/video-engine/video-job-audit.types";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");

type Check = { name: string; ok: boolean; detail?: string };

function read(relPath: string) {
  return readFileSync(join(ROOT, relPath), "utf8");
}

function checkSchemaModels(): Check {
  const schema = read("prisma/schema.prisma");
  const required = [
    "model GenerationJobEvent",
    "model GenerationJobAttempt",
    "model VideoRoutingDecision",
    "model VideoPromptVersion",
    "@@index([providerTaskId])"
  ];
  const missing = required.filter((needle) => !schema.includes(needle));
  return {
    name: "schema.audit_models",
    ok: missing.length === 0,
    detail: missing.length ? `Missing: ${missing.join(", ")}` : "Audit models present"
  };
}

function checkMigrationFile(): Check {
  const sql = read("prisma/migrations/20260724120000_video_engine_sprint_c_audit/migration.sql");
  const ok =
    sql.includes("generation_job_events") &&
    sql.includes("generation_job_attempts") &&
    sql.includes("video_routing_decisions") &&
    sql.includes("video_prompt_versions") &&
    sql.includes("generation_jobs_provider_task_id_idx");
  return {
    name: "migration.sprint_c_sql",
    ok,
    detail: ok ? "Sprint C migration SQL present" : "Missing Sprint C migration artifacts"
  };
}

function checkIdempotentCreatePattern(): Check {
  const repo = read("features/canvas/canvas.repository.ts");
  const ok =
    repo.includes("prisma.generationJob.create") &&
    repo.includes("isUniqueConstraintError") &&
    repo.includes("created: true") &&
    repo.includes("created: false") &&
    !repo.includes("generationJob.upsert");
  return {
    name: "repository.idempotent_create",
    ok,
    detail: ok
      ? "createGenerationJob uses create + P2002 fallback"
      : "Expected create + unique constraint handling"
  };
}

function checkClaimFlow(): Check {
  const claim = read("features/video-engine/video-job-claim.repository.ts");
  const orchestrator = read("features/video-engine/video-orchestrator.ts");
  const ok =
    !claim.includes("prisma.$transaction") &&
    claim.includes("generationJobAttempt.aggregate") &&
    claim.includes("generationJobAttempt.create") &&
    claim.includes("generationJobEvent.create") &&
    claim.includes("JOB_CLAIMED") &&
    claim.includes("rollbackClaim") &&
    !orchestrator.includes("$transaction") &&
    !orchestrator.includes("TransactionClient");
  return {
    name: "claim.no_interactive_transaction",
    ok,
    detail: ok
      ? "Claim uses short DB writes only; provider I/O stays outside transactions"
      : "Claim must not use interactive transactions or hold tx across provider calls"
  };
}

function checkAuditFailureSignal(): Check {
  const service = read("features/video-engine/video-job-audit.service.ts");
  const ok =
    service.includes(VIDEO_ENGINE_AUDIT_WRITE_FAILED) &&
    service.includes("reportRequiredAuditFailure");
  return {
    name: "audit.required_failure_signal",
    ok,
    detail: ok ? "Required audit failures emit structured ops signal" : "Missing audit failure signal"
  };
}

function checkMockProductionLock(): Check {
  const envModule = read("features/video-engine/mock-provider-env.ts");
  const registry = read("features/video-engine/video-provider.registry.ts");
  const ok =
    envModule.includes('process.env.NODE_ENV === "production"') &&
    envModule.includes("return false") &&
    registry.includes('process.env.NODE_ENV === "production"') &&
    registry.includes("SEEDANCE_NOT_CONFIGURED") &&
    !registry.includes("FALLBACK_MOCK");
  return {
    name: "mock.production_lock",
    ok,
    detail: ok
      ? "Mock hard-disabled in production; routing uses failure reasons"
      : "Mock production lock or routing reasons incomplete"
  };
}

function checkRoutingNoMockFallbackLabel(): Check {
  const registry = read("features/video-engine/video-provider.registry.ts");
  const ok =
    !registry.includes("FALLBACK_MOCK") &&
    !registry.includes("SEEDANCE_NOT_CONFIGURED_FALLBACK_MOCK");
  return {
    name: "routing.no_mock_fallback_label",
    ok,
    detail: ok ? "Routing reasons exclude mock fallback labels" : "Remove mock fallback routing labels"
  };
}

function checkProviderPromptDeferredWrite(): Check {
  const orchestrator = read("features/video-engine/video-orchestrator.ts");
  const auditService = read("features/video-engine/video-job-audit.service.ts");
  const ok =
    orchestrator.includes("recordProviderPromptSubmitted") &&
    auditService.includes("updatePromptVersionProviderPrompt") &&
    auditService.includes("providerPrompt: null");
  return {
    name: "prompt.provider_submit_write",
    ok,
    detail: ok
      ? "providerPrompt updated at adapter submit time"
      : "Expected deferred providerPrompt write"
  };
}

function checkTestRegistryInjection(): Check {
  const registry = read("features/video-engine/video-provider.registry.ts");
  const ok =
    registry.includes("setVideoProviderAdapterForTests") &&
    registry.includes("resetVideoProviderAdaptersForTests") &&
    registry.includes('process.env.NODE_ENV === "test"');
  return {
    name: "mock.test_registry_injection",
    ok,
    detail: ok ? "Registry test override hooks present" : "Missing test registry override hooks"
  };
}

function checkUniqueConstraintHelper(): Check {
  const helper = read("lib/core/prisma-errors.ts");
  const ok = helper.includes("isUniqueConstraintError") && helper.includes('"P2002"');
  return {
    name: "prisma.unique_constraint_helper",
    ok,
    detail: ok ? "isUniqueConstraintError helper present" : "Missing P2002 helper"
  };
}

function main() {
  const checks: Check[] = [
    checkSchemaModels(),
    checkMigrationFile(),
    checkIdempotentCreatePattern(),
    checkClaimFlow(),
    checkAuditFailureSignal(),
    checkMockProductionLock(),
    checkRoutingNoMockFallbackLabel(),
    checkProviderPromptDeferredWrite(),
    checkTestRegistryInjection(),
    checkUniqueConstraintHelper()
  ];

  const failed = checks.filter((check) => !check.ok);
  for (const check of checks) {
    console.log(`${check.ok ? "✓" : "✗"} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  }

  console.log(
    JSON.stringify(
      {
        total: checks.length,
        passed: checks.length - failed.length,
        failed: failed.length
      },
      null,
      2
    )
  );

  if (failed.length > 0) {
    process.exit(1);
  }
}

main();
