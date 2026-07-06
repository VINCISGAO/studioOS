/**
 * MVP payment collection — checkout → webhook → commission → manual payout
 * Run: npm run payment:verify
 */
import { PrismaClient } from "@prisma/client";
import { campaignService } from "../features/campaign/campaign.service";
import { campaignRepository } from "../features/campaign/campaign.repository";
import { creativeDirectionService } from "../features/ai/creative-direction.service";
import { invitationService } from "../features/matching/invitation.service";
import { escrowService } from "../features/payment/escrow.service";
import { paymentCollectionService } from "../features/payment/payment-collection.service";
import { paymentWebhookService } from "../features/payment/payment-webhook.service";

const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail?: string };

async function main() {
  const checks: Check[] = [];
  let campaignId: string | null = null;

  try {
    const brand = await prisma.user.findUniqueOrThrow({ where: { email: "client.arc@studioos.test" } });
    const creatorUser = await prisma.user.findUniqueOrThrow({ where: { email: "creator.nova@studioos.test" } });
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@studioos.test" } });
    const nova = await prisma.creatorProfile.findFirstOrThrow({ where: { userId: creatorUser.id } });

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 14);

    const created = await campaignService.create(
      { id: brand.id, role: "BRAND" },
      {
        title: "Payment Collection Verify",
        description: "MVP payment webhook test",
        budget: 3000,
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

    const checkout = await escrowService.startCheckout(campaignId, {
      id: brand.id,
      role: "BRAND",
      email: brand.email
    });
    checks.push({
      name: "checkout.session_created",
      ok: checkout.mode === "demo" || Boolean((checkout as { checkoutUrl?: string }).checkoutUrl),
      detail: checkout.mode
    });

    const paid = await escrowService.demoPay(campaignId, { id: brand.id, role: "BRAND" });
    checks.push({
      name: "payment.escrow_held",
      ok: paid.escrow?.status === "HELD",
      detail: paid.escrow?.status
    });

    const invitations = await invitationService.send(campaignId, { id: brand.id, role: "BRAND" }, [nova.id]);
    await invitationService.accept(invitations[0]!.id, { id: creatorUser.id, role: "CREATOR" });
    await campaignRepository.selectCreator({
      campaignId,
      creatorUserId: creatorUser.id
    });
    await paymentCollectionService.finalizeSuccessfulPayment({
      campaignId,
      stripePaymentId: paid.escrow?.stripePaymentId ?? undefined,
      stripeSessionId: paid.escrow?.stripeSessionId ?? undefined
    });

    const escrow = await prisma.escrowPayment.findUniqueOrThrow({ where: { campaignId } });
    checks.push({
      name: "payment.status_paid",
      ok: escrow.paymentStatus === "PAID",
      detail: escrow.paymentStatus
    });
    checks.push({
      name: "payment.transaction_id_saved",
      ok: Boolean(escrow.stripePaymentId),
      detail: escrow.stripePaymentId ?? undefined
    });
    checks.push({
      name: "payout.manual_pending",
      ok: escrow.creatorPayoutStatus === "MANUAL_PAYOUT_PENDING",
      detail: escrow.creatorPayoutStatus ?? undefined
    });

    const commission = await prisma.orderCommission.findUnique({ where: { campaignId } });
    checks.push({
      name: "commission.calculated",
      ok: Boolean(commission && Number(commission.creatorPayoutAmount) > 0),
      detail: commission
        ? `fee=${Number(commission.clientServiceFeeAmount)} comm=${Number(commission.creatorCommissionAmount)} payable=${Number(commission.creatorPayoutAmount)}`
        : "missing"
    });

    const webhookResult = await paymentWebhookService.handleStripeEvent({
      id: `evt_test_${Date.now()}`,
      type: "checkout.session.expired",
      data: {
        object: {
          id: escrow.stripeSessionId ?? "cs_test_missing",
          metadata: { campaign_id: campaignId }
        }
      }
    } as never);
    checks.push({
      name: "webhook.cancel_ignored_after_paid",
      ok: (webhookResult as { ignored?: boolean }).ignored === true,
      detail: JSON.stringify(webhookResult)
    });

    const mark = await paymentCollectionService.markCreatorPayoutPaid(
      { id: admin.id, role: "ADMIN" },
      campaignId
    );
    checks.push({
      name: "admin.mark_payout_paid",
      ok: mark.record.creatorPayoutStatus === "PAID",
      detail: mark.record.creatorPayoutStatus ?? undefined
    });

    const adminList = await paymentCollectionService.listForAdmin({ id: admin.id, role: "ADMIN" });
    checks.push({
      name: "admin.list_payments",
      ok: adminList.some((row) => row.campaignId === campaignId),
      detail: `${adminList.length} records`
    });
  } catch (error) {
    checks.push({
      name: "payment.run",
      ok: false,
      detail: error instanceof Error ? error.message : String(error)
    });
  } finally {
    if (campaignId) {
      await prisma.notification.deleteMany({ where: { campaignId } });
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
  console.log("\nPayment collection verification\n");
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
