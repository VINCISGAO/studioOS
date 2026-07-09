import {
  DEFAULT_LANGUAGE_CODE,
  normalizeLanguageCode,
  type SupportedLanguageCode
} from "@/features/i18n/language.constants";
import type { Locale } from "@/lib/i18n";

export const APP_LANGUAGE_STORAGE_KEY = "vincis_app_language";

export const INTERNAL_APP_PATH_PREFIXES = [
  "/brand",
  "/studio",
  "/admin",
  "/dashboard",
  "/workspace",
  "/creator"
] as const;

export function normalizeAppLanguage(value: string | null | undefined): SupportedLanguageCode {
  return normalizeLanguageCode(value ?? DEFAULT_LANGUAGE_CODE);
}

/** Legacy UI locale — brand/studio/admin copy uses zh | en. */
export function toUiLocale(language: SupportedLanguageCode | string): Locale {
  const code = normalizeAppLanguage(language);
  return code === "en" ? "en" : "zh";
}

export function isInternalAppPath(pathname: string) {
  return INTERNAL_APP_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** `?lang=` is only meaningful on the marketing homepage. */
export function isHomepageLangPath(pathname: string) {
  return pathname === "/";
}

export function stripLangFromSearch(search: string) {
  const params = new URLSearchParams(search);
  params.delete("lang");
  const query = params.toString();
  return query ? `?${query}` : "";
}
