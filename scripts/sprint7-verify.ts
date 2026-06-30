/**
 * Sprint 7 — Escrow + Stripe Checkout (demo pay path)
 * Run: npm run sprint7:verify
 */
import { PrismaClient } from "@prisma/client";
import { campaignService } from "../features/campaign/campaign.service";
import { creativeDirectionService } from "../features/ai/creative-direction.service";
import { invitationService } from "../features/matching/invitation.service";
import { escrowService } from "../features/payment/escrow.service";

const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail?: string };

async function main() {
  const checks: Check[] = [];
  let campaignId: string | null = null;

  try {
    const brand = await prisma.user.findUniqueOrThrow({ where: { email: "client.arc@studioos.test" } });
    const creatorUser = await prisma.user.findUniqueOrThrow({ where: { email: "creator.nova@studioos.test" } });
    const nova = await prisma.creatorProfile.findFirstOrThrow({
      where: { userId: creatorUser.id }
    });

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 14);

    const created = await campaignService.create(
      { id: brand.id, role: "BRAND" },
      {
        title: "Sprint 7 Verify Campaign",
        description: "Escrow checkout test",
        budget: 2500,
        currency: "USD",
        deadline: deadline.toISOString(),
        platform: "TikTok",
        aspect_ratio: "9:16"
      }
    );
    campaignId = created?.id ?? null;
    if (!campaignId) throw new Error("Campaign not created");

    const directions = await creativeDirectionService.generate(campaignId, { id: brand.id, role: "BRAND" });
    await creativeDirectionService.approve(campaignId, { id: brand.id, role: "BRAND" }, directions[0]!.id);

    const invitations = await invitationService.send(campaignId, { id: brand.id, role: "BRAND" }, [nova.id]);
    const accepted = await invitationService.accept(invitations[0]!.id, {
      id: creatorUser.id,
      role: "CREATOR"
    });
    checks.push({
      name: "creator.accepted",
      ok: accepted.status === "ACCEPTED",
      detail: accepted.status
    });

    const beforePay = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });
    checks.push({
      name: "campaign.creator_accepted",
      ok: beforePay.status === "CREATOR_ACCEPTED",
      detail: beforePay.status
    });

    const checkout = await escrowService.startCheckout(campaignId, {
      id: brand.id,
      role: "BRAND",
      email: brand.email
    });
    checks.push({
      name: "checkout.init",
      ok: checkout.mode === "demo" || Boolean((checkout as { checkoutUrl?: string }).checkoutUrl),
      detail: checkout.mode
    });

    const paid = await escrowService.demoPay(campaignId, { id: brand.id, role: "BRAND" });
    checks.push({
      name: "escrow.demo_pay",
      ok: paid.escrow?.status === "HELD",
      detail: paid.escrow?.status
    });

    const afterPay = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });
    checks.push({
      name: "campaign.producing",
      ok: afterPay.status === "PRODUCING",
      detail: afterPay.status
    });

    const again = await escrowService.demoPay(campaignId, { id: brand.id, role: "BRAND" });
    checks.push({
      name: "escrow.idempotent",
      ok: again.alreadyFunded === true,
      detail: String(again.alreadyFunded)
    });

    const escrowView = await escrowService.getEscrow(campaignId, { id: brand.id, role: "BRAND" });
    checks.push({
      name: "escrow.read",
      ok: escrowView.escrow?.amount === 2500,
      detail: `$${escrowView.escrow?.amount}`
    });
  } catch (error) {
    checks.push({
      name: "sprint7.run",
      ok: false,
      detail: error instanceof Error ? error.message : String(error)
    });
  } finally {
    if (campaignId) {
      await prisma.orderCommission.deleteMany({ where: { campaignId } });
      await prisma.activityLog.deleteMany({ where: { campaignId } });
      await prisma.escrowPayment.deleteMany({ where: { campaignId } });
      await prisma.creatorInvitation.deleteMany({ where: { campaignId } });
      await prisma.aiJob.deleteMany({ where: { campaignId } });
      await prisma.campaign.delete({ where: { id: campaignId } });
    }
  }

  report(checks);
  process.exit(checks.some((c) => !c.ok) ? 1 : 0);
}

function report(checks: Check[]) {
  console.log("\nSprint 7 verification\n");
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
