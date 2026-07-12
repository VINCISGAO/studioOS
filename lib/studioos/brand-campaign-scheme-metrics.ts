import type { CreativeDirection } from "@/features/ai/creative-direction.types";
import type { Locale } from "@/lib/i18n";

export type SchemeRadarScores = {
  appeal: number;
  resonance: number;
  memorability: number;
  conversion: number;
  difficulty: number;
};

export type SchemeDisplayMetrics = {
  label: string;
  recommended: boolean;
  audienceMatch: number;
  emotionalResonance: number;
  productIntegration: number;
  estimatedCtr: string;
  recommendedDuration: string;
  aiProductionDifficulty: string;
  suitableIndustries: string[];
  suitablePlatforms: string[];
  psychologyTags: string[];
  radar: SchemeRadarScores;
  highlights: string[];
  budgetTotal: number;
  budgetSlices: Array<{ key: string; amount: number; color: string }>;
};

function parseBudgetAmount(raw: string | undefined, fallback: number) {
  const match = raw?.replace(/,/g, "").match(/\d+/);
  return match ? Number(match[0]) : fallback;
}

function clampScore(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function productionDifficultyScore(raw: string | undefined) {
  const normalized = raw?.toLowerCase() ?? "";
  if (normalized.includes("low") || normalized.includes("低")) return 35;
  if (normalized.includes("high") || normalized.includes("高")) return 78;
  if (normalized.includes("medium") || normalized.includes("中")) return 55;
  return 50;
}

export function localizeSchemeDisplayText(value: string, locale: Locale): string {
  if (locale !== "zh") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;

  const exact: Record<string, string> = {
    low: "低",
    medium: "中",
    high: "高",
    excellent: "优秀",
    "ai pending": "待 AI 判断",
    "ai strategy analysis": "AI 策略分析"
  };
  const key = trimmed.toLowerCase();
  if (exact[key]) return exact[key];

  if (/^low\b/i.test(trimmed)) return trimmed.replace(/^low\b/i, "低");
  if (/^medium\b/i.test(trimmed)) return trimmed.replace(/^medium\b/i, "中");
  if (/^high\b/i.test(trimmed)) return trimmed.replace(/^high\b/i, "高");
  return value;
}

function strategyTags(direction: CreativeDirection, locale: "en" | "zh") {
  const fromApi = [
    ...(direction.suitableIndustries ?? []),
    direction.estimatedCtr,
    direction.aiProductionDifficulty
  ].filter((item): item is string => Boolean(item?.trim()));
  if (fromApi.length) {
    return fromApi.slice(0, 4).map((item) => localizeSchemeDisplayText(item, locale));
  }
  return locale === "zh" ? ["AI 策略分析"] : ["AI strategy analysis"];
}

export function buildSchemeDisplayMetrics(
  direction: CreativeDirection,
  index: number,
  locale: "en" | "zh",
  fallbackBudget = 300
): SchemeDisplayMetrics {
  const budgetTotal = parseBudgetAmount(direction.recommendedBudget, fallbackBudget);
  const creatorFee = Math.round(budgetTotal * 0.45);
  const production = Math.round(budgetTotal * 0.22);
  const equipment = Math.round(budgetTotal * 0.12);
  const post = Math.round(budgetTotal * 0.14);
  const other = Math.max(0, budgetTotal - creatorFee - production - equipment - post);

  const shotList = Array.isArray(direction.shotList) ? direction.shotList : [];
  const highlights =
    shotList.length >= 3
      ? shotList.slice(0, 3)
      : [
          direction.hook,
          direction.coreIdea,
          direction.visualStyle
        ].filter(Boolean);

  return {
    label: String.fromCharCode(65 + index),
    recommended: index === 0,
    audienceMatch: clampScore(direction.audienceMatch),
    emotionalResonance: clampScore(direction.emotionalResonance),
    productIntegration: clampScore(direction.productIntegration),
    estimatedCtr: localizeSchemeDisplayText(
      direction.estimatedCtr || (locale === "zh" ? "待 AI 判断" : "AI pending"),
      locale
    ),
    recommendedDuration: localizeSchemeDisplayText(
      direction.recommendedDuration || (locale === "zh" ? "待 AI 判断" : "AI pending"),
      locale
    ),
    aiProductionDifficulty: localizeSchemeDisplayText(
      direction.aiProductionDifficulty || (locale === "zh" ? "待 AI 判断" : "AI pending"),
      locale
    ),
    suitableIndustries: direction.suitableIndustries?.length ? direction.suitableIndustries : [],
    suitablePlatforms: direction.suitablePlatforms?.length ? direction.suitablePlatforms : [],
    psychologyTags: strategyTags(direction, locale),
    radar: {
      appeal: clampScore(direction.audienceMatch),
      resonance: clampScore(direction.emotionalResonance),
      memorability: Math.round((clampScore(direction.emotionalResonance) + clampScore(direction.productIntegration)) / 2),
      conversion: clampScore(direction.productIntegration),
      difficulty: productionDifficultyScore(direction.aiProductionDifficulty)
    },
    highlights,
    budgetTotal,
    budgetSlices: [
      { key: locale === "zh" ? "创作者费用" : "Creator fee", amount: creatorFee, color: "#7c3aed" },
      { key: locale === "zh" ? "拍摄制作" : "Production", amount: production, color: "#a78bfa" },
      { key: locale === "zh" ? "设备租赁" : "Equipment", amount: equipment, color: "#c4b5fd" },
      { key: locale === "zh" ? "后期剪辑" : "Post-production", amount: post, color: "#ddd6fe" },
      { key: locale === "zh" ? "其他" : "Other", amount: other, color: "#ede9fe" }
    ]
  };
}

export function schemeLetter(index: number) {
  return String.fromCharCode(65 + index);
}
