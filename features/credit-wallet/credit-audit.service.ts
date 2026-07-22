import { activityLogWriter } from "@/features/admin/activity-log.service";
import { prisma } from "@/lib/core/database/prisma";
import { logger } from "@/lib/core/logger";

export type CreditAuditContext = {
  userId: string;
  campaignId?: string | null;
  actorUserId?: string | null;
  reservationId?: string | null;
  generationJobId?: string | null;
  ruleId?: string | null;
  credits?: number;
  reason?: string;
  internalNote?: string;
};

export const creditAuditService = {
  async write(action: string, context: CreditAuditContext, metadata: Record<string, unknown> = {}) {
    const payload = {
      userId: context.userId,
      reservationId: context.reservationId ?? null,
      generationJobId: context.generationJobId ?? null,
      ruleId: context.ruleId ?? null,
      credits: context.credits ?? null,
      reason: context.reason ?? null,
      internalNote: context.internalNote ?? null,
      ...metadata
    };

    if (context.campaignId) {
      try {
        await activityLogWriter.write({
          campaignId: context.campaignId,
          userId: context.actorUserId ?? context.userId,
          action,
          metadata: payload
        });
      } catch (error) {
        logger.error("credit.audit.activity_log_failed", {
          service: "CreditAuditService",
          action,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return payload;
  },

  async resolveCampaignId(input: {
    campaignId?: string | null;
    generationJobId?: string | null;
    userId: string;
  }) {
    if (input.campaignId) return input.campaignId;
    if (input.generationJobId) {
      const job = await prisma.generationJob.findUnique({
        where: { id: input.generationJobId },
        select: { campaignId: true }
      });
      if (job?.campaignId) return job.campaignId;
    }

    const campaign = await prisma.campaign.findFirst({
      where: { creatorId: input.userId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: { id: true }
    });
    return campaign?.id ?? null;
  }
};
