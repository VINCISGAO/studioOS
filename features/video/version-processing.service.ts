import { videoRepository } from "@/features/video/video.repository";
import { campaignService } from "@/features/campaign/campaign.service";
import { CampaignEvent, CampaignState } from "@/features/campaign/campaign.state-machine";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { runTransition } from "@/lib/core/transition-runner";
import { appError } from "@/lib/core/errors";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { buildVersionPlayback } from "@/features/video/playback-token.service";
import {
  versionStateMachine,
  VersionState,
  type VersionStateValue,
  type VersionEventValue
} from "@/features/shared/state-machines/version.state-machine";
import type { VersionStatus } from "@prisma/client";

export class VersionProcessingService {
  private assertDb() {
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }

  async getProcessingStatus(versionId: string, user: AuthUser) {
    this.assertDb();
    const version = await prisma.campaignVersion.findUnique({
      where: { id: versionId },
      include: { campaign: true }
    });
    if (!version) throw appError("NOT_FOUND", "Version not found");
    if (!PermissionService.canAccessCampaign(user, version.campaign)) {
      throw appError("FORBIDDEN", "Not allowed for this version");
    }
    PermissionService.assert(user, "review.read");

    const job = await prisma.videoJob.findFirst({
      where: { versionId },
      orderBy: { createdAt: "desc" }
    });

    return {
      versionId: version.id,
      versionNumber: version.versionNumber,
      status: version.status,
      reviewStatus: version.reviewStatus,
      watermark: version.watermark,
      playback: buildVersionPlayback(version, user.id),
      job: job
        ? {
            id: job.id,
            status: job.status,
            retryCount: job.retryCount,
            error: job.error,
            startedAt: job.startedAt?.toISOString() ?? null,
            finishedAt: job.finishedAt?.toISOString() ?? null
          }
        : null
    };
  }

  private async transitionVersion(
    versionId: string,
    event: VersionEventValue,
    actor?: AuthUser,
    metadata?: Record<string, unknown>
  ) {
    const version = await prisma.campaignVersion.findUniqueOrThrow({
      where: { id: versionId },
      include: { campaign: true }
    });
    const current = version.status as VersionStateValue;

    return runTransition({
      machine: versionStateMachine,
      current,
      event,
      context: {
        aggregateType: "review",
        aggregateId: versionId,
        campaignId: version.campaignId,
        actor,
        metadata
      },
      persist: async (next) => {
        await prisma.campaignVersion.update({
          where: { id: versionId },
          data: { status: next as VersionStatus }
        });
      }
    });
  }

  async runPipeline(versionId: string, actor?: AuthUser) {
    this.assertDb();

    const version = await prisma.campaignVersion.findUniqueOrThrow({
      where: { id: versionId },
      include: { campaign: true }
    });

    const steps: VersionEventValue[] = [
      "UPLOAD_COMPLETE",
      "PROCESS_DONE",
      "TRANSCODE_DONE",
      "HLS_DONE",
      "AI_DONE"
    ];

    for (const event of steps) {
      await this.transitionVersion(versionId, event, actor, { pipeline: "video.transcode" });
    }

    const campaign = version.campaign;
    const campaignActor = actor ?? {
      id: version.uploadedBy,
      role: "CREATOR"
    };
    if (campaign.status === CampaignState.PRODUCING || campaign.status === CampaignState.UNDER_REVIEW) {
      await campaignService.transition(campaign.id, CampaignEvent.VERSION_UPLOAD, campaignActor);
    }

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { currentVersion: version.versionNumber }
    });

    await prisma.campaignVersion.update({
      where: { id: versionId },
      data: { reviewStatus: "READY" }
    });

    return prisma.campaignVersion.findUniqueOrThrow({ where: { id: versionId } });
  }

  async markFailed(versionId: string, actor?: AuthUser) {
    const version = await prisma.campaignVersion.findUniqueOrThrow({ where: { id: versionId } });
    const current = version.status as VersionStateValue;
    if (current === VersionState.FAILED) return current;

    const failable: VersionStateValue[] = [
      VersionState.UPLOADING,
      VersionState.PROCESSING,
      VersionState.TRANSCODING,
      VersionState.GENERATING_HLS,
      VersionState.AI_ANALYZING
    ];
    if (!failable.includes(current)) return current;

    return this.transitionVersion(versionId, "FAIL", actor);
  }
}

export const versionProcessingService = new VersionProcessingService();
