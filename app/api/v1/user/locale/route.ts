import { NextResponse } from "next/server";
import { getSessionUser } from "@/features/auth/session.service";
import { persistUserNotificationLocale } from "@/features/notification/notification-locale";
import { normalizeLanguageCode } from "@/features/i18n/language.constants";
import { toUiLocale } from "@/lib/app-language.shared";

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { locale?: string; languageCode?: string } | null;
  const locale = toUiLocale(normalizeLanguageCode(body?.languageCode ?? body?.locale));
  await persistUserNotificationLocale(user.id, locale);

  return NextResponse.json({ ok: true, locale });
}
