import { z } from "zod";

export const commissionRuleSchema = z.object({
  name: z.string().optional(),
  clientServiceFeePercentage: z.number().min(0).max(100),
  defaultCreatorCommissionPercentage: z.number().min(0).max(100),
  verifiedCreatorCommissionPercentage: z.number().min(0).max(100),
  upgradeRevenueThreshold: z.number().min(0),
  upgradeModalEnabled: z.boolean().optional(),
  clientServiceFeeEnabled: z.boolean().optional()
});

export const membershipPlanSchema = z.object({
  name: z.string().min(1),
  planType: z.enum(["DEFAULT", "VERIFIED"]),
  annualFee: z.number().min(0),
  creatorCommissionPercentage: z.number().min(0).max(100),
  membershipDurationDays: z.number().int().min(1),
  benefitsJson: z.array(z.string()),
  stripePriceId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional()
});

export const extendMembershipSchema = z.object({
  extraDays: z.number().int().min(1),
  note: z.string().optional()
});

export const refundMembershipSchema = z.object({
  membershipId: z.string().uuid(),
  note: z.string().optional()
});

export const upgradeDeclineSchema = z.object({});

export const stripeCheckoutSchema = z.object({
  successUrl: z.string().url(),
  cancelUrl: z.string().url()
});
