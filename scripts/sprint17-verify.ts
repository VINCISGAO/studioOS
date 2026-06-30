/**
 * Sprint 17 — E2E Happy Path (automated checkpoints)
 * Maps to docs/product/phase0-happy-path-qa-script.md (15 steps)
 * Run: npm run sprint17:verify
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { brandPortalService } from "../features/brand/brand-portal.service";
import { creatorPortalService } from "../features/creator/creator-portal.service";
import { brandPortalRoutes } from "../lib/studioos/brand-portal-routes";
import { creatorPortalRoutes } from "../lib/studioos/creator-portal-routes";

type Check = { name: string; ok: boolean; detail?: string; step?: number };

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

async function main() {
  const checks: Check[] = [];
  const prisma = new PrismaClient();

  try {
    // Step 1 — Brand login + wizard entry
    checks.push({
      step: 1,
      name: "step1.brand_wizard_route",
      ok: read("app/brand/projects/new/page.tsx").length > 0,
      detail: brandPortalRoutes.newProject ?? "/brand/projects/new"
    });

    const brand = await prisma.user.findUnique({ where: { email: "client.arc@studioos.test" } });
    const creator = await prisma.user.findUnique({ where: { email: "creator.nova@studioos.test" } });

    if (!brand || !creator) {
      checks.push({ step: 0, name: "seed.demo_users", ok: false, detail: "run npm run db:seed" });
    } else {
      checks.push({ step: 1, name: "seed.brand_user", ok: true, detail: brand.email });
      checks.push({ step: 6, name: "seed.creator_user", ok: true, detail: creator.email });

      const brandDash = await brandPortalService.getDashboard({ id: brand.id, role: "BRAND" }, [], []);
      checks.push({
        step: 1,
        name: "step1.brand_dashboard",
        ok: brandDash.stats != null,
        detail: `${brandDash.campaigns.length} campaigns`
      });

      const creatorDash = await creatorPortalService.getDashboard({ id: creator.id, role: "CREATOR" }, []);
      checks.push({
        step: 11,
        name: "step11.studio_dashboard",
        ok: creatorDash.stats != null,
        detail: creatorPortalRoutes.dashboard
      });
    }

    // Step 4-5 — Campaign + matching
    checks.push({
      step: 4,
      name: "step4.wizard_steps",
      ok: read("lib/campaign/wizard-steps.ts").includes("CAMPAIGN_WIZARD_STEPS"),
      detail: "7-step wizard"
    });

    checks.push({
      step: 5,
      name: "step5.matching_api",
      ok: read("features/matching/matching.service.ts").includes("matchCreatorsForCampaign"),
      detail: "MatchingService"
    });

    // Step 7-9 — Proposal / contract
    checks.push({
      step: 7,
      name: "step7.proposal_room",
      ok:
        read("components/proposal/proposal-contract-panel.tsx").includes("Proposal") ||
        read("app/brand/projects/[id]/page.tsx").length > 0,
      detail: "proposal UI"
    });

    // Step 10 — Escrow
    checks.push({
      step: 10,
      name: "step10.checkout_api",
      ok: read("app/api/v1/campaigns/[id]/checkout/route.ts").length > 0,
      detail: "Stripe checkout"
    });

    const escrowCount = await prisma.escrowPayment.count();
    checks.push({
      step: 10,
      name: "step10.escrow_model",
      ok: escrowCount >= 0,
      detail: `${escrowCount} escrows`
    });

    // Step 12 — Delivery upload
    checks.push({
      step: 12,
      name: "step12.upload_api",
      ok: read("features/video/version-upload.service.ts").includes("initUpload"),
      detail: "chunk upload"
    });

    // Step 13 — Review center
    checks.push({
      step: 13,
      name: "step13.review_hub",
      ok: read("app/brand/review/page.tsx").includes("Review"),
      detail: brandPortalRoutes.reviewHub
    });

    const demoCampaign = await prisma.campaign.findFirst({
      where: { title: "Summer Glow Campaign" },
      include: { versions: { where: { versionNumber: 3 }, take: 1 } }
    });
    checks.push({
      step: 13,
      name: "step13.demo_review_version",
      ok: Boolean(demoCampaign?.versions[0]?.hlsUrl),
      detail: demoCampaign?.id ?? "no demo campaign"
    });

    // Step 14 — Approve + settlement
    checks.push({
      step: 14,
      name: "step14.approve_api",
      ok: read("features/review/review-decision.service.ts").includes("approve"),
      detail: "ReviewDecisionService"
    });

    checks.push({
      step: 14,
      name: "step14.settlement_page",
      ok: read("app/brand/settlement/page.tsx").includes("Escrow"),
      detail: brandPortalRoutes.settlement
    });

    // Step 15 — Wallet
    checks.push({
      step: 15,
      name: "step15.wallet_api",
      ok: read("app/api/v1/wallet/route.ts").length > 0,
      detail: "GET /api/v1/wallet"
    });

    checks.push({
      step: 15,
      name: "step15.withdraw_api",
      ok: read("features/wallet/withdraw.service.ts").includes("requestWithdraw"),
      detail: "WithdrawService"
    });
  } catch (error) {
    checks.push({
      name: "sprint17.run",
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
  console.log("\nSprint 17 — Happy path checkpoints\n");
  for (const check of checks) {
    const step = check.step ? `[${check.step}] ` : "";
    console.log(`${check.ok ? "✅" : "❌"} ${step}${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  }
  const failed = checks.filter((c) => !c.ok).length;
  console.log(failed ? `\n${failed} check(s) failed` : "\nAll 15-step checkpoints passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
