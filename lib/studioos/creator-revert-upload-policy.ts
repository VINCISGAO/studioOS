import type { Locale } from "@/lib/i18n";
import type { ReviewComment } from "@/lib/studioos/review-comment-types";

/** Prisma `ReviewStatus` values that mean the brand review / annotation flow has started. */
const BRAND_ANNOTATION_REVIEW_STATUSES = new Set(["REVIEWING", "REVISION_REQUIRED", "APPROVED", "LOCKED"]);

export function isBrandReviewComment(comment: ReviewComment): boolean {
  if (comment.author !== "brand") return false;
  const hasBody = comment.body.trim().length > 0;
  const hasPin = comment.pos_x != null && comment.pos_y != null;
  const hasAnnotations = (comment.annotations?.length ?? 0) > 0;
  return hasBody || hasPin || hasAnnotations;
}

export function hasBrandAnnotationFlowStarted(input: {
  brandComments: ReviewComment[];
  prismaReviewStatus?: string | null;
}): boolean {
  if (input.prismaReviewStatus && BRAND_ANNOTATION_REVIEW_STATUSES.has(input.prismaReviewStatus)) {
    return true;
  }
  return input.brandComments.some(isBrandReviewComment);
}

export function canCreatorRevertUpload(input: {
  brandComments: ReviewComment[];
  prismaReviewStatus?: string | null;
}): boolean {
  return !hasBrandAnnotationFlowStarted(input);
}

export function creatorRevertUploadPolicyNotice(locale: Locale) {
  if (locale === "zh") {
    return {
      hint: "退回后可重新上传并覆盖当前稿件，再次发起审核；品牌方开始批注后将无法退回。",
      lockedHint: "品牌方已开始批注，无法再退回上传。请等待审片反馈或按修改意见处理。"
    };
  }
  return {
    hint: "Revert to re-upload and replace the current draft. Locked once the brand starts annotating.",
    lockedHint: "The brand has started annotating — revert upload is no longer available."
  };
}
