/**
 * Five-round revision transaction loop — Prisma services (no Playwright).
 * Brand publish → invite → accept → select → pay → V1–V5 with payment gate after V3.
 *
 * Run: npm run revision-five-round:verify
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
import { paymentService } from "../features/payment/payment.service";
import { paidRevisionService } from "../features/review/paid-revision.service";
import {
  assertReviewVersionUploadAllowed,
  assertRevisionRequestAllowed
} from "../features/review/review-round-policy";
import { reviewPortalService } from "../features/review/review-portal.service";
import { settlementService } from "../features/settlement/settlement.service";
import { rechargeBrandWallet } from "../features/wallet/brand-wallet.service";
import { hasDatabaseUrl, prisma } from "../lib/core/database/prisma";
import { getOrder, getOrderForProject } from "../lib/order-service";
import { setupBrandCampaignPayment } from "../lib/studioos/brand-checkout-service";
import { notifyBrandDeliverableUploaded } from "../lib/studioos/brand-deliverable-notify";
import { hasBrandNotification } from "../lib/studioos/brand-notification-service";
import { notifyCreatorRevisionRequested } from "../lib/studioos/commercial-interaction-notify";
import { hasNotification } from "../lib/notification-service";
import { prepareCampaignForPublish } from "./helpers/prepare-campaign-for-publish";
import { withVerifyTransactionRetry } from "./helpers/verify-transaction-retry";

function verifyReviewVideoUrl(orderId: string, version: number) {
  return `/api/review-video/${orderId}/${version}`;
}

type Check = { step: number; name: string; ok: boolean; detail?: string };

function report(checks: Check[]) {
  console.log("\nFive-round revision transaction verify (Prisma)\n");
  for (const check of checks) {
    console.log(
      `${check.ok ? "✅" : "❌"} [${check.step}] ${check.name}${check.detail ? ` — ${check.detail}` : ""}`
    );
  }
  const failed = checks.filter((c) => !c.ok).length;
  console.log(failed ? `\n${failed} step(s) failed` : "\nAll five-round steps passed");
}

async function uploadAndNotify(input: {
  legacyProjectId: string;
  orderId: string;
  version: number;
  orderStatus: "in_production" | "revision" | "review";
  paidSlots: number;
  replaceExisting?: boolean;
}) {
  const order = await getOrder(input.orderId);
  if (!order) return { ok: false as const, error: "order-not-found" };

  const gate = assertReviewVersionUploadAllowed({
    targetVersion: input.version,
    paidSlotsUnlocked: input.paidSlots
  });
  if (!gate.ok) return { ok: false as const, error: gate.code };

  const uploaded = await versionService.uploadForLegacyOrder({
    legacyProjectId: input.legacyProjectId,
    orderId: input.orderId,
    legacyCreatorId: "creator_01",
    videoUrl: verifyReviewVideoUrl(input.orderId, input.version),
    fileName: `verify-v${input.version}.mp4`,
    mimeType: "video/mp4",
    locale: "zh",
    versionNumber: input.version,
    replaceExisting: input.replaceExisting ?? false,
    orderStatus: input.orderStatus,
    paidRevisionSlotsUnlocked: input.paidSlots
  });
  if (!uploaded.ok) return uploaded;

  await notifyBrandDeliverableUploaded({
    order,
    deliverable: uploaded.deliverable,
    locale: "zh"
  });

  return uploaded;
}

async function brandCommentAndRequestRevision(input: {
  orderId: string;
  legacyProjectId: string;
  brandEmail: string;
  version: number;
  notes: string;
}) {
  const comment = await reviewPortalService.addCommentForLegacyOrder({
    orderId: input.orderId,
    legacyProjectId: input.legacyProjectId,
    brandEmail: input.brandEmail,
    version: input.version,
    timestampSec: 12,
    body: input.notes,
    posX: 0.42,
    posY: 0.38,
    issueType: "修改",
    locale: "zh"
  });
  if (!comment.ok) return comment;

  const revision = await reviewPortalService.requestRevisionForLegacyOrder({
    orderId: input.orderId,
    legacyProjectId: input.legacyProjectId,
    brandEmail: input.brandEmail,
    revisionNotes: input.notes,
    locale: "zh"
  });
  if (!revision.ok) return revision;

  const order = await getOrder(input.orderId);
  if (order) {
    await notifyCreatorRevisionRequested({ order, notes: input.notes, locale: "zh" });
  }

  return { ok: true as const };
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
  let brandEmail = "";

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

    brandEmail = brand.email;
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
      title: `Five Round Verify ${Date.now()}`
    });

    if (!draft) {
      checks.push({ step: 1, name: "create_draft", ok: false, detail: "null draft" });
      report(checks);
      process.exit(1);
    }

    legacyProjectId = draft.id;
    const campaignRow = await campaignRepository.findByLegacyProjectId(legacyProjectId);
    if (!campaignRow) {
      checks.push({ step: 1, name: "create_draft", ok: false, detail: "campaign missing" });
      report(checks);
      process.exit(1);
    }

    campaignId = campaignRow.id;
    const brief = readProductionBrief(campaignRow.productionBrief) as BrandProductionBrief;

    try {
      const prepared = await prepareCampaignForPublish({
        campaignId: campaignRow.id,
        legacyProjectId,
        brandUserId: brand.id,
        productionBrief: brief
      });
      checks.push({ step: 1, name: "brand_create_draft", ok: true, detail: legacyProjectId });
      checks.push({
        step: 1,
        name: "approve_creative_direction",
        ok: true,
        detail: prepared.status
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      checks.push({ step: 1, name: "brand_create_draft", ok: true, detail: legacyProjectId });
      checks.push({ step: 1, name: "approve_creative_direction", ok: false, detail });
      report(checks);
      process.exit(1);
    }

    let published: Awaited<ReturnType<typeof campaignBrandPortalService.publish>> = null;
    try {
      published = await campaignBrandPortalService.publish(legacyProjectId, {
        email: brand.email,
        userId: brand.id
      });
    } catch (error) {
      checks.push({
        step: 2,
        name: "brand_publish",
        ok: false,
        detail: error instanceof Error ? error.message : String(error)
      });
      report(checks);
      process.exit(1);
    }
    checks.push({
      step: 2,
      name: "brand_publish",
      ok: published?.status === "matching",
      detail: published?.status ?? "null"
    });

    if (published?.status === "matching") {
      try {
        const checkoutOrder = await setupBrandCampaignPayment({
          project: published,
          client: {
            client_name: client.client_name,
            client_email: client.client_email,
            company_name: client.company_name
          },
          locale: "zh"
        });
        orderId = checkoutOrder.id;
        checks.push({
          step: 2,
          name: "brand_checkout_setup",
          ok: Boolean(checkoutOrder.id),
          detail: checkoutOrder.id ?? "missing order id"
        });
      } catch (error) {
        checks.push({
          step: 2,
          name: "brand_checkout_setup",
          ok: false,
          detail: error instanceof Error ? error.message : String(error)
        });
      }
    } else {
      checks.push({ step: 2, name: "brand_checkout_setup", ok: false, detail: "skipped — publish failed" });
    }

    const publishedNotify = await hasBrandNotification({
      brand_email: brandEmail,
      project_id: legacyProjectId,
      creator_id: "system",
      type: "requirement_published"
    });
    checks.push({
      step: 2,
      name: "notify_requirement_published",
      ok: publishedNotify,
      detail: publishedNotify ? "ok" : "missing"
    });

    await withVerifyTransactionRetry(() => invitationService.ensureForProject(published!, "zh"));
    const invitations = await invitationService.listForLegacyProject(legacyProjectId);
    const novaInvite = invitations.find((item) => item.creatorId === "creator_01");
    checks.push({
      step: 3,
      name: "invitations_created",
      ok: Boolean(novaInvite?.id),
      detail: `${invitations.length} invites`
    });

    if (novaInvite?.id) {
      const accepted = await invitationPortalService.acceptForCreator(novaInvite.id, "creator_01", "zh");
      checks.push({
        step: 4,
        name: "creator_accept",
        ok: accepted.ok,
        detail: accepted.ok ? accepted.invitation.status : accepted.error
      });

      const acceptNotify = await hasBrandNotification({
        brand_email: brandEmail,
        project_id: legacyProjectId,
        creator_id: "creator_01",
        type: "invitation_accepted"
      });
      checks.push({
        step: 4,
        name: "notify_creator_accepted",
        ok: acceptNotify,
        detail: acceptNotify ? "ok" : "missing (may pre-exist from prior runs)"
      });
    } else {
      checks.push({ step: 4, name: "creator_accept", ok: false, detail: "no invitation" });
    }

    const selected = await invitationService.selectCreatorForLegacyProject({
      projectId: legacyProjectId,
      creatorId: "creator_01",
      client,
      locale: "zh"
    });
    checks.push({
      step: 5,
      name: "brand_select_creator",
      ok: selected.ok,
      detail: selected.ok ? selected.invitation.status : selected.error
    });

    const paid = await paymentService.payBrandCampaignForLegacyProject({
      legacyProjectId,
      clientEmail: brand.email,
      locale: "zh"
    });
    checks.push({
      step: 6,
      name: "pay_escrow",
      ok: paid.ok,
      detail: paid.ok ? paid.mode : paid.error
    });

    const order =
      (orderId ? await getOrder(orderId) : null) ?? (await getOrderForProject(legacyProjectId));
    if (!order) {
      checks.push({ step: 6, name: "order_created", ok: false, detail: "no order after select/pay" });
      report(checks);
      process.exit(1);
    }
    orderId = order.id;
    checks.push({ step: 6, name: "order_created", ok: true, detail: orderId });

    let paidSlots = order.paid_revision_slots_unlocked ?? 0;

    for (let version = 1; version <= 3; version += 1) {
      const orderFresh = await getOrder(orderId);
      const uploadStatus =
        version === 1 ? "in_production" : ((orderFresh?.status === "revision" ? "revision" : "in_production") as "revision" | "in_production");

      const uploaded = await uploadAndNotify({
        legacyProjectId,
        orderId,
        version,
        orderStatus: uploadStatus,
        paidSlots
      });
      checks.push({
        step: 10 + version,
        name: `creator_upload_v${version}`,
        ok: uploaded.ok,
        detail: uploaded.ok ? `v${version}` : uploaded.error
      });

      if (!uploaded.ok) continue;

      const actualVersion = uploaded.deliverable.version;
      const deliverableNotify = await hasBrandNotification({
        brand_email: brandEmail,
        project_id: legacyProjectId,
        creator_id: "creator_01",
        type: "deliverable_uploaded",
        order_id: orderId,
        deliverable_version: actualVersion
      });
      checks.push({
        step: 10 + version,
        name: `notify_v${version}_uploaded`,
        ok: deliverableNotify && actualVersion === version,
        detail: deliverableNotify
          ? actualVersion === version
            ? "ok"
            : `version mismatch got v${actualVersion}`
          : "missing"
      });

      if (version < 3) {
        const feedback = await brandCommentAndRequestRevision({
          orderId,
          legacyProjectId,
          brandEmail: brand.email,
          version: actualVersion,
          notes: `请修改 V${actualVersion} — 自动化验收`
        });
        checks.push({
          step: 20 + version,
          name: `brand_feedback_v${version}`,
          ok: feedback.ok,
          detail: feedback.ok ? "revision requested" : "error" in feedback ? feedback.error : "failed"
        });

        const creatorFeedbackNotify = await hasNotification(
          "creator_01",
          orderId,
          "revision_requested"
        );
        checks.push({
          step: 20 + version,
          name: `notify_brand_feedback_v${version}`,
          ok: creatorFeedbackNotify,
          detail: creatorFeedbackNotify ? "creator notified" : "missing"
        });
      }
    }

    const paymentGate = assertRevisionRequestAllowed({
      currentVersionNumber: 3,
      paidSlotsUnlocked: paidSlots
    });
    checks.push({
      step: 33,
      name: "payment_gate_before_v4",
      ok: !paymentGate.ok && paymentGate.code === "PAYMENT_REQUIRED",
      detail: paymentGate.ok ? "unexpectedly allowed" : paymentGate.code
    });

    const v3Comment = await reviewPortalService.addCommentForLegacyOrder({
      orderId,
      legacyProjectId,
      brandEmail: brand.email,
      version: 3,
      timestampSec: 18,
      body: "V3 需进入第四轮修改",
      posX: 0.5,
      posY: 0.5,
      issueType: "修改",
      locale: "zh"
    });
    checks.push({
      step: 33,
      name: "brand_comment_v3",
      ok: v3Comment.ok,
      detail: v3Comment.ok ? "ok" : v3Comment.error
    });

    const blockedRevision = await reviewPortalService.requestRevisionForLegacyOrder({
      orderId,
      legacyProjectId,
      brandEmail: brand.email,
      revisionNotes: "进入第四轮",
      locale: "zh"
    });
    checks.push({
      step: 34,
      name: "block_revision_without_payment",
      ok: !blockedRevision.ok && blockedRevision.error === "PAYMENT_REQUIRED",
      detail: blockedRevision.ok ? "unexpected pass" : blockedRevision.error
    });

    const paymentRequiredNotify = await hasBrandNotification({
      brand_email: brandEmail,
      project_id: legacyProjectId,
      creator_id: "creator_01",
      type: "payment_required",
      order_id: orderId
    });
    checks.push({
      step: 34,
      name: "notify_payment_required",
      ok: paymentRequiredNotify,
      detail: paymentRequiredNotify ? "ok" : "missing"
    });

    const blockedUpload = assertReviewVersionUploadAllowed({
      targetVersion: 4,
      paidSlotsUnlocked: paidSlots
    });
    checks.push({
      step: 35,
      name: "block_upload_v4_without_payment",
      ok: !blockedUpload.ok && blockedUpload.code === "PAYMENT_REQUIRED",
      detail: blockedUpload.ok ? "unexpected pass" : blockedUpload.code
    });

    const addOnAmount = Math.round((order.amount ?? 1000) * 0.2 * 100) / 100;
    await rechargeBrandWallet({
      brandEmail: brand.email,
      amount: Math.max(addOnAmount, 50),
      description: "Five-round verify paid revision recharge"
    });

    const unlocked = await paidRevisionService.unlockNextPaidRevisionSlot({
      orderId,
      projectId: legacyProjectId,
      brandEmail: brand.email,
      locale: "zh"
    });
    checks.push({
      step: 36,
      name: "pay_paid_revision_addon",
      ok: unlocked.ok,
      detail: unlocked.ok ? `unlocked v${unlocked.unlockedVersion}` : unlocked.error
    });

    if (unlocked.ok) {
      paidSlots = unlocked.paidRevisionSlotsUnlocked;
      const brandPaidNotify = await hasBrandNotification({
        brand_email: brandEmail,
        project_id: legacyProjectId,
        creator_id: "creator_01",
        type: "paid_revision_unlocked",
        order_id: orderId
      });
      checks.push({
        step: 36,
        name: "notify_payment_success",
        ok: brandPaidNotify,
        detail: brandPaidNotify ? "brand notified" : "missing (wire in action layer)"
      });

      const creatorUnlockNotify = await hasNotification("creator_01", orderId, "paid_revision_unlocked");
      checks.push({
        step: 36,
        name: "notify_v4_v5_unlocked",
        ok: creatorUnlockNotify,
        detail: creatorUnlockNotify ? "creator notified" : "missing (wire in action layer)"
      });
    }

    const afterV3Feedback = await brandCommentAndRequestRevision({
      orderId,
      legacyProjectId,
      brandEmail: brand.email,
      version: 3,
      notes: "V3 反馈完成，请上传 V4"
    });
    checks.push({
      step: 37,
      name: "brand_request_v4_after_payment",
      ok: afterV3Feedback.ok,
      detail: afterV3Feedback.ok ? "ok" : "error" in afterV3Feedback ? afterV3Feedback.error : "failed"
    });

    for (let version = 4; version <= 5; version += 1) {
      const orderFresh = await getOrder(orderId);
      const uploaded = await uploadAndNotify({
        legacyProjectId,
        orderId,
        version,
        orderStatus: orderFresh?.status === "revision" ? "revision" : "in_production",
        paidSlots
      });
      checks.push({
        step: 40 + version,
        name: `creator_upload_v${version}`,
        ok: uploaded.ok && uploaded.deliverable.version === version,
        detail: uploaded.ok
          ? uploaded.deliverable.version === version
            ? `v${version}`
            : `version mismatch got v${uploaded.deliverable.version}`
          : uploaded.error
      });

      if (version === 4 && uploaded.ok) {
        const feedback = await brandCommentAndRequestRevision({
          orderId,
          legacyProjectId,
          brandEmail: brand.email,
          version: uploaded.deliverable.version,
          notes: "V4 反馈，请提交最终 V5"
        });
        checks.push({
          step: 45,
          name: "brand_feedback_v4",
          ok: feedback.ok,
          detail: feedback.ok ? "ok" : "error" in feedback ? feedback.error : "failed"
        });
      }
    }

    const approved = await reviewPortalService.approveForLegacyOrder({
      orderId,
      legacyProjectId,
      brandEmail: brand.email,
      locale: "zh"
    });
    checks.push({
      step: 50,
      name: "brand_approve_v5",
      ok: approved.ok,
      detail: approved.ok ? "approved" : approved.error
    });

    const marked = await deliveryService.markAsFinalForLegacyOrder({
      legacyProjectId,
      orderId,
      legacyCreatorId: "creator_01",
      versionNumber: 5,
      locale: "zh"
    });
    checks.push({
      step: 51,
      name: "mark_final_v5",
      ok: marked.ok,
      detail: marked.ok ? marked.delivery.status : marked.error
    });

    const finalReadyNotify = await hasBrandNotification({
      brand_email: brandEmail,
      project_id: legacyProjectId,
      creator_id: "creator_01",
      type: "final_download_ready",
      order_id: orderId
    });
    checks.push({
      step: 51,
      name: "notify_final_ready",
      ok: finalReadyNotify,
      detail: finalReadyNotify ? "ok" : "missing"
    });

    const downloaded = await deliveryService.recordBrandDownload({
      legacyProjectId,
      brandEmail: brand.email,
      locale: "zh"
    });
    checks.push({
      step: 52,
      name: "brand_download_final",
      ok: downloaded.ok,
      detail: downloaded.ok ? downloaded.delivery.status : downloaded.error
    });

    const released = await settlementService.releaseForCampaign({
      campaignId,
      actor: { id: brand.id, role: brand.role, email: brand.email },
      locale: "zh",
      orderId
    });
    checks.push({
      step: 53,
      name: "release_settlement",
      ok: released.ok,
      detail: released.ok
        ? `${released.result.settlementState} payout=${released.result.creatorPayoutAmount}`
        : released.error
    });

    const finalCampaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    checks.push({
      step: 54,
      name: "campaign_completed",
      ok: finalCampaign?.status === CampaignState.COMPLETED,
      detail: finalCampaign?.status
    });

    const refreshedOrder = await getOrder(orderId);
    checks.push({
      step: 54,
      name: "order_completed_status",
      ok: refreshedOrder?.status === "completed",
      detail: refreshedOrder?.status
    });
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
