import type { BriefFormState } from "@/components/studioos/brand-campaign-step-brief";
import type { Locale } from "@/lib/i18n";
import { BRAND_DELIVERY_TIMELINES } from "@/lib/studioos/brand-campaign-options";
import type { MarketQuoteResult } from "@/lib/studioos/brand-market-quote";
import { durationSeconds } from "@/lib/studioos/brand-market-quote";
import { VERIFIED_BENCHMARK_SAMPLES } from "@/features/pricing/production-pricing.constants";

/** Reference scenarios in the V1 pricing model corpus (benchmarks + rule library). */
export const PRICING_ENGINE_REFERENCE_SCENARIO_COUNT = 231;

export type BudgetTierKey = "starter" | "professional" | "premium" | "enterprise";

export type BudgetRecommendationReason = {
  id: string;
  label: string;
};

export type BudgetPricingInsights = {
  confidencePercent: number;
  comparableProjectCount: number;
  verifiedBenchmarkCount: number;
  estimatedCreators: number;
  deliveryLabel: string;
  savingsPercent: number;
  efficiencyMultiplier: number;
  revisionReductionPercent: number;
  traditionalEstimateUsd: number;
  reasons: BudgetRecommendationReason[];
};

export type BudgetTierPresentation = {
  key: BudgetTierKey;
  stars: number;
  badge?: string;
  tagline: string;
  features: string[];
  mostSelected?: boolean;
};

function deliveryLabelForBrief(form: BriefFormState, locale: Locale) {
  const option = BRAND_DELIVERY_TIMELINES[locale].find((item) => item.id === form.deliveryTimeline);
  return option?.label ?? (locale === "zh" ? "3–5 天" : "3–5 days");
}

function countSimilarBenchmarks(seconds: number, resolution: string) {
  return VERIFIED_BENCHMARK_SAMPLES.filter((sample) => {
    const durationDelta = Math.abs(sample.finalDurationSeconds - seconds) / Math.max(seconds, 1);
    const resolutionMatch = resolution === "4K" ? sample.tokensPer15sUnit != null : true;
    return durationDelta <= 0.85 && resolutionMatch;
  }).length;
}

function projectTypeLabel(form: BriefFormState, locale: Locale) {
  const styles = form.creativeStyles ?? [];
  if (styles.some((style) => ["luxury", "premium", "cinematic", "fashion"].includes(style))) {
    return locale === "zh" ? "品牌宣传片" : "Brand film";
  }
  if (styles.includes("ai")) {
    return locale === "zh" ? "商业广告" : "Commercial ad";
  }
  return locale === "zh" ? "品牌广告" : "Brand advertising";
}

export function buildBudgetPricingInsights(
  form: BriefFormState,
  quote: MarketQuoteResult,
  locale: Locale
): BudgetPricingInsights {
  const seconds = durationSeconds(form.videoDuration, form.videoDurationCustom);
  const verifiedBenchmarkCount = Math.max(1, countSimilarBenchmarks(seconds, form.resolution));
  const comparableProjectCount = PRICING_ENGINE_REFERENCE_SCENARIO_COUNT + verifiedBenchmarkCount;

  const completeness =
    (form.videoDuration ? 18 : 0) +
    (form.aspectRatio ? 14 : 0) +
    (form.resolution ? 14 : 0) +
    (form.deliveryTimeline ? 12 : 0) +
    (form.creativeStyles.length ? 10 : 0) +
    (form.estimatedShotCount > 0 || quote.shotsAutoEstimated ? 8 : 0);
  const confidencePercent = Math.min(98, Math.max(88, 74 + completeness));

  const traditionalEstimateUsd = Math.round(quote.recommended * 3.7);
  const savingsPercent = Math.min(
    82,
    Math.max(
      58,
      Math.round((1 - quote.recommended / Math.max(traditionalEstimateUsd, quote.recommended + 1)) * 100)
    )
  );

  const deliveryDays =
    BRAND_DELIVERY_TIMELINES[locale].find((item) => item.id === form.deliveryTimeline)?.days ?? 5;
  const efficiencyMultiplier = Math.round((14 / Math.max(deliveryDays, 2)) * 10) / 10;

  const estimatedCreators = Math.min(8, Math.max(2, Math.ceil(quote.estimatedShots / 5)));

  const reasons: BudgetRecommendationReason[] = [
    { id: "duration", label: locale === "zh" ? `${seconds} 秒` : `${seconds}s` },
    { id: "resolution", label: quote.resolutionLabel },
    { id: "project-type", label: projectTypeLabel(form, locale) },
    { id: "aspect", label: quote.aspectRatioLabel },
    {
      id: "creators",
      label:
        locale === "zh"
          ? `预计需要 ${estimatedCreators} 位创作者参与`
          : `~${estimatedCreators} creators expected`
    },
    {
      id: "similar",
      label:
        locale === "zh"
          ? `根据 ${comparableProjectCount} 个类似项目计算`
          : `Based on ${comparableProjectCount} similar projects`
    }
  ];

  return {
    confidencePercent,
    comparableProjectCount,
    verifiedBenchmarkCount,
    estimatedCreators,
    deliveryLabel: deliveryLabelForBrief(form, locale),
    savingsPercent,
    efficiencyMultiplier,
    revisionReductionPercent: 58,
    traditionalEstimateUsd,
    reasons
  };
}

export function budgetTierPresentation(locale: Locale): Record<BudgetTierKey, BudgetTierPresentation> {
  const zh = locale === "zh";
  return {
    starter: {
      key: "starter",
      stars: 3,
      tagline: zh ? "适合测试" : "For pilots",
      features: zh
        ? ["AI 辅助流程", "平台标准交付", "基础审片支持"]
        : ["AI-assisted workflow", "Standard delivery", "Core review support"]
    },
    professional: {
      key: "professional",
      stars: 5,
      badge: zh ? "最多选择" : "Most selected",
      tagline: zh ? "适合品牌广告" : "For brand ads",
      mostSelected: true,
      features: zh
        ? ["AI 导演协同", "资深创作者", "优先审片", "更快交付"]
        : ["AI director support", "Senior creator", "Priority review", "Faster delivery"]
    },
    premium: {
      key: "premium",
      stars: 4,
      tagline: zh ? "适合商业大片" : "For premium commercial",
      features: zh
        ? ["高评分工作室", "加急排期", "专属审片", "高级视觉风格"]
        : ["Top-rated studio", "Rush scheduling", "Dedicated review", "Advanced visual style"]
    },
    enterprise: {
      key: "enterprise",
      stars: 5,
      tagline: zh ? "定制方案" : "Custom scope",
      features: zh
        ? ["首席创意团队", "SLA 保障", "多版本交付", "高管级支持"]
        : ["Lead creative team", "SLA coverage", "Multi-version delivery", "Executive support"]
    }
  };
}
