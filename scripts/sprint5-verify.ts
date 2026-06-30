/**
 * Sprint 5 — Approve / Revision state machines + Activity Log
 * Run: npm run sprint5:verify
 */
import { PrismaClient } from "@prisma/client";
import { reviewDecisionService } from "../features/review/review-decision.service";
import { activityService } from "../features/campaign/activity.service";

const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail?: string };

async function main() {
  const checks: Check[] = [];
  let campaignId: string | null = null;

  try {
    const brand = await prisma.user.findUniqueOrThrow({ where: { email: "client.arc@studioos.test" } });
    const creator = await prisma.user.findUniqueOrThrow({ where: { email: "creator.nova@studioos.test" } });

    const campaign = await prisma.campaign.create({
      data: {
        brandId: brand.id,
        creatorId: creator.id,
        title: "Sprint 5 Verify Campaign",
        budget: 2200,
        deadline: new Date(Date.now() + 10 * 86400000),
        platform: "TikTok",
        aspectRatio: "9:16",
        status: "UNDER_REVIEW",
        reviewRound: 0,
        currentVersion: 1
      }
    });
    campaignId = campaign.id;

    const version = await prisma.campaignVersion.create({
      data: {
        campaignId: campaign.id,
        versionNumber: 1,
        uploadedBy: creator.id,
        videoKey: `campaigns/${campaign.id}/v1.mp4`,
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        status: "READY",
        reviewStatus: "REVIEWING"
      }
    });

    const revision = await reviewDecisionService.requestRevision(
      version.id,
      { id: brand.id, role: "BRAND" },
      "Please tighten the opening hook."
    );
    checks.push({
      name: "revision.transition",
      ok: revision.campaignStatus === "PRODUCING" && revision.reviewRound === 1,
      detail: `${revision.campaignStatus} / round ${revision.reviewRound}`
    });

    const afterRevision = await prisma.campaignVersion.findUniqueOrThrow({ where: { id: version.id } });
    checks.push({
      name: "review.revision_required",
      ok: afterRevision.reviewStatus === "REVISION_REQUIRED",
      detail: afterRevision.reviewStatus
    });

    await prisma.campaignVersion.update({
      where: { id: version.id },
      data: { reviewStatus: "REVIEWING" }
    });
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "UNDER_REVIEW" }
    });

    const approved = await reviewDecisionService.approveVersion(version.id, {
      id: brand.id,
      role: "BRAND"
    });
    checks.push({
      name: "approve.transition",
      ok: approved.campaignStatus === "APPROVED",
      detail: approved.campaignStatus
    });

    const afterApprove = await prisma.campaignVersion.findUniqueOrThrow({ where: { id: version.id } });
    checks.push({
      name: "review.approved",
      ok: afterApprove.reviewStatus === "APPROVED",
      detail: afterApprove.reviewStatus
    });

    const activity = await activityService.listForCampaign(campaign.id, {
      id: brand.id,
      role: "BRAND"
    });
    checks.push({
      name: "activity.log",
      ok: activity.some((log) => log.action.includes("REQUEST_REVISION") || log.action.includes("review.")),
      detail: `${activity.length} entries`
    });
  } catch (error) {
    checks.push({
      name: "sprint5.run",
      ok: false,
      detail: error instanceof Error ? error.message : String(error)
    });
  } finally {
    if (campaignId) {
      await prisma.activityLog.deleteMany({ where: { campaignId } });
      await prisma.reviewAnnotation.deleteMany({ where: { campaignId } });
      await prisma.reviewComment.deleteMany({ where: { campaignId } });
      await prisma.campaignVersion.deleteMany({ where: { campaignId } });
      await prisma.campaign.delete({ where: { id: campaignId } });
    }
  }

  report(checks);
  process.exit(checks.some((c) => !c.ok) ? 1 : 0);
}

function report(checks: Check[]) {
  console.log("\nSprint 5 verification\n");
  for (const check of checks) {
    console.log(`${check.ok ? "✅" : "❌"} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  }
  const failed = checks.filter((c) => !c.ok).length;
  console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
