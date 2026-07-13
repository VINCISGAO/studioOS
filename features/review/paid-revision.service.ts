import { activityService } from "@/features/campaign/activity.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { userRepository } from "@/features/auth/user.repository";
import { payBrandWalletCharge } from "@/features/wallet/brand-wallet.service";
import { notificationService } from "@/features/notification/notification.service";
import {
  hasPaidRevisionPackUnlocked,
  MAX_REVISION_ROUNDS,
  nextPaidVersionToUnlock,
  PAID_REVISION_SURCHARGE_RATE,
  paidRevisionPackLabel,
  remainingPaidPayments,
  reviewRoundGateMessage
} from "@/features/review/review-round-policy";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import type { Locale } from "@/lib/i18n";
import { getAppBaseUrl } from "@/lib/app-url";
import { getOrder, syncOrderPaidRevisionSlots } from "@/lib/order-service";
import { resolveLegacyProjectId } from "@/features/matching/invitation.mapper";

export type ReviewRoundPolicySnapshot = {
  paidRevisionSlotsUnlocked: number;
  remainingPaidSlots: number;
  nextPaidVersion: number | null;
};

async function syncLegacyOrderPaidSlots(orderId: string, paidRevisionSlotsUnlocked: number) {
  await syncOrderPaidRevisionSlots(orderId, paidRevisionSlotsUnlocked);
}

export class PaidRevisionService {
  async resolvePolicyForOrder(input: {
    orderId: string;
    projectId: string | null;
  }): Promise<ReviewRoundPolicySnapshot> {
    const paidRevisionSlotsUnlocked = await this.readPaidSlotsUnlocked(input);
    return {
      paidRevisionSlotsUnlocked,
      remainingPaidSlots: remainingPaidPayments(paidRevisionSlotsUnlocked),
      nextPaidVersion: nextPaidVersionToUnlock(paidRevisionSlotsUnlocked)
    };
  }

  async readPaidSlotsUnlocked(input: {
    orderId: string;
    projectId: string | null;
  }): Promise<number> {
    if (hasDatabaseUrl() && input.projectId) {
      const campaign = await campaignRepository.findByLegacyProjectId(input.projectId);
      if (campaign) {
        const order = await getOrder(input.orderId);
        return order?.paid_revision_slots_unlocked ?? 0;
      }
    }

    const order = await getOrder(input.orderId);
    return order?.paid_revision_slots_unlocked ?? 0;
  }

