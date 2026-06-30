import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { asInputJson } from "@/lib/core/prisma-json";

export type WriteActivityLogInput = {
  campaignId: string;
  userId?: string | null;
  action: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  device?: string | null;
};

export class ActivityLogWriter {
  async write(input: WriteActivityLogInput) {
    if (!hasDatabaseUrl()) return null;
    return prisma.activityLog.create({
      data: {
        campaignId: input.campaignId,
        userId: input.userId ?? null,
        action: input.action,
        metadata: asInputJson(input.metadata ?? undefined),
        ip: input.ip ?? null,
        device: input.device ?? null
      }
    });
  }
}

export const activityLogWriter = new ActivityLogWriter();
