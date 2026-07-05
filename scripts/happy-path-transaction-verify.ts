/**
 * Full happy-path transaction — Prisma services only (no Playwright).
 * Brand publish → invite → accept → select → pay → upload → approve → delivery → settlement → wallet → withdrawal.
 *
 * Run: npm run happy-path:verify
 * Requires: DATABASE_URL, demo seed (npm run db:seed)
 */
import { CampaignState } from "../features/campaign/campaign.state-machine";
import { campaignBrandPortalService } from "../features/campaign/campaign-brand.service";
import { campaignRepository } from "../features/campaign/campaign.repository";
import { readProductionBrief } from "../features/campaign/brand-campaign/brand-campaign.utils";
import type { BrandProductionBrief } from "../features/campaign/brand-campaign/brand-campaign.types";
import { deliveryService } from "../features/delivery/delivery.service";
import { versionService } from "../features/delivery/version.service";
import { invitationPortalService } from "../features/matching/invitation-portal.service";
import { invitationService } from "../features/matching/invitation.service";
import { paymentRepository } from "../features/payment/payment.repository";
import { paymentService } from "../features/payment/payment.service";
import { reviewPortalService } from "../features/review/review-portal.service";
import { settlementService } from "../features/settlement/settlement.service";
import { walletRepository } from "../features/wallet/wallet.repository";
import { withdrawService } from "../features/wallet/withdraw.service";
import { hasDatabaseUrl, prisma } from "../lib/core/database/prisma";
import { paymentConfig } from "../lib/core/config/payment";
import { getOrderForProject } from "../lib/order-service";
import { getProject } from "../lib/project-service";
import { setupBrandCampaignPayment } from "../lib/studioos/brand-checkout-service";
import { prepareCampaignForPublish } from "./helpers/prepare-campaign-for-publish";
import { withVerifyTransactionRetry } from "./helpers/verify-transaction-retry";

const DEMO_VIDEO =
  "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/v2/prog_index.m3u8";

type Check = { step: number; name: string; ok: boolean; detail?: string };

function report(checks: Check[]) {
  console.log("\nHappy path transaction verify (Prisma)\n");
  for (const check of checks) {
    console.log(
      `${check.ok ? "✅" : "❌"} [${check.step}] ${check.name}${check.detail ? ` — ${check.detail}` : ""}`
    );
  }
  const failed = checks.filter((c) => !c.ok).length;
  console.log(failed ? `\n${failed} step(s) failed` : "\nAll transaction steps passed");
}

