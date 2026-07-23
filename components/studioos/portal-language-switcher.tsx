"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import type { Locale } from "@/lib/i18n";

/** Compact language control for brand / studio / admin portals. */
export function PortalLanguageSwitcher({
  locale,
  tone = "light"
}: {
  locale: Locale;
  tone?: "light" | "dark";
}) {
  return <LanguageSwitcher locale={locale} tone={tone} variant="icon" menuPlacement="bottom" />;
}
