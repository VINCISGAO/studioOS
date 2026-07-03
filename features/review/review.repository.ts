import type { CampaignVersion, ReviewAnnotation, ReviewComment } from "@prisma/client";
import {
  reviewerV1Repository,
  ReviewerV1Repository
} from "@/features/review/reviewer-v1.repository";
import type {
  CreateReviewerV1CommentInput,
  ReviewerV1CommentRecord,
  ReviewerV1VersionWithComments
} from "@/features/review/reviewer-v1.types";

export type ReviewCommentWithAnnotations = ReviewerV1CommentRecord;

export type VersionWithComments = ReviewerV1VersionWithComments & {
  comments: (ReviewComment & {
    annotations: ReviewAnnotation[];
    user: { id: string; fullName: string; role: string };
  })[];
};

/** @deprecated Use ReviewerV1Repository — kept for existing imports */
export class ReviewRepository {
  findVersion(versionId: string) {
    return reviewerV1Repository.findCampaignVersion(versionId);
  }

  findVersionByCampaignAndNumber(campaignId: string, versionNumber: number) {
    return reviewerV1Repository.findCampaignVersionByNumber(campaignId, versionNumber);
  }

  listVersionsForCampaign(campaignId: string): Promise<VersionWithComments[]> {
    return reviewerV1Repository.listCampaignVersionsWithComments(campaignId) as Promise<
      VersionWithComments[]
    >;
  }

  listComments(versionId: string) {
    return reviewerV1Repository.listCommentsForVersion(versionId);
  }

  createComment(input: CreateReviewerV1CommentInput): Promise<ReviewCommentWithAnnotations> {
    return reviewerV1Repository.createComment(input);
  }

  softDeleteComment(commentId: string, campaignId: string) {
    return reviewerV1Repository.softDeleteComment(commentId, campaignId);
  }

  hardDeleteComment(commentId: string, campaignId: string) {
    return reviewerV1Repository.hardDeleteComment(commentId, campaignId);
  }

  resolveComment(commentId: string, campaignId: string, resolvedBy: string) {
    return reviewerV1Repository.updateCommentStatus({
      commentId,
      campaignId,
      resolved: true,
      resolvedBy
    });
  }

  updateCommentStatus(
    commentId: string,
    campaignId: string,
    resolved: boolean,
    resolvedBy?: string
  ) {
    return reviewerV1Repository.updateCommentStatus({
      commentId,
      campaignId,
      resolved,
      resolvedBy
    });
  }

  findComment(commentId: string, campaignId: string): Promise<ReviewCommentWithAnnotations | null> {
    return reviewerV1Repository.findComment(commentId, campaignId);
  }
}

export { ReviewerV1Repository, reviewerV1Repository };
export const reviewRepository = new ReviewRepository();

export type { CampaignVersion, ReviewAnnotation, ReviewComment };
