import type { Locale } from "@/lib/i18n";
import {
  convertUsdToDisplayAmount,
  formatMoneyFromUsd,
  formatMoneyRangeFromUsd,
  formatStoredBudgetRange,
  getDisplayCurrency,
  USD_REFERENCE_RATES
} from "@/lib/money/display-money";

export type BrandDeliveryTimelineId = "3-5" | "5-7" | "7-14" | "14plus" | "48h" | "24h";

export type BrandBudgetOption = { value: string; label: string };
export type BrandTimelineOption = { id: BrandDeliveryTimelineId; label: string; days: number };

export const BRAND_BUDGET_MIN_USD = 250;

/** Canonical USD values — labels are localized at render time. */
export const BRAND_BUDGET_PRESET_USD = [
  { value: "$200 – $500", min: 200, max: 500 },
  { value: "$500 – $1,000", min: 500, max: 1000 },
  { value: "$1,000 – $2,500", min: 1000, max: 2500 },
  { value: "$2,500+", min: 2500, max: null as number | null }
] as const;

/** All budget amounts in USD (canonical storage). */
export const BRAND_BUDGET_PRESETS: BrandBudgetOption[] = BRAND_BUDGET_PRESET_USD.map((item) => ({
  value: item.value,
  label: item.value
}));

/** @deprecated Use BRAND_BUDGET_PRESETS — kept for imports that expect locale map */
export const BRAND_BUDGET_OPTIONS: Record<Locale, BrandBudgetOption[]> = {
  en: BRAND_BUDGET_PRESETS,
  zh: BRAND_BUDGET_PRESETS
};

export const BRAND_DELIVERY_TIMELINES: Record<Locale, BrandTimelineOption[]> = {
  en: [
    { id: "14plus", label: "14+ days", days: 21 },
    { id: "7-14", label: "7–14 days", days: 14 },
    { id: "5-7", label: "5–7 days", days: 7 },
    { id: "3-5", label: "3–5 days", days: 5 },
    { id: "48h", label: "Within 48h", days: 2 }
  ],
  zh: [
    { id: "14plus", label: "14 天以上", days: 21 },
    { id: "7-14", label: "7–14 天", days: 14 },
    { id: "5-7", label: "5–7 天", days: 7 },
    { id: "3-5", label: "3–5 天", days: 5 },
    { id: "48h", label: "48 小时内", days: 2 }
  ]
};

export function getBrandBudgetPresets(locale: Locale): BrandBudgetOption[] {
  return BRAND_BUDGET_PRESET_USD.map((item) => ({
    value: item.value,
    label:
      item.max === null
        ? formatMoneyRangeFromUsd(item.min, null, locale)
        : formatMoneyRangeFromUsd(item.min, item.max, locale)
  }));
}

function formatUsdCanonical(amount: number): string {
  const normalized = Math.round(amount * 100) / 100;
  if (Number.isInteger(normalized)) {
    return normalized.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  return normalized.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function displayAmountToUsd(amount: number, locale: Locale): number {
  const currency = getDisplayCurrency(locale);
  const rate = USD_REFERENCE_RATES[currency];
  if (rate <= 0 || currency === "USD") {
    return Math.round(amount * 100) / 100;
  }
  return Math.max(0, Math.round((amount / rate) * 100) / 100);
}

function usdAmountToDisplayInput(amountUsd: number, locale: Locale): string {
  const currency = getDisplayCurrency(locale);
  if (currency === "USD") return formatUsdCanonical(amountUsd);
  return String(convertUsdToDisplayAmount(amountUsd, locale));
}

export function isPresetBudget(value: string): boolean {
  return BRAND_BUDGET_PRESETS.some((item) => item.value === value);
}

export function customBudgetInputFromStored(value: string, locale: Locale = "en"): string {
  if (!value || isPresetBudget(value)) return "";
  const numbers =
    value.match(/\d[\d,]*/g)?.map((item) => Number(item.replace(/,/g, ""))) ?? [];
  if (numbers.length === 1) {
    return usdAmountToDisplayInput(numbers[0], locale);
  }
  if (numbers.length >= 2) {
    return `${usdAmountToDisplayInput(numbers[0], locale)}-${usdAmountToDisplayInput(numbers[1], locale)}`;
  }
  return value
    .replace(/\$/g, "")
    .replace(/,/g, "")
    .replace(/\s*–\s*/g, "-")
    .trim();
}

export function normalizeCustomBudgetInput(
  raw: string,
  locale: Locale
): { ok: true; value: string } | { ok: false; message: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      ok: false,
      message: locale === "zh" ? "请输入预算金额" : "Enter a budget amount"
    };
  }

  const rangeMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*[-–~到]\s*(\d+(?:\.\d+)?)$/);
  if (rangeMatch) {
    const minDisplay = Number(rangeMatch[1]);
    const maxDisplay = Number(rangeMatch[2]);
    const min = displayAmountToUsd(minDisplay, locale);
    const max = displayAmountToUsd(maxDisplay, locale);
    if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
      return {
        ok: false,
        message: locale === "zh" ? "预算区间格式不正确" : "Invalid budget range"
      };
    }
    if (min < BRAND_BUDGET_MIN_USD) {
      return {
        ok: false,
        message:
          locale === "zh"
            ? `预算不能低于 ${formatMoneyFromUsd(BRAND_BUDGET_MIN_USD, locale)}`
            : `Minimum budget is ${formatMoneyFromUsd(BRAND_BUDGET_MIN_USD, locale)}`
      };
    }
    return { ok: true, value: `$${formatUsdCanonical(min)} – $${formatUsdCanonical(max)}` };
  }

  const digits = trimmed.replace(/[^0-9.]/g, "");
  const displayAmount = Number(digits);
  const amount = displayAmountToUsd(displayAmount, locale);
  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      ok: false,
      message: locale === "zh" ? "请输入有效金额" : "Enter a valid amount"
    };
  }
  if (amount < BRAND_BUDGET_MIN_USD) {
    return {
      ok: false,
      message:
        locale === "zh"
          ? `预算不能低于 ${formatMoneyFromUsd(BRAND_BUDGET_MIN_USD, locale)}`
          : `Minimum budget is ${formatMoneyFromUsd(BRAND_BUDGET_MIN_USD, locale)}`
    };
  }
  return { ok: true, value: `$${formatUsdCanonical(amount)}` };
}

