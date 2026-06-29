import { z } from "zod";

export const createCampaignSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  budget: z.number().positive().max(10_000_000),
  currency: z.string().trim().length(3).optional(),
  deadline: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  platform: z.string().trim().max(100).optional(),
  aspect_ratio: z.string().trim().max(20).optional()
});

export const updateCampaignSchema = createCampaignSchema.partial();

export const listCampaignsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export type CreateCampaignBody = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignBody = z.infer<typeof updateCampaignSchema>;
