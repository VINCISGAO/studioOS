import "server-only";

import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { asInputJson } from "@/lib/core/prisma-json";
import type { AiUsageCategory } from "@/lib/studioos/brand-abuse-policy";

export type RecordAiUsageInput = {
  userId: string;
  campaignId?: string | null;
  category: AiUsageCategory;
  provider?: string;
  tokenInput?: number;
  tokenOutput?: number;
  cost?: number;
  metadata?: Record<string, unknown>;
};

export class AiUsageQuotaRepository {
  async countForCampaign(campaignId: string, category: AiUsageCategory, since?: Date) {
    if (!hasDatabaseUrl()) return 0;
    return prisma.campaignAiUsageLog.count({
      where: {
        campaignId,
        category,
        ...(since ? { createdAt: { gte: since } } : {})
      }
    });
  }

  async countForUser(userId: string, category: AiUsageCategory, since: Date) {
    if (!hasDatabaseUrl()) return 0;
    return prisma.campaignAiUsageLog.count({
      where: {
        userId,
        category,
        createdAt: { gte: since }
      }
    });
  }

  async record(input: RecordAiUsageInput) {
    if (!hasDatabaseUrl()) return null;
    return prisma.campaignAiUsageLog.create({
      data: {
        userId: input.userId,
        campaignId: input.campaignId ?? null,
        category: input.category,
        provider: input.provider ?? null,
        tokenInput: input.tokenInput ?? 0,
        tokenOutput: input.tokenOutput ?? 0,
        cost: input.cost ?? 0,
        metadataJson: asInputJson(input.metadata)
      }
    });
  }

  async summarizeUserDay(userId: string, since: Date) {
    if (!hasDatabaseUrl()) {
      return { requests: 0, tokenInput: 0, tokenOutput: 0, cost: 0 };
    }
    const rows = await prisma.campaignAiUsageLog.aggregate({
      where: { userId, createdAt: { gte: since } },
      _count: { _all: true },
      _sum: { tokenInput: true, tokenOutput: true, cost: true }
    });
    return {
      requests: rows._count._all,
      tokenInput: rows._sum.tokenInput ?? 0,
      tokenOutput: rows._sum.tokenOutput ?? 0,
      cost: Number(rows._sum.cost ?? 0)
    };
  }
}

export const aiUsageQuotaRepository = new AiUsageQuotaRepository();
