import { cache } from "react";
import "server-only";

import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "@/lib/auth-config";
import {
  normalizeAppLanguage,
  toUiLocale
} from "@/lib/app-language.shared";
import type { SupportedLanguageCode } from "@/features/i18n/language.constants";
import type { Locale } from "@/lib/i18n";

export {
  APP_LANGUAGE_STORAGE_KEY,
  INTERNAL_APP_PATH_PREFIXES,
  isHomepageLangPath,
  isInternalAppPath,
  normalizeAppLanguage,
  stripLangFromSearch,
  toUiLocale
} from "@/lib/app-language.shared";

/** Saved app language — cookie is the server source of truth. */
export const getAppLanguage = cache(async (): Promise<SupportedLanguageCode> => {
  const cookieStore = await cookies();
  return normalizeAppLanguage(cookieStore.get(LOCALE_COOKIE)?.value);
});

export const getAppUiLocale = cache(async (): Promise<Locale> => {
  return toUiLocale(await getAppLanguage());
});

/** Server actions / APIs — cookie first, optional form hint second. */
export async function resolveServerLocale(formLang?: string | null): Promise<Locale> {
  const cookieLocale = await getAppUiLocale();
  if (!formLang) return cookieLocale;
  const normalized = normalizeAppLanguage(formLang === "zh" ? "zh-CN" : formLang);
  return toUiLocale(normalized);
}

const PORTAL_LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Portal layouts — cookie wins when present; otherwise seed from the signed-in user's DB preference.
 * Keeps internal routes off `?lang=` while preparing future full i18n rollout.
 */
export async function resolvePortalLocale(userLanguageCode?: string | null): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value;

  if (cookieValue) {
    return toUiLocale(normalizeAppLanguage(cookieValue));
  }

  if (userLanguageCode) {
    const normalized = normalizeAppLanguage(userLanguageCode);
    cookieStore.set(LOCALE_COOKIE, normalized, {
      path: "/",
      maxAge: PORTAL_LOCALE_COOKIE_MAX_AGE,
      sameSite: "lax"
    });
    return toUiLocale(normalized);
  }

  return getAppUiLocale();
}
