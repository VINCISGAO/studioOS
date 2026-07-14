import { KNOWLEDGE_LANGUAGE_OPTIONS } from "@/features/knowledge-center/knowledge-center.constants";
import type { KnowledgeTranslationDto } from "@/features/knowledge-center/knowledge-center.types";
import type { Locale } from "@/lib/i18n";

type TranslationLike = Pick<
  KnowledgeTranslationDto,
  "language_code" | "title" | "status" | "updated_at" | "published_at"
>;

const LANGUAGE_LABELS_ZH: Record<string, string> = {
  en: "🇺🇸 英文",
  "zh-CN": "🇨🇳 简体中文",
  "zh-TW": "🇹🇼 繁体中文",
  ja: "🇯🇵 日文",
  ko: "🇰🇷 韩文",
  ms: "🇲🇾 马来文",
  km: "🇰🇭 高棉文",
  th: "🇹🇭 泰文",
  vi: "🇻🇳 越南文",
  fr: "🇫🇷 法文",
  es: "🇪🇸 西班牙文"
};

const LANGUAGE_LABELS_EN: Record<string, string> = {
  en: "🇺🇸 English",
  "zh-CN": "🇨🇳 Chinese (Simplified)",
  "zh-TW": "🇹🇼 Chinese (Traditional)",
  ja: "🇯🇵 Japanese",
  ko: "🇰🇷 Korean",
  ms: "🇲🇾 Malay",
  km: "🇰🇭 Khmer",
  th: "🇹🇭 Thai",
  vi: "🇻🇳 Vietnamese",
  fr: "🇫🇷 French",
  es: "🇪🇸 Spanish"
};

export function knowledgeAdminLanguageLabel(languageCode: string, zh: boolean) {
  const map = zh ? LANGUAGE_LABELS_ZH : LANGUAGE_LABELS_EN;
  return map[languageCode] ?? languageCode;
}

function adminLocaleDefaultCode(locale: Locale) {
  return locale === "zh" ? "zh-CN" : "en";
}

function isPublishedTranslation(translation: TranslationLike) {
  return translation.status === "PUBLISHED";
}

/** Pick one translation for admin list / editor / preview — same rules everywhere. */
export function resolveKnowledgeAdminTranslation(
  translations: TranslationLike[],
  options?: {
    preferredLanguageCode?: string;
    adminLocale?: Locale;
  }
): TranslationLike | null {
  if (!translations.length) return null;

  const preferred = options?.preferredLanguageCode?.trim();
  if (preferred && preferred !== "ALL") {
    const filtered = translations.find((item) => item.language_code === preferred);
    if (filtered) return filtered;
  }

  const adminDefault = options?.adminLocale ? adminLocaleDefaultCode(options.adminLocale) : null;
  if (adminDefault) {
    const byAdmin = translations.find((item) => item.language_code === adminDefault);
    if (byAdmin) return byAdmin;
  }

  for (const option of KNOWLEDGE_LANGUAGE_OPTIONS) {
    const published = translations.find(
      (item) => item.language_code === option.code && isPublishedTranslation(item)
    );
    if (published) return published;
  }

  for (const option of KNOWLEDGE_LANGUAGE_OPTIONS) {
    const match = translations.find((item) => item.language_code === option.code);
    if (match) return match;
  }

  return translations[0] ?? null;
}

/** Same as resolveKnowledgeAdminTranslation but returns the full translation row. */
export function pickKnowledgeAdminTranslation<T extends TranslationLike>(
  translations: T[],
  options?: {
    preferredLanguageCode?: string;
    adminLocale?: Locale;
  }
): T | null {
  const resolved = resolveKnowledgeAdminTranslation(translations, options);
  if (!resolved) return null;
  return translations.find((item) => item.language_code === resolved.language_code) ?? null;
}
