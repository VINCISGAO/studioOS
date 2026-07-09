import type { MarketingLocale } from "@/lib/i18n";

/** ASCII public URLs — browsers and CDNs handle these reliably. */
export const homeHeroVideoPublicPaths: Record<MarketingLocale, string> = {
  en: "/videos/home/hero/vincis-hero-en.mp4",
  "zh-CN": "/videos/home/hero/vincis-hero-zh-cn.mp4",
  "zh-TW": "/videos/home/hero/vincis-hero-zh-tw.mp4",
  ja: "/videos/home/hero/vincis-hero-ja.mp4",
  ko: "/videos/home/hero/vincis-hero-ko.mp4",
  ms: "/videos/home/hero/vincis-hero-ms.mp4",
  km: "/videos/home/hero/vincis-hero-km.mp4",
  th: "/videos/home/hero/vincis-hero-th.mp4",
  vi: "/videos/home/hero/vincis-hero-vi.mp4",
  fr: "/videos/home/hero/vincis-hero-fr.mp4",
  es: "/videos/home/hero/vincis-hero-es.mp4"
};

/** R2 object filenames (uploaded from `public/videos/home/hero/`). */
export const homeHeroVideoR2Filenames: Record<MarketingLocale, string> = {
  en: "VINCIS宣传片（英文）.mp4",
  "zh-CN": "VINCIS宣传片（中文）.mp4",
  "zh-TW": "VINCIS宣传片（繁体中文）.mp4",
  ja: "VINCIS宣传片（日文）.mp4",
  ko: "VINCIS宣传片（韩文）.mp4",
  ms: "VINCIS宣传片（马来文）.mp4",
  km: "VINCIS宣传片（柬埔寨文）.mp4",
  th: "VINCIS宣传片（泰文）.mp4",
  vi: "VINCIS宣传片（越南文）.mp4",
  fr: "VINCIS宣传片（法文）.mp4",
  es: "VINCIS宣传片（西班牙语）.mp4"
};

const HERO_SLUG_TO_R2_FILENAME = Object.fromEntries(
  Object.entries(homeHeroVideoPublicPaths).map(([locale, publicPath]) => {
    const slug = publicPath.split("/").pop() ?? "";
    const r2Name = homeHeroVideoR2Filenames[locale as MarketingLocale];
    return [slug, r2Name];
  })
) as Record<string, string>;

/** @deprecated Use `homeHeroVideoPublicPaths` — kept for upload scripts referencing legacy paths. */
export const homeHeroVideoRelativePaths = homeHeroVideoPublicPaths;

/** Public CDN/R2 base for upload scripts — not for HTML video `src`. */
export function marketingCdnBaseUrl(): string | null {
  const upstream = process.env.MARKETING_CDN_UPSTREAM?.trim();
  if (upstream) return upstream.replace(/\/+$/u, "");
  const base = process.env.NEXT_PUBLIC_MARKETING_CDN_URL?.trim();
  if (!base) return null;
  return base.replace(/\/+$/u, "");
}

/** Bust browser/CDN caches after proxy URL changes. */
const HERO_VIDEO_CACHE_VERSION = "3";

/**
 * Same-origin hero video path — production proxies `/videos/home/*` via `app/videos/[...path]/route.ts`.
 * Avoid direct r2.dev URLs in `<video src>` (Safari logs `TypeError: Load failed` on cross-origin media).
 */
export function resolveHomeHeroVideoPlaybackSrc(locale: MarketingLocale): string {
  const base = homeHeroVideoPublicPaths[locale] ?? homeHeroVideoPublicPaths.en;
  return `${base}?cv=${HERO_VIDEO_CACHE_VERSION}`;
}

export function resolveHomeHeroVideoSrc(locale: MarketingLocale): string {
  return resolveHomeHeroVideoPlaybackSrc(locale);
}

export function homeHeroVideoObjectKey(relativePath: string): string {
  return relativePath.replace(/^\/+/u, "");
}

/** Map ASCII hero slug URL to the Unicode R2 object key, if applicable. */
export function resolveHeroR2ObjectKey(pathname: string): string | null {
  if (!pathname.startsWith("/videos/home/hero/")) return null;
  const slug = decodeURIComponent(pathname.split("/").pop() ?? "");
  const r2Filename = HERO_SLUG_TO_R2_FILENAME[slug];
  if (!r2Filename) return null;
  return `videos/home/hero/${r2Filename}`;
}
