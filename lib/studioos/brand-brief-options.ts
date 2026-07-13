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
  if (objective === "") {
    return OBJECTIVE_LABELS[""][zh ? "zh" : "en"];
  }
  return OBJECTIVE_LABELS[objective || "other"][zh ? "zh" : "en"];
}

/** True only when the user explicitly mentions a new product / launch. */
export function userMentionsProductLaunch(source: string): boolean {
  return /新品|上市|发布|launch|new product|product launch|刚推出|首次亮相|新上市/i.test(source);
}

/** Infer campaign objective id from free text — never defaults to launch. */
export function inferObjectiveFromText(text: string): CommercialObjective {
  const lower = text.toLowerCase();
  if (userMentionsProductLaunch(text)) return "launch";
  if (/转化|conversion|purchase|下单|roi|performance|销量|提升销量/.test(lower)) return "scale";
  if (/测试|test|a\/b|创意测试/.test(lower)) return "test";
  if (/季节|season|holiday|圣诞|黑五/.test(lower)) return "seasonal";
  if (/品牌|认知|曝光|awareness|品牌认知/.test(lower)) return "other";
  return "";
}

/** Human-readable primary objective for polished brief — inferred from copy, not assumed launch. */
export function inferPrimaryObjectiveLabel(
  source: string,
  locale: Locale,
  formObjective?: CommercialObjective
): string {
  const zh = usesChinese(locale);
  const inferred = inferObjectiveFromText(source);
  if (inferred) {
    return objectiveLabelFor(inferred, locale);
  }
  if (formObjective && formObjective !== "launch") {
    return objectiveLabelFor(formObjective, locale);
  }
  return OBJECTIVE_LABELS[""][zh ? "zh" : "en"];
}

/** Strip「新品上市」when the user never said it. */
export function sanitizePrimaryObjectiveLabel(
  primary: string,
  source: string,
  locale: Locale,
  formObjective?: CommercialObjective
): string {
  const trimmed = primary.trim();
  if (!trimmed) {
    return inferPrimaryObjectiveLabel(source, locale, formObjective);
  }
  const mentionsLaunch = userMentionsProductLaunch(source);
  const looksLikeLaunch = /新品上市|product launch/i.test(trimmed) || (/上市|launch/i.test(trimmed) && !mentionsLaunch);
  if (looksLikeLaunch && !mentionsLaunch) {
    return inferPrimaryObjectiveLabel(source, locale, formObjective);
  }
  return trimmed;
}

/** Prefer user-written brief; never set launch unless the user actually said it. */
export function resolveCampaignObjectiveFromBrief(
  userSource: string,
  optimizerObjectiveText: string
): CommercialObjective {
  const fromUser = inferObjectiveFromText(userSource);
  if (fromUser) return fromUser;

  const fromOptimizer = inferObjectiveFromText(optimizerObjectiveText);
  if (fromOptimizer === "launch" && !userMentionsProductLaunch(userSource)) {
    return "";
  }
  return fromOptimizer;
}

export const PLATFORM_OPTIONS = ["TikTok", "Meta", "YouTube", "Instagram", "Amazon"] as const;
