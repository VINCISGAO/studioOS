import type { DemoSession } from "@/lib/demo-auth";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { isChineseLanguage } from "@/lib/i18n";
import { buildLocalizedHref, marketingHomeHref } from "@/lib/marketing/localized-href";

/** Admin must never surface on the public marketing homepage. */
export function isMarketingPublicSession(session: DemoSession | null): session is DemoSession {
  return Boolean(session && session.role !== "admin");
}

/** Homepage header / footer portal button — brand & creator only. */
const portalLabels: Record<MarketingLocale, { signIn: string; brand: string; studio: string; admin: string }> = {
  en: { signIn: "Sign in", brand: "Brand portal", studio: "Studio portal", admin: "Admin (dev)" },
  "zh-CN": { signIn: "登录", brand: "品牌方门户", studio: "创作者", admin: "管理后台 (dev)" },
  "zh-TW": { signIn: "登入", brand: "品牌方入口", studio: "創作者", admin: "管理後台 (dev)" },
  ja: { signIn: "ログイン", brand: "ブランドポータル", studio: "スタジオポータル", admin: "管理画面 (dev)" },
  ko: { signIn: "로그인", brand: "브랜드 포털", studio: "스튜디오 포털", admin: "관리자 (dev)" },
  ms: { signIn: "Log masuk", brand: "Portal jenama", studio: "Portal studio", admin: "Admin (dev)" },
  km: { signIn: "ចូល", brand: "ផតថលម៉ាក", studio: "ផតថលស្ទូឌីយោ", admin: "Admin (dev)" },
  th: { signIn: "เข้าสู่ระบบ", brand: "พอร์ทัลแบรนด์", studio: "พอร์ทัลสตูดิโอ", admin: "ผู้ดูแล (dev)" },
  vi: { signIn: "Đăng nhập", brand: "Cổng thương hiệu", studio: "Cổng studio", admin: "Quản trị (dev)" },
  fr: { signIn: "Connexion", brand: "Portail marque", studio: "Portail studio", admin: "Admin (dev)" },
  es: { signIn: "Iniciar sesión", brand: "Portal de marca", studio: "Portal de estudio", admin: "Admin (dev)" }
};

function labelsFor(locale: Locale | MarketingLocale) {
  return portalLabels[locale as MarketingLocale] ?? (isChineseLanguage(locale) ? portalLabels["zh-CN"] : portalLabels.en);
}

export function resolveMarketingPortalHref(locale: Locale | MarketingLocale, session: DemoSession | null) {
  if (!isMarketingPublicSession(session)) {
    return marketingHomeHref.login(locale);
  }
  return session.role === "creator" ? marketingHomeHref.studio(locale) : marketingHomeHref.brand(locale);
}

export function resolveMarketingPortalLabel(locale: Locale | MarketingLocale, session: DemoSession | null) {
  const t = labelsFor(locale);
  if (!session || session.role === "admin") {
    return t.signIn;
  }
  if (session.role === "creator") {
    return t.studio;
  }
  return t.brand;
}

/** Logged-in workspace CTA for marketing nav — null for guests and admins. */
export function resolveMarketingWorkspaceCta(
  locale: Locale | MarketingLocale,
  session: DemoSession | null
): { href: string; label: string } | null {
  if (!isMarketingPublicSession(session)) {
    return null;
  }
  return {
    href: session.role === "creator" ? marketingHomeHref.studio(locale) : marketingHomeHref.brand(locale),
    label: resolveMarketingPortalLabel(locale, session)
  };
}

/** Dev-only admin shortcut — never render on production homepage. */
export function resolveDevAdminShortcut(locale: Locale): { href: string; label: string } | null {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }
  return {
    href: buildLocalizedHref("/admin", locale),
    label: labelsFor(locale).admin
  };
}

/** Public homepage hero / bottom CTA — brand entry. */
export function resolveMarketingBrandEntryHref(locale: Locale | MarketingLocale) {
  return marketingHomeHref.brand(locale);
}

export function resolveMarketingCreatorEntryHref(locale: Locale | MarketingLocale) {
  return marketingHomeHref.studio(locale);
}
