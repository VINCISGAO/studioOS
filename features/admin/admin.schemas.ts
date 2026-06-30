import { z } from "zod";

export const resolveDisputeSchema = z.object({
  status: z.enum(["PROCESSING", "RESOLVED", "CLOSED"]),
  result: z.string().min(1).max(2000)
});

export const openDisputeSchema = z.object({
  reason: z.string().min(10).max(2000)
});

export const featureFlagSchema = z.object({
  key: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9._-]+$/i, "Key must be alphanumeric with dots, dashes, or underscores"),
  enabled: z.boolean(),
  metadata: z.record(z.unknown()).optional()
});

export const auditQuerySchema = z.object({
  campaignId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  action: z.string().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional()
});