  async unlockNextPaidRevisionSlot(input: {
    orderId: string;
    projectId: string | null;
    brandEmail: string;
    locale: Locale;
    payInvoice?: boolean;
  }): Promise<
    | {
        ok: true;
        paidRevisionSlotsUnlocked: number;
        unlockedVersion: number;
        addOnAmount: number;
        currency: string;
        paymentSource: "balance" | "invoice" | "demo";
        invoiceId: string | null;
        availableBefore: number;
        shortfallAmount: number;
        balanceAfter: number;
        message: string;
      }
    | {
        ok: false;
        error: string;
        addOnAmount?: number;
        currency?: string;
        paymentSource?: "invoice";
        invoiceId?: string | null;
        availableBefore?: number;
        shortfallAmount?: number;
      }
  > {
    const normalizedEmail = input.brandEmail.trim().toLowerCase();
    const order = await getOrder(input.orderId);
    if (!order || order.client_email.toLowerCase() !== normalizedEmail) {
      return { ok: false, error: "unauthorized" };
    }

    const current = await this.readPaidSlotsUnlocked({
      orderId: input.orderId,
      projectId: input.projectId
    });

    if (hasPaidRevisionPackUnlocked(current)) {
      return { ok: false, error: "all-paid-slots-unlocked" };
    }

    const unlockedVersion = nextPaidVersionToUnlock(current);
    if (!unlockedVersion) {
      return { ok: false, error: "all-paid-slots-unlocked" };
    }

    /** Single payment flag — unlocks both V4 and V5. */
    const nextCount = 1;
    const addOnAmount = Math.round(order.amount * PAID_REVISION_SURCHARGE_RATE * 100) / 100;
    const currency = "USD";
    let campaignId: string | undefined;
    let brandUserId: string | null = null;
    let paymentSource: "balance" | "invoice" | "demo" = "demo";
    let invoiceId: string | null = null;
    let availableBefore = 0;
    let shortfallAmount = 0;
    let balanceAfter = 0;

    if (hasDatabaseUrl()) {
      const brandUser = await userRepository.findByEmail(normalizedEmail);
      if (!brandUser || brandUser.role !== "BRAND") {
        return { ok: false, error: "unauthorized" };
      }
      brandUserId = brandUser.id;

      if (input.projectId) {
        const campaign = await campaignRepository.findByLegacyProjectId(input.projectId);
        if (!campaign) {
          return { ok: false, error: "campaign-not-found" };
        }
        if (campaign.brandId !== brandUser.id) {
          return { ok: false, error: "unauthorized" };
        }
        campaignId = campaign.id;
      }

      const payment = await payBrandWalletCharge({
        brandUserId,
        campaignId,
        amount: addOnAmount,
        description: `Paid revision add-on for order ${input.orderId}`,
        invoicePrefix: `inv_paid_revision_${input.orderId}`,
        payInvoice: input.payInvoice
      });
      paymentSource = payment.paymentSource;
      invoiceId = payment.invoiceId;
      availableBefore = payment.availableBefore;
      shortfallAmount = payment.shortfallAmount;
      balanceAfter = payment.balanceAfter;
      if (!payment.paid) {
        return {
          ok: false,
          error: "payment-required",
          addOnAmount,
          currency,
          paymentSource: "invoice",
          invoiceId,
          availableBefore,
          shortfallAmount
        };
      }
    }

    if (hasDatabaseUrl() && campaignId && brandUserId) {
      await activityService.write(
        campaignId,
        "review.paid_revision_paid",
        {
          userId: brandUserId,
          email: normalizedEmail,
          role: "brand"
        },
        {
          orderId: input.orderId,
          unlockedFromVersion: unlockedVersion,
          unlockedThroughVersion: MAX_REVISION_ROUNDS,
          paidRevisionSlotsUnlocked: nextCount,
          addOnAmount,
          currency,
          paymentSource,
          invoiceId,
          shortfallAmount,
          balanceAfter
        }
      );
    }

    await syncLegacyOrderPaidSlots(input.orderId, nextCount);

    if (hasDatabaseUrl() && campaignId && brandUserId) {
      const campaign = await campaignRepository.findById(campaignId);
      if (campaign) {
        const legacyProjectId = input.projectId ?? resolveLegacyProjectId(campaign);
        await notificationService.notify({
          userId: brandUserId,
          campaignId,
          type: "revision.paid_addon_unlocked",
          category: "REVISION",
          title: input.locale === "zh" ? "第 4-5 轮修订已解锁" : "Paid revision rounds unlocked",
          content:
            input.locale === "zh"
              ? `「${campaign.title}」已解锁第 4-5 轮修订，加购金额 ${currency} ${addOnAmount.toFixed(2)}。`
              : `"${campaign.title}" now has revision rounds 4-5 unlocked. Add-on: ${currency} ${addOnAmount.toFixed(2)}.`,
          actionUrl: `${getAppBaseUrl()}/brand/projects/${legacyProjectId}/review`,
          template: "revision.additional_purchased",
          priority: "HIGH",
          metadata: {
            orderId: input.orderId,
            unlockedFromVersion: unlockedVersion,
            unlockedThroughVersion: MAX_REVISION_ROUNDS,
            addOnAmount,
            additionalPayment: "20%",
            currentStage: `Version ${unlockedVersion}`,
            currency,
            paymentSource
          }
        });

        if (campaign.creatorId) {
          await notificationService.notify({
            userId: campaign.creatorId,
            campaignId,
            type: "revision.paid_addon_unlocked",
            category: "REVISION",
            title: input.locale === "zh" ? "品牌已解锁第 4-5 轮修订" : "Brand unlocked paid revision rounds",
            content:
              input.locale === "zh"
                ? `「${campaign.title}」现在可进入 V4-V5 修订流程。`
                : `"${campaign.title}" can now continue through V4-V5 revisions.`,
            actionUrl: `${getAppBaseUrl()}/studio/review/${input.orderId}`,
            template: "revision.additional_purchased",
            priority: "HIGH",
            metadata: {
              orderId: input.orderId,
              unlockedFromVersion: unlockedVersion,
              unlockedThroughVersion: MAX_REVISION_ROUNDS,
              additionalPayment: "20%",
              currentStage: `Version ${unlockedVersion}`
            }
          });
        }
      }
    }

    const refreshedOrder = await getOrder(input.orderId);
    if (refreshedOrder) {
      const { notifyCreatorPaidRevisionUnlocked, notifyBrandPaidRevisionUnlocked } = await import(
        "@/lib/studioos/commercial-interaction-notify"
      );
      await notifyCreatorPaidRevisionUnlocked({ order: refreshedOrder, locale: input.locale }).catch(
        () => undefined
      );
      await notifyBrandPaidRevisionUnlocked({ order: refreshedOrder, locale: input.locale }).catch(
        () => undefined
      );
    }

    const packLabel = paidRevisionPackLabel(input.locale);
    const message =
      input.locale === "zh"
        ? `已解锁${packLabel}。品牌发起第4轮修改后创作者可上传 V4；第5轮（V5）无需再次付费。`
        : `${packLabel} unlocked. Round 4 (V4) and round 5 (V5) are included — no second payment for V5.`;

    return {
      ok: true,
      paidRevisionSlotsUnlocked: nextCount,
      unlockedVersion,
      addOnAmount,
      currency,
      paymentSource,
      invoiceId,
      availableBefore,
      shortfallAmount,
      balanceAfter,
      message
    };
  }
}

export const paidRevisionService = new PaidRevisionService();

export function paidRevisionErrorMessage(code: string, locale: Locale): string {
  if (locale === "zh") {
    if (code === "unauthorized") return "无权限";
    if (code === "campaign-not-found") return "找不到对应 Campaign";
    if (code === "all-paid-slots-unlocked") return "加购修订已解锁，无需重复付费";
    if (code === "PAYMENT_REQUIRED") {
      return reviewRoundGateMessage("PAYMENT_REQUIRED", locale);
    }
    if (code === "REVIEW_LOCKED") {
      return reviewRoundGateMessage("REVIEW_LOCKED", locale);
    }
    return "加购修订解锁失败，请稍后重试";
  }
  if (code === "unauthorized") return "Unauthorized";
  if (code === "all-paid-slots-unlocked") return "Paid revision add-on is already unlocked";
  if (code === "PAYMENT_REQUIRED") {
    return reviewRoundGateMessage("PAYMENT_REQUIRED", locale);
  }
  if (code === "REVIEW_LOCKED") {
    return reviewRoundGateMessage("REVIEW_LOCKED", locale);
  }
  return "Could not unlock paid revision add-on. Please try again.";
}
