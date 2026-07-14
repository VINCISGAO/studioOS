import type { Locale } from "@/lib/i18n";
import { countries, platforms, videoFormats, workCategories } from "@/lib/project-options";
import {
  getCountryLocalizedName,
  getCountryOptions as buildCountryOptions
} from "@/lib/geo/country";

export type LocalizedOption = { value: string; label: string };

type Bilingual = Record<Locale, string>;

export const WORK_CATEGORY_LABELS: Record<string, Bilingual> = {
  Beauty: { en: "Beauty", zh: "美妆护肤" },
  "Consumer packaged goods": { en: "Consumer packaged goods", zh: "快消包装" },
  "Consumer tech": { en: "Consumer tech", zh: "数码科技" },
  Automotive: { en: "Automotive ads", zh: "汽车广告" },
  Fashion: { en: "Fashion", zh: "时尚服饰" },
  "Food and beverage": { en: "Food and beverage", zh: "食品饮料" },
  Home: { en: "Home", zh: "家居生活" },
  "Travel accessories": { en: "Travel accessories", zh: "旅行装备" },
  Other: { en: "Other", zh: "其他" }
};

export const PLATFORM_LABELS: Record<string, Bilingual> = {
  TikTok: { en: "TikTok", zh: "TikTok" },
  Meta: { en: "Meta", zh: "Meta 广告" },
  YouTube: { en: "YouTube", zh: "YouTube" },
  Instagram: { en: "Instagram", zh: "Instagram" },
  Amazon: { en: "Amazon", zh: "亚马逊" }
};

/** @deprecated Use getCountryLocalizedName from lib/geo/country */
export const COUNTRY_LABELS: Record<string, Bilingual> = Object.fromEntries(
  countries.map((iso2) => [
    iso2,
    { en: getCountryLocalizedName(iso2, "en"), zh: getCountryLocalizedName(iso2, "zh") }
  ])
);

export const VIDEO_FORMAT_LABELS: Record<string, Bilingual> = {
  "9:16": { en: "9:16 Vertical", zh: "9:16 竖屏" },
  "16:9": { en: "16:9 Landscape", zh: "16:9 横屏" },
  "1:1": { en: "1:1 Square", zh: "1:1 方形" }
};

const TURNAROUND_I18N: Record<string, Bilingual> = {
  "48 hours": { en: "48 hours", zh: "48 小时" },
  "72 hours": { en: "72 hours", zh: "72 小时" },
  "5 days": { en: "5 days", zh: "5 天" },
  "1 week": { en: "1 week", zh: "1 周" }
};

export function labelWorkCategory(value: string, locale: Locale) {
  return WORK_CATEGORY_LABELS[value]?.[locale] ?? value;
}

export function labelPlatform(value: string, locale: Locale) {
  return PLATFORM_LABELS[value]?.[locale] ?? value;
}

export function labelCountry(value: string, locale: Locale) {
  return getCountryLocalizedName(value, locale);
}

export function labelVideoFormat(value: string, locale: Locale) {
  return VIDEO_FORMAT_LABELS[value]?.[locale] ?? value;
}

export function labelTurnaround(value: string, locale: Locale) {
  return TURNAROUND_I18N[value]?.[locale] ?? value;
}

const DELIVERY_SPEED_I18N: Record<string, Bilingual> = {
  "48-72 hours": { en: "48-72 hours", zh: "48-72 小时" }
};

export function labelDeliverySpeed(value: string, locale: Locale) {
  return labelTurnaround(value, locale) !== value
    ? labelTurnaround(value, locale)
    : (DELIVERY_SPEED_I18N[value]?.[locale] ?? value);
}

export function getWorkCategoryOptions(locale: Locale): LocalizedOption[] {
  return workCategories.map((value) => ({
    value,
    label: labelWorkCategory(value, locale)
  }));
}

export function getPlatformOptions(locale: Locale): LocalizedOption[] {
  return platforms.map((value) => ({
    value,
    label: labelPlatform(value, locale)
  }));
}

export function getCountryOptions(locale: Locale, extra?: string): LocalizedOption[] {
  return buildCountryOptions(locale, extra);
}

export function getVideoFormatOptions(locale: Locale): LocalizedOption[] {
  return videoFormats.map((value) => ({
    value,
    label: labelVideoFormat(value, locale)
  }));
}

export function getTurnaroundOptions(locale: Locale): LocalizedOption[] {
  return Object.entries(TURNAROUND_I18N).map(([value, labels]) => ({
    value,
    label: labels[locale]
  }));
}

export const publishFormPlaceholders = {
  videoUrl: {
    en: "https://www.youtube.com/watch?v=...",
    zh: "https://www.youtube.com/watch?v=..."
  },
  thumbnail: {
    en: "Leave empty to auto-use YouTube cover",
    zh: "留空则从 YouTube 自动取封面"
  },
  tags: {
    en: "UGC, product demo",
    zh: "原生 UGC、产品演示"
  },
  specialties: {
    en: "Beauty, TikTok, product films",
    zh: "美妆、TikTok、产品短片"
  },
  tools: {
    en: "Runway, After Effects",
    zh: "Runway、After Effects"
  },
  deliverySpeed: {
    en: "48-72 hours",
    zh: "48–72 小时"
  }
} as const;

export function publishPlaceholder(key: keyof typeof publishFormPlaceholders, locale: Locale) {
  return publishFormPlaceholders[key][locale];
}

export const defaultTurnaroundValue = "72 hours";
