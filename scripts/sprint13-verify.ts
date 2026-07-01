/**
 * Sprint 13 — Creator Portal unification
 * Run: npm run sprint13:verify
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { creatorPortalService } from "../features/creator/creator-portal.service";
import { creatorPortalRoutes } from "../lib/studioos/creator-portal-routes";

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
        creatorPortalRoutes.dashboard === "/studio" &&
        creatorPortalRoutes.invitations === "/studio/invitations" &&
        creatorPortalRoutes.reviewHub === "/studio/review" &&
        creatorPortalRoutes.projects === "/studio/projects",
      detail: "creator-portal-routes"
    });

    checks.push({
      name: "feature.creator_service",
      ok: read("features/creator/creator-portal.service.ts").includes("getDashboard"),
      detail: "CreatorPortalService"
    });

    checks.push({
      name: "api.creator_portal",
      ok: read("app/api/v1/me/creator/portal/route.ts").includes("creatorPortalService"),
      detail: "GET /api/v1/me/creator/portal"
    });

    checks.push({
      name: "ui.invitations_panel",
      ok: read("components/studioos/creator-invitations-board.tsx").includes("acceptDemoInvitationAction"),
      detail: "CreatorInvitationsBoard"
    });

    checks.push({
      name: "page.studio_invitations",
      ok: read("app/studio/invitations/page.tsx").includes("CreatorInvitationsBoard"),
      detail: "/studio/invitations"
    });

    checks.push({
      name: "page.review_hub",
      ok: read("app/studio/review/page.tsx").includes("creatorPortalRoutes.projects"),
      detail: "/studio/review → /studio/projects"
    });

    checks.push({
      name: "redirect.legacy_creator_order",
      ok: read("app/creator/orders/[id]/page.tsx").includes("creatorPortalRoutes.project"),
      detail: "/creator/orders → /studio/projects"
    });

    checks.push({
      name: "redirect.legacy_review_upload",
      ok: read("app/creator/orders/[id]/review-upload/page.tsx").includes("creatorPortalRoutes.review"),
      detail: "review-upload → /studio/review"
    });

    checks.push({
      name: "redirect.workspace_studio",
      ok: read("app/workspace/studio/page.tsx").includes("creatorPortalRoutes.projects"),
      detail: "/workspace/studio → /studio/projects"
    });

    checks.push({
      name: "nav.unified",
      ok:
        read("components/studioos/studio-portal-shell.tsx").includes("creatorPortalRoutes.invitations") &&
        read("components/studioos/studio-portal-shell.tsx").includes("creatorPortalRoutes.projects"),
      detail: "StudioPortalShell nav"
    });

    checks.push({
      name: "middleware.legacy_redirect",
      ok: read("middleware.ts").includes("/creator/orders/"),
      detail: "middleware redirect"
    });

    const creatorUser = await prisma.user.findUnique({
      where: { email: "creator.nova@studioos.test" },
      include: { creatorProfile: true }
    });

    if (creatorUser) {
      const dashboard = await creatorPortalService.getDashboard(
        { id: creatorUser.id, role: "CREATOR" },
        []
      );
      checks.push({
        name: "db.dashboard",
        ok: dashboard.stats != null && Array.isArray(dashboard.invitations),
        detail: `${dashboard.invitations.length} invitations`
      });
    } else {
      checks.push({ name: "db.dashboard", ok: false, detail: "creator seed missing" });
    }
  } catch (error) {
    checks.push({
      name: "sprint13.run",
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
  console.log("\nSprint 13 verification\n");
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
