import type { Prisma, ReviewStatus } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import {
  CreateReviewerV1CommentInput,
  reviewerV1CommentInclude,
  type ReviewerV1CommentRecord,
  type ReviewerV1VersionRecord,
  type ReviewerV1VersionWithComments,
  type UpdateReviewerV1CommentStatusInput
} from "@/features/review/reviewer-v1.types";

function requireClient() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL not configured");
  }
  return prisma;
}

function buildAnnotationCreates(
  input: CreateReviewerV1CommentInput
): Prisma.ReviewCommentCreateInput["annotations"] {
  if (!input.annotations?.length) return undefined;

  return {
    create: input.annotations.map((annotation) => ({
      campaign: { connect: { id: input.campaignId } },
      version: { connect: { id: input.versionId } },
      type: annotation.type,
      x: annotation.x,
      y: annotation.y,
      width: annotation.width,
      height: annotation.height,
      color: annotation.color ?? "#FF4D4F",
      strokeWidth: annotation.strokeWidth ?? 2,
      ...(annotation.dataJson != null
        ? { dataJson: annotation.dataJson as Prisma.InputJsonValue }
        : {})
    }))
  };
}

export class ReviewerV1Repository {
  async findCampaignVersion(versionId: string): Promise<ReviewerV1VersionRecord | null> {
    if (!hasDatabaseUrl()) return null;
    return requireClient().campaignVersion.findFirst({
      where: { id: versionId, deletedAt: null },
      include: {
        campaign: {
          select: {
            id: true,
            brandId: true,
            creatorId: true,
            status: true,
            reviewRound: true,
            currentVersion: true,
            title: true
          }
        }
      }
    });
  }

  async findCampaignVersionByNumber(
    campaignId: string,
    versionNumber: number
  ): Promise<ReviewerV1VersionRecord | null> {
    if (!hasDatabaseUrl()) return null;
    return requireClient().campaignVersion.findFirst({
      where: { campaignId, versionNumber, deletedAt: null },
      include: {
        campaign: {
          select: {
            id: true,
            brandId: true,
            creatorId: true,
            status: true,
            reviewRound: true,
            currentVersion: true,
            title: true
          }
        }
      }
    });
  }

  async listCampaignVersionsWithComments(campaignId: string): Promise<ReviewerV1VersionWithComments[]> {
    if (!hasDatabaseUrl()) return [];
    return requireClient().campaignVersion.findMany({
      where: { campaignId, deletedAt: null },
      include: {
        comments: {
          where: { deletedAt: null },
          orderBy: { timeSeconds: "asc" },
          include: reviewerV1CommentInclude
        }
      },
      orderBy: { versionNumber: "asc" }
    });
  }

  async listCommentsForVersion(versionId: string): Promise<ReviewerV1CommentRecord[]> {
    if (!hasDatabaseUrl()) return [];
    return requireClient().reviewComment.findMany({
      where: { versionId, deletedAt: null },
      orderBy: { timeSeconds: "asc" },
      include: reviewerV1CommentInclude
    });
  }

  async findComment(commentId: string, campaignId: string): Promise<ReviewerV1CommentRecord | null> {
    if (!hasDatabaseUrl()) return null;
    return requireClient().reviewComment.findFirst({
      where: { id: commentId, campaignId, deletedAt: null },
      include: reviewerV1CommentInclude
    });
  }

  async createComment(input: CreateReviewerV1CommentInput): Promise<ReviewerV1CommentRecord> {
    return requireClient().reviewComment.create({
      data: {
        campaignId: input.campaignId,
        versionId: input.versionId,
        userId: input.userId,
        timeSeconds: input.timeSeconds,
        comment: input.comment,
        annotations: buildAnnotationCreates(input)
      },
      include: reviewerV1CommentInclude
    });
  }

  async resolveComment(commentId: string, campaignId: string, resolvedBy: string) {
    return this.updateCommentStatus({
      commentId,
      campaignId,
      resolved: true,
      resolvedBy
    });
  }

  async updateCommentStatus(input: UpdateReviewerV1CommentStatusInput) {
    return requireClient().reviewComment.updateMany({
      where: { id: input.commentId, campaignId: input.campaignId, deletedAt: null },
      data: {
        resolved: input.resolved,
        resolvedBy: input.resolved ? (input.resolvedBy ?? null) : null,
        resolvedAt: input.resolved ? new Date() : null
      }
    });
  }

  async softDeleteComment(commentId: string, campaignId: string) {
    return requireClient().reviewComment.updateMany({
      where: { id: commentId, campaignId, deletedAt: null },
      data: { deletedAt: new Date() }
    });
  }

  async hardDeleteComment(commentId: string, campaignId: string) {
    return requireClient().$transaction(async (tx) => {
      await tx.reviewAnnotation.deleteMany({
        where: { commentId, campaignId }
      });
      return tx.reviewComment.deleteMany({
        where: { id: commentId, campaignId }
      });
    });
  }

  async updateCampaignVersionReviewStatus(versionId: string, reviewStatus: ReviewStatus) {
    return requireClient().campaignVersion.update({
      where: { id: versionId },
      data: { reviewStatus }
    });
  }
}

export const reviewerV1Repository = new ReviewerV1Repository();