async function main() {
  const checks: Check[] = [];

  if (!hasDatabaseUrl()) {
    checks.push({ step: 0, name: "database", ok: false, detail: "DATABASE_URL not set" });
    report(checks);
    process.exit(1);
  }

  let legacyProjectId = "";
  let campaignId = "";
  let orderId = "";

  try {
    const brand = await prisma.user.findUnique({ where: { email: "client.arc@studioos.test" } });
    const creator = await prisma.user.findUnique({
      where: { email: "creator.nova@studioos.test" },
      include: { creatorProfile: true }
    });

    if (!brand || !creator?.creatorProfile) {
      checks.push({ step: 0, name: "seed.demo_users", ok: false, detail: "run npm run db:seed" });
      report(checks);
      process.exit(1);
    }

    const client = {
      client_email: brand.email,
      client_name: brand.fullName,
      company_name: brand.fullName
    };

    const draft = await campaignBrandPortalService.createDraft({
      client_email: brand.email,
      client_name: brand.fullName,
      company_name: brand.fullName,
      created_by: brand.email,
      wizard_ephemeral: false,
      title: `Happy Path Verify ${Date.now()}`
    });

    if (!draft) {
      checks.push({ step: 1, name: "create_draft", ok: false, detail: "createBrandDraft returned null" });
      report(checks);
      process.exit(1);
    }

    legacyProjectId = draft.id;
    const campaignRow = await campaignRepository.findByLegacyProjectId(legacyProjectId);
    if (!campaignRow) {
      checks.push({ step: 1, name: "create_draft", ok: false, detail: "campaign not found after draft" });
      report(checks);
      process.exit(1);
    }

    campaignId = campaignRow.id;
    const brief = readProductionBrief(campaignRow.productionBrief) as BrandProductionBrief;
    await prepareCampaignForPublish({
      campaignId: campaignRow.id,
      legacyProjectId,
      brandUserId: brand.id,
      productionBrief: brief
    });

    checks.push({ step: 1, name: "create_draft", ok: true, detail: legacyProjectId });

    const published = await campaignBrandPortalService.publish(legacyProjectId, {
      email: brand.email,
      userId: brand.id
    });
    checks.push({
      step: 2,
      name: "publish",
      ok: published?.status === "matching",
      detail: published?.status ?? "null"
    });

    if (published?.status === "matching") {
      const projectForCheckout = (await getProject(legacyProjectId)) ?? published;
      await setupBrandCampaignPayment({
        project: projectForCheckout,
        client,
        locale: "en"
      });
    }

    await withVerifyTransactionRetry(() => invitationService.ensureForProject(published!, "en"));
    const invitations = await invitationService.listForLegacyProject(legacyProjectId);
    const novaInvite = invitations.find((item) => item.creatorId === "creator_01");
    checks.push({
      step: 3,
      name: "invitations",
      ok: Boolean(novaInvite?.id),
      detail: `${invitations.length} invites`
    });

    if (novaInvite?.id) {
      const accepted = await invitationPortalService.acceptForCreator(novaInvite.id, "creator_01", "en");
      checks.push({
        step: 4,
        name: "studio_accept",
        ok: accepted.ok,
        detail: accepted.ok ? accepted.invitation.status : accepted.error
      });
    } else {
      checks.push({ step: 4, name: "studio_accept", ok: false, detail: "no invitation" });
    }

    const selected = await invitationService.selectCreatorForLegacyProject({
      projectId: legacyProjectId,
      creatorId: "creator_01",
      client,
      locale: "en"
    });
    checks.push({
      step: 5,
      name: "brand_select_studio",
      ok: selected.ok,
      detail: selected.ok ? selected.invitation.status : selected.error
    });

    const paid = await paymentService.payBrandCampaignForLegacyProject({
      legacyProjectId,
      clientEmail: brand.email,
      locale: "en"
    });
    checks.push({
      step: 6,
      name: "pay_escrow",
      ok: paid.ok,
      detail: paid.ok ? paid.mode : paid.error
    });

    const afterPay = await campaignRepository.findByLegacyProjectId(legacyProjectId);
    checks.push({
      step: 6,
      name: "campaign_producing",
      ok: afterPay?.status === CampaignState.PRODUCING || afterPay?.status === CampaignState.ESCROW_FUNDED,
      detail: afterPay?.status
    });

    const legacyOrder = await getOrderForProject(legacyProjectId);
    orderId = legacyOrder?.id ?? "";
    checks.push({
      step: 6,
      name: "legacy_order_created",
      ok: Boolean(legacyOrder?.id),
      detail: legacyOrder?.id ?? "missing after checkout setup"
    });

    const escrow = await paymentRepository.findByCampaignId(campaignId);
    checks.push({
      step: 6,
      name: "escrow_order",
      ok: escrow?.status === "HELD" || escrow?.status === "PARTIAL_RELEASE",
      detail: escrow ? `${escrow.status} id=${orderId || escrow.id}` : "no prisma escrow"
    });

    const uploaded = await versionService.uploadForLegacyOrder({
      legacyProjectId,
      orderId,
      legacyCreatorId: "creator_01",
      videoUrl: DEMO_VIDEO,
      fileName: "happy-path-v1.mp4",
      mimeType: "video/mp4",
      locale: "en"
    });
    checks.push({
      step: 7,
      name: "upload_version",
      ok: uploaded.ok,
      detail: uploaded.ok ? `v${uploaded.deliverable.version}` : uploaded.error
    });

    const approved = await reviewPortalService.approveForLegacyOrder({
      orderId,
      legacyProjectId,
      brandEmail: brand.email,
      locale: "en"
    });
    checks.push({
      step: 8,
      name: "brand_approve",
      ok: approved.ok,
      detail: approved.ok ? "approved" : approved.error
    });

    const marked = await deliveryService.markAsFinalForLegacyOrder({
      legacyProjectId,
      orderId,
      legacyCreatorId: "creator_01",
      versionNumber: 1,
      locale: "en"
    });
    checks.push({
      step: 9,
      name: "mark_final",
      ok: marked.ok,
      detail: marked.ok ? marked.delivery.status : marked.error
    });

    const downloaded = await deliveryService.recordBrandDownload({
      legacyProjectId,
      brandEmail: brand.email,
      locale: "en"
    });
    checks.push({
      step: 10,
      name: "brand_download_lock",
      ok: downloaded.ok,
      detail: downloaded.ok ? downloaded.delivery.status : downloaded.error
    });

    const released = await settlementService.releaseForCampaign({
      campaignId,
      actor: { id: brand.id, role: brand.role, email: brand.email },
      locale: "en",
      orderId
    });
    checks.push({
      step: 11,
      name: "release_settlement",
      ok: released.ok,
      detail: released.ok
        ? `${released.result.settlementState} payout=${released.result.creatorPayoutAmount}`
        : released.error
    });

    const wallet = creator.id ? await walletRepository.findByUserId(creator.id) : null;
    const walletAvailable = wallet ? Number(wallet.availableBalance) : 0;
    checks.push({
      step: 12,
      name: "wallet_credit",
      ok: walletAvailable > 0,
      detail: wallet
        ? `available=${walletAvailable} earned=${Number(wallet.totalEarned)}`
        : "no wallet"
    });

    const finalCampaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    checks.push({
      step: 12,
      name: "campaign_completed",
      ok: finalCampaign?.status === CampaignState.COMPLETED,
      detail: finalCampaign?.status
    });

    const refreshedWallet = creator.id ? await walletRepository.findByUserId(creator.id) : null;
    const availableBalance = Number(refreshedWallet?.availableBalance ?? 0);
    const withdrawAmount = paymentConfig.minWithdrawUsd;

    if (availableBalance >= paymentConfig.minWithdrawUsd && creator.id) {
      const creatorUser = {
        id: creator.id,
        role: creator.role
      };
      const requested = await withdrawService.requestWithdraw(creatorUser, withdrawAmount);
      const completed = await withdrawService.completeWithdraw(requested.withdrawId, {
        id: creator.id,
        role: "ADMIN"
      });
      checks.push({
        step: 13,
        name: "withdraw",
        ok: requested.status === "pending" && requested.amount === withdrawAmount,
        detail: `withdrawId=${requested.withdrawId} amount=${requested.amount}`
      });
      checks.push({
        step: 13,
        name: "withdraw_complete",
        ok: !completed.alreadyCompleted || Boolean(completed.transaction),
        detail: completed.alreadyCompleted ? "already-completed" : "completed"
      });
    } else {
      checks.push({
        step: 13,
        name: "withdraw",
        ok: false,
        detail: `available=${availableBalance} min=${paymentConfig.minWithdrawUsd}`
      });
    }
  } catch (error) {
    checks.push({
      step: 0,
      name: "run",
      ok: false,
      detail: error instanceof Error ? error.message : String(error)
    });
  } finally {
    await prisma.$disconnect();
  }

  report(checks);
  process.exit(checks.some((c) => !c.ok) ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
