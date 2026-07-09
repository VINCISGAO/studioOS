import type { MarketingLocale } from "@/lib/i18n";

/** R2/CDN object keys mirror `public/videos/home/hero/` for stable URLs. */
export const homeHeroVideoRelativePaths: Record<MarketingLocale, string> = {
  en: "/videos/home/hero/VINCIS宣传片（英文）.mp4",
  "zh-CN": "/videos/home/hero/VINCIS宣传片（中文）.mp4",
  "zh-TW": "/videos/home/hero/VINCIS宣传片（繁体中文）.mp4",
  ja: "/videos/home/hero/VINCIS宣传片（日文）.mp4",
  ko: "/videos/home/hero/VINCIS宣传片（韩文）.mp4",
  ms: "/videos/home/hero/VINCIS宣传片（马来文）.mp4",
  km: "/videos/home/hero/VINCIS宣传片（柬埔寨文）.mp4",
  th: "/videos/home/hero/VINCIS宣传片（泰文）.mp4",
  vi: "/videos/home/hero/VINCIS宣传片（越南文）.mp4",
  fr: "/videos/home/hero/VINCIS宣传片（法文）.mp4",
  es: "/videos/home/hero/VINCIS宣传片（西班牙语）.mp4"
};

/** Optional explicit CDN base. Leave unset in production — use same-origin `/videos/...` + `MARKETING_CDN_UPSTREAM` rewrite. */
export function marketingCdnBaseUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_MARKETING_CDN_URL?.trim();
  if (!base) return null;
  return base.replace(/\/+$/u, "");
}

export function resolveHomeHeroVideoSrc(locale: MarketingLocale): string {
  const relative = homeHeroVideoRelativePaths[locale] ?? homeHeroVideoRelativePaths.en;
  const cdn = marketingCdnBaseUrl();
  if (cdn) {
    return `${cdn}${encodeURI(relative)}`;
  }
  // Production: Vercel rewrites `/videos/home/hero/*` → R2 via MARKETING_CDN_UPSTREAM.
  // Local dev: serves files from `public/videos/home/hero/` when upstream is unset.
  return encodeURI(relative);
}

export function homeHeroVideoObjectKey(relativePath: string): string {
  return relativePath.replace(/^\/+/u, "");
}
