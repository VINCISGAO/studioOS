import type { BriefFormState } from "@/components/studioos/brand-campaign-step-brief";
import type { Locale } from "@/lib/i18n";
import type { BrandDeliveryTimelineId } from "@/lib/studioos/brand-campaign-options";
import { resolveBriefAspectRatioValue } from "@/lib/studioos/brand-campaign-options";
import {
  durationSecondsFromBrief,
  durationStartingPriceFromBrief,
  overOneMinuteCoefficient
} from "@/lib/studioos/brand-duration-pricing";
import { formatMoneyRangeFromUsd, parseStoredMoneyRange } from "@/lib/money/display-money";

const TIER_PROFESSIONAL_MULTIPLIER = 1.2;
const TIER_PREMIUM_MULTIPLIER = 1.45;
const TIER_ENTERPRISE_MULTIPLIER = 1.9;

const HEAVY_CG_STYLE_IDS = new Set(["animation", "cartoon", "viral"]);
const BRAND_CINEMATIC_STYLE_IDS = new Set(["luxury", "premium", "fashion"]);
const ADVANCED_CINEMATIC_STYLE_IDS = new Set(["cinematic"]);
const ORDINARY_STYLE_IDS = new Set(["minimal", "lifestyle", "documentary", "humor"]);

const STYLE_QUOTE_UPLIFT = {
  ordinary: 0.05,
  advancedCinematic: 0.1,
  brandCinematic: 0.12,
  hyperReal: 0.12,
  heavyCg: 0.15
} as const;

export function durationSeconds(duration: string, customDuration = "") {
  return durationSecondsFromBrief(duration, customDuration);
}

function roundToMarketStep(amount: number) {
  if (amount < 1000) return Math.round(amount / 25) * 25;
  return Math.round(amount / 50) * 50;
}

function premiumStyleCount(form: Pick<BriefFormState, "creativeStyles">) {
  const styles = Array.isArray(form.creativeStyles) ? form.creativeStyles : [];
  return styles.filter((style) => !ORDINARY_STYLE_IDS.has(style)).length;
}

function styleQuoteMultiplier(form: Pick<BriefFormState, "creativeStyles">) {
  const styles = Array.isArray(form.creativeStyles) ? form.creativeStyles : [];
  let uplift: number = STYLE_QUOTE_UPLIFT.ordinary;

  for (const style of styles) {
    if (HEAVY_CG_STYLE_IDS.has(style)) {
      uplift = Math.max(uplift, STYLE_QUOTE_UPLIFT.heavyCg);
      continue;
    }
    if (BRAND_CINEMATIC_STYLE_IDS.has(style)) {
      uplift = Math.max(uplift, STYLE_QUOTE_UPLIFT.brandCinematic);
      continue;
    }
    if (style === "ai") {
      uplift = Math.max(uplift, STYLE_QUOTE_UPLIFT.hyperReal);
      continue;
    }
    if (ADVANCED_CINEMATIC_STYLE_IDS.has(style)) {
      uplift = Math.max(uplift, STYLE_QUOTE_UPLIFT.advancedCinematic);
      continue;
    }
    if (ORDINARY_STYLE_IDS.has(style)) {
      uplift = Math.max(uplift, STYLE_QUOTE_UPLIFT.ordinary);
    }
  }

  return 1 + uplift;
}

function deliveryTimelineMultiplier(timeline: BrandDeliveryTimelineId) {
  if (timeline === "14plus") return 0.95;
  if (timeline === "7-14") return 1;
  if (timeline === "5-7") return 1.12;
  if (timeline === "3-5") return 1.25;
  if (timeline === "48h") return 1.45;
  if (timeline === "24h") return 1.8;
  return 1;
}

function resolutionSpecMultiplier(form: BriefFormState) {
  return form.resolution === "4K" ? 1.18 : 1;
}

