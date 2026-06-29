import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { appError } from "@/lib/core/errors";

export type PlaybackAuditAction = "play" | "pause" | "seek" | "download";

export class PlaybackAuditService {
  private assertDb() {
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }

  async log(input: {
    campaignId: string;
    versionId: string;
    userId: string;
    action: PlaybackAuditAction;
    timeSeconds?: number;
    ip?: string | null;
    device?: string | null;
  }) {
    this.assertDb();
    await prisma.activityLog.create({
      data: {
        campaignId: input.campaignId,
        userId: input.userId,
        action: `playback.${input.action}`,
        ip: input.ip ?? undefined,
        device: input.device ?? undefined,
        metadata: {
          versionId: input.versionId,
          timeSeconds: input.timeSeconds ?? null
        }
      }
    });
  }
}

export const playbackAuditService = new PlaybackAuditService();
