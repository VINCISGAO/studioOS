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

  if (/^No pricing rule configured for /i.test(message)) {
    return locale === "zh"
      ? "该模型的 Credits 定价规则尚未配置，请联系管理员或稍后再试"
      : "Credits pricing is not configured for this model yet. Please contact an admin or try again later.";
  }

  if (
    /Transaction API error|Transaction not found|Transaction ID is invalid|Invalid `prisma\./i.test(
      message
    )
  ) {
    return locale === "zh"
      ? "视频生成暂时失败，请稍后重试。相关 Credits 已自动退回。"
      : "Video generation failed temporarily. Your Credits have been refunded automatically.";
  }

  return message;
}
