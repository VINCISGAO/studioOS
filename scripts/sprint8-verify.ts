/**
 * Sprint 8 — Wallet + Ledger + Withdraw
 * Run: npm run sprint8:verify
 */
import { PrismaClient } from "@prisma/client";
import { campaignService } from "../features/campaign/campaign.service";
import { creativeDirectionService } from "../features/ai/creative-direction.service";
import { invitationService } from "../features/matching/invitation.service";
import { escrowService } from "../features/payment/escrow.service";
import { walletService } from "../features/wallet/wallet.service";
import { withdrawService } from "../features/wallet/withdraw.service";
import { paymentConfig } from "../lib/core/config/payment";
import { membershipRepository } from "../features/membership/membership.repository";

const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail?: string };

async function main() {
  const checks: Check[] = [];
  let campaignId: string | null = null;
  let creatorUserId: string | null = null;

  try {
    const brand = await prisma.user.findUniqueOrThrow({ where: { email: "client.arc@studioos.test" } });
    const creatorUser = await prisma.user.findUniqueOrThrow({ where: { email: "creator.nova@studioos.test" } });
    creatorUserId = creatorUser.id;
    const nova = await prisma.creatorProfile.findFirstOrThrow({ where: { userId: creatorUser.id } });

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 14);

    const created = await campaignService.create(
      { id: brand.id, role: "BRAND" },
      {
        title: "Sprint 8 Verify Campaign",
        description: "Wallet ledger test",
        budget: 2000,
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
    await invitationService.accept(invitations[0]!.id, { id: creatorUser.id, role: "CREATOR" });
    await escrowService.demoPay(campaignId, { id: brand.id, role: "BRAND" });

    const gross = 2000;
    const rule = await membershipRepository.getActiveCommissionRule();
    const defaultRate = rule?.defaultCreatorCommissionPercentage ?? 20;
    const expectedNet = Math.round(gross * (1 - defaultRate / 100) * 100) / 100;

    const release = await walletService.releaseEscrowForCampaign(campaignId, {
      id: brand.id,
      role: "BRAND"
    });
    checks.push({
      name: "escrow.release",
      ok: release.net === expectedNet,
      detail: `$${release.net} (fee $${release.commission})`
    });

    const walletView = await walletService.getWallet({ id: creatorUser.id, role: "CREATOR" });
    checks.push({
      name: "wallet.available",
      ok: walletView.wallet.availableBalance === expectedNet,
      detail: `$${walletView.wallet.availableBalance}`
    });

    const ledger = await walletService.listLedger({ id: creatorUser.id, role: "CREATOR" }, 20);
    checks.push({
      name: "ledger.entries",
      ok:
        ledger.items.some((t) => t.type === "ESCROW_RELEASE") &&
        ledger.items.some((t) => t.type === "PLATFORM_COMMISSION"),
      detail: `${ledger.items.length} txns`
    });

    const withdraw = await withdrawService.requestWithdraw(
      { id: creatorUser.id, role: "CREATOR" },
      150
    );
    checks.push({
      name: "withdraw.request",
      ok: withdraw.status === "pending" && withdraw.amount === 150,
      detail: withdraw.withdrawId
    });

    const completed = await withdrawService.completeWithdraw(withdraw.withdrawId, {
      id: creatorUser.id,
      role: "CREATOR"
    });
    checks.push({
      name: "withdraw.complete",
      ok: completed.transaction.type === "WITHDRAW_SUCCESS",
      detail: completed.transaction.type
    });

    const after = await walletService.getWallet({ id: creatorUser.id, role: "CREATOR" });
    checks.push({
      name: "wallet.after_withdraw",
      ok: after.wallet.availableBalance === expectedNet - 150 && after.wallet.totalWithdraw === 150,
      detail: `$${after.wallet.availableBalance} / withdrawn $${after.wallet.totalWithdraw}`
    });

    const belowMin = await withdrawService
      .requestWithdraw({ id: creatorUser.id, role: "CREATOR" }, 50)
      .then(() => null)
      .catch((error: Error) => error.message);
    checks.push({
      name: "withdraw.min_guard",
      ok: Boolean(belowMin?.includes(String(paymentConfig.minWithdrawUsd))),
      detail: belowMin ?? "unexpected success"
    });
  } catch (error) {
    checks.push({
      name: "sprint8.run",
      ok: false,
      detail: error instanceof Error ? error.message : String(error)
    });
  } finally {
    if (campaignId) {
      await prisma.orderCommission.deleteMany({ where: { campaignId } });
      await prisma.activityLog.deleteMany({ where: { campaignId } });
      await prisma.transaction.deleteMany({ where: { campaignId } });
      await prisma.escrowPayment.deleteMany({ where: { campaignId } });
      await prisma.creatorInvitation.deleteMany({ where: { campaignId } });
      await prisma.aiJob.deleteMany({ where: { campaignId } });
      await prisma.campaign.delete({ where: { id: campaignId } });
    }
    if (creatorUserId) {
      const wallet = await prisma.wallet.findUnique({ where: { userId: creatorUserId } });
      if (wallet) {
        await prisma.transaction.deleteMany({ where: { walletId: wallet.id } });
        await prisma.wallet.delete({ where: { id: wallet.id } });
      }
    }
  }

  report(checks);
  process.exit(checks.some((c) => !c.ok) ? 1 : 0);
}

function report(checks: Check[]) {
  console.log("\nSprint 8 verification\n");
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
