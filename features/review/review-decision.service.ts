import { MAX_REVISION_ROUNDS } from "@/features/review/review-round-policy";
import { campaignService } from "@/features/campaign/campaign.service";
import { CampaignEvent, CampaignState } from "@/features/campaign/campaign.state-machine";
import { reviewRepository } from "@/features/review/review.repository";
import { reviewService } from "@/features/review/review.service";
import { serializeReviewVersion } from "@/features/review/review.serializer";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { notificationService } from "@/features/notification/notification.service";
import { appError } from "@/lib/core/errors";
import { getAppBaseUrl } from "@/lib/app-url";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export class ReviewDecisionService {
  private assertDb() {
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }

  private async getVersionForDecision(versionId: string, user: AuthUser) {
    this.assertDb();
    const version = await reviewRepository.findVersion(versionId);
    if (!version) throw appError("NOT_FOUND", "Version not found");
    if (!PermissionService.canAccessCampaign(user, version.campaign)) {
      throw appError("FORBIDDEN", "Not allowed for this version");
    }
    return version;
  }

  async approveVersion(versionId: string, user: AuthUser) {
    const version = await this.getVersionForDecision(versionId, user);
    PermissionService.assert(user, "review.approve");

    if (user.role.toUpperCase() === "CREATOR") {
      throw appError("FORBIDDEN", "Creators cannot approve review");
    }

    if (version.reviewStatus !== "REVIEWING" && version.reviewStatus !== "READY") {
      throw appError("INVALID_TRANSITION", `Cannot approve from review status ${version.reviewStatus}`);
    }

    const reviewStatus = await reviewService.approve(versionId, user);

    const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: version.campaignId } });
    if (campaign.status === CampaignState.UNDER_REVIEW) {
      await campaignService.transition(version.campaignId, CampaignEvent.APPROVE, user);
    }
    if (version.campaign.creatorId) {
      await notificationService.notify({
        userId: version.campaign.creatorId,
        campaignId: version.campaignId,
        title: "Campaign approved — escrow releasing",
        content: `"${version.campaign.title}" was approved by the brand. Escrow settlement is starting.`,
        actionUrl: `${getAppBaseUrl()}/studio/income`,
        template: "review.approved",
        priority: "HIGH",
        email: false
      });
    }

    const updated = await reviewRepository.findVersion(versionId);
    return {
      reviewStatus,
      campaignStatus: updated?.campaign.status ?? campaign.status,
      version: updated ? serializeReviewVersion(updated) : null
    };
  }

  async requestRevision(versionId: string, user: AuthUser, note?: string) {
    const version = await this.getVersionForDecision(versionId, user);
    PermissionService.assert(user, "review.revision");

    if (user.role.toUpperCase() === "CREATOR") {
      throw appError("FORBIDDEN", "Creators cannot request revision");
    }

    if (version.reviewStatus !== "REVIEWING") {
      throw appError("INVALID_TRANSITION", `Cannot request revision from review status ${version.reviewStatus}`);
    }

    const reviewStatus = await reviewService.requestRevision(versionId, user, version.versionNumber);

    const nextRevisionRound = Math.min(version.versionNumber + 1, MAX_REVISION_ROUNDS);
    await prisma.campaign.update({
      where: { id: version.campaignId },
      data: { reviewRound: nextRevisionRound }
    });

    const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: version.campaignId } });
    if (campaign.status === CampaignState.UNDER_REVIEW) {
      await campaignService.transition(version.campaignId, CampaignEvent.REQUEST_REVISION, user);
    }
    if (version.campaign.creatorId) {
      await notificationService.notify({
        userId: version.campaign.creatorId,
        campaignId: version.campaignId,
        title: "Revision requested",
        content: note?.trim()
          ? `The brand requested changes on "${version.campaign.title}": ${note.trim()}`
          : `The brand requested changes on "${version.campaign.title}".`,
        actionUrl: `${getAppBaseUrl()}/studio/delivery`,
        template: "review.revision_requested",
        priority: "HIGH",
        email: false
      });
    }

    if (note?.trim()) {
      await prisma.activityLog.create({
        data: {
          campaignId: version.campaignId,
          userId: user.id,
          action: "review.revision_note",
          metadata: { versionId, note: note.trim() }
        }
      });
    }

    const updated = await reviewRepository.findVersion(versionId);
    return {
      reviewStatus,
      campaignStatus: updated?.campaign.status ?? campaign.status,
      reviewRound: nextRevisionRound,
      version: updated ? serializeReviewVersion(updated) : null
    };
  }

  async getLatestReviewingVersionId(campaignId: string): Promise<string | null> {
    const versions = await reviewRepository.listVersionsForCampaign(campaignId);
    const reviewing = versions.filter((v) => v.reviewStatus === "REVIEWING");
    if (reviewing.length) return reviewing[reviewing.length - 1]!.id;
    return versions[versions.length - 1]?.id ?? null;
  }
}

export const reviewDecisionService = new ReviewDecisionService();
