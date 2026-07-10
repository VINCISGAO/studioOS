import type { Locale } from "@/lib/i18n";
import { isChineseLanguage } from "@/lib/i18n";
import type { CommercialObjective } from "@/lib/project-types";

const OBJECTIVE_LABELS: Record<CommercialObjective, { en: string; zh: string }> = {
  launch: { en: "Product launch", zh: "新品上市" },
  scale: { en: "Scale / conversion", zh: "放量转化" },
  test: { en: "Creative testing", zh: "创意测试" },
  seasonal: { en: "Seasonal campaign", zh: "季节营销" },
  other: { en: "Brand awareness", zh: "品牌曝光" },
  "": { en: "General campaign", zh: "常规推广" }
};

function usesChinese(locale: Locale) {
  return locale === "zh" || isChineseLanguage(locale);
}

export function objectiveOptions(locale: Locale): { id: CommercialObjective; label: string }[] {
  const zh = usesChinese(locale);
  return [
    { id: "launch", label: OBJECTIVE_LABELS.launch[zh ? "zh" : "en"] },
    { id: "scale", label: OBJECTIVE_LABELS.scale[zh ? "zh" : "en"] },
    { id: "test", label: OBJECTIVE_LABELS.test[zh ? "zh" : "en"] },
    { id: "seasonal", label: OBJECTIVE_LABELS.seasonal[zh ? "zh" : "en"] },
    { id: "other", label: OBJECTIVE_LABELS.other[zh ? "zh" : "en"] }
  ];
}

export function objectiveLabelFor(
  objective: CommercialObjective | undefined,
  locale: Locale
): string {
  const zh = usesChinese(locale);
  return OBJECTIVE_LABELS[objective || "other"][zh ? "zh" : "en"];
}

export const PLATFORM_OPTIONS = ["TikTok", "Meta", "YouTube", "Instagram", "Amazon"] as const;
