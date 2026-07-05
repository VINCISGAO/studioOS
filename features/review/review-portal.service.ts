import { activityService } from "@/features/campaign/activity.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { userRepository } from "@/features/auth/user.repository";
import { versionRepository } from "@/features/delivery/version.repository";
import { reviewDecisionService } from "@/features/review/review-decision.service";
import {
  reviewRepository,
  type ReviewCommentWithAnnotations
} from "@/features/review/review.repository";
import { reviewService } from "@/features/review/review.service";
import { reviewBridgeService } from "@/features/review/review-bridge.service";
import { notificationService } from "@/features/notification/notification.service";
import { getAppBaseUrl } from "@/lib/app-url";
import { resolveCreatorProfileIdForLegacyId } from "@/features/matching/invitation-creator-bridge";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import type { Locale } from "@/lib/i18n";
import type { ReviewComment as StoredReviewComment } from "@/lib/studioos/review-store";
import { normalizeReviewCommentTimestampSec } from "@/lib/studioos/review-comment-time";
import { normalizeStoredAnnotationDataJson } from "@/lib/studioos/review-annotation-json";
import { readProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.utils";
import type { BrandProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.types";

type AuthActor = { id: string; role: string };

function resolveLegacyProjectId(campaign: { productionBrief: unknown; id: string }): string {
  const brief = readProductionBrief(campaign.productionBrief) as BrandProductionBrief;
  return brief.legacy_project_id ?? campaign.id;
}

function mapAnnotationDataJson(
  annotation: {
    dataJson?: unknown;
    x: unknown;
    y: unknown;
    width: unknown;
    height: unknown;
  },
  commentTimeSeconds: number
) {
  return normalizeStoredAnnotationDataJson(annotation.dataJson, commentTimeSeconds, {
    x: Number(annotation.x),
    y: Number(annotation.y),
    width: Number(annotation.width),
    height: Number(annotation.height)
  });
}

function mapStoredComment(
  comment: ReviewCommentWithAnnotations,
  orderId: string,
  versionNumber: number
): StoredReviewComment {
  return {
    id: comment.id,
    order_id: orderId,
    version: versionNumber,
    timestamp_sec: normalizeReviewCommentTimestampSec(comment.timeSeconds),
    body: comment.comment,
    pos_x: comment.annotations[0] ? Number(comment.annotations[0].x) : null,
    pos_y: comment.annotations[0] ? Number(comment.annotations[0].y) : null,
    issue_type: null,
    author: comment.user?.role === "BRAND" ? "brand" : "studio",
    created_by: comment.userId,
    annotations: comment.annotations.map((annotation) => ({
      id: annotation.id,
      type: annotation.type,
      color: annotation.color,
      stroke_width: annotation.strokeWidth,
      data_json: mapAnnotationDataJson(
        annotation,
        normalizeReviewCommentTimestampSec(comment.timeSeconds)
      )
    })),
    status: comment.resolved ? "resolved" : "todo",
    created_at: comment.createdAt.toISOString(),
    resolved_at: comment.resolvedAt?.toISOString() ?? null
  };
}

function mapVersionComment(
  comment: Awaited<ReturnType<typeof reviewRepository.listVersionsForCampaign>>[number]["comments"][number],
  orderId: string,
  versionNumber: number
): StoredReviewComment {
  return {
    id: comment.id,
    order_id: orderId,
    version: versionNumber,
    timestamp_sec: normalizeReviewCommentTimestampSec(comment.timeSeconds),
    body: comment.comment,
    pos_x: comment.annotations[0] ? Number(comment.annotations[0].x) : null,
    pos_y: comment.annotations[0] ? Number(comment.annotations[0].y) : null,
    issue_type: null,
    author: comment.user?.role === "BRAND" ? "brand" : "studio",
    created_by: comment.userId,
    author_display_name: comment.user?.fullName,
    annotations: comment.annotations.map((annotation) => ({
      id: annotation.id,
      type: annotation.type,
      color: annotation.color,
      stroke_width: annotation.strokeWidth,
      data_json: mapAnnotationDataJson(
        annotation,
        normalizeReviewCommentTimestampSec(comment.timeSeconds)
      )
    })),
    status: comment.resolved ? "resolved" : "todo",
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
        rows.push(mapVersionComment(comment, orderId, version.versionNumber));
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
    annotations?: StoredReviewComment["annotations"];
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

    const annotations =
      input.annotations && input.annotations.length
        ? input.annotations
            .map((annotation) => {
              const type = String(annotation.type ?? "").toUpperCase();
              if (
                !["POINT", "ARROW", "RECTANGLE", "CIRCLE", "PEN", "TEXT"].includes(type)
              ) {
                return null;
              }
              const data = (annotation.data_json ?? {}) as Record<string, unknown>;
              const x =
                typeof data.x === "number"
                  ? data.x
                  : input.posX != null
                    ? input.posX
                    : 0.5;
              const y =
                typeof data.y === "number"
                  ? data.y
                  : input.posY != null
                    ? input.posY
                    : 0.5;
              const width = typeof data.width === "number" ? data.width : 0;
              const height = typeof data.height === "number" ? data.height : 0;
              return {
                type: type as "POINT" | "ARROW" | "RECTANGLE" | "CIRCLE" | "PEN" | "TEXT",
                x,
                y,
                width,
                height,
                color: annotation.color ?? "#FF4D4F",
                strokeWidth: annotation.stroke_width ?? 2,
                dataJson: normalizeStoredAnnotationDataJson(annotation.data_json, input.timestampSec, {
                  x,
                  y,
                  width,
                  height
                })
              };
            })
            .filter((item): item is NonNullable<typeof item> => Boolean(item))
        : undefined;

    const created = await reviewRepository.createComment({
      campaignId: ctx.campaign.id,
      versionId: version.id,
      userId: ctx.brandUser.id,
      timeSeconds: normalizeReviewCommentTimestampSec(input.timestampSec),
      comment: body,
      annotations:
        annotations && annotations.length > 0
          ? annotations
          : input.posX != null && input.posY != null
            ? [
                {
                  type: "POINT",
                  x: input.posX,
                  y: input.posY,
                  width: 0,
                  height: 0
                }
              ]
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
        time_seconds: normalizeReviewCommentTimestampSec(input.timestampSec)
      }
    );

    return { ok: true, comment: mapStoredComment(created, input.orderId, input.version) };
  }

  async addStudioReplyForLegacyOrder(input: {
    orderId: string;
    legacyProjectId: string;
    legacyCreatorId: string;
    version: number;
    body: string;
    replyToCommentId: string;
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
      select: { userId: true, displayName: true }
    });
    if (!profile || profile.userId !== campaign.creatorId) {
      return { ok: false, error: "unauthorized" };
    }

    const parent = await reviewRepository.findComment(input.replyToCommentId, campaign.id);
    if (!parent) {
      return { ok: false, error: "not-found" };
    }

    const version = await reviewRepository.findVersion(parent.versionId);
    if (!version || version.versionNumber !== input.version) {
      return { ok: false, error: "not-found" };
    }

    const parentMapped = mapStoredComment(parent, input.orderId, version.versionNumber);
    if (parentMapped.author !== "brand") {
      return { ok: false, error: "invalid-parent" };
    }

    const created = await reviewRepository.createComment({
      campaignId: campaign.id,
      versionId: version.id,
      userId: profile.userId,
      timeSeconds: Number(parent.timeSeconds),
      comment: input.body.trim()
    });

    await activityService.write(
      campaign.id,
      "review.studio_reply_added",
      { userId: profile.userId, email: input.legacyCreatorId, role: "creator" },
      {
        order_id: input.orderId,
        version_number: input.version,
        comment_id: created.id,
        reply_to_comment_id: input.replyToCommentId
      }
    );

    const mapped = mapStoredComment(created, input.orderId, input.version);
    mapped.author_display_name = profile.displayName ?? "Studio";
    return { ok: true, comment: mapped };
  }

  async updateCreatorCommentWorkflowForLegacyOrder(input: {
    orderId: string;
    legacyProjectId: string;
    legacyCreatorId: string;
    commentId: string;
    status: "in_progress" | "pending_confirmation";
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

    const version = await reviewRepository.findVersion(existing.versionId);
    if (!version) {
      return { ok: false, error: "not-found" };
    }

    const mappedExisting = mapStoredComment(existing, input.orderId, version.versionNumber);
    if (mappedExisting.status === "resolved") {
      return { ok: false, error: "already-resolved" };
    }
    if (
      (input.status === "in_progress" && mappedExisting.status !== "todo") ||
      (input.status === "pending_confirmation" && mappedExisting.status !== "in_progress")
    ) {
      return { ok: false, error: "invalid-transition" };
    }

    await activityService.write(
      campaign.id,
      "review.comment_status_updated",
      { userId: profile.userId, email: input.legacyCreatorId, role: "creator" },
      {
        order_id: input.orderId,
        version_number: version.versionNumber,
        comment_id: input.commentId,
        status: input.status
      }
    );

    const result = mapStoredComment(existing, input.orderId, version.versionNumber);
    result.status = input.status;
    return { ok: true, comment: result };
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

    const deleted = await reviewRepository.hardDeleteComment(input.commentId, ctx.campaign.id);
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

  async updateCommentStatusForLegacyOrder(input: {
    orderId: string;
    legacyProjectId: string;
    brandEmail: string;
    commentId: string;
    status: StoredReviewComment["status"];
  }): Promise<{ ok: true; comment: StoredReviewComment } | { ok: false; error: string }> {
    if (!this.isEnabled()) {
      return { ok: false, error: "no-database" };
    }

    const ctx = await this.loadBrandCampaign(input.legacyProjectId, input.brandEmail);
    if (!ctx) {
      return { ok: false, error: "unauthorized" };
    }

    const existing = await reviewRepository.findComment(input.commentId, ctx.campaign.id);
    if (!existing) {
      return { ok: false, error: "not-found" };
    }

    await reviewRepository.updateCommentStatus(
      input.commentId,
      ctx.campaign.id,
      input.status === "resolved",
      input.status === "resolved" ? ctx.brandUser.id : undefined
    );

    const updated = await reviewRepository.findComment(input.commentId, ctx.campaign.id);
    const version = await reviewRepository.findVersion(existing.versionId);
    if (!updated || !version) {
      return { ok: false, error: "not-found" };
    }

    const mapped = mapStoredComment(updated, input.orderId, version.versionNumber);
    mapped.author_display_name = ctx.brandUser.fullName;
    return { ok: true, comment: mapped };
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

    try {
      await reviewDecisionService.requestRevision(
        version.id,
        actor,
        input.revisionNotes?.trim() || undefined
      );
    } catch (error) {
      const { isAppError } = await import("@/lib/core/errors");
      if (isAppError(error)) {
        if (error.code === "PAYMENT_REQUIRED") {
          const { getOrder } = await import("@/lib/order-service");
          const { notifyBrandPaymentRequired } = await import(
            "@/lib/studioos/commercial-interaction-notify"
          );
          const order = await getOrder(input.orderId);
          if (order) {
            await notifyBrandPaymentRequired({
              order,
              locale: input.locale,
              nextRevisionRound: version.versionNumber + 1
            }).catch(() => undefined);
          }
        }
        return { ok: false, error: error.code };
      }
      throw error;
    }

    await reviewBridgeService.syncLegacyOrderStatusAfterRevision(ctx.campaign.id);

    if (ctx.campaign.creatorId) {
      const legacyProjectId = resolveLegacyProjectId(ctx.campaign);
      await notificationService
        .notify({
          userId: ctx.campaign.creatorId,
          campaignId: ctx.campaign.id,
          title: input.locale === "zh" ? "品牌要求修改" : "Brand requested changes",
          content:
            input.locale === "zh"
              ? `「${ctx.campaign.title}」Version ${version.versionNumber} 需要修改，请查看 Studio 审片室。`
              : `"${ctx.campaign.title}" — Version ${version.versionNumber} needs revisions. Open the review room.`,
          actionUrl: `${getAppBaseUrl()}/studio/review/${input.orderId}`,
          email: false
        })
        .catch(() => undefined);
    }

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

    await reviewBridgeService.syncLegacyOrderStatusAfterApprove(ctx.campaign.id);

    if (ctx.campaign.creatorId) {
      await notificationService
        .notify({
          userId: ctx.campaign.creatorId,
          campaignId: ctx.campaign.id,
          title: input.locale === "zh" ? "品牌已通过交付" : "Brand approved delivery",
          content:
            input.locale === "zh"
              ? `「${ctx.campaign.title}」Version ${version.versionNumber} 已通过，请标记最终版供品牌下载。`
              : `"${ctx.campaign.title}" — Version ${version.versionNumber} approved. Mark the final master for brand download.`,
          actionUrl: `${getAppBaseUrl()}/studio/review/${input.orderId}`,
          email: false
        })
        .catch(() => undefined);
    }

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
