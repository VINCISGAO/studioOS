/**
 * Sprint 3 — AI creative directions + creator matching + invitations
 * Run: npm run sprint3:verify
 */
import { PrismaClient } from "@prisma/client";
import { campaignService } from "../features/campaign/campaign.service";
import { creativeDirectionService } from "../features/ai/creative-direction.service";
import { matchingService } from "../features/matching/matching.service";
import { invitationService } from "../features/matching/invitation.service";

const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail?: string };

async function main() {
  const checks: Check[] = [];
  let campaignId: string | null = null;

  try {
    const brand = await prisma.user.findUniqueOrThrow({ where: { email: "client.arc@adbridge.test" } });
    const nova = await prisma.creatorProfile.findFirstOrThrow({
      where: { user: { email: "creator.nova@adbridge.test" } }
    });
    const signal = await prisma.creatorProfile.findFirstOrThrow({
      where: { user: { email: "creator.signal@adbridge.test" } }
    });

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 14);

    const created = await campaignService.create(
      { id: brand.id, role: "BRAND" },
      {
        title: "Sprint 3 Verify Campaign",
        description: "Creative + matching test",
        budget: 3000,
        currency: "USD",
        deadline: deadline.toISOString(),
        platform: "TikTok",
        aspect_ratio: "9:16"
      }
    );
    campaignId = created?.id ?? null;

    const directions = await creativeDirectionService.generate(
      campaignId!,
      { id: brand.id, role: "BRAND" }
    );
    checks.push({
      name: "creative.generate",
      ok: directions.length === 3,
      detail: `${directions.length} directions`
    });

    const approved = await creativeDirectionService.approve(
      campaignId!,
      { id: brand.id, role: "BRAND" },
      directions[0]!.id
    );
    checks.push({
      name: "creative.approve",
      ok: Boolean(approved?.title),
      detail: approved.title
    });

    const campaignAfterApprove = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId! } });
    checks.push({
      name: "campaign.matching_status",
      ok: campaignAfterApprove.status === "MATCHING",
      detail: campaignAfterApprove.status
    });

    const matches = await matchingService.matchCreatorsForCampaign(
      campaignId!,
      { id: brand.id, role: "BRAND" },
      6
    );
    checks.push({
      name: "matching.rank",
      ok: matches.length >= 2,
      detail: `${matches.length} creators scored`
    });

    const invitations = await invitationService.send(
      campaignId!,
      { id: brand.id, role: "BRAND" },
      [nova.id, signal.id]
    );
    checks.push({
      name: "invitation.send",
      ok: invitations.length >= 2,
      detail: `${invitations.length} sent`
    });

    const novaInvitation = await prisma.creatorInvitation.findFirstOrThrow({
      where: { campaignId: campaignId!, creatorId: nova.id }
    });

    const accepted = await invitationService.accept(novaInvitation.id, {
      id: nova.userId,
      role: "CREATOR"
    });
    checks.push({
      name: "invitation.accept",
      ok: accepted.status === "ACCEPTED",
      detail: accepted.status
    });

    const linked = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId! } });
    checks.push({
      name: "campaign.creator_linked",
      ok: linked.creatorId === nova.userId && linked.status === "CREATOR_ACCEPTED",
      detail: linked.status
    });

    const aiJob = await prisma.aiJob.findFirst({ where: { campaignId: campaignId!, type: "CREATIVE_DIRECTION" } });
    checks.push({
      name: "ai_job.logged",
      ok: aiJob?.status === "SUCCESS",
      detail: aiJob?.status ?? "missing"
    });
  } catch (error) {
    checks.push({
      name: "sprint3.run",
      ok: false,
      detail: error instanceof Error ? error.message : String(error)
    });
  } finally {
    if (campaignId) {
      await prisma.creatorInvitation.deleteMany({ where: { campaignId } });
      await prisma.aiJob.deleteMany({ where: { campaignId } });
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { deletedAt: new Date() }
      });
    }
  }

  report(checks);
  process.exit(checks.some((c) => !c.ok) ? 1 : 0);
}

function report(checks: Check[]) {
  console.log("\nSprint 3 verification\n");
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