export function defaultBrandBudget(): string {
  return BRAND_BUDGET_PRESETS[0]?.value ?? "$200 – $500";
}

export function defaultBrandTimeline(): BrandDeliveryTimelineId {
  return "5-7";
}

export type BrandVideoAspectRatio = "9:16" | "16:9" | "1:1" | "4:5" | "4:3" | "21:9" | "custom";

export type BrandAspectRatioOption = {
  id: BrandVideoAspectRatio;
  label: string;
  hint: string;
};

export const BRAND_VIDEO_ASPECT_RATIOS: Record<Locale, BrandAspectRatioOption[]> = {
  en: [
    { id: "9:16", label: "9:16 Vertical", hint: "TikTok, Reels, Shorts" },
    { id: "16:9", label: "16:9 Landscape", hint: "YouTube, TV, web" },
    { id: "1:1", label: "1:1 Square", hint: "Feed ads, Meta" },
    { id: "4:5", label: "4:5 Portrait", hint: "Instagram feed" }
  ],
  zh: [
    { id: "9:16", label: "9:16 竖屏", hint: "TikTok、Reels、短视频" },
    { id: "16:9", label: "16:9 横屏", hint: "YouTube、电视、网站" },
    { id: "1:1", label: "1:1 方形", hint: "信息流广告" },
    { id: "4:5", label: "4:5 竖版", hint: "Instagram 信息流" }
  ]
};

/** Quick Brief layer — compact aspect ratio picker. */
export const QUICK_BRIEF_ASPECT_RATIOS: Record<Locale, BrandAspectRatioOption[]> = {
  en: [
    { id: "16:9", label: "16:9 Landscape", hint: "YouTube, TV, web" },
    { id: "9:16", label: "9:16 Vertical", hint: "TikTok, Reels, Shorts" },
    { id: "4:3", label: "4:3 Standard", hint: "Classic TV, presentations" },
    { id: "21:9", label: "21:9 Ultrawide", hint: "Cinematic widescreen" },
    { id: "custom", label: "Other", hint: "Enter a custom ratio" }
  ],
  zh: [
    { id: "16:9", label: "16:9 横屏", hint: "YouTube、电视、网站" },
    { id: "9:16", label: "9:16 竖屏", hint: "TikTok、Reels、短视频" },
    { id: "4:3", label: "4:3 标准", hint: "传统电视、演示" },
    { id: "21:9", label: "21:9 超宽", hint: "电影感宽银幕" },
    { id: "custom", label: "其他", hint: "手动填写比例" }
  ]
};

const PRESET_ASPECT_RATIO_IDS = new Set<string>([
  ...BRAND_VIDEO_ASPECT_RATIOS.en.map((item) => item.id),
  ...QUICK_BRIEF_ASPECT_RATIOS.en.map((item) => item.id).filter((id) => id !== "custom")
]);

