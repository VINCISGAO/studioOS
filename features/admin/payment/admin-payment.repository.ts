import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export class AdminPaymentRepository {
  async listEscrowPayments(limit = 100) {
    if (!hasDatabaseUrl()) return [];

    return prisma.escrowPayment.findMany({
      orderBy: { updatedAt: "desc" },
      take: limit,
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            status: true,
            brand: { select: { email: true, fullName: true, brandProfile: { select: { companyName: true } } } },
            creator: { select: { email: true, fullName: true, creatorProfile: { select: { displayName: true } } } },
            orderCommission: true,
            disputes: { where: { status: { in: ["OPEN", "PROCESSING"] } }, take: 1 }
          }
        }
      }
    });
  }

  async listRecentWebhooks(limit = 20) {
    if (!hasDatabaseUrl()) return [];
    return prisma.webhookEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit
    });
  }
}

export const adminPaymentRepository = new AdminPaymentRepository();
