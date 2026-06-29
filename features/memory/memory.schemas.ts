import { z } from "zod";

export const aiPreferenceSchema = z.object({
  preferred_language: z.string().trim().min(2).max(10).optional(),
  always_translate: z.boolean().optional(),
  never_use_emojis: z.boolean().optional(),
  tone: z.enum(["PROFESSIONAL", "LUXURY", "GEN_Z", "CORPORATE", "CASUAL"]).optional()
});

export const manualFactSchema = z.object({
  category: z.string().trim().min(1).max(64),
  key: z.string().trim().min(1).max(128),
  value: z.string().trim().min(1).max(5000)
});
