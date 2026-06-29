import { DEMO_USERS } from "@/lib/demo-auth";
import type { Locale } from "@/lib/i18n";

/** Default UI language per demo brand account. Extend with profile settings later. */
const BRAND_PREFERRED_LOCALE: Record<string, Locale> = {
  "client.arc@adbridge.test": "en",
  "client.bright@adbridge.test": "en",
  "client.north@adbridge.test": "en"
};

export function getClientPreferredLocale(
  clientEmail: string,
  orderClientLocale?: Locale | null
): Locale {
  if (orderClientLocale === "zh" || orderClientLocale === "en") {
    return orderClientLocale;
  }

  const normalized = clientEmail.trim().toLowerCase();
  if (BRAND_PREFERRED_LOCALE[normalized]) {
    return BRAND_PREFERRED_LOCALE[normalized];
  }

  const demoUser = DEMO_USERS.find((user) => user.email === normalized && user.role === "client");
  if (demoUser?.email.includes(".cn") || demoUser?.label.includes("中国")) {
    return "zh";
  }

  return "en";
}
