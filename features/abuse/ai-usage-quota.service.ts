import "server-only";

import { aiUsageQuotaRepository, type RecordAiUsageInput } from "@/features/abuse/ai-usage-quota.repository";
import {
  AI_USAGE_QUOTA_PER_CAMPAIGN,
  AI_USAGE_USER_DAILY_COPILOT,
  aiUsageQuotaErrorMessage,
  type AiUsageCategory,
  type AiUsageQuotaResult
} from "@/lib/studioos/brand-abuse-policy";

function startOfUtcDay() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export const aiUsageQuotaService = {
  async assertCampaignQuota(input: {
    userId: string;
    campaignId?: string | null;
    category: AiUsageCategory;
  }): Promise<AiUsageQuotaResult> {
    if (input.campaignId) {
      const limit = AI_USAGE_QUOTA_PER_CAMPAIGN[input.category];
      const used = await aiUsageQuotaRepository.countForCampaign(input.campaignId, input.category);
      if (used >= limit) {
        return { ok: false, code: "campaign_quota", category: input.category, limit, used };
      }
    }

    if (input.category === "copilot_qa") {
      const dailyUsed = await aiUsageQuotaRepository.countForUser(
        input.userId,
        "copilot_qa",
        startOfUtcDay()
      );
      if (dailyUsed >= AI_USAGE_USER_DAILY_COPILOT) {
        return {
          ok: false,
          code: "user_daily_quota",
          category: input.category,
          limit: AI_USAGE_USER_DAILY_COPILOT,
          used: dailyUsed
        };
      }
    }

    return { ok: true };
  },

  async recordOpenAiUsage(input: RecordAiUsageInput & { charged?: boolean }) {
    if (input.charged === false) return null;
    return aiUsageQuotaRepository.record(input);
  },

  quotaErrorMessage(locale: "en" | "zh", result: Exclude<AiUsageQuotaResult, { ok: true }>) {
    return aiUsageQuotaErrorMessage(locale, result);
  },

  async getUserDailySummary(userId: string) {
    return aiUsageQuotaRepository.summarizeUserDay(userId, startOfUtcDay());
  }
};
