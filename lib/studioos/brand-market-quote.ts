import type { BriefFormState } from "@/components/studioos/brand-campaign-step-brief";
import type { Locale } from "@/lib/i18n";
import {
  DURATION_QUOTE_WEIGHT,
  durationBasePriceUsd,
  durationPriceCoefficient,
  durationSecondsFromBrief
} from "@/lib/studioos/brand-duration-pricing";
import { formatMoneyRangeFromUsd, parseStoredMoneyRange } from "@/lib/money/display-money";

const PREMIUM_STYLE_IDS = new Set([
  "cinematic",
  "luxury",
  "premium",
  "fashion",
  "animation",
  "cartoon",
  "ai",
  "viral"
]);

export function durationSeconds(duration: string, customDuration = "") {
  return durationSecondsFromBrief(duration, customDuration);
}

function roundToMarketStep(amount: number) {
  if (amount < 1000) return Math.round(amount / 25) * 25;
  return Math.round(amount / 50) * 50;
}

function premiumStyleCount(form: Pick<BriefFormState, "creativeStyles">) {
  const styles = Array.isArray(form.creativeStyles) ? form.creativeStyles : [];
  return styles.filter((style) => PREMIUM_STYLE_IDS.has(style)).length;
}

function averageShotSeconds(premiumCount: number) {
  if (premiumCount >= 3) return 3;
  if (premiumCount >= 1) return 4;
  return 5;
}

/** 0 = auto-infer from duration; otherwise use brand-provided shot count. */
export function resolveEstimatedShotCount(input: {
  duration: string;
  customDuration?: string;
  quantity: number;
  premiumStyleCount: number;
  estimatedShotCount?: number;
}) {
  const explicit = Math.round(input.estimatedShotCount ?? 0);
  if (explicit > 0) {
    return Math.min(200, Math.max(1, explicit));
  }
  const seconds = durationSeconds(input.duration, input.customDuration);
  const avgShot = averageShotSeconds(input.premiumStyleCount);
  const raw = Math.ceil((seconds / avgShot) * input.quantity);
  if (seconds <= 15) return Math.max(2, Math.min(4, raw));
  if (seconds <= 30) return Math.max(3, raw);
  return Math.max(3, raw);
}

/** Spec bumps (4K, rush, etc.) only partially flow into brand-visible quote. */
const QUOTE_SPEC_MULTIPLIER_BLEND = 0.45;

/** Shot/labor model nudges quote at most this share vs duration anchor (short-form). */
const SHOT_COST_QUOTE_BLEND = 0.12;

/** Short clips stay duration-led; long-form gradually shifts to shot/labor cost. */
const SHOT_QUOTE_BLEND_MIN = 0.1;
const SHOT_QUOTE_BLEND_MAX = 0.58;
const SHOT_QUOTE_BLEND_FULL_SECONDS = 240;

function shotQuoteBlendRatio(seconds: number) {
  if (seconds <= 15) return SHOT_QUOTE_BLEND_MIN;
  if (seconds >= SHOT_QUOTE_BLEND_FULL_SECONDS) return SHOT_QUOTE_BLEND_MAX;
  const progress =
    (seconds - 15) / (SHOT_QUOTE_BLEND_FULL_SECONDS - 15);
  const eased = progress * progress;
  return SHOT_QUOTE_BLEND_MIN + (SHOT_QUOTE_BLEND_MAX - SHOT_QUOTE_BLEND_MIN) * eased;
}

function quoteSpecMultiplier(rawMultiplier: number) {
  return 1 + (rawMultiplier - 1) * QUOTE_SPEC_MULTIPLIER_BLEND;
}

function shotCostNudgeUsd(shotDrivenProductionCost: number, durationMarketUsd: number) {
  return Math.min(
    shotDrivenProductionCost * SHOT_COST_QUOTE_BLEND,
    durationMarketUsd * 0.35
  );
}

