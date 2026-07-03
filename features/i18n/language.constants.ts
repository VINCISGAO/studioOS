export const SUPPORTED_LANGUAGE_SEEDS = [
  { code: "en", locale: "en", nativeName: "English", englishName: "English", isDefault: true, isEnabled: true, sortOrder: 10 },
  { code: "zh-CN", locale: "zh-CN", nativeName: "简体中文", englishName: "Simplified Chinese", isDefault: false, isEnabled: true, sortOrder: 20 },
  { code: "zh-TW", locale: "zh-TW", nativeName: "繁體中文", englishName: "Traditional Chinese", isDefault: false, isEnabled: true, sortOrder: 30 },
  { code: "ja", locale: "ja", nativeName: "日本語", englishName: "Japanese", isDefault: false, isEnabled: true, sortOrder: 40 },
  { code: "ko", locale: "ko", nativeName: "한국어", englishName: "Korean", isDefault: false, isEnabled: true, sortOrder: 50 },
  { code: "th", locale: "th", nativeName: "ไทย", englishName: "Thai", isDefault: false, isEnabled: true, sortOrder: 60 },
  { code: "km", locale: "km", nativeName: "ខ្មែរ", englishName: "Khmer", isDefault: false, isEnabled: true, sortOrder: 70 },
  { code: "es", locale: "es", nativeName: "Español", englishName: "Spanish", isDefault: false, isEnabled: true, sortOrder: 80 },
  { code: "fr", locale: "fr", nativeName: "Français", englishName: "French", isDefault: false, isEnabled: true, sortOrder: 90 },
  { code: "de", locale: "de", nativeName: "Deutsch", englishName: "German", isDefault: false, isEnabled: true, sortOrder: 100 },
  { code: "vi", locale: "vi", nativeName: "Tiếng Việt", englishName: "Vietnamese", isDefault: false, isEnabled: true, sortOrder: 110 },
  { code: "id", locale: "id", nativeName: "Bahasa Indonesia", englishName: "Indonesian", isDefault: false, isEnabled: true, sortOrder: 120 },
  { code: "ms", locale: "ms", nativeName: "Bahasa Melayu", englishName: "Malay", isDefault: false, isEnabled: true, sortOrder: 130 },
  { code: "pt", locale: "pt", nativeName: "Português", englishName: "Portuguese", isDefault: false, isEnabled: true, sortOrder: 140 },
  { code: "ar", locale: "ar", nativeName: "العربية", englishName: "Arabic", isDefault: false, isEnabled: true, sortOrder: 150 },
  { code: "ru", locale: "ru", nativeName: "Русский", englishName: "Russian", isDefault: false, isEnabled: false, sortOrder: 210 },
  { code: "it", locale: "it", nativeName: "Italiano", englishName: "Italian", isDefault: false, isEnabled: false, sortOrder: 220 },
  { code: "tr", locale: "tr", nativeName: "Türkçe", englishName: "Turkish", isDefault: false, isEnabled: false, sortOrder: 230 },
  { code: "hi", locale: "hi", nativeName: "हिन्दी", englishName: "Hindi", isDefault: false, isEnabled: false, sortOrder: 240 }
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGE_SEEDS)[number]["code"];

export const DEFAULT_LANGUAGE_CODE: SupportedLanguageCode = "en";

export function normalizeLanguageCode(value: string | null | undefined): SupportedLanguageCode {
  if (!value) return DEFAULT_LANGUAGE_CODE;
  if (value === "zh") return "zh-CN";
  const match = SUPPORTED_LANGUAGE_SEEDS.find((item) => item.code === value || item.locale === value);
  return match?.code ?? DEFAULT_LANGUAGE_CODE;
}
