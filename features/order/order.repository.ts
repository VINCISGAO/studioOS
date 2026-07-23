import type { OrderStatus, Prisma } from "@prisma/client";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { asInputJson } from "@/lib/core/prisma-json";

const ORDER_LIST_INCLUDE = {
  campaign: { select: { id: true, title: true, status: true } },
  client: { select: { id: true, fullName: true, email: true, avatarUrl: true, language: true } },
  creator: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
  creatorProfile: true
} as const;

export type OrderListRow = Prisma.OrderGetPayload<{ include: typeof ORDER_LIST_INCLUDE }>;

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
      include: ORDER_LIST_INCLUDE,
      orderBy: { createdAt: "desc" }
    });
  }

  listForClientEmail(clientEmail: string): Promise<OrderListRow[]> {
    const normalized = clientEmail.trim().toLowerCase();
    return prisma.order.findMany({
      where: {
        client: { email: { equals: normalized, mode: "insensitive" } }
      },
      include: ORDER_LIST_INCLUDE,
      orderBy: { createdAt: "desc" }
    });
  }

  listForLegacyCreatorId(legacyCreatorId: string): Promise<OrderListRow[]> {
    return prisma.order.findMany({
      where: {
        OR: [
          { creatorProfile: { legacyCreatorId } },
          { creatorProfileId: legacyCreatorId },
          {
            metadataJson: {
              path: ["creator_legacy_id"],
              equals: legacyCreatorId
            }
          }
        ]
      },
      include: ORDER_LIST_INCLUDE,
      orderBy: { createdAt: "desc" }
    });
  }

  listForLegacyProjectId(projectId: string): Promise<OrderListRow[]> {
    return prisma.order.findMany({
      where: {
        OR: [
          {
            campaign: {
              productionBrief: {
                path: ["legacy_project_id"],
                equals: projectId
              }
            }
          },
          {
            metadataJson: {
              path: ["project_id"],
              equals: projectId
            }
          }
        ]
      },
      include: ORDER_LIST_INCLUDE,
      orderBy: { createdAt: "desc" }
    });
  }

  /** Idempotency guard — reuse active order for same campaign + creator. */
  findActiveForCampaignAndCreator(campaignId: string, creatorProfileId: string) {
    return prisma.order.findFirst({
      where: {
        campaignId,
        creatorProfileId,
        status: { notIn: ["CANCELLED", "REFUNDED"] }
      },
      include: ORDER_LIST_INCLUDE,
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

  async assignCreator(input: {
    orderId: string;
    creatorProfileId: string;
    creatorUserId: string;
    creatorLegacyId: string;
    inquiryId?: string;
    workId?: string | null;
    confirmProduction?: boolean;
  }) {
    const existing = await prisma.order.findUnique({
      where: { id: input.orderId },
      select: { metadataJson: true, status: true }
    });
    if (!existing) {
      return null;
    }

    const metadata =
      typeof existing.metadataJson === "object" &&
      existing.metadataJson !== null &&
      !Array.isArray(existing.metadataJson)
        ? { ...(existing.metadataJson as Record<string, unknown>) }
        : {};

    metadata.creator_legacy_id = input.creatorLegacyId;
    if (input.inquiryId) {
      metadata.inquiry_id = input.inquiryId;
    }
    if (input.workId !== undefined) {
      metadata.work_id = input.workId;
    }

    const shouldConfirm = Boolean(input.confirmProduction && existing.status === "PENDING");

    return prisma.order.update({
      where: { id: input.orderId },
      data: {
        creatorProfileId: input.creatorProfileId,
        creatorId: input.creatorUserId,
        ...(input.inquiryId ? { conversationId: input.inquiryId } : {}),
        ...(shouldConfirm ? { status: "CONFIRMED" } : {}),
        metadataJson: asInputJson(metadata)
      },
      include: ORDER_LIST_INCLUDE
    });
  }
}

export const orderRepository = new OrderRepository();
