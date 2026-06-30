/**
 * Sprint 16 — Security + Signed URL + RBAC
 * Run: npm run sprint16:verify
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  createPlaybackToken,
  verifyPlaybackToken
} from "../features/video/playback-token.service";
import { getRbacMatrix, roleHasPermission } from "../lib/core/security/rbac-matrix";
import {
  enforceApiRateLimit,
  resetRateLimitStateForTests
} from "../lib/core/security/rate-limit.service";
import { featureFlagService } from "../features/admin/feature-flag.service";

type Check = { name: string; ok: boolean; detail?: string };

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

async function main() {
  const checks: Check[] = [];
  const prisma = new PrismaClient();

  try {
    checks.push({
      name: "security.rate_limit_module",
      ok: read("lib/core/security/rate-limit.service.ts").includes("enforceApiRateLimit"),
      detail: "rate-limit.service"
    });

    checks.push({
      name: "security.rbac_matrix",
      ok:
        getRbacMatrix().some((row) => row.role === "ADMIN" && row.permissions.includes("admin.audit.read")) &&
        getRbacMatrix().some((row) => row.role === "ADMIN" && row.permissions.includes("admin.payment.manage")),
      detail: `${getRbacMatrix().length} roles`
    });

    checks.push({
      name: "security.playback_guard",
      ok: read("app/api/v1/playback/[token]/[[...path]]/route.ts").includes("assertPlaybackAccess"),
      detail: "playback RBAC"
    });

    checks.push({
      name: "rbac.brand_cannot_withdraw_admin",
      ok: roleHasPermission("BRAND", "campaign.read") && !roleHasPermission("BRAND", "admin.audit.read"),
      detail: "brand scoped"
    });

    const token = createPlaybackToken({
      versionId: "v-test",
      userId: "u-test",
      campaignId: "c-test",
      ttlSec: 60
    });
    checks.push({
      name: "signed_url.roundtrip",
      ok: verifyPlaybackToken(token)?.v === "v-test",
      detail: "playback token"
    });

    const config = await featureFlagService.getApiRateLimitConfig();
    checks.push({
      name: "db.rate_limit_config",
      ok: config.maxRequests > 0 && config.windowMs > 0,
      detail: `${config.maxRequests}/${config.windowMs}ms`
    });

    resetRateLimitStateForTests();
    const fakeRequest = new Request("http://localhost/api/v1/auth/login", {
      headers: { "x-forwarded-for": "127.0.0.1" }
    });
    let limited = false;
    try {
      for (let i = 0; i < 25; i++) {
        await enforceApiRateLimit(fakeRequest, "/api/v1/auth/login");
      }
    } catch {
      limited = true;
    }
    checks.push({
      name: "rate_limit.enforced",
      ok: limited,
      detail: limited ? "429 after burst" : "may need db seed"
    });
  } catch (error) {
    checks.push({
      name: "sprint16.run",
      ok: false,
      detail: error instanceof Error ? error.message : String(error)
    });
  } finally {
    await prisma.$disconnect();
  }

  report(checks);
  process.exit(checks.some((c) => !c.ok) ? 1 : 0);
}

function report(checks: Check[]) {
  console.log("\nSprint 16 verification\n");
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
