import { reviewerV1Repository } from "@/features/review/reviewer-v1.repository";
import type {
  CreateReviewerV1CommentInput,
  ReviewerV1AnnotationInput,
  ReviewerV1CommentRecord,
  ReviewerV1VersionRecord
} from "@/features/review/reviewer-v1.types";
import type { ReviewStatus } from "@prisma/client";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

export type ReviewerV1CreateCommentInput = Omit<CreateReviewerV1CommentInput, "campaignId" | "versionId"> & {
  versionId: string;
  /** Single legacy annotation (API v1 body) */
  annotation?: Omit<ReviewerV1AnnotationInput, "type"> & {
    type: ReviewerV1AnnotationInput["type"];
  };
  annotations?: ReviewerV1AnnotationInput[];
};

export class ReviewerV1Service {
  private assertDb() {
    if (!hasDatabaseUrl()) {
      throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
    }
  }

  async getCampaignVersion(versionId: string): Promise<ReviewerV1VersionRecord> {
    this.assertDb();
    const version = await reviewerV1Repository.findCampaignVersion(versionId);
    if (!version) {
      throw appError("NOT_FOUND", "Version not found");
    }
    return version;
  }

  async getCampaignVersionByNumber(campaignId: string, versionNumber: number) {
    this.assertDb();
    const version = await reviewerV1Repository.findCampaignVersionByNumber(campaignId, versionNumber);
    if (!version) {
      throw appError("NOT_FOUND", "Version not found");
    }
    return version;
  }

  async listComments(versionId: string): Promise<ReviewerV1CommentRecord[]> {
    this.assertDb();
    await this.getCampaignVersion(versionId);
    return reviewerV1Repository.listCommentsForVersion(versionId);
  }

  async listCommentsForCampaign(campaignId: string) {
    this.assertDb();
    return reviewerV1Repository.listCampaignVersionsWithComments(campaignId);
  }

  async createComment(input: ReviewerV1CreateCommentInput): Promise<ReviewerV1CommentRecord> {
    this.assertDb();
    const version = await this.getCampaignVersion(input.versionId);

    const annotations =
      input.annotations && input.annotations.length > 0
        ? input.annotations
        : input.annotation
          ? [input.annotation]
          : undefined;

    return reviewerV1Repository.createComment({
      campaignId: version.campaignId,
      versionId: input.versionId,
      userId: input.userId,
      timeSeconds: input.timeSeconds,
      comment: input.comment,
      annotations
    });
  }

  async findComment(commentId: string, campaignId: string) {
    this.assertDb();
    const comment = await reviewerV1Repository.findComment(commentId, campaignId);
    if (!comment) {
      throw appError("NOT_FOUND", "Comment not found");
    }
    return comment;
  }

  async setCommentResolved(
    commentId: string,
    campaignId: string,
    resolved: boolean,
    resolvedBy?: string | null
  ) {
    this.assertDb();
    const updated = await reviewerV1Repository.updateCommentStatus({
      commentId,
      campaignId,
      resolved,
      resolvedBy
    });
    if (!updated.count) {
      throw appError("NOT_FOUND", "Comment not found");
    }
    return this.findComment(commentId, campaignId);
  }

  async softDeleteComment(commentId: string, campaignId: string) {
    this.assertDb();
    const deleted = await reviewerV1Repository.softDeleteComment(commentId, campaignId);
    if (!deleted.count) {
      throw appError("NOT_FOUND", "Comment not found");
    }
    return { commentId };
  }

  async setVersionReviewStatus(versionId: string, reviewStatus: ReviewStatus) {
    this.assertDb();
    await this.getCampaignVersion(versionId);
    return reviewerV1Repository.updateCampaignVersionReviewStatus(versionId, reviewStatus);
  }
}

export const reviewerV1Service = new ReviewerV1Service();