const ASPECT_RATIO_PATTERN = /^\d+(\.\d+)?:\d+(\.\d+)?$/;

export function defaultQuickBriefAspectRatio(): BrandVideoAspectRatio {
  return defaultBrandAspectRatio();
}

export function defaultBrandAspectRatio(): BrandVideoAspectRatio {
  return "16:9";
}

export function isValidBrandAspectRatio(value: string): value is BrandVideoAspectRatio {
  return value === "custom" || PRESET_ASPECT_RATIO_IDS.has(value);
}

export function isCustomAspectRatioPattern(value: string) {
  return ASPECT_RATIO_PATTERN.test(value.trim());
}

export function resolveBriefAspectRatioValue(input: {
  aspectRatio: BrandVideoAspectRatio;
  aspectRatioCustom?: string;
}) {
  if (input.aspectRatio === "custom") {
    return input.aspectRatioCustom?.trim() ?? "";
  }
  return input.aspectRatio;
}

export function validateBriefAspectRatio(
  aspectRatio: BrandVideoAspectRatio | "",
  aspectRatioCustom: string,
  locale: Locale
): { ok: true } | { ok: false; error: string } {
  if (!aspectRatio) {
    return {
      ok: false,
      error: locale === "zh" ? "请选择视频比例" : "Select a video aspect ratio"
    };
  }
  if (aspectRatio !== "custom") {
    return { ok: true };
  }
  const raw = aspectRatioCustom.trim();
  if (!raw) {
    return {
      ok: false,
      error: locale === "zh" ? "请填写自定义比例" : "Enter a custom aspect ratio"
    };
  }
  if (!isCustomAspectRatioPattern(raw)) {
    return {
      ok: false,
      error: locale === "zh" ? "比例格式无效，例如 16:9" : "Invalid ratio format — e.g. 16:9"
    };
  }
  return { ok: true };
}

export function resolveAspectRatioFromProject(input: {
  aspect_ratios?: string[];
  video_format?: string;
  settings_json?: Record<string, unknown>;
}): BrandVideoAspectRatio {
  const stored = input.settings_json?.brand_questionnaire as
    | { aspectRatio?: string; aspectRatioCustom?: string }
    | undefined;
  const storedCustom = stored?.aspectRatioCustom?.trim();
  if (stored?.aspectRatio && isValidBrandAspectRatio(stored.aspectRatio)) {
    return stored.aspectRatio;
  }
  if (stored?.aspectRatio && isCustomAspectRatioPattern(stored.aspectRatio)) {
    return "custom";
  }
  const fromArray = input.aspect_ratios?.find((item) => isValidBrandAspectRatio(item));
  if (fromArray) return fromArray;
  const fromArrayCustom = input.aspect_ratios?.find((item) => isCustomAspectRatioPattern(item));
  if (fromArrayCustom) return "custom";
  if (input.video_format && isValidBrandAspectRatio(input.video_format)) {
    return input.video_format;
  }
  if (input.video_format && isCustomAspectRatioPattern(input.video_format)) {
    return "custom";
  }
  if (storedCustom && isCustomAspectRatioPattern(storedCustom)) {
    return "custom";
  }
  return defaultBrandAspectRatio();
}

export function deadlineFromTimeline(timelineId: string): string {
  const option =
    BRAND_DELIVERY_TIMELINES.en.find((item) => item.id === timelineId) ??
    BRAND_DELIVERY_TIMELINES.en.find((item) => item.id === "5-7");
  const days = option?.days ?? 7;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function deliveryTimelineLabel(timelineId: string, locale: Locale): string {
  const option = BRAND_DELIVERY_TIMELINES[locale].find((item) => item.id === timelineId);
  return option?.label ?? BRAND_DELIVERY_TIMELINES[locale][1]?.label ?? "5–7 days";
}

export function resolveDeliveryTimelineFromProject(input: {
  settings_json?: Record<string, unknown>;
  deadline?: string | null;
}): BrandDeliveryTimelineId {
  const stored = input.settings_json?.brand_questionnaire as { deliveryTimeline?: string } | undefined;
  if (stored?.deliveryTimeline && BRAND_DELIVERY_TIMELINES.en.some((item) => item.id === stored.deliveryTimeline)) {
    return stored.deliveryTimeline as BrandDeliveryTimelineId;
  }
  if (!input.deadline) return defaultBrandTimeline();
  const days = Math.ceil((new Date(input.deadline).getTime() - Date.now()) / 86400000);
  if (days <= 5) return "3-5";
  if (days <= 7) return "5-7";
  if (days <= 14) return "7-14";
  return "14plus";
}
