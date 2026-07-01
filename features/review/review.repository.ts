import type { CampaignVersion, ReviewAnnotation, ReviewComment } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export type VersionWithComments = CampaignVersion & {
  comments: (ReviewComment & { annotations: ReviewAnnotation[] })[];
};

export type ReviewCommentWithAnnotations = ReviewComment & {
  annotations: ReviewAnnotation[];
};

export class ReviewRepository {
  async findVersion(versionId: string) {
    if (!hasDatabaseUrl()) return null;
    return prisma.campaignVersion.findFirst({
      where: { id: versionId, deletedAt: null },
      include: { campaign: true }
    });
  }

  async findVersionByCampaignAndNumber(campaignId: string, versionNumber: number) {
    if (!hasDatabaseUrl()) return null;
    return prisma.campaignVersion.findFirst({
      where: { campaignId, versionNumber, deletedAt: null },
      include: { campaign: true }
    });
  }

  async listVersionsForCampaign(campaignId: string): Promise<VersionWithComments[]> {
    if (!hasDatabaseUrl()) return [];
    return prisma.campaignVersion.findMany({
      where: { campaignId, deletedAt: null },
      include: {
        comments: {
          where: { deletedAt: null },
          orderBy: { timeSeconds: "asc" },
          include: { annotations: true }
        }
      },
      orderBy: { versionNumber: "asc" }
    });
  }

  async listComments(versionId: string) {
    if (!hasDatabaseUrl()) return [];
    return prisma.reviewComment.findMany({
      where: { versionId, deletedAt: null },
      orderBy: { timeSeconds: "asc" },
      include: { annotations: true, user: true }
    });
  }

  async createComment(input: {
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
  }): Promise<ReviewCommentWithAnnotations> {
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

  async softDeleteComment(commentId: string, campaignId: string) {
    return prisma.reviewComment.updateMany({
      where: { id: commentId, campaignId, deletedAt: null },
      data: { deletedAt: new Date() }
    });
  }

  async resolveComment(commentId: string, campaignId: string, resolvedBy: string) {
    return prisma.reviewComment.updateMany({
      where: { id: commentId, campaignId, deletedAt: null },
      data: {
        resolved: true,
        resolvedBy,
        resolvedAt: new Date()
      }
    });
  }

  async findComment(commentId: string, campaignId: string) {
    return prisma.reviewComment.findFirst({
      where: { id: commentId, campaignId, deletedAt: null },
      include: { annotations: true }
    });
  }
}

export const reviewRepository = new ReviewRepository();
