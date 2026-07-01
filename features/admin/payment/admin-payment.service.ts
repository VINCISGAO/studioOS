import { adminPaymentRepository } from "@/features/admin/payment/admin-payment.repository";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

export type AdminPaymentRecord = {
  id: string;
  campaignId: string;
  campaignTitle: string;
  brandName: string | null;
  creatorName: string | null;
  escrowStatus: string;
  paymentStatus: string;
  creatorPayoutStatus: string | null;
  amount: number;
  releasedAmount: number;
  remainingAmount: number;
  currency: string;
  platformFee: number;
  commission: number;
  creatorPayout: number;
  paidAt: string | null;
  payoutPaidAt: string | null;
  hasOpenDispute: boolean;
  stripePaymentId: string | null;
  updatedAt: string;
};

export class AdminPaymentService {
  async list(user: AuthUser): Promise<AdminPaymentRecord[]> {
    PermissionService.assert(user, "admin.payment.manage");
    if (!hasDatabaseUrl()) return [];

    const rows = await adminPaymentRepository.listEscrowPayments();
    return rows.map((row) => {
      const commission = row.campaign.orderCommission;
      return {
        id: row.id,
        campaignId: row.campaignId,
        campaignTitle: row.campaign.title,
        brandName: row.campaign.brand.brandProfile?.companyName ?? row.campaign.brand.fullName ?? null,
        creatorName: row.campaign.creator?.creatorProfile?.displayName ?? row.campaign.creator?.fullName ?? null,
        escrowStatus: row.status,
        paymentStatus: row.paymentStatus,
        creatorPayoutStatus: row.creatorPayoutStatus,
        amount: Number(row.amount),
        releasedAmount: Number(row.releasedAmount),
        remainingAmount: Number(row.remainingAmount),
        currency: row.currency,
        platformFee: commission ? Number(commission.clientServiceFeeAmount) : 0,
        commission: commission ? Number(commission.creatorCommissionAmount) : 0,
        creatorPayout: commission ? Number(commission.creatorPayoutAmount) : 0,
        paidAt: row.paidAt?.toISOString() ?? null,
        payoutPaidAt: row.payoutPaidAt?.toISOString() ?? null,
        hasOpenDispute: row.campaign.disputes.length > 0,
        stripePaymentId: row.stripePaymentId,
        updatedAt: row.updatedAt.toISOString()
      };
    });
  }

  async listWebhooks(user: AuthUser) {
    PermissionService.assert(user, "admin.payment.manage");
    if (!hasDatabaseUrl()) return [];
    const rows = await adminPaymentRepository.listRecentWebhooks();
    return rows.map((row) => ({
      id: row.id,
      provider: row.provider,
      eventType: row.eventType,
      processed: row.processed,
      createdAt: row.createdAt.toISOString()
    }));
  }
}

export const adminPaymentService = new AdminPaymentService();
