"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { LOCALE_COOKIE } from "@/lib/auth-config";
import { normalizeAppLanguage } from "@/lib/app-language.shared";
import type { MarketingLocale } from "@/lib/i18n";

function readCookieLocale(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

/** Marketing docs locale — URL ?lang= first, then locale cookie, no server round-trip. */
export function useMarketingPageLocale(fallback: MarketingLocale = "zh-CN"): MarketingLocale {
  const searchParams = useSearchParams();

  return useMemo(() => {
    const langParam = searchParams.get("lang");
    if (langParam) {
      return normalizeAppLanguage(langParam);
    }

    const cookieLang = readCookieLocale();
    if (cookieLang) {
      return normalizeAppLanguage(cookieLang);
    }

    return fallback;
  }, [searchParams, fallback]);
}
