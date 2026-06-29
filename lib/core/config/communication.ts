/** AI Communication Engine — supported languages + prompt config */
export const communicationConfig = {
  promptVersion: "communication-v1",
  maxRetries: 3,
  summaryMinChars: 200,
  supportedLanguages: [
    "en",
    "zh_cn",
    "zh_tw",
    "ja",
    "ko",
    "vi",
    "th",
    "km",
    "es",
    "pt",
    "fr",
    "de"
  ] as const,
  languageLabels: {
    en: { label: "English", flag: "🇺🇸" },
    zh_cn: { label: "Chinese Simplified", flag: "🇨🇳" },
    zh_tw: { label: "Chinese Traditional", flag: "🇹🇼" },
    ja: { label: "Japanese", flag: "🇯🇵" },
    ko: { label: "Korean", flag: "🇰🇷" },
    vi: { label: "Vietnamese", flag: "🇻🇳" },
    th: { label: "Thai", flag: "🇹🇭" },
    km: { label: "Khmer", flag: "🇰🇭" },
    es: { label: "Spanish", flag: "🇪🇸" },
    pt: { label: "Portuguese", flag: "🇵🇹" },
    fr: { label: "French", flag: "🇫🇷" },
    de: { label: "German", flag: "🇩🇪" }
  } as Record<string, { label: string; flag: string }>
} as const;

export type SupportedLanguageCode = (typeof communicationConfig.supportedLanguages)[number];

export function normalizeLanguageCode(input?: string | null): SupportedLanguageCode {
  const raw = (input ?? "en").trim().toLowerCase().replace("-", "_");
  if (raw === "zh" || raw === "zh_cn" || raw === "cn") return "zh_cn";
  if (raw === "zh_tw" || raw === "tw") return "zh_tw";
  if (communicationConfig.supportedLanguages.includes(raw as SupportedLanguageCode)) {
    return raw as SupportedLanguageCode;
  }
  return "en";
}

export function languageDisplay(code: string) {
  return communicationConfig.languageLabels[code] ?? communicationConfig.languageLabels.en;
}
