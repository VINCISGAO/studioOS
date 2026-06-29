import type { Locale } from "@/lib/i18n";
import { parseBudgetMidpoint } from "@/lib/studioos/brand-checkout-utils";

export const CREATOR_MIN_BUDGET_PRESETS = [0, 500, 1000, 2500] as const;
export const CREATOR_MIN_BUDGET_MAX_USD = 1_000_000;

export type CreatorMinBudgetPreset = (typeof CREATOR_MIN_BUDGET_PRESETS)[number];

export type CreatorMinBudgetOption = {
  value: CreatorMinBudgetPreset;
  label: string;
  hint: string;
};

export const CREATOR_MIN_BUDGET_OPTIONS: Record<Locale, CreatorMinBudgetOption[]> = {
  en: [
    { value: 0, label: "Any budget", hint: "Open to all project sizes" },
    { value: 500, label: "From $500", hint: "Skip very small briefs" },
    { value: 1000, label: "From $1,000", hint: "Mid-size campaigns and up" },
    { value: 2500, label: "From $2,500", hint: "Premium projects only" }
  ],
  zh: [
    { value: 0, label: "不限预算", hint: "各类商单均可" },
    { value: 500, label: "$500 起", hint: "不接过低预算单" },
    { value: 1000, label: "$1,000 起", hint: "中等预算及以上" },
    { value: 2500, label: "$2,500 起", hint: "仅接高端商单" }
  ]
};

export function creatorMinBudgetCustomOptionLabel(locale: Locale) {
  return locale === "zh" ? "自定义金额" : "Custom amount";
}

export function isPresetCreatorMinBudget(value: number) {
  return (CREATOR_MIN_BUDGET_PRESETS as readonly number[]).includes(value);
}

export function normalizeCreatorMinBudget(raw: unknown): number {
  if (raw === null || raw === undefined || raw === "") {
    return 0;
  }

  const parsed =
    typeof raw === "number"
      ? raw
      : Number.parseInt(String(raw).replace(/[^\d]/g, ""), 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.min(parsed, CREATOR_MIN_BUDGET_MAX_USD);
}

export function formatCreatorMinBudgetUsd(value: number, locale: Locale) {
  const formatted = value.toLocaleString(locale === "zh" ? "zh-CN" : "en-US");
  return locale === "zh" ? `$${formatted} 起` : `From $${formatted}`;
}

export function creatorMinBudgetLabel(minUsd: number | undefined, locale: Locale): string {
  const value = normalizeCreatorMinBudget(minUsd ?? 0);
  if (!value) {
    return CREATOR_MIN_BUDGET_OPTIONS[locale][0].label;
  }

  const preset = CREATOR_MIN_BUDGET_OPTIONS[locale].find((item) => item.value === value);
  if (preset) {
    return preset.label;
  }

  return formatCreatorMinBudgetUsd(value, locale);
}

export function creatorMinBudgetHeroLabel(minUsd: number | undefined, locale: Locale): string | null {
  const value = normalizeCreatorMinBudget(minUsd ?? 0);
  if (!value) return null;
  return locale === "zh" ? `商单 ${creatorMinBudgetLabel(value, locale)}` : creatorMinBudgetLabel(value, locale);
}

export function creatorMinBudgetAboutLabel(minUsd: number | undefined, locale: Locale): string {
  const value = normalizeCreatorMinBudget(minUsd ?? 0);
  if (!value) {
    return locale === "zh" ? "不限" : "Any budget";
  }
  return creatorMinBudgetLabel(value, locale);
}

export function projectBudgetMatchesCreatorMin(
  projectBudgetRange: string | null | undefined,
  creatorMinUsd: number | undefined
): boolean {
  const min = normalizeCreatorMinBudget(creatorMinUsd ?? 0);
  if (!min) return true;
  return parseBudgetMidpoint(projectBudgetRange) >= min;
}

export function resolveCreatorMinBudgetMode(value: number): "preset" | "custom" {
  return isPresetCreatorMinBudget(normalizeCreatorMinBudget(value)) ? "preset" : "custom";
}

export function creatorMinBudgetOptionValues(locale: Locale) {
  return CREATOR_MIN_BUDGET_OPTIONS[locale].map((item) => ({
    value: String(item.value),
    label: item.label
  }));
}
