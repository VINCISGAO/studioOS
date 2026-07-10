export function parseBudgetMidpoint(budget?: string | null): number {
  if (!budget?.trim()) return 1000;
  const numbers =
    budget.match(/[\d,]+(?:\.\d+)?/g)?.map((value) => Number.parseFloat(value.replace(/,/g, ""))) ?? [];
  if (numbers.length >= 2) {
    return Math.round((numbers[0] + numbers[1]) / 2);
  }
  if (numbers.length === 1) {
    return numbers[0];
  }
  return 1000;
}

export function deliveryDaysFromDeadline(deadline?: string | null): number {
  if (!deadline) return 7;
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  return Math.max(5, Math.min(days, 21));
}

/** Placeholder creator on campaign escrow orders — replaced when brand picks a Studio. */
export const CAMPAIGN_PENDING_CREATOR_ID = "pending_match";

export function isResolvableCampaignCreatorId(
  creatorId: string | null | undefined
): creatorId is string {
  return Boolean(creatorId && creatorId !== CAMPAIGN_PENDING_CREATOR_ID);
}

export function buildQuoteSummary(input: {
  title: string;
  videoCount?: number | null;
  targetPlatform?: string | null;
  locale: "en" | "zh";
}): string {
  const count = input.videoCount ?? 1;
  if (input.locale === "zh") {
    return `${input.title} — ${count} 支视频 · ${input.targetPlatform || "多平台"}`;
  }
  return `${input.title} — ${count} video${count > 1 ? "s" : ""} · ${input.targetPlatform || "multi-platform"}`;
}
