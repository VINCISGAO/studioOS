import { reviewRepository } from "@/features/review/review.repository";
import type { CreateReviewCommentBody } from "@/features/review/review.schemas";
import { serializeReviewComment, serializeReviewVersion } from "@/features/review/review.serializer";
import { platformLocalizationService } from "@/features/communication/platform-localization.service";
import { buildReviewBundleFromPrisma } from "@/features/review/prisma-review-bundle";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { PermissionService, type AuthUser } from "@/features/auth/permission.service";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { appError } from "@/lib/core/errors";
import { runTransition } from "@/lib/core/transition-runner";
import { ReviewEvents } from "@/features/shared/types/events";
import {
  reviewStateMachine,
  MAX_REVIEW_ROUNDS,
  type ReviewStateValue,
  type ReviewEventValue
} from "@/features/review/review.state-machine";
import type { ReviewStatus } from "@prisma/client";

export type CreateCommentInput = {
  campaignId: string;
  versionId: string;
  userId: string;
  timeSeconds: number;
  comment: string;
  annotation?: {
    type: "CIRCLE" | "RECTANGLE" | "ARROW" | "POINT";
    x: number;
    y: number;
    width: number;
    height: number;
    color?: string;
  };
};

export class ReviewService {
  private assertDb() {
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }

  private async assertVersionAccess(versionId: string, user: AuthUser) {
    this.assertDb();
    const version = await reviewRepository.findVersion(versionId);
    if (!version) throw appError("NOT_FOUND", "Version not found");
    if (!PermissionService.canAccessCampaign(user, version.campaign)) {
      throw appError("FORBIDDEN", "Not allowed for this version");
    }
    return version;
  }

  async getCampaignReviewTimeline(campaignId: string, user: AuthUser) {
    this.assertDb();
    PermissionService.assert(user, "review.read");

    const campaign = await campaignRepository.findReviewBundleSource(campaignId);
    if (!campaign) throw appError("NOT_FOUND", "Campaign not found");
    if (!PermissionService.canAccessCampaign(user, campaign)) {
      throw appError("FORBIDDEN", "Not allowed for this campaign");
    }

    const bundle = buildReviewBundleFromPrisma(campaign, { projectId: campaignId, viewerUserId: user.id });
    const versions = await reviewRepository.listVersionsForCampaign(campaignId);

    return {
      campaign: {
        id: campaign.id,
        title: campaign.title,
        status: campaign.status,
        reviewRound: campaign.reviewRound,
        currentVersion: campaign.currentVersion
      },
      versions: versions.map((v) => serializeReviewVersion(v, user.id)),
      comments: bundle.comments.map((c) => ({
        id: c.id,
        versionId: c.video_version_id,
        userId: c.user_id,
        timeSeconds: c.timestamp_seconds,
        comment: c.comment_text,
        annotation:
          c.annotation_type && c.pos_x != null
            ? {
                type: c.annotation_type === "circle" ? "CIRCLE" : c.annotation_type === "rect" ? "RECTANGLE" : "POINT",
                x: c.pos_x,
                y: c.pos_y ?? 0,
                width: c.width ?? 0,
                height: c.height ?? 0,
                color: c.color
              }
            : null,
        status: c.status,
        createdAt: c.created_at
      })),
      profiles: bundle.profiles
    };
  }

  async getVersion(versionId: string, user: AuthUser) {
    const version = await this.assertVersionAccess(versionId, user);
    PermissionService.assert(user, "review.read");
    return serializeReviewVersion(version, user.id);
  }

  async listComments(versionId: string, user: AuthUser) {
    const version = await this.assertVersionAccess(versionId, user);
    PermissionService.assert(user, "review.read");
    const comments = await reviewRepository.listComments(versionId);

    const enriched = await Promise.all(
      comments.map(async (comment) => {
        const base = serializeReviewComment(comment);
        try {
          const localized = await platformLocalizationService.localizeReviewComment({
            commentId: comment.id,
            campaignId: version.campaignId,
            versionId,
            authorId: comment.userId,
            viewerUserId: user.id,
            originalContent: comment.comment
          });
          return {
            ...base,
            localizedComment: localized.displayContent,
            summary: localized.summary,
            autoLocalized: localized.autoLocalized
          };
        } catch {
          return base;
        }
      })
    );

    return enriched;
  }