function productionComplexityMultiplier(form: BriefFormState) {
  let multiplier = 1;

  if (form.deliveryTimeline === "3-5") multiplier += 0.25;
  if (form.deliveryTimeline === "5-7") multiplier += 0.12;
  if (form.deliveryTimeline === "14plus") multiplier -= 0.08;

  if (form.aspectRatio === "16:9") multiplier += 0.1;
  if (form.aspectRatio === "4:5") multiplier += 0.05;
  if (form.aspectRatio === "1:1") multiplier -= 0.05;

  if (form.resolution === "4K") multiplier += 0.2;
  if (form.resolution === "720p") multiplier -= 0.12;
  if (form.frameRate === "60 fps") multiplier += 0.1;
  if (form.frameRate === "24 fps") multiplier += 0.04;

  const premiumCount = premiumStyleCount(form);
  multiplier += Math.min(0.3, premiumCount * 0.06);
  return { multiplier, premiumCount };
}

export type MarketQuoteResult = {
  range: string;
  status: string;
  minimum: number;
  recommended: number;
  priority: number;
  topCreator: number;
  creatorIncome: number;
  estimatedHours: number;
  estimatedShots: number;
  shotsAutoEstimated: boolean;
  estimatedGenerations: number;
  durationCoefficient: number;
  riskLevel: string;
  riskTone: string;
  complexity: string;
  tiers: Array<{
    key: string;
    label: string;
    price: number;
    probability: string;
    time: string;
    description: string;
  }>;
};

