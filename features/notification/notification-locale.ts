import "server-only";

import { normalizeLanguageCode } from "@/features/i18n/language.constants";
import { toUiLocale } from "@/lib/app-language.shared";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import type { Locale } from "@/lib/i18n";

export async function resolveNotificationLocale(userId: string): Promise<Locale> {
  if (!hasDatabaseUrl()) {
    return "en";
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { languageCode: true, language: true }
  });

  return toUiLocale(normalizeLanguageCode(user?.languageCode ?? user?.language));
}

export function notificationActionLabel(locale: Locale) {
  return locale === "zh" ? "在 VINCIS 中查看" : "View in VINCIS";
}

export async function persistUserNotificationLocale(userId: string, locale: Locale) {
  if (!hasDatabaseUrl()) {
    return;
  }

  const languageCode = locale === "zh" ? "zh-CN" : "en";
  await prisma.user.update({
    where: { id: userId },
    data: {
      language: locale,
      languageCode
    }
  });
}
