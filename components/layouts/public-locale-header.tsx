"use client";

import { useSearchParams } from "next/navigation";
import { PublicHeader } from "@/components/layouts/public-header";
import { toUiLocale } from "@/lib/app-language.shared";
import { getLanguageCode } from "@/lib/i18n";

/** Respects `?lang=` on public profile URLs. */
export function PublicLocaleHeader() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang");
  const locale = toUiLocale(getLanguageCode(lang ? { lang } : undefined));
  return <PublicHeader locale={locale} />;
}