export function marketQuoteForBrief(form: BriefFormState, locale: Locale): MarketQuoteResult {
  const { multiplier, premiumCount } = productionComplexityMultiplier(form);
  const quantity = Math.max(1, form.videoQuantity || 1);
  const quantityDiscount = quantity >= 4 ? 0.82 : quantity >= 2 ? 0.9 : 1;
  const seconds = durationSeconds(form.videoDuration, form.videoDurationCustom);
  const durationCoeff = durationPriceCoefficient(seconds);
  const shotsAutoEstimated = !(form.estimatedShotCount > 0);
  const estimatedShots = resolveEstimatedShotCount({
    duration: form.videoDuration,
    customDuration: form.videoDurationCustom,
    quantity,
    premiumStyleCount: premiumCount,
    estimatedShotCount: form.estimatedShotCount
  });

  const generationMultiplier =
    premiumCount >= 4 ? 4.5 : premiumCount >= 2 ? 3.5 : premiumCount >= 1 ? 2.8 : 2.5;
  const estimatedGenerations = Math.ceil(estimatedShots * generationMultiplier);
  const estimatedHours = Math.ceil(
    estimatedShots * 0.65 +
      seconds / 18 +
      quantity * 1.4 +
      premiumCount * 1.2 +
      (form.deliveryTimeline === "3-5" ? 3 : 0)
  );

  const toolCost = Math.max(45, estimatedGenerations * 6);
  const laborCost = estimatedHours * 40;
  const revisionReserve = (toolCost + laborCost) * (premiumCount >= 3 ? 0.22 : 0.15);
  const riskBufferRate =
    form.deliveryTimeline === "3-5" || premiumCount >= 4 ? 0.25 : premiumCount >= 2 ? 0.18 : 0.1;
  const shotDrivenProductionCost =
    (toolCost + laborCost + revisionReserve + (toolCost + laborCost) * riskBufferRate) *
    multiplier *
    quantityDiscount;

  const durationUplift = 1 + (durationCoeff - 1) * DURATION_QUOTE_WEIGHT;
  const durationMarketUsd =
    durationBasePriceUsd(form.videoDuration, form.videoDurationCustom) *
    quoteSpecMultiplier(multiplier) *
    quantityDiscount;
  const shotNudgeUsd = shotCostNudgeUsd(shotDrivenProductionCost, durationMarketUsd);
  const durationLedCreatorIncome =
    (durationMarketUsd + shotNudgeUsd) * 1.35 * durationUplift;
  const shotLedCreatorIncome = shotDrivenProductionCost * 1.35;
  const shotBlend = shotQuoteBlendRatio(seconds);
  const creatorIncome = roundToMarketStep(
    durationLedCreatorIncome * (1 - shotBlend) + shotLedCreatorIncome * shotBlend
  );
  const platformDeductionRate = 0.17;
  const brandMinimum = roundToMarketStep(creatorIncome / (1 - platformDeductionRate));
  const recommended = roundToMarketStep(brandMinimum * 1.16);
  const priority = roundToMarketStep(brandMinimum * 1.38);
  const topCreator = roundToMarketStep(brandMinimum * 1.75);
  const durationFloor = roundToMarketStep(durationBasePriceUsd(form.videoDuration, form.videoDurationCustom));
  const low = Math.max(200, roundToMarketStep(Math.max(brandMinimum * 0.88, durationFloor)));
  const high = Math.max(low + 100, roundToMarketStep(Math.max(recommended, brandMinimum * 1.2)));

  const userBudget = parseStoredMoneyRange(form.budgetRange);
  const riskLevel =
    userBudget?.max !== null && userBudget?.max !== undefined && userBudget.max < brandMinimum
      ? locale === "zh"
        ? "预算不足"
        : "Under budget"
      : userBudget?.min !== undefined && userBudget.min > recommended
        ? locale === "zh"
          ? "低风险"
          : "Low risk"
        : riskBufferRate >= 0.25
          ? locale === "zh"
            ? "较高"
            : "Elevated"
          : locale === "zh"
            ? "标准"
            : "Standard";
  const riskTone =
    riskLevel === "预算不足" || riskLevel === "Under budget"
      ? "danger"
      : riskLevel === "低风险" || riskLevel === "Low risk"
        ? "low"
        : riskLevel === "较高" || riskLevel === "Elevated"
          ? "elevated"
          : "standard";
  const complexity =
    generationMultiplier >= 4
      ? locale === "zh"
        ? "高难"
        : "Advanced"
      : generationMultiplier >= 3
        ? locale === "zh"
          ? "较难"
          : "Complex"
        : locale === "zh"
          ? "标准"
          : "Standard";
  const status =
    userBudget?.max !== null && userBudget?.max !== undefined && userBudget.max < brandMinimum
      ? locale === "zh"
        ? "当前预算低于最低可执行价，建议提高预算或调整制作规格"
        : "Current budget is below the reference quote; increase budget or adjust production specs"
      : userBudget?.min !== undefined && userBudget.min > recommended
        ? locale === "zh"
          ? "当前预算充足，可匹配更高质量创作者"
          : "Budget is strong enough for higher-tier creators"
        : locale === "zh"
          ? "当前预算与参考报价基本匹配"
          : "Current budget broadly matches the reference quote";

  return {
    range: formatMoneyRangeFromUsd(low, high, locale),
    status,
    minimum: brandMinimum,
    recommended,
    priority,
    topCreator,
    creatorIncome,
    estimatedHours,
    estimatedShots,
    shotsAutoEstimated,
    estimatedGenerations,
    durationCoefficient: durationCoeff,
    riskLevel,
    riskTone,
    complexity,
    tiers: [
      {
        key: "base",
        label: locale === "zh" ? "基础匹配" : "Base match",
        price: brandMinimum,
        probability: "60%",
        time: locale === "zh" ? "24–48 小时" : "24–48h",
        description: locale === "zh" ? "覆盖基本制作标准" : "Covers basic production standards"
      },
      {
        key: "recommended",
        label: locale === "zh" ? "推荐匹配" : "Recommended",
        price: recommended,
        probability: "82%",
        time: locale === "zh" ? "6–18 小时" : "6–18h",
        description: locale === "zh" ? "更多专业创作者可见" : "Visible to more qualified creators"
      },
      {
        key: "priority",
        label: locale === "zh" ? "优先匹配" : "Priority",
        price: priority,
        probability: "94%",
        time: locale === "zh" ? "1–6 小时" : "1–6h",
        description: locale === "zh" ? "优先推荐给高评分创作者" : "Prioritized for high-rated creators"
      },
      {
        key: "top",
        label: locale === "zh" ? "顶级创作者" : "Top creators",
        price: topCreator,
        probability: "98%",
        time: locale === "zh" ? "最快响应" : "Fastest",
        description: locale === "zh" ? "匹配优秀 Studio 和强创意能力" : "Best studios and creative capability"
      }
    ]
  };
}
