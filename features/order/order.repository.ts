import type { OrderStatus, Prisma } from "@prisma/client";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { asInputJson } from "@/lib/core/prisma-json";

export type CreateOrderInput = {
  campaignId?: string | null;
  clientId: string;
  creatorId: string;
  creatorProfileId?: string | null;
  serviceProject: string;
  shootingCity?: string | null;
  shootingDate?: Date | null;
  currency?: string;
  orderAmount: Prisma.Decimal | number;
  platformCommission?: Prisma.Decimal | number;
  creatorIncome?: Prisma.Decimal | number;
  sourceChannel?: string | null;
  conversationId?: string | null;
  referrerId?: string | null;
  metadataJson?: Prisma.InputJsonValue;
};

export class OrderRepository {
  isEnabled() {
    return hasDatabaseUrl();
  }

  listForUser(userId: string) {
    return prisma.order.findMany({
      where: {
        OR: [{ clientId: userId }, { creatorId: userId }]
      },
      include: {
        campaign: { select: { id: true, title: true, status: true } },
        client: { select: { id: true, fullName: true, email: true, avatarUrl: true, language: true } },
        creator: { select: { id: true, fullName: true, email: true, avatarUrl: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  listAll(input: { status?: OrderStatus; search?: string } = {}) {
    return prisma.order.findMany({
      where: {
        ...(input.status ? { status: input.status } : {}),
        ...(input.search
          ? {
              OR: [
                { id: { contains: input.search, mode: "insensitive" } },
                { serviceProject: { contains: input.search, mode: "insensitive" } },
                { shootingCity: { contains: input.search, mode: "insensitive" } }
              ]
            }
          : {})
      },
      include: {
        campaign: { select: { id: true, title: true, status: true } },
        client: { select: { id: true, fullName: true, email: true, language: true } },
        creator: { select: { id: true, fullName: true, email: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  findById(orderId: string) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        campaign: true,
        client: { select: { id: true, fullName: true, email: true, avatarUrl: true, language: true } },
        creator: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        creatorProfile: true,
        ledgerEntries: true,
        referralCommissions: true
      }
    });
  }

  create(input: CreateOrderInput) {
    return prisma.order.create({
      data: {
        campaignId: input.campaignId ?? null,
        clientId: input.clientId,
        creatorId: input.creatorId,
        creatorProfileId: input.creatorProfileId ?? null,
        serviceProject: input.serviceProject,
        shootingCity: input.shootingCity ?? null,
        shootingDate: input.shootingDate ?? null,
        currency: input.currency ?? "USD",
        orderAmount: input.orderAmount,
        platformCommission: input.platformCommission ?? 0,
        creatorIncome: input.creatorIncome ?? 0,
        sourceChannel: input.sourceChannel ?? null,
        conversationId: input.conversationId ?? null,
        referrerId: input.referrerId ?? null,
        metadataJson: input.metadataJson
      }
    });
  }

  updateStatus(orderId: string, status: OrderStatus) {
    const now = new Date();
    return prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === "COMPLETED" ? { completedAt: now } : {}),
        ...(status === "CANCELLED" ? { cancelledAt: now } : {}),
        ...(status === "REFUNDED" ? { refundedAt: now } : {})
      }
    });
  }

  confirmPendingCampaignOrders(campaignId: string) {
    return prisma.order.updateMany({
      where: {
        campaignId,
        status: "PENDING",
        creatorProfileId: null
      },
      data: {
        status: "CONFIRMED"
      }
    });
  }

  cancelPendingOrder(orderId: string, metadataJson?: Record<string, unknown>) {
    const now = new Date();
    return prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        cancelledAt: now,
        ...(metadataJson !== undefined ? { metadataJson: asInputJson(metadataJson) } : {})
      }
    });
  }
}

export const orderRepository = new OrderRepository();
