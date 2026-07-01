import { activityService } from "@/features/campaign/activity.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { userRepository } from "@/features/auth/user.repository";
import { versionRepository } from "@/features/delivery/version.repository";
import { reviewDecisionService } from "@/features/review/review-decision.service";
import { reviewRepository } from "@/features/review/review.repository";
import { reviewService } from "@/features/review/review.service";
import { notificationService } from "@/features/notification/notification.service";
import { getAppBaseUrl } from "@/lib/app-url";
import { resolveCreatorProfileIdForLegacyId } from "@/features/matching/invitation-creator-bridge";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import type { Locale } from "@/lib/i18n";
import type { ReviewComment as StoredReviewComment } from "@/lib/studioos/review-store";
import { readProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.utils";
import type { BrandProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.types";

type AuthActor = { id: string; role: string };

function resolveLegacyProjectId(campaign: { productionBrief: unknown; id: string }): string {
  const brief = readProductionBrief(campaign.productionBrief) as BrandProductionBrief;
  return brief.legacy_project_id ?? campaign.id;
}

function mapStoredComment(
  comment: Awaited<ReturnType<typeof reviewRepository.createComment>>,
  orderId: string,
  versionNumber: number
): StoredReviewComment {
  const annotation = comment.annotations[0];
  return {
    id: comment.id,
    order_id: orderId,
    version: versionNumber,
    timestamp_sec: Number(comment.timeSeconds),
    body: comment.comment,
    pos_x: annotation ? Number(annotation.x) : null,
    pos_y: annotation ? Number(annotation.y) : null,
    issue_type: null,
    author: "brand",
    created_by: comment.userId,
    status: comment.resolved ? "resolved" : "open",
    created_at: comment.createdAt.toISOString(),
    resolved_at: comment.resolvedAt?.toISOString() ?? null
  };
}

export class ReviewPortalService {
  isEnabled() {
    return hasDatabaseUrl();
  }

  private async loadBrandCampaign(legacyProjectId: string, brandEmail: string) {
    const campaign = await campaignRepository.findByLegacyProjectId(legacyProjectId);
    if (!campaign) return null;

    const brandUser = await userRepository.ensureBrandPortalUser({
      email: brandEmail,
      fullName: brandEmail.split("@")[0],
      companyName: brandEmail.split("@")[0]
    });
    if (!brandUser || campaign.brandId !== brandUser.id) {
      return null;
    }

    return { campaign, brandUser };
  }

  private actorFromUser(user: { id: string; role: string }): AuthActor {
    return { id: user.id, role: user.role };
  }

  private async resolveTargetVersion(campaignId: string, versionNumber?: number) {
    if (versionNumber != null) {
      return reviewRepository.findVersionByCampaignAndNumber(campaignId, versionNumber);
    }

    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) return null;

    if (campaign.currentVersion > 0) {
      const current = await reviewRepository.findVersionByCampaignAndNumber(
        campaignId,
        campaign.currentVersion
      );
      if (current) return current;
    }

    const versions = await versionRepository.listByCampaign(campaignId);
    return versions[versions.length - 1] ?? null;
  }

  private async ensureReviewSession(versionId: string, reviewRound: number, actor: AuthActor) {
    const version = await reviewRepository.findVersion(versionId);
    if (!version) return null;

    if (version.reviewStatus === "WAITING") {
      await reviewService.changeReviewStatus(versionId, "VERSION_READY", reviewRound, actor);
    }

    const refreshed = await reviewRepository.findVersion(versionId);
    if (refreshed?.reviewStatus === "READY") {
      await reviewService.changeReviewStatus(versionId, "START_REVIEW", reviewRound, actor);
    }

    return reviewRepository.findVersion(versionId);
  }

  async listCommentsForLegacyOrder(
    orderId: string,
    legacyProjectId: string
  ): Promise<StoredReviewComment[] | null> {
    if (!this.isEnabled()) return null;

    const campaign = await campaignRepository.findByLegacyProjectId(legacyProjectId);
    if (!campaign) return null;

    const versions = await reviewRepository.listVersionsForCampaign(campaign.id);
    const rows: StoredReviewComment[] = [];

    for (const version of versions) {
      for (const comment of version.comments) {
        rows.push(mapStoredComment(comment, orderId, version.versionNumber));
      }
    }

    return rows.sort(
      (a, b) =>
        a.timestamp_sec - b.timestamp_sec ||
        String(a.created_at).localeCompare(String(b.created_at))
    );
  }

  async addCommentForLegacyOrder(input: {
    orderId: string;
    legacyProjectId: string;
    brandEmail: string;
    version: number;
    timestampSec: number;
    body: string;
    posX?: number | null;
    posY?: number | null;
    issueType?: string | null;
    locale: Locale;
  }): Promise<{ ok: true; comment: StoredReviewComment } | { ok: false; error: string }> {
    if (!this.isEnabled()) {
      return { ok: false, error: "no-database" };
    }

    const ctx = await this.loadBrandCampaign(input.legacyProjectId, input.brandEmail);
    if (!ctx) {
      return { ok: false, error: "unauthorized" };
    }

    const version = await reviewRepository.findVersionByCampaignAndNumber(
      ctx.campaign.id,
      input.version
    );
    if (!version) {
      return { ok: false, error: "version-not-found" };
    }

    const actor = this.actorFromUser(ctx.brandUser);
    const sessionVersion = await this.ensureReviewSession(
      version.id,
      ctx.campaign.reviewRound,
      actor
    );
    if (!sessionVersion) {
      return { ok: false, error: "invalid-status" };
    }

    if (!["READY", "REVIEWING"].includes(sessionVersion.reviewStatus)) {
      return { ok: false, error: "invalid-status" };
    }

    const body = input.issueType
      ? `[${input.issueType}] ${input.body}`.trim()
      : input.body.trim();

    const created = await reviewRepository.createComment({
      campaignId: ctx.campaign.id,
      versionId: version.id,
      userId: ctx.brandUser.id,
      timeSeconds: input.timestampSec,
      comment: body,
      annotation:
        input.posX != null && input.posY != null
          ? {
              type: "POINT",
              x: input.posX,
              y: input.posY,
              width: 0,
              height: 0
            }
          : undefined
    });

    if (sessionVersion.reviewStatus === "READY") {
      await reviewService.changeReviewStatus(
        version.id,
        "START_REVIEW",
        ctx.campaign.reviewRound,
        actor
      );
    }

    await activityService.write(
      ctx.campaign.id,
      "review.comment_added",
      {
        userId: ctx.brandUser.id,
        email: input.brandEmail,
        role: "brand"
      },
      {
        order_id: input.orderId,
        version_number: input.version,
        comment_id: created.id,
        time_seconds: input.timestampSec
      }
    );

    if (ctx.campaign.creatorId) {
      const legacyProjectId = resolveLegacyProjectId(ctx.campaign);
      await notificationService
        .notify({
          userId: ctx.campaign.creatorId,
          campaignId: ctx.campaign.id,
          title: input.locale === "zh" ? "品牌添加了审片批注" : "Brand left a review comment",
          content:
            input.locale === "zh"
              ? `「${ctx.campaign.title}」Version ${input.version} 有新批注，请查看 Studio 审片室。`
              : `"${ctx.campaign.title}" — Version ${input.version} has new feedback in the review room.`,
          actionUrl: `${getAppBaseUrl()}/studio/review/${input.orderId}`,
          email: false
        })
        .catch(() => undefined);
    }

    return { ok: true, comment: mapStoredComment(created, input.orderId, input.version) };
  }

  async deleteCommentForLegacyOrder(input: {
    orderId: string;
    legacyProjectId: string;
    brandEmail: string;
    commentId: string;
  }): Promise<{ ok: true; commentId: string } | { ok: false; error: string }> {
    if (!this.isEnabled()) {
      return { ok: false, error: "no-database" };
    }

    const ctx = await this.loadBrandCampaign(input.legacyProjectId, input.brandEmail);
    if (!ctx) {
      return { ok: false, error: "unauthorized" };
    }

    const deleted = await reviewRepository.softDeleteComment(input.commentId, ctx.campaign.id);
    if (!deleted.count) {
      return { ok: false, error: "not-found" };
    }

    return { ok: true, commentId: input.commentId };
  }

  async resolveCommentForLegacyOrder(input: {
    orderId: string;
    legacyProjectId: string;
    legacyCreatorId: string;
    commentId: string;
  }): Promise<{ ok: true; comment: StoredReviewComment } | { ok: false; error: string }> {
    if (!this.isEnabled()) {
      return { ok: false, error: "no-database" };
    }

    const campaign = await campaignRepository.findByLegacyProjectId(input.legacyProjectId);
    if (!campaign?.creatorId) {
      return { ok: false, error: "unauthorized" };
    }

    const creatorProfileId = await resolveCreatorProfileIdForLegacyId(input.legacyCreatorId);
    if (!creatorProfileId) {
      return { ok: false, error: "unauthorized" };
    }

    const profile = await prisma.creatorProfile.findUnique({
      where: { id: creatorProfileId },
      select: { userId: true }
    });
    if (!profile || profile.userId !== campaign.creatorId) {
      return { ok: false, error: "unauthorized" };
    }

    const existing = await reviewRepository.findComment(input.commentId, campaign.id);
    if (!existing) {
      return { ok: false, error: "not-found" };
    }

    await reviewRepository.resolveComment(input.commentId, campaign.id, profile.userId);

    const version = await reviewRepository.findVersion(existing.versionId);
    const resolved = await reviewRepository.findComment(input.commentId, campaign.id);
    if (!resolved || !version) {
      return { ok: false, error: "not-found" };
    }

    return {
      ok: true,
      comment: mapStoredComment(resolved, input.orderId, version.versionNumber)
    };
  }

  async requestRevisionForLegacyOrder(input: {
    orderId: string;
    legacyProjectId: string;
    brandEmail: string;
    revisionNotes?: string;
    locale: Locale;
  }): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!this.isEnabled()) {
      return { ok: false, error: "no-database" };
    }

    const ctx = await this.loadBrandCampaign(input.legacyProjectId, input.brandEmail);
    if (!ctx) {
      return { ok: false, error: "unauthorized" };
    }

    const version = await this.resolveTargetVersion(ctx.campaign.id);
    if (!version) {
      return { ok: false, error: "version-not-found" };
    }

    const actor = this.actorFromUser(ctx.brandUser);
    const sessionVersion = await this.ensureReviewSession(
      version.id,
      ctx.campaign.reviewRound,
      actor
    );
    if (!sessionVersion || sessionVersion.reviewStatus !== "REVIEWING") {
      return { ok: false, error: "invalid-status" };
    }

    await reviewDecisionService.requestRevision(
      version.id,
      actor,
      input.revisionNotes?.trim() || undefined
    );

    await activityService.write(
      ctx.campaign.id,
      "review.revision_requested",
      {
        userId: ctx.brandUser.id,
        email: input.brandEmail,
        role: "brand"
      },
      {
        order_id: input.orderId,
        version_number: version.versionNumber,
        revision_notes: input.revisionNotes?.trim() || null
      }
    );

    return { ok: true };
  }

  async approveForLegacyOrder(input: {
    orderId: string;
    legacyProjectId: string;
    brandEmail: string;
    locale: Locale;
  }): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!this.isEnabled()) {
      return { ok: false, error: "no-database" };
    }

    const ctx = await this.loadBrandCampaign(input.legacyProjectId, input.brandEmail);
    if (!ctx) {
      return { ok: false, error: "unauthorized" };
    }

    const version = await this.resolveTargetVersion(ctx.campaign.id);
    if (!version) {
      return { ok: false, error: "version-not-found" };
    }

    const actor = this.actorFromUser(ctx.brandUser);
    const sessionVersion = await this.ensureReviewSession(
      version.id,
      ctx.campaign.reviewRound,
      actor
    );
    if (
      !sessionVersion ||
      !["READY", "REVIEWING"].includes(sessionVersion.reviewStatus)
    ) {
      return { ok: false, error: "invalid-status" };
    }

    await reviewDecisionService.approveVersion(version.id, actor);

    await activityService.write(
      ctx.campaign.id,
      "review.approved",
      {
        userId: ctx.brandUser.id,
        email: input.brandEmail,
        role: "brand"
      },
      {
        order_id: input.orderId,
        version_number: version.versionNumber
      }
    );

    return { ok: true };
  }
}

export const reviewPortalService = new ReviewPortalService();
