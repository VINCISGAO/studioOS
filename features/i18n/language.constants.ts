export const SUPPORTED_LANGUAGE_SEEDS = [
  { code: "en", locale: "en", nativeName: "English", englishName: "English", isDefault: true, isEnabled: true, sortOrder: 10 },
  { code: "zh-CN", locale: "zh-CN", nativeName: "简体中文", englishName: "Simplified Chinese", isDefault: false, isEnabled: true, sortOrder: 20 },
  { code: "zh-TW", locale: "zh-TW", nativeName: "繁體中文", englishName: "Traditional Chinese", isDefault: false, isEnabled: true, sortOrder: 30 },
  { code: "ja", locale: "ja", nativeName: "日本語", englishName: "Japanese", isDefault: false, isEnabled: true, sortOrder: 40 },
  { code: "ko", locale: "ko", nativeName: "한국어", englishName: "Korean", isDefault: false, isEnabled: true, sortOrder: 50 },
  { code: "ms", locale: "ms", nativeName: "Bahasa Melayu", englishName: "Malay", isDefault: false, isEnabled: true, sortOrder: 60 },
  { code: "km", locale: "km", nativeName: "ភាសាខ្មែរ", englishName: "Khmer", isDefault: false, isEnabled: true, sortOrder: 70 },
  { code: "th", locale: "th", nativeName: "ไทย", englishName: "Thai", isDefault: false, isEnabled: true, sortOrder: 80 },
  { code: "vi", locale: "vi", nativeName: "Tiếng Việt", englishName: "Vietnamese", isDefault: false, isEnabled: true, sortOrder: 90 },
  { code: "fr", locale: "fr", nativeName: "Français", englishName: "French", isDefault: false, isEnabled: true, sortOrder: 100 },
  { code: "es", locale: "es", nativeName: "Español", englishName: "Spanish", isDefault: false, isEnabled: true, sortOrder: 110 }
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGE_SEEDS)[number]["code"];

export const DEFAULT_LANGUAGE_CODE: SupportedLanguageCode = "en";

export function normalizeLanguageCode(value: string | null | undefined): SupportedLanguageCode {
  if (!value) return DEFAULT_LANGUAGE_CODE;
  if (value === "zh") return "zh-CN";
  const match = SUPPORTED_LANGUAGE_SEEDS.find((item) => item.code === value || item.locale === value);
  return match?.code ?? DEFAULT_LANGUAGE_CODE;
}
