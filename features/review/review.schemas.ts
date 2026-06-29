import { z } from "zod";

export const createReviewCommentSchema = z.object({
  time_seconds: z.number().min(0).max(86400),
  comment: z.string().trim().min(1).max(5000),
  annotation: z
    .object({
      type: z.enum(["CIRCLE", "RECTANGLE", "ARROW", "POINT"]),
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
      width: z.number().min(0).max(1),
      height: z.number().min(0).max(1),
      color: z.string().optional()
    })
    .optional()
});

export type CreateReviewCommentBody = z.infer<typeof createReviewCommentSchema>;
