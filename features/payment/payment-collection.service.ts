import { paymentCollectionRepository } from "@/features/payment/payment-collection.repository";
import { escrowRepository } from "@/features/payment/escrow.repository";
import { membershipService } from "@/features/membership/membership.service";
import { notificationService } from "@/features/notification/notification.service";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { getAppBaseUrl } from "@/lib/app-url";
import { logger } from "@/lib/core/logger";
import type { CommissionBreakdown } from "@/features/membership/membership.types";

function resolveLegacyProjectId(campaign: { productionBrief?: unknown; id: string }) {
  const brief = campaign.productionBrief as { legacy_project_id?: string } | null;
  return brief?.legacy_project_id ?? campaign.id;
}

export type PaymentRecordView = {
  campaignId: string;
  campaignTitle: string;
  brandName: string | null;
  brandEmail: string | null;
  creatorName: string | null;
  creatorEmail: string | null;
  amount: number;
  currency: string;
  escrowStatus: string;
  paymentStatus: string;
  creatorPayoutStatus: string | null;
  stripePaymentId: string | null;
  stripeSessionId: string | null;
  paidAt: string | null;
  payoutPaidAt: string | null;
  clientServiceFeeAmount: number | null;
  clientServiceFeePercentage: number | null;
  creatorCommissionAmount: number | null;
  creatorCommissionPercentage: number | null;
  creatorPayableAmount: number | null;
};

export class PaymentCollectionService {
  private assertDb() {
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }

  serializeRecord(row: Awaited<ReturnType<typeof paymentCollectionRepository.listPaymentRecords>>[number]): PaymentRecordView {
    const { escrow, commission, creator } = row;
    const brand = escrow.campaign.brand;
    return {
      campaignId: escrow.campaignId,
      campaignTitle: escrow.campaign.title,
      brandName: brand.brandProfile?.companyName ?? brand.fullName,
      brandEmail: brand.email,
      creatorName: creator?.creatorProfile?.displayName ?? creator?.fullName ?? null,
      creatorEmail: creator?.email ?? null,
      amount: Number(escrow.amount),
      currency: escrow.currency,
      escrowStatus: escrow.status,
      paymentStatus: escrow.paymentStatus,
      creatorPayoutStatus: escrow.creatorPayoutStatus,
      stripePaymentId: escrow.stripePaymentId,
      stripeSessionId: escrow.stripeSessionId,
      paidAt: escrow.paidAt?.toISOString() ?? null,
      payoutPaidAt: escrow.payoutPaidAt?.toISOString() ?? null,
      clientServiceFeeAmount: commission ? Number(commission.clientServiceFeeAmount) : null,
      clientServiceFeePercentage: commission ? Number(commission.clientServiceFeePercentage) : null,
      creatorCommissionAmount: commission ? Number(commission.creatorCommissionAmount) : null,
      creatorCommissionPercentage: commission ? Number(commission.creatorCommissionPercentage) : null,
      creatorPayableAmount: commission ? Number(commission.creatorPayoutAmount) : null
    };
  }

  /** Called after escrow transitions to HELD — idempotent. */
  async finalizeSuccessfulPayment(input: {
    campaignId: string;
    stripePaymentId?: string;
    stripeSessionId?: string;
    orderId?: string;
  }) {
    this.assertDb();

    const campaign = await prisma.campaign.findUniqueOrThrow({
      where: { id: input.campaignId },
      include: { brand: true, creator: true }
    });

    const escrow = await escrowRepository.findByCampaignId(input.campaignId);
    if (!escrow || escrow.status !== "HELD") {
      throw appError("INVALID_TRANSITION", "Escrow must be HELD before payment finalization");
    }

    if (!campaign.creatorId) {
      await paymentCollectionRepository.markPaymentCollected(input.campaignId, {
        stripePaymentId: input.stripePaymentId,
        stripeSessionId: input.stripeSessionId
      });
      return { deferred: true, commission: null };
    }

    if (escrow.creatorId !== campaign.creatorId) {
      await prisma.escrowPayment.update({
        where: { campaignId: input.campaignId },
        data: { creatorId: campaign.creatorId }
      });
    }

    if (escrow.paymentStatus === "PAID") {
      const existing = await membershipService.getOrderCommissionSnapshot(input.campaignId);
      if (existing) {
        return { alreadyFinalized: true, commission: existing };
      }
    }

    await paymentCollectionRepository.markPaymentCollected(input.campaignId, {
      stripePaymentId: input.stripePaymentId,
      stripeSessionId: input.stripeSessionId
    });

    const commission = await membershipService.getOrSettleOrderCommission({
      campaignId: input.campaignId,
      creatorId: campaign.creatorId,
      orderAmount: Number(escrow.amount),
      currency: escrow.currency,
      orderId: input.orderId
    });

    await this.notifyPaymentSuccess({
      campaignId: input.campaignId,
      campaignTitle: campaign.title,
      brandId: campaign.brandId,
      creatorId: campaign.creatorId,
      amount: Number(escrow.amount),
      currency: escrow.currency,
      commission
    });

    logger.info("Payment collection finalized", {
      service: "PaymentCollectionService",
      campaignId: input.campaignId,
      stripePaymentId: input.stripePaymentId,
      creatorPayable: commission.creatorPayoutAmount
    });

    return { alreadyFinalized: false, commission };
  }

