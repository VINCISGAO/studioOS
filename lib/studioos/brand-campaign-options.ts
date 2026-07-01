import type { Locale } from "@/lib/i18n";

export type BrandDeliveryTimelineId = "3-5" | "5-7" | "7-14" | "14plus";

export type BrandBudgetOption = { value: string; label: string };
export type BrandTimelineOption = { id: BrandDeliveryTimelineId; label: string; days: number };

export const BRAND_BUDGET_MIN_USD = 200;

/** All budget amounts in USD. */
export const BRAND_BUDGET_PRESETS: BrandBudgetOption[] = [
  { value: "$200 – $500", label: "$200 – $500" },
  { value: "$500 – $1,000", label: "$500 – $1,000" },
  { value: "$1,000 – $2,500", label: "$1,000 – $2,500" },
  { value: "$2,500+", label: "$2,500+" }
];

/** @deprecated Use BRAND_BUDGET_PRESETS — kept for imports that expect locale map */
export const BRAND_BUDGET_OPTIONS: Record<Locale, BrandBudgetOption[]> = {
  en: BRAND_BUDGET_PRESETS,
  zh: BRAND_BUDGET_PRESETS
};

export const BRAND_DELIVERY_TIMELINES: Record<Locale, BrandTimelineOption[]> = {
  en: [
    { id: "3-5", label: "3–5 days", days: 5 },
    { id: "5-7", label: "5–7 days", days: 7 },
    { id: "7-14", label: "7–14 days", days: 14 },
    { id: "14plus", label: "14+ days", days: 21 }
  ],
  zh: [
    { id: "3-5", label: "3–5 天", days: 5 },
    { id: "5-7", label: "5–7 天", days: 7 },
    { id: "7-14", label: "7–14 天", days: 14 },
    { id: "14plus", label: "14 天以上", days: 21 }
  ]
};

function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function isPresetBudget(value: string): boolean {
  return BRAND_BUDGET_PRESETS.some((item) => item.value === value);
}

export function customBudgetInputFromStored(value: string): string {
  if (!value || isPresetBudget(value)) return "";
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
    const min = Number(rangeMatch[1]);
    const max = Number(rangeMatch[2]);
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
            ? `预算不能低于 $${formatUsd(BRAND_BUDGET_MIN_USD)}`
            : `Minimum budget is $${formatUsd(BRAND_BUDGET_MIN_USD)}`
      };
    }
    return { ok: true, value: `$${formatUsd(min)} – $${formatUsd(max)}` };
  }

  const digits = trimmed.replace(/[^0-9.]/g, "");
  const amount = Number(digits);
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
          ? `预算不能低于 $${formatUsd(BRAND_BUDGET_MIN_USD)}`
          : `Minimum budget is $${formatUsd(BRAND_BUDGET_MIN_USD)}`
    };
  }
  return { ok: true, value: `$${formatUsd(amount)}` };
}

export function defaultBrandBudget(): string {
  return BRAND_BUDGET_PRESETS[0]?.value ?? "$200 – $500";
}

export function defaultBrandTimeline(): BrandDeliveryTimelineId {
  return "5-7";
}

export type BrandVideoAspectRatio = "9:16" | "16:9" | "1:1" | "4:5";

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

export function defaultBrandAspectRatio(): BrandVideoAspectRatio {
  return "9:16";
}

export function isValidBrandAspectRatio(value: string): value is BrandVideoAspectRatio {
  return BRAND_VIDEO_ASPECT_RATIOS.en.some((item) => item.id === value);
}

export function resolveAspectRatioFromProject(input: {
  aspect_ratios?: string[];
  video_format?: string;
  settings_json?: Record<string, unknown>;
}): BrandVideoAspectRatio {
  const stored = input.settings_json?.brand_questionnaire as { aspectRatio?: string } | undefined;
  if (stored?.aspectRatio && isValidBrandAspectRatio(stored.aspectRatio)) {
    return stored.aspectRatio;
  }
  const fromArray = input.aspect_ratios?.find((item) => isValidBrandAspectRatio(item));
  if (fromArray) return fromArray;
  if (input.video_format && isValidBrandAspectRatio(input.video_format)) {
    return input.video_format;
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
