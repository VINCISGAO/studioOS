import type { CreativeDirection } from "@/features/ai/creative-direction.types";

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
  aiScore: number;
  ctrLift: number;
  conversionLift: number;
  roi: number;
  difficultyStars: number;
  psychologyTags: string[];
  radar: SchemeRadarScores;
  highlights: string[];
  avgWatchSec: number;
  engagementRate: number;
  cpmForecast: number;
  budgetTotal: number;
  budgetSlices: Array<{ key: string; amount: number; color: string }>;
};

const METRIC_PRESETS = [
  {
    aiScore: 94,
    ctrLift: 18,
    conversionLift: 21,
    roi: 4.2,
    difficultyStars: 3,
    psychologyTags: {
      zh: ["身份认同", "社会认同", "稀缺感", "品质追求"],
      en: ["Identity", "Social proof", "Scarcity", "Quality"]
    },
    radar: { appeal: 92, resonance: 88, memorability: 90, conversion: 94, difficulty: 62 },
    avgWatchSec: 18,
    engagementRate: 8.7,
    cpmForecast: 3.2
  },
  {
    aiScore: 88,
    ctrLift: 14,
    conversionLift: 16,
    roi: 3.6,
    difficultyStars: 2,
    psychologyTags: {
      zh: ["信任感", "真实体验", "口碑传播"],
      en: ["Trust", "Authentic use", "Word of mouth"]
    },
    radar: { appeal: 86, resonance: 92, memorability: 84, conversion: 88, difficulty: 48 },
    avgWatchSec: 16,
    engagementRate: 7.9,
    cpmForecast: 3.5
  },
  {
    aiScore: 86,
    ctrLift: 12,
    conversionLift: 14,
    roi: 3.4,
    difficultyStars: 4,
    psychologyTags: {
      zh: ["好奇驱动", "惊喜感", "快速决策"],
      en: ["Curiosity", "Surprise", "Fast decision"]
    },
    radar: { appeal: 94, resonance: 80, memorability: 91, conversion: 86, difficulty: 72 },
    avgWatchSec: 14,
    engagementRate: 9.1,
    cpmForecast: 3.8
  }
] as const;

function parseBudgetAmount(raw: string | undefined, fallback: number) {
  const match = raw?.replace(/,/g, "").match(/\d+/);
  return match ? Number(match[0]) : fallback;
}

export function buildSchemeDisplayMetrics(
  direction: CreativeDirection,
  index: number,
  locale: "en" | "zh",
  fallbackBudget = 300
): SchemeDisplayMetrics {
  const preset = METRIC_PRESETS[index] ?? METRIC_PRESETS[0];
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
    aiScore: preset.aiScore,
    ctrLift: preset.ctrLift,
    conversionLift: preset.conversionLift,
    roi: preset.roi,
    difficultyStars: preset.difficultyStars,
    psychologyTags: [...preset.psychologyTags[locale]],
    radar: { ...preset.radar },
    highlights,
    avgWatchSec: preset.avgWatchSec,
    engagementRate: preset.engagementRate,
    cpmForecast: preset.cpmForecast,
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
