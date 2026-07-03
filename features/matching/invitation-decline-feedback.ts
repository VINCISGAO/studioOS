import { z } from "zod";

export const declineReasonValues = [
  "BUDGET_TOO_LOW",
  "SCHEDULE_CONFLICT",
  "NOT_MY_CATEGORY",
  "BRIEF_INSUFFICIENT",
  "DEADLINE_TOO_TIGHT",
  "BRAND_RISK"
] as const;

export type CreatorInvitationDeclineReason = (typeof declineReasonValues)[number];

export const declineReasonCopy = {
  en: {
    BUDGET_TOO_LOW: "Budget is too low",
    SCHEDULE_CONFLICT: "Schedule does not fit",
    NOT_MY_CATEGORY: "Not my category",
    BRIEF_INSUFFICIENT: "Brief lacks information",
    DEADLINE_TOO_TIGHT: "Deadline is too tight",
    BRAND_RISK: "Brand risk"
  },
  zh: {
    BUDGET_TOO_LOW: "预算太低",
    SCHEDULE_CONFLICT: "档期不合适",
    NOT_MY_CATEGORY: "不擅长此类型",
    BRIEF_INSUFFICIENT: "Brief 信息不足",
    DEADLINE_TOO_TIGHT: "交付时间太紧",
    BRAND_RISK: "品牌风险"
  }
} as const;

export const budgetThresholdValues = ["300", "500", "800", "1000", "custom"] as const;
export const availabilityValues = ["one_week", "two_weeks", "one_month", "unknown"] as const;
export const briefMissingValues = [
  "product_intro",
  "reference_cases",
  "production_requirements",
  "product_assets",
  "delivery_standard",
  "other"
] as const;
export const categoryMismatchValues = ["product_type", "platform", "production_method", "other"] as const;
export const deadlineExtensionValues = ["two_days", "one_week", "not_possible"] as const;
export const brandRiskValues = ["industry", "legal", "content", "private"] as const;

const optionalTrimmedText = z
  .string()
  .trim()
  .max(240)
  .optional()
  .transform((value) => value || undefined);

export const invitationDeclineFeedbackSchema = z
  .object({
    reason: z.enum(declineReasonValues),
    budgetThreshold: z.enum(budgetThresholdValues).optional(),
    customBudgetUsd: z.coerce.number().positive().max(1_000_000).optional(),
    availability: z.enum(availabilityValues).optional(),
    briefMissing: z.array(z.enum(briefMissingValues)).default([]),
    categoryMismatch: z.enum(categoryMismatchValues).optional(),
    deadlineExtension: z.enum(deadlineExtensionValues).optional(),
    brandRisk: z.enum(brandRiskValues).optional(),
    note: optionalTrimmedText
  })
  .superRefine((value, ctx) => {
    if (value.reason === "BUDGET_TOO_LOW" && !value.budgetThreshold) {
      ctx.addIssue({ code: "custom", path: ["budgetThreshold"], message: "Budget threshold is required" });
    }
    if (value.budgetThreshold === "custom" && !value.customBudgetUsd) {
      ctx.addIssue({ code: "custom", path: ["customBudgetUsd"], message: "Custom budget is required" });
    }
    if (value.reason === "SCHEDULE_CONFLICT" && !value.availability) {
      ctx.addIssue({ code: "custom", path: ["availability"], message: "Availability is required" });
    }
    if (value.reason === "BRIEF_INSUFFICIENT" && value.briefMissing.length === 0) {
      ctx.addIssue({ code: "custom", path: ["briefMissing"], message: "Brief missing items are required" });
    }
    if (value.reason === "NOT_MY_CATEGORY" && !value.categoryMismatch) {
      ctx.addIssue({ code: "custom", path: ["categoryMismatch"], message: "Category detail is required" });
    }
    if (value.reason === "DEADLINE_TOO_TIGHT" && !value.deadlineExtension) {
      ctx.addIssue({ code: "custom", path: ["deadlineExtension"], message: "Deadline detail is required" });
    }
    if (value.reason === "BRAND_RISK" && !value.brandRisk) {
      ctx.addIssue({ code: "custom", path: ["brandRisk"], message: "Brand risk detail is required" });
    }
  });

export type InvitationDeclineFeedback = z.infer<typeof invitationDeclineFeedbackSchema>;

export function parseInvitationDeclineFeedback(input: unknown) {
  return invitationDeclineFeedbackSchema.safeParse(input);
}

export function invitationDeclineFeedbackFromFormData(formData: FormData) {
  return parseInvitationDeclineFeedback({
    reason: String(formData.get("decline_reason") ?? ""),
    budgetThreshold: optionalFormValue(formData, "budget_threshold"),
    customBudgetUsd: optionalFormValue(formData, "custom_budget_usd"),
    availability: optionalFormValue(formData, "availability"),
    briefMissing: formData.getAll("brief_missing").map(String).filter(Boolean),
    categoryMismatch: optionalFormValue(formData, "category_mismatch"),
    deadlineExtension: optionalFormValue(formData, "deadline_extension"),
    brandRisk: optionalFormValue(formData, "brand_risk"),
    note: optionalFormValue(formData, "decline_note")
  });
}

function optionalFormValue(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || undefined;
}