  async createCommentForUser(versionId: string, user: AuthUser, body: CreateReviewCommentBody) {
    const version = await this.assertVersionAccess(versionId, user);
    PermissionService.assert(user, "review.comment");

    if (user.role.toUpperCase() === "CREATOR") {
      throw appError("FORBIDDEN", "Creators cannot add review comments");
    }

    if (!["REVIEWING", "READY"].includes(version.reviewStatus)) {
      throw appError("CAMPAIGN_LOCKED", "Comments are only allowed during active review");
    }

    const created = await this.createComment({
      campaignId: version.campaignId,
      versionId,
      userId: user.id,
      timeSeconds: body.time_seconds,
      comment: body.comment,
      annotation: body.annotation
    });

    if (version.reviewStatus === "READY") {
      await this.changeReviewStatus(versionId, "START_REVIEW", version.campaign.reviewRound, user);
    }

    void platformLocalizationService
      .localizeReviewComment({
        commentId: created.id,
        campaignId: version.campaignId,
        versionId,
        authorId: user.id,
        viewerUserId: version.campaign.creatorId ?? user.id,
        originalContent: created.comment
      })
      .catch(() => undefined);

    return serializeReviewComment(created);
  }

  async getVersionBundle(versionId: string) {
    if (!hasDatabaseUrl()) return null;
    return prisma.campaignVersion.findUnique({
      where: { id: versionId },
      include: {
        comments: { include: { annotations: true, user: true }, orderBy: { timeSeconds: "asc" } },
        campaign: true
      }
    });
  }

  async createComment(input: CreateCommentInput) {
    if (!hasDatabaseUrl()) {
      throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
    }

    const version = await prisma.campaignVersion.findUnique({ where: { id: input.versionId } });
    if (!version || version.campaignId !== input.campaignId) {
      throw appError("NOT_FOUND", "Version not found");
    }

    return prisma.reviewComment.create({
      data: {
        campaignId: input.campaignId,
        versionId: input.versionId,
        userId: input.userId,
        timeSeconds: input.timeSeconds,
        comment: input.comment,
        annotations: input.annotation
          ? {
              create: {
                campaignId: input.campaignId,
                versionId: input.versionId,
                type: input.annotation.type,
                x: input.annotation.x,
                y: input.annotation.y,
                width: input.annotation.width,
                height: input.annotation.height,
                color: input.annotation.color ?? "#FF4D4F"
              }
            }
          : undefined
      },
      include: { annotations: true }
    });
  }

  async changeReviewStatus(
    versionId: string,
    event: ReviewEventValue,
    reviewRound: number,
    actor?: AuthUser
  ) {
    if (!hasDatabaseUrl()) {
      throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
    }

    const version = await prisma.campaignVersion.findUnique({
      where: { id: versionId },
      include: { campaign: true }
    });
    if (!version) throw appError("NOT_FOUND", "Version not found");

    if (event === "REQUEST_REVISION" && reviewRound >= MAX_REVIEW_ROUNDS) {
      throw appError("REVIEW_LOCKED", `Maximum ${MAX_REVIEW_ROUNDS} review rounds reached`);
    }

    const current = version.reviewStatus as unknown as ReviewStateValue;

    return runTransition({
      machine: reviewStateMachine,
      current,
      event,
      context: {
        aggregateType: "review",
        aggregateId: versionId,
        campaignId: version.campaignId,
        actor
      },
      persist: async (next) => {
        await prisma.campaignVersion.update({
          where: { id: versionId },
          data: { reviewStatus: next as ReviewStatus }
        });
      },
      domainEvent: {
        name:
          event === "APPROVE"
            ? ReviewEvents.APPROVED
            : event === "REQUEST_REVISION"
              ? ReviewEvents.REVISION_REQUESTED
              : ReviewEvents.COMMENT_CREATED,
        aggregateType: "review",
        aggregateId: versionId,
        payload: { event, reviewRound }
      }
    });
  }

  async approve(versionId: string, actor: AuthUser) {
    return this.changeReviewStatus(versionId, "APPROVE", 0, actor);
  }

  async requestRevision(versionId: string, actor: AuthUser, reviewRound: number) {
    return this.changeReviewStatus(versionId, "REQUEST_REVISION", reviewRound, actor);
  }
}

export const reviewService = new ReviewService();
