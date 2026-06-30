/**
 * Sprint 14 — Brand Portal unification
 * Run: npm run sprint14:verify
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { brandPortalService } from "../features/brand/brand-portal.service";
import { brandPortalRoutes } from "../lib/studioos/brand-portal-routes";

type Check = { name: string; ok: boolean; detail?: string };

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

async function main() {
  const checks: Check[] = [];
  const prisma = new PrismaClient();

  try {
    checks.push({
      name: "routes.canonical",
      ok:
        brandPortalRoutes.dashboard === "/brand" &&
        brandPortalRoutes.reviewHub === "/brand/review" &&
        brandPortalRoutes.settlement === "/brand/settlement",
      detail: "brand-portal-routes"
    });

    checks.push({
      name: "feature.brand_service",
      ok: read("features/brand/brand-portal.service.ts").includes("getDashboard"),
      detail: "BrandPortalService"
    });

    checks.push({
      name: "api.brand_portal",
      ok: read("app/api/v1/me/brand/portal/route.ts").includes("brandPortalService"),
      detail: "GET /api/v1/me/brand/portal"
    });

    checks.push({
      name: "page.review_hub",
      ok: read("app/brand/review/page.tsx").includes("Review center"),
      detail: "/brand/review"
    });

    checks.push({
      name: "page.settlement",
      ok: read("app/brand/settlement/page.tsx").includes("Escrow"),
      detail: "/brand/settlement"
    });

    checks.push({
      name: "shell.sidebar_nav",
      ok:
        read("components/studioos/brand-portal-shell.tsx").includes("brandPortalRoutes.reviewHub") &&
        read("components/studioos/brand-portal-shell.tsx").includes("brandPortalRoutes.settlement"),
      detail: "BrandPortalShell"
    });

    checks.push({
      name: "redirect.workspace_brand",
      ok: read("app/workspace/brand/page.tsx").includes("brandPortalRoutes.dashboard"),
      detail: "/workspace/brand → /brand"
    });

    checks.push({
      name: "redirect.workspace_new",
      ok: read("app/workspace/projects/new/page.tsx").includes("brandPortalRoutes.newProject"),
      detail: "/workspace/projects/new → /brand/projects/new"
    });

    checks.push({
      name: "middleware.brand_redirects",
      ok: read("middleware.ts").includes("/workspace/brand"),
      detail: "middleware"
    });

    const brandUser = await prisma.user.findUnique({
      where: { email: "client.arc@adbridge.test" }
    });

    if (brandUser) {
      const dashboard = await brandPortalService.getDashboard(
        { id: brandUser.id, role: "BRAND" },
        [],
        []
      );
      checks.push({
        name: "db.dashboard",
        ok: dashboard.stats != null && Array.isArray(dashboard.campaigns),
        detail: `${dashboard.campaigns.length} campaigns`
      });
    } else {
      checks.push({ name: "db.dashboard", ok: false, detail: "brand seed missing" });
    }
  } catch (error) {
    checks.push({
      name: "sprint14.run",
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
  console.log("\nSprint 14 verification\n");
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