  async handlePaymentFailed(input: {
    campaignId?: string;
    stripeSessionId?: string;
    reason: "FAILED" | "CANCELLED";
  }) {
    this.assertDb();

    let campaignId = input.campaignId;
    if (!campaignId && input.stripeSessionId) {
      const escrow = await paymentCollectionRepository.findByStripeSessionId(input.stripeSessionId);
      campaignId = escrow?.campaignId;
    }
    if (!campaignId) {
      return { ignored: true, reason: "no_campaign" };
    }

    const escrow = await paymentCollectionRepository.findByCampaignId(campaignId);
    if (!escrow || escrow.paymentStatus === "PAID") {
      return { ignored: true, reason: "already_paid_or_missing" };
    }

    await paymentCollectionRepository.markPaymentFailed(campaignId, input.reason);

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, title: true, brandId: true, productionBrief: true }
    });
    if (campaign) {
      const legacyProjectId = resolveLegacyProjectId(campaign);
      const title =
        input.reason === "CANCELLED" ? "Payment cancelled" : "Payment failed";
      const content =
        input.reason === "CANCELLED"
          ? `Checkout for "${campaign.title}" was cancelled. You can retry payment when ready.`
          : `Payment for "${campaign.title}" did not complete. Please try again or contact support.`;

      await notificationService.notify({
        userId: campaign.brandId,
        campaignId: campaign.id,
        title,
        content,
        actionUrl: `${getAppBaseUrl()}/brand/projects/${legacyProjectId}/checkout`,
        template: input.reason === "CANCELLED" ? "payment.cancelled" : "payment.failed",
        priority: "HIGH"
      });
    }

    return { campaignId, paymentStatus: input.reason };
  }

  async listForAdmin(user: AuthUser, filters?: { limit?: number; offset?: number }) {
    PermissionService.assert(user, "admin.payment.manage");
    const rows = await paymentCollectionRepository.listPaymentRecords(filters);
    return rows.map((row) => this.serializeRecord(row));
  }

  async markCreatorPayoutPaid(user: AuthUser, campaignId: string) {
    PermissionService.assert(user, "admin.payment.manage");

    const escrow = await paymentCollectionRepository.findByCampaignId(campaignId);
    if (!escrow) throw appError("NOT_FOUND", "Payment record not found");
    if (escrow.paymentStatus !== "PAID") {
      throw appError("INVALID_TRANSITION", "Payment must be PAID before marking creator payout");
    }

    const rows = await paymentCollectionRepository.listPaymentRecords({ limit: 200 });
    const existing = rows.find((row) => row.escrow.campaignId === campaignId);
    if (!existing) throw appError("NOT_FOUND", "Payment record not found");

    if (escrow.creatorPayoutStatus === "PAID") {
      return { alreadyPaid: true, record: this.serializeRecord(existing) };
    }

    await paymentCollectionRepository.markCreatorPayoutPaid(campaignId, user.id);
    const commission = await prisma.orderCommission.findUnique({ where: { campaignId } });

    const campaign = await prisma.campaign.findUniqueOrThrow({
      where: { id: campaignId },
      select: { title: true, creatorId: true }
    });

    if (campaign.creatorId && commission) {
      await notificationService.notify({
        userId: campaign.creatorId,
        campaignId,
        title: "Payout marked as paid",
        content: `Your payout of ${commission.currency} ${Number(commission.creatorPayoutAmount).toFixed(2)} for "${campaign.title}" has been processed.`,
        actionUrl: `${getAppBaseUrl()}/studio/income`,
        template: "payment.creator_payout_paid",
        priority: "HIGH"
      });
    }

    await prisma.activityLog.create({
      data: {
        campaignId,
        userId: user.id,
        action: "payment.CREATOR_PAYOUT_MARKED_PAID",
        metadata: { payoutAmount: commission ? Number(commission.creatorPayoutAmount) : null }
      }
    });

    const refreshed = await paymentCollectionRepository.listPaymentRecords({ limit: 200 });
    const updated = refreshed.find((row) => row.escrow.campaignId === campaignId)!;
    return { alreadyPaid: false, record: this.serializeRecord(updated) };
  }

  private async notifyPaymentSuccess(input: {
    campaignId: string;
    campaignTitle: string;
    brandId: string;
    creatorId: string;
    amount: number;
    currency: string;
    commission: CommissionBreakdown;
  }) {
    const appUrl = getAppBaseUrl();
    const amountLabel = `${input.currency} ${input.amount.toFixed(2)}`;

    const campaign = await prisma.campaign.findUnique({
      where: { id: input.campaignId },
      select: { productionBrief: true }
    });
    const brief = campaign?.productionBrief as { legacy_project_id?: string } | null;
    const legacyProjectId = brief?.legacy_project_id ?? input.campaignId;
    let creatorActionUrl = `${appUrl}/studio/projects`;
    let hasLegacyOrder = false;
    if (legacyProjectId) {
      const { getOrderForProject } = await import("@/lib/order-service");
      const legacyOrder = await getOrderForProject(legacyProjectId);
      if (legacyOrder) {
        hasLegacyOrder = true;
        creatorActionUrl = `${appUrl}/studio/review/${legacyOrder.id}`;
      }
    }

    await notificationService.notify({
      userId: input.brandId,
      campaignId: input.campaignId,
      title: "Payment received",
      content: `Your payment of ${amountLabel} for "${input.campaignTitle}" is confirmed. AI creator matching can begin.`,
      actionUrl: `${appUrl}/brand/projects/${legacyProjectId}?tab=match`,
      template: "payment.brand_success",
      priority: "HIGH"
    });

    await notificationService.notify({
      userId: input.creatorId,
      campaignId: input.campaignId,
      title: "Escrow funded",
      content: `"${input.campaignTitle}" is escrow-funded (${amountLabel}). The project becomes upload-ready after formal creator selection. Payable after commission: ${input.currency} ${input.commission.creatorPayoutAmount.toFixed(2)}.`,
      actionUrl: creatorActionUrl,
      template: "payment.creator_funded",
      priority: "HIGH",
      email: !hasLegacyOrder
    });
  }
}

export const paymentCollectionService = new PaymentCollectionService();
