import { z } from "zod";
import { REVIEWER_V1_ANNOTATION_TYPES } from "@/features/review/reviewer-v1.types";

const annotationTypeSchema = z.enum(REVIEWER_V1_ANNOTATION_TYPES);

export const reviewAnnotationInputSchema = z.object({
  type: annotationTypeSchema,
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
  color: z.string().optional(),
  strokeWidth: z.number().int().min(1).max(24).optional(),
  dataJson: z.unknown().optional()
});

export const createReviewCommentSchema = z.object({
  time_seconds: z.number().min(0).max(86400),
  comment: z.string().trim().min(1).max(5000),
  annotation: reviewAnnotationInputSchema.optional(),
  annotations: z.array(reviewAnnotationInputSchema).max(32).optional()
});

export type CreateReviewCommentBody = z.infer<typeof createReviewCommentSchema>;
