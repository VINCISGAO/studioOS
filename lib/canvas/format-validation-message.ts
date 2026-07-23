import type { Locale } from "@/lib/i18n";
import { musicFieldLimitMessage } from "@/lib/canvas/music-field-limits";

const ZOD_MAX_EN = /String must contain at most (\d+) character/i;
const ZOD_MIN_EN = /String must contain at least (\d+) character/i;

export function formatValidationMessage(message: string, locale: Locale = "zh"): string {
  const maxMatch = message.match(ZOD_MAX_EN);
  if (maxMatch) {
    const max = Number(maxMatch[1]);
    if (Number.isFinite(max)) {
      return musicFieldLimitMessage(max, locale);
    }
  }

  const minMatch = message.match(ZOD_MIN_EN);
  if (minMatch) {
    const min = Number(minMatch[1]);
    if (Number.isFinite(min)) {
      return locale === "zh" ? `至少需要 ${min} 个字符` : `At least ${min} characters required`;
    }
  }

  if (message === "Invalid input") {
    return locale === "zh" ? "输入无效，请检查后重试" : "Invalid input, please check and retry";
  }

  return message;
}
