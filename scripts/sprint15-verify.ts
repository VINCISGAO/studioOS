/**
 * Sprint 15 — Admin + Dispute + Audit + Feature Flags
 * Run: npm run sprint15:verify
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { adminService } from "../features/admin/admin.service";
import { disputeService } from "../features/admin/dispute.service";
import { featureFlagService } from "../features/admin/feature-flag.service";
import { adminPortalRoutes } from "../lib/studioos/admin-portal-routes";

type Check = { name: string; ok: boolean; detail?: string };

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

async function main() {
  const checks: Check[] = [];
  const prisma = new PrismaClient();

  try {
    checks.push({
      name: "routes.admin_portal",
      ok:
        adminPortalRoutes.audit === "/admin/audit" &&
        adminPortalRoutes.featureFlags === "/admin/feature-flags",
      detail: "admin-portal-routes"
    });

    checks.push({
      name: "feature.admin_services",
      ok:
        read("features/admin/dispute.service.ts").includes("resolve") &&
        read("features/admin/feature-flag.service.ts").includes("getApiRateLimitConfig"),
      detail: "features/admin"
    });

    checks.push({
      name: "api.admin_overview",
      ok: read("app/api/v1/admin/overview/route.ts").includes("adminService"),
      detail: "GET /api/v1/admin/overview"
    });

    checks.push({
      name: "page.audit",
      ok: read("app/admin/audit/page.tsx").includes("auditService"),
      detail: "/admin/audit"
    });

    checks.push({
      name: "page.feature_flags",
      ok: read("app/admin/feature-flags/page.tsx").includes("featureFlagService"),
      detail: "/admin/feature-flags"
    });

    checks.push({
      name: "api.campaign_disputes",
      ok: read("app/api/v1/campaigns/[campaignId]/disputes/route.ts").includes("disputeService.open"),
      detail: "POST/GET /api/v1/campaigns/{id}/disputes"
    });

    checks.push({
      name: "page.dispute_detail",
      ok: read("app/admin/disputes/[id]/page.tsx").includes("disputeService.get"),
      detail: "/admin/disputes/[id]"
    });

    checks.push({
      name: "feature.activity_log_writer",
      ok: read("features/admin/activity-log.service.ts").includes("activityLogWriter"),
      detail: "centralized audit writes"
    });

    checks.push({
      name: "ui.admin_ops_preview",
      ok: read("components/studioos/admin-ops-preview.tsx").includes("AdminOpsPreview"),
      detail: "admin dashboard preview"
    });

    const admin = await prisma.user.findUnique({ where: { email: "admin@studioos.test" } });
    if (admin) {
      const overview = await adminService.getOverview({ id: admin.id, role: "ADMIN" });
      checks.push({
        name: "db.admin_overview",
        ok: overview.campaignCount >= 0,
        detail: `${overview.campaignCount} campaigns`
      });

      const flags = await featureFlagService.list({ id: admin.id, role: "ADMIN" });
      checks.push({
        name: "db.feature_flags",
        ok: flags.some((f) => f.key === "security.api_rate_limit"),
        detail: `${flags.length} flags`
      });

      const disputes = await disputeService.list({ id: admin.id, role: "ADMIN" });
      checks.push({
        name: "db.disputes",
        ok: Array.isArray(disputes),
        detail: `${disputes.length} disputes`
      });
    } else {
      checks.push({ name: "db.admin_overview", ok: false, detail: "admin seed missing" });
    }
  } catch (error) {
    checks.push({
      name: "sprint15.run",
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
  console.log("\nSprint 15 verification\n");
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
