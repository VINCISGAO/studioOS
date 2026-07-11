import "server-only";

import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { asInputJson } from "@/lib/core/prisma-json";

export const actualProductionRecordRepository = {
  async upsertOnCompletion(input: {
    campaignId: string;
    actualShotCount?: number | null;
    actualGenerations?: number | null;
    actualToolCostUsd?: number | null;
    actualLaborHours?: number | null;
    actualRevisionRounds?: number | null;
    actualCreatorIncomeUsd?: number | null;
    actualDeliveryDays?: number | null;
    actualMultiplier?: number | null;
    actualTokens?: number | null;
    recordJson?: Record<string, unknown>;
  }) {
    if (!hasDatabaseUrl()) return null;

    const data = {
      actualShotCount: input.actualShotCount ?? null,
      actualGenerations: input.actualGenerations ?? null,
      actualToolCostUsd: input.actualToolCostUsd ?? null,
      actualLaborHours: input.actualLaborHours ?? null,
      actualRevisionRounds: input.actualRevisionRounds ?? null,
      actualCreatorIncomeUsd: input.actualCreatorIncomeUsd ?? null,
      actualDeliveryDays: input.actualDeliveryDays ?? null,
      actualMultiplier: input.actualMultiplier ?? null,
      actualTokens: input.actualTokens ?? null,
      recordJson: asInputJson(input.recordJson),
      completedAt: new Date()
    };

    return prisma.actualProductionRecord.upsert({
      where: { campaignId: input.campaignId },
      update: data,
      create: {
        campaignId: input.campaignId,
        ...data
      }
    });
  },

  async findByCampaignId(campaignId: string) {
    if (!hasDatabaseUrl()) return null;
    return prisma.actualProductionRecord.findUnique({ where: { campaignId } });
  }
};
