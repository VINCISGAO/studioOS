import { demoRedirectForRole, type DemoSession } from "@/lib/demo-auth";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";

/** Admin must never surface on the public marketing homepage. */
export function isMarketingPublicSession(session: DemoSession | null): session is DemoSession {
  return Boolean(session && session.role !== "admin");
}

/** Homepage header / footer portal button — brand & creator only. */
export function resolveMarketingPortalHref(locale: Locale, session: DemoSession | null) {
  if (!isMarketingPublicSession(session)) {
    return withLocale("/login", locale);
  }
  return withLocale(demoRedirectForRole(session.role), locale);
}

export function resolveMarketingPortalLabel(locale: Locale, session: DemoSession | null) {
  if (!session || session.role === "admin") {
    return locale === "zh" ? "登录" : "Sign in";
  }
  if (session.role === "creator") {
    return locale === "zh" ? "创作者" : "Studio portal";
  }
  return locale === "zh" ? "品牌方门户" : "Brand portal";
}

/** Logged-in workspace CTA for marketing nav — null for guests and admins. */
export function resolveMarketingWorkspaceCta(
  locale: Locale,
  session: DemoSession | null
): { href: string; label: string } | null {
  if (!isMarketingPublicSession(session)) {
    return null;
  }
  return {
    href: withLocale(demoRedirectForRole(session.role), locale),
    label: resolveMarketingPortalLabel(locale, session)
  };
}

/** Dev-only admin shortcut — never render on production homepage. */
export function resolveDevAdminShortcut(locale: Locale): { href: string; label: string } | null {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }
  return {
    href: withLocale("/admin", locale),
    label: locale === "zh" ? "管理后台 (dev)" : "Admin (dev)"
  };
}

/** Public homepage hero / bottom CTA — always external brand entry. */
export function resolveMarketingBrandEntryHref(locale: Locale) {
  return withLocale("/login?role=brand", locale);
}

export function resolveMarketingCreatorEntryHref(locale: Locale) {
  return withLocale("/login?role=creator", locale);
}
