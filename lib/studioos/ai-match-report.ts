import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import { parseBudgetMidpoint } from "@/lib/studioos/brand-checkout-utils";
import {
  declineReasonCopy,
  type CreatorInvitationDeclineReason
} from "@/features/matching/invitation-decline-feedback";
import type { Locale } from "@/lib/i18n";

const BUDGET_SCORE_POLICY = {
  excellent: 85,
  normal: 65,
  low: 45,
  minimum: 18,
  acceptanceLift: 56
} as const;

export type AiMatchReportReason = {
  reason: CreatorInvitationDeclineReason;
  label: string;
  count: number;
  percent: number;
};

export type AiMatchReport = {
  invitedCount: number;
  respondedCount: number;
  acceptedCount: number;
  declinedCount: number;
  responseRate: number;
  acceptanceRate: number;
  projectedAcceptanceRate: number;
  budgetScore: number;
  budgetLevel: "excellent" | "normal" | "low";
  marketBelowPercent: number;
  currentBudget: number;
  suggestedBudget: number;
  reasons: AiMatchReportReason[];
  recommendations: string[];
  expanding: boolean;
};

export type AiMatchReportStatistics = {
  declineReasonCounts: Partial<Record<CreatorInvitationDeclineReason, number>>;
  declinedCount: number;
  suggestedBudgetUsd: number | null;
  learningDeclineCount: number;
};

export function buildAiMatchReport(input: {
  invitations: StoredCreatorInvitation[];
  projectBudgetRange?: string | null;
  locale: Locale;
  statistics?: AiMatchReportStatistics | null;
}): AiMatchReport | null {
  if (!input.invitations.length) return null;

  const currentBudget = parseBudgetMidpoint(input.projectBudgetRange ?? "");
  const responded = input.invitations.filter((item) => ["accepted", "declined"].includes(item.status));
  const accepted = input.invitations.filter((item) => item.status === "accepted");
  const declined = input.invitations.filter((item) => item.status === "declined");
  const observedReasonCounts = countDeclineReasons(declined);
  const reasonCounts = mergeReasonCounts(observedReasonCounts, input.statistics?.declineReasonCounts);
  const budgetTargets = [
    ...declined
      .map((item) => resolveBudgetTarget(item))
      .filter((value): value is number => typeof value === "number" && value > currentBudget),
    input.statistics?.suggestedBudgetUsd && input.statistics.suggestedBudgetUsd > currentBudget
      ? input.statistics.suggestedBudgetUsd
      : null
  ].filter((value): value is number => typeof value === "number");
  const declinedCount = Math.max(declined.length, input.statistics?.declinedCount ?? 0);
  const budgetRejects = reasonCounts.BUDGET_TOO_LOW ?? 0;
  const suggestedBudget = resolveSuggestedBudget(currentBudget, budgetTargets, budgetRejects);
  const budgetScore = scoreBudget(currentBudget, suggestedBudget, declinedCount, budgetRejects);
  const acceptanceRate = percent(accepted.length, responded.length || input.invitations.length);
  const projectedAcceptanceRate = Math.min(92, acceptanceRate + projectedLift(budgetScore, reasonCounts));

  return {
    invitedCount: input.invitations.length,
    respondedCount: responded.length,
    acceptedCount: accepted.length,
    declinedCount,
    responseRate: percent(responded.length, input.invitations.length),
    acceptanceRate,
    projectedAcceptanceRate,
    budgetScore,
    budgetLevel: budgetScore >= BUDGET_SCORE_POLICY.excellent ? "excellent" : budgetScore >= BUDGET_SCORE_POLICY.normal ? "normal" : "low",
    marketBelowPercent: Math.max(0, Math.min(95, 100 - budgetScore)),
    currentBudget,
    suggestedBudget,
    reasons: Object.entries(reasonCounts)
      .map(([reason, count]) => ({
        reason: reason as CreatorInvitationDeclineReason,
        label: declineReasonCopy[input.locale][reason as CreatorInvitationDeclineReason],
        count,
        percent: percent(count, declinedCount)
      }))
      .sort((a, b) => b.count - a.count),
    recommendations: buildRecommendations(input.locale, reasonCounts, suggestedBudget),
    expanding: accepted.length === 0 && responded.length >= Math.min(3, input.invitations.length)
  };
}

