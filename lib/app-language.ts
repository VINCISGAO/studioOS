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
export async function getAppLanguage(): Promise<SupportedLanguageCode> {
  const cookieStore = await cookies();
  return normalizeAppLanguage(cookieStore.get(LOCALE_COOKIE)?.value);
}

export async function getAppUiLocale(): Promise<Locale> {
  return toUiLocale(await getAppLanguage());
}

/** Server actions / APIs — cookie first, optional form hint second. */
export async function resolveServerLocale(formLang?: string | null): Promise<Locale> {
  const cookieLocale = await getAppUiLocale();
  if (!formLang) return cookieLocale;
  const normalized = normalizeAppLanguage(formLang === "zh" ? "zh-CN" : formLang);
  return toUiLocale(normalized);
}
