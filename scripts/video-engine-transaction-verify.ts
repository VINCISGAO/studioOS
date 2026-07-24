/**
 * Video Engine — Prisma transaction lifecycle regression checks
 * Run: npm run video-engine:transaction:verify
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  isPrismaTransactionLifecycleError,
  sanitizeVideoGenerationJobError
} from "../features/video-engine/video-generation.errors";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");

type Check = { name: string; ok: boolean; detail?: string };

function read(relPath: string) {
  return readFileSync(join(ROOT, relPath), "utf8");
}

function checkClaimRepository(): Check {
  const claim = read("features/video-engine/video-job-claim.repository.ts");
  const ok =
    !claim.includes("prisma.$transaction") &&
    !claim.includes("tx.generationJobAttempt") &&
    claim.includes("generationJobAttempt.aggregate") &&
    claim.includes("generationJobAttempt.create");
  return {
    name: "claim.no_interactive_transaction",
    ok,
    detail: ok
      ? "Claim uses aggregate + create on global prisma only"
      : "Claim must not use interactive transactions or tx.*"
  };
}

function checkRuntimePrismaUrl(): Check {
  const prismaModule = read("lib/core/database/prisma.ts");
  const ok =
    prismaModule.includes("DIRECT_DATABASE_URL") &&
    prismaModule.includes("withoutPoolerHost") &&
    prismaModule.includes("datasources");
  return {
    name: "prisma.runtime_direct_url",
    ok,
    detail: ok
      ? "Runtime Prisma prefers direct / non-pooler DATABASE_URL"
      : "Prisma client must avoid Neon pooler at runtime"
  };
}

function checkSanitizedUserMessage(): Check {
  const sanitized = sanitizeVideoGenerationJobError(
    new Error(
      "Invalid `prisma.generationJobAttempt.findFirst()` invocation: Transaction API error: Transaction not found."
    )
  );
  const ok =
    sanitized.errorCode === "DATABASE_TRANSACTION" &&
    sanitized.userMessageZh.includes("Credits 已自动退回") &&
    !sanitized.userMessageZh.includes("Transaction not found");
  return {
    name: "errors.sanitize_prisma_transaction",
    ok,
    detail: ok ? "Prisma tx errors map to user-safe copy" : "Missing sanitize mapping"
  };
}

function checkTransactionDetector(): Check {
  const ok = isPrismaTransactionLifecycleError(
    new Error("Transaction ID is invalid, refers to an old closed transaction")
  );
  return { name: "errors.detect_transaction_lifecycle", ok, detail: ok ? "Detector works" : "Broken" };
}

function checkAuditMigration(): Check {
  const sql = read("prisma/migrations/20260724120000_video_engine_sprint_c_audit/migration.sql");
  const ok = sql.includes("generation_job_attempts");
  return {
    name: "migration.generation_job_attempts",
    ok,
    detail: ok ? "Sprint C migration present" : "Missing generation_job_attempts migration"
  };
}

const checks: Check[] = [
  checkClaimRepository(),
  checkRuntimePrismaUrl(),
  checkSanitizedUserMessage(),
  checkTransactionDetector(),
  checkAuditMigration()
];

let failed = 0;
for (const check of checks) {
  if (check.ok) {
    console.log(`✓ ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  } else {
    failed += 1;
    console.error(`✗ ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  }
}

console.log(JSON.stringify({ total: checks.length, passed: checks.length - failed, failed }, null, 2));
process.exit(failed > 0 ? 1 : 0);
