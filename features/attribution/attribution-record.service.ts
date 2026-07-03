import type { Attribution, Prisma } from "@prisma/client";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { asInputJson } from "@/lib/core/prisma-json";

export type CreateAttributionInput = {
  orderId?: string | null;
  campaignId?: string | null;
  conversationId?: string | null;
  creatorId?: string | null;
  source?: string | null;
  medium?: string | null;
  content?: string | null;
  utm?: Prisma.InputJsonValue;
  platform?: string | null;
  clickId?: string | null;
  metadataJson?: Prisma.InputJsonValue;
};

export type ListAttributionsInput = {
  orderId?: string;
  campaignId?: string;
  conversationId?: string;
  creatorId?: string;
  platform?: string;
  limit?: number;
};

export class AttributionRecordService {
  isEnabled() {
    return hasDatabaseUrl();
  }

  create(input: CreateAttributionInput): Promise<Attribution> {
    return prisma.attribution.create({
      data: {
        orderId: input.orderId ?? null,
        campaignId: input.campaignId ?? null,
        conversationId: input.conversationId ?? null,
        creatorId: input.creatorId ?? null,
        source: input.source ?? null,
        medium: input.medium ?? null,
        content: input.content ?? null,
        utm: asInputJson(input.utm),
        platform: input.platform ?? null,
        clickId: input.clickId ?? null,
        metadataJson: asInputJson(input.metadataJson)
      }
    });
  }

  list(input: ListAttributionsInput = {}) {
    return prisma.attribution.findMany({
      where: {
        ...(input.orderId ? { orderId: input.orderId } : {}),
        ...(input.campaignId ? { campaignId: input.campaignId } : {}),
        ...(input.conversationId ? { conversationId: input.conversationId } : {}),
        ...(input.creatorId ? { creatorId: input.creatorId } : {}),
        ...(input.platform ? { platform: input.platform } : {})
      },
      include: {
        order: { select: { id: true, status: true, orderAmount: true, currency: true } },
        campaign: { select: { id: true, title: true, status: true } },
        conversation: { select: { id: true, status: true, channel: true, lastMessageAt: true } },
        creator: { select: { id: true, displayName: true, userId: true } }
      },
      orderBy: { createdAt: "desc" },
      take: input.limit ?? 100
    });
  }

  attachOrder(attributionId: string, orderId: string): Promise<Attribution> {
    return prisma.attribution.update({
      where: { id: attributionId },
      data: { orderId }
    });
  }
}

export const attributionRecordService = new AttributionRecordService();