function quantityScale(quantity: number) {
  const count = Math.max(1, Math.round(quantity) || 1);
  const perUnitDiscount =
    count <= 1
      ? 1
      : count === 2
        ? 0.94
        : count === 3
          ? 0.9
          : count <= 5
            ? 0.86 + (0.9 - 0.86) * ((5 - count) / 2)
            : count < 10
              ? 0.8 + (0.86 - 0.8) * ((10 - count) / 5)
              : 0.8;
  return count * perUnitDiscount;
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

function quoteSpecMultiplier(form: BriefFormState) {
  return (
    resolutionSpecMultiplier(form) *
    deliveryTimelineMultiplier(form.deliveryTimeline) *
    styleQuoteMultiplier(form)
  );
}

export function aspectRatioLabelForBrief(form: BriefFormState, locale: Locale) {
  const value = resolveBriefAspectRatioValue(form);
  if (!value) return locale === "zh" ? "未选择" : "Not set";
  return value;
}

export function resolutionLabelForBrief(form: BriefFormState) {
  return form.resolution === "4K" ? "4K" : "1080P";
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
  aspectRatioLabel: string;
  resolutionLabel: string;
  toolCostUsd: number;
  fixedExpenditureAnchorUsd: number;
  riskLevel: string;
  riskTone: string;
  complexity: string;
  rangeUsd: string;
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
  const quantity = Math.max(1, form.videoQuantity || 1);
  const premiumCount = premiumStyleCount(form);
  const seconds = durationSeconds(form.videoDuration, form.videoDurationCustom);
  const durationCoeff = overOneMinuteCoefficient(seconds);
  const shotsAutoEstimated = !(form.estimatedShotCount > 0);
  const estimatedShots = resolveEstimatedShotCount({
    duration: form.videoDuration,
    customDuration: form.videoDurationCustom,
    quantity,
    premiumStyleCount: premiumCount,
    estimatedShotCount: form.estimatedShotCount
  });

  const durationAnchorUsd = durationStartingPriceFromBrief(
    form.videoDuration,
    form.videoDurationCustom
  );
  const starterBase = roundToMarketStep(
    durationAnchorUsd * quoteSpecMultiplier(form) * quantityScale(quantity)
  );
  const professional = roundToMarketStep(starterBase * TIER_PROFESSIONAL_MULTIPLIER);
  const premium = roundToMarketStep(starterBase * TIER_PREMIUM_MULTIPLIER);
  const enterprise = roundToMarketStep(starterBase * TIER_ENTERPRISE_MULTIPLIER);
  const creatorIncome = roundToMarketStep(professional * 0.8);

  const generationMultiplier =
    premiumCount >= 4 ? 4.5 : premiumCount >= 2 ? 3.5 : premiumCount >= 1 ? 2.8 : 2.5;
  const estimatedGenerations = Math.ceil(estimatedShots * generationMultiplier);
  const estimatedHours = Math.ceil(
    estimatedShots * 0.65 + seconds / 18 + quantity * 1.4 + premiumCount * 1.2
  );
  const toolCost = Math.max(45, estimatedGenerations * 6);
  const fixedExpenditureQuoteAnchor = roundToMarketStep(toolCost * 3);

  const low = Math.max(250, roundToMarketStep(starterBase * 0.92));
  const high = Math.max(low + 100, roundToMarketStep(Math.max(professional, starterBase * 1.22)));

  const rushTimeline =
    form.deliveryTimeline === "3-5" ||
    form.deliveryTimeline === "48h" ||
    form.deliveryTimeline === "24h";
  const riskBufferRate = rushTimeline || premiumCount >= 4 ? 0.25 : premiumCount >= 2 ? 0.18 : 0.1;

  const userBudget = parseStoredMoneyRange(form.budgetRange);
  const riskLevel =
    userBudget?.max !== null && userBudget?.max !== undefined && userBudget.max < starterBase
      ? locale === "zh"
        ? "预算不足"
        : "Under budget"
      : userBudget?.min !== undefined && userBudget.min > professional
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
    userBudget?.max !== null && userBudget?.max !== undefined && userBudget.max < starterBase
      ? locale === "zh"
        ? "当前预算低于 Starter 参考价，建议提高预算或调整制作规格"
        : "Current budget is below the Starter reference; increase budget or adjust production specs"
      : userBudget?.min !== undefined && userBudget.min > professional
        ? locale === "zh"
          ? "当前预算充足，可匹配 Premium / Enterprise 级创作者"
          : "Budget is strong enough for Premium or Enterprise creators"
        : locale === "zh"
          ? "当前预算与 Professional 参考价基本匹配"
          : "Current budget broadly matches the Professional reference";

  return {
    range: formatMoneyRangeFromUsd(low, high, locale),
    rangeUsd: formatMoneyRangeFromUsd(low, high, locale, { currency: "USD" }),
    status,
    minimum: starterBase,
    recommended: professional,
    priority: premium,
    topCreator: enterprise,
    creatorIncome,
    estimatedHours,
    estimatedShots,
    shotsAutoEstimated,
    estimatedGenerations,
    durationCoefficient: durationCoeff,
    aspectRatioLabel: aspectRatioLabelForBrief(form, locale),
    resolutionLabel: resolutionLabelForBrief(form),
    toolCostUsd: toolCost,
    fixedExpenditureAnchorUsd: fixedExpenditureQuoteAnchor,
    riskLevel,
    riskTone,
    complexity,
    tiers: [
      {
        key: "starter",
        label: "Starter",
        price: starterBase,
        probability: "58%",
        time: locale === "zh" ? "24–48 小时" : "24–48h",
        description:
          locale === "zh" ? "覆盖核心制作与平台标准交付" : "Core production with platform-standard delivery"
      },
      {
        key: "professional",
        label: "Professional",
        price: professional,
        probability: "80%",
        time: locale === "zh" ? "12–24 小时" : "12–24h",
        description:
          locale === "zh"
            ? "大多数品牌的默认选择，匹配经验创作者"
            : "Default for most brands — experienced creators"
      },
      {
        key: "premium",
        label: "Premium",
        price: premium,
        probability: "92%",
        time: locale === "zh" ? "4–12 小时" : "4–12h",
        description:
          locale === "zh"
            ? "优先触达高评分创作者与高级创意能力"
            : "Priority access to top-rated studios"
      },
      {
        key: "enterprise",
        label: "Enterprise",
        price: enterprise,
        probability: "98%",
        time: locale === "zh" ? "1–6 小时" : "1–6h",
        description:
          locale === "zh"
            ? "顶级创作者、最快响应与最高完成保障"
            : "Top creators, fastest response, highest assurance"
      }
    ]
  };
}
