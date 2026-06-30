import type { CreatorPayoutStatus, PaymentCollectionStatus } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export class PaymentCollectionRepository {
  private assertDb() {
    if (!hasDatabaseUrl()) throw new Error("DATABASE_URL not configured");
  }

  async listPaymentRecords(filters?: { limit?: number; offset?: number }) {
    this.assertDb();
    const rows = await prisma.escrowPayment.findMany({
      orderBy: { updatedAt: "desc" },
      take: filters?.limit ?? 100,
      skip: filters?.offset ?? 0,
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            status: true,
            brand: {
              select: {
                id: true,
                email: true,
                fullName: true,
                brandProfile: { select: { companyName: true } }
              }
            }
          }
        }
      }
    });

    const campaignIds = rows.map((row) => row.campaignId);
    const commissions =
      campaignIds.length > 0
        ? await prisma.orderCommission.findMany({ where: { campaignId: { in: campaignIds } } })
        : [];
    const commissionByCampaign = new Map(commissions.map((row) => [row.campaignId, row]));

    const creatorIds = [...new Set(rows.map((row) => row.creatorId))];
    const creators =
      creatorIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: creatorIds } },
            select: {
              id: true,
              email: true,
              fullName: true,
              creatorProfile: { select: { displayName: true } }
            }
          })
        : [];
    const creatorById = new Map(creators.map((row) => [row.id, row]));

    return rows.map((row) => ({
      escrow: row,
      commission: commissionByCampaign.get(row.campaignId) ?? null,
      creator: creatorById.get(row.creatorId) ?? null
    }));
  }

  async markPaymentCollected(
    campaignId: string,
    input: {
      stripePaymentId?: string;
      stripeSessionId?: string;
      paidAt?: Date;
    }
  ) {
    this.assertDb();
    return prisma.escrowPayment.update({
      where: { campaignId },
      data: {
        paymentStatus: "PAID",
        creatorPayoutStatus: "MANUAL_PAYOUT_PENDING",
        paidAt: input.paidAt ?? new Date(),
        ...(input.stripePaymentId ? { stripePaymentId: input.stripePaymentId } : {}),
        ...(input.stripeSessionId ? { stripeSessionId: input.stripeSessionId } : {})
      }
    });
  }

  async markPaymentFailed(campaignId: string, status: "FAILED" | "CANCELLED") {
    this.assertDb();
    return prisma.escrowPayment.update({
      where: { campaignId },
      data: {
        paymentStatus: status,
        status: "CREATED"
      }
    });
  }

  async markCreatorPayoutPaid(campaignId: string, adminId: string) {
    this.assertDb();
    return prisma.escrowPayment.update({
      where: { campaignId },
      data: {
        creatorPayoutStatus: "PAID",
        payoutPaidAt: new Date(),
        payoutMarkedByAdminId: adminId
      }
    });
  }

  async findByStripeSessionId(stripeSessionId: string) {
    this.assertDb();
    return prisma.escrowPayment.findFirst({ where: { stripeSessionId } });
  }

  async findByCampaignId(campaignId: string) {
    this.assertDb();
    return prisma.escrowPayment.findUnique({ where: { campaignId } });
  }
}

export const paymentCollectionRepository = new PaymentCollectionRepository();

export type PaymentRecordRow = Awaited<
  ReturnType<PaymentCollectionRepository["listPaymentRecords"]>
>[number];
