import type {
  AnnotationType,
  CampaignVersion,
  Prisma,
  ReviewAnnotation,
  ReviewComment,
  ReviewStatus
} from "@prisma/client";

export type {
  AnnotationType,
  CampaignVersion,
  ReviewAnnotation,
  ReviewComment,
  ReviewStatus
};

/** Prisma-aligned annotation kinds for Reviewer V1. */
export const REVIEWER_V1_ANNOTATION_TYPES = [
  "CIRCLE",
  "RECTANGLE",
  "ARROW",
  "POINT",
  "PEN",
  "TEXT"
] as const satisfies readonly AnnotationType[];

export type ReviewerV1AnnotationType = (typeof REVIEWER_V1_ANNOTATION_TYPES)[number];

export type ReviewerV1AnnotationInput = {
  type: ReviewerV1AnnotationType;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  strokeWidth?: number;
  dataJson?: unknown;
};

export type CreateReviewerV1CommentInput = {
  campaignId: string;
  versionId: string;
  userId: string;
  timeSeconds: number;
  comment: string;
  annotations?: ReviewerV1AnnotationInput[];
};

export const reviewerV1CommentInclude = {
  annotations: true,
  user: { select: { id: true, fullName: true, role: true } }
} satisfies Prisma.ReviewCommentInclude;

export type ReviewerV1CommentRecord = Prisma.ReviewCommentGetPayload<{
  include: typeof reviewerV1CommentInclude;
}>;

export type ReviewerV1VersionRecord = CampaignVersion & {
  campaign: {
    id: string;
    brandId: string;
    creatorId: string | null;
    status: string;
    reviewRound: number;
    currentVersion: number;
    title: string;
  };
};

export type ReviewerV1VersionWithComments = CampaignVersion & {
  comments: ReviewerV1CommentRecord[];
};

export type UpdateReviewerV1CommentStatusInput = {
  commentId: string;
  campaignId: string;
  resolved: boolean;
  resolvedBy?: string | null;
};
