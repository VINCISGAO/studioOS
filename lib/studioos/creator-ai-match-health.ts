import type { Locale } from "@/lib/i18n";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { withLocale } from "@/lib/i18n";

type CreatorAiMatchInvitation = {
  status: string;
  declineFeedback?: {
    reason?: string;
  };
};

export type CreatorAiMatchHealth = {
  accuracyPercent: number;
  stars: number;
  totalResponses: number;
  budgetDeclines: number;
  showBudgetPreferencePrompt: boolean;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
};

export function buildCreatorAiMatchHealth(input: {
  locale: Locale;
  invitations: CreatorAiMatchInvitation[];
}): CreatorAiMatchHealth {
  const responded = input.invitations.filter((item) =>
    ["accepted", "declined", "expired", "selected"].includes(item.status)
  );
  const positive = input.invitations.filter((item) => ["accepted", "selected"].includes(item.status));
  const budgetDeclines = input.invitations.filter(
    (item) => "declineFeedback" in item && item.declineFeedback?.reason === "BUDGET_TOO_LOW"
  ).length;
  const accuracyPercent = responded.length
    ? Math.max(35, Math.round((positive.length / responded.length) * 100))
    : 92;
  const showBudgetPreferencePrompt = budgetDeclines >= 2;
  const zh = input.locale === "zh";

  return {
    accuracyPercent,
    stars: Math.max(1, Math.round(accuracyPercent / 20)),
    totalResponses: responded.length,
    budgetDeclines,
    showBudgetPreferencePrompt,
    title: zh ? "AI 推荐准确率" : "AI Match Accuracy",
    body: showBudgetPreferencePrompt
      ? zh
        ? "你近期多次因预算原因拒绝项目，建议设置最低接单预算，AI 将减少不符合预期的邀请。"
        : "You recently declined multiple projects for budget reasons. Set your minimum budget so AI sends fewer low-fit invitations."
      : zh
        ? "最近 30 天，你收到的大多数项目与你的偏好一致。"
        : "Most recent invitations match your preferences.",
    ctaLabel: showBudgetPreferencePrompt ? (zh ? "去设置最低预算" : "Set minimum budget") : (zh ? "查看邀请" : "View invitations"),
    ctaHref: withLocale(showBudgetPreferencePrompt ? creatorPortalRoutes.settings : creatorPortalRoutes.invitations, input.locale)
  };
}