function mergeReasonCounts(
  observed: Partial<Record<CreatorInvitationDeclineReason, number>>,
  learned?: Partial<Record<CreatorInvitationDeclineReason, number>>
) {
  const merged = { ...observed };
  for (const [reason, count] of Object.entries(learned ?? {})) {
    const key = reason as CreatorInvitationDeclineReason;
    merged[key] = Math.max(merged[key] ?? 0, count ?? 0);
  }
  return merged;
}

function countDeclineReasons(invitations: StoredCreatorInvitation[]) {
  const counts: Partial<Record<CreatorInvitationDeclineReason, number>> = {};
  for (const invitation of invitations) {
    const reason = invitation.declineFeedback?.reason;
    if (!reason) continue;
    counts[reason] = (counts[reason] ?? 0) + 1;
  }
  return counts;
}

function resolveBudgetTarget(invitation: StoredCreatorInvitation) {
  const feedback = invitation.declineFeedback;
  if (!feedback || feedback.reason !== "BUDGET_TOO_LOW") return null;
  if (feedback.budgetThreshold === "custom") return feedback.customBudgetUsd ?? null;
  return Number(feedback.budgetThreshold);
}

function resolveSuggestedBudget(currentBudget: number, targets: number[], budgetRejects: number) {
  if (targets.length > 0) {
    const average = targets.reduce((sum, value) => sum + value, 0) / targets.length;
    return Math.ceil(average / 50) * 50;
  }
  if (budgetRejects > 0) return Math.ceil((currentBudget * 1.8) / 50) * 50;
  return currentBudget;
}

function scoreBudget(currentBudget: number, suggestedBudget: number, declinedCount: number, budgetRejects: number) {
  if (suggestedBudget <= currentBudget && budgetRejects === 0) return 88;
  const ratio = suggestedBudget > 0 ? currentBudget / suggestedBudget : 1;
  const reasonPenalty = declinedCount > 0 ? (budgetRejects / declinedCount) * 35 : 0;
  return Math.max(BUDGET_SCORE_POLICY.minimum, Math.round(ratio * 100 - reasonPenalty));
}

function projectedLift(
  budgetScore: number,
  reasonCounts: Partial<Record<CreatorInvitationDeclineReason, number>>
) {
  const briefPenalty = reasonCounts.BRIEF_INSUFFICIENT ? 10 : 0;
  const deadlinePenalty = reasonCounts.DEADLINE_TOO_TIGHT ? 8 : 0;
  return Math.max(12, BUDGET_SCORE_POLICY.acceptanceLift - Math.round(budgetScore / 3) - briefPenalty - deadlinePenalty);
}

function buildRecommendations(
  locale: Locale,
  reasonCounts: Partial<Record<CreatorInvitationDeclineReason, number>>,
  suggestedBudget: number
) {
  const zh = locale === "zh";
  const items: string[] = [];
  if (reasonCounts.BUDGET_TOO_LOW) items.push(zh ? `提高预算至 $${suggestedBudget}` : `Increase budget to $${suggestedBudget}`);
  if (reasonCounts.BRIEF_INSUFFICIENT) items.push(zh ? "补充产品素材、参考案例与交付标准" : "Add product assets, references, and delivery standards");
  if (reasonCounts.DEADLINE_TOO_TIGHT) items.push(zh ? "放宽交付时间至少 2 天" : "Extend delivery time by at least 2 days");
  if (reasonCounts.SCHEDULE_CONFLICT) items.push(zh ? "扩大匹配范围，邀请更多有档期 Creator" : "Expand matching to creators with better availability");
  return items.length ? items : [zh ? "继续观察 Creator 回复" : "Keep monitoring creator responses"];
}

function percent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}
