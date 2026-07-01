import { adminPaymentRepository } from "@/features/admin/payment/admin-payment.repository";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

export type AdminRefundListItem = {
  id: string;
  orderId: string;
  campaignId: string;
  campaignTitle: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
};

export class AdminRefundService {
  async list(user: AuthUser): Promise<AdminRefundListItem[]> {
    PermissionService.assert(user, "admin.dispute.manage");
    if (!hasDatabaseUrl()) return [];

    const rows = await adminPaymentRepository.listEscrowPayments();
    return rows
      .filter((row) => row.status === "REFUND" || row.paymentStatus === "FAILED")
      .map((row) => ({
        id: row.id,
        orderId: row.campaignId,
        campaignId: row.campaignId,
        campaignTitle: row.campaign.title,
        amount: Number(row.amount),
        reason:
          row.paymentStatus === "FAILED"
            ? "Payment failed — refund review"
            : "Escrow refund requested",
        status: row.status === "REFUND" ? "under_review" : row.paymentStatus.toLowerCase(),
        createdAt: row.updatedAt.toISOString()
      }));
  }
}

export const adminRefundService = new AdminRefundService();
