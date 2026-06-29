import { demoRedirectForRole, type DemoSession } from "@/lib/demo-auth";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";

/** Homepage primary CTA + header portal button — same destination rules. */
export function resolveMarketingPortalHref(locale: Locale, session: DemoSession | null) {
  if (!session) {
    return withLocale("/login", locale);
  }
  return withLocale(demoRedirectForRole(session.role), locale);
}

export function resolveMarketingPortalLabel(locale: Locale, session: DemoSession | null) {
  if (!session) {
    return locale === "zh" ? "登录" : "Sign in";
  }
  if (session.role === "creator") {
    return locale === "zh" ? "创作者" : "Studio portal";
  }
  if (session.role === "admin") {
    return locale === "zh" ? "管理后台" : "Admin";
  }
  return locale === "zh" ? "品牌方门户" : "Brand portal";
}
