"use client";

import { LOCALE_COOKIE } from "@/lib/auth-config";
import {
  APP_LANGUAGE_STORAGE_KEY,
  normalizeAppLanguage
} from "@/lib/app-language.shared";
import type { SupportedLanguageCode } from "@/features/i18n/language.constants";

function cookieSecureFlag() {
  return typeof window !== "undefined" && window.location.protocol === "https:" ? "; secure" : "";
}

/** Homepage only — persists the user's language choice site-wide. */
export function setAppLanguage(code: SupportedLanguageCode) {
  const normalized = normalizeAppLanguage(code);
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${normalized}; path=/; max-age=${maxAge}; samesite=lax${cookieSecureFlag()}`;
  try {
    localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, normalized);
  } catch {
    // Ignore private mode storage failures.
  }
}

export function readStoredAppLanguage(): SupportedLanguageCode | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const fromStorage = localStorage.getItem(APP_LANGUAGE_STORAGE_KEY);
    if (fromStorage) {
      return normalizeAppLanguage(fromStorage);
    }
  } catch {
    // Ignore storage read failures.
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  return match?.[1] ? normalizeAppLanguage(decodeURIComponent(match[1])) : null;
}
