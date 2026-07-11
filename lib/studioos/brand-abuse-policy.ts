export const BRAND_CAMPAIGN_CREATION_LIMIT_10M = 2;
export const BRAND_CAMPAIGN_CREATION_LIMIT_24H = 5;

export const TEN_MINUTES_MS = 10 * 60 * 1000;
export const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export type AiUsageCategory =
  | "brief_generate"
  | "brief_rewrite"
  | "creative_direction"
  | "copilot_qa";

/** Per-campaign OpenAI call budgets (template fallbacks do not consume). */
export const AI_USAGE_QUOTA_PER_CAMPAIGN: Record<AiUsageCategory, number> = {
  brief_generate: 3,
  brief_rewrite: 10,
  creative_direction: 3,
  copilot_qa: 100
};

/** Extra daily copilot cap per user — limits multi-account abuse at assistant layer. */
export const AI_USAGE_USER_DAILY_COPILOT = 200;

export type AiUsageQuotaViolation = {
  ok: false;
  code: "campaign_quota" | "user_daily_quota";
  category: AiUsageCategory;
  limit: number;
  used: number;
};

export type AiUsageQuotaOk = { ok: true };

export type AiUsageQuotaResult = AiUsageQuotaOk | AiUsageQuotaViolation;

export function aiUsageQuotaErrorMessage(
  locale: "en" | "zh",
  violation: AiUsageQuotaViolation
): string {
  if (locale === "zh") {
    if (violation.code === "user_daily_quota") {
      return "已达到今日 AI 助手使用建议上限，请明天再试或联系平台支持。";
    }
    return "已达到本项目 AI 使用额度。如需继续，请完成当前项目或联系平台支持。";
  }
  if (violation.code === "user_daily_quota") {
    return "You have reached today’s recommended AI assistant limit. Try again tomorrow or contact support.";
  }
  return "This project has reached its AI usage allowance. Finish the current workflow or contact support to continue.";
}
