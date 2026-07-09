import type { MarketingLocale } from "@/lib/i18n";

/** R2 object filenames — language code in parentheses (matches dashboard upload). */
export const homeHeroVideoFilenames: Record<MarketingLocale, string> = {
  en: "VINCIS Brand Film (EN).mp4",
  "zh-CN": "VINCIS Brand Film (ZH-CN).mp4",
  "zh-TW": "VINCIS Brand Film (ZH-TW).mp4",
  ja: "VINCIS Brand Film (JA).mp4",
  ko: "VINCIS Brand Film (KO).mp4",
  ms: "VINCIS Brand Film (MS).mp4",
  km: "VINCIS Brand Film (KM).mp4",
  th: "VINCIS Brand Film (TH).mp4",
  vi: "VINCIS Brand Film (VI).mp4",
  fr: "VINCIS Brand Film (FR).mp4",
  es: "VINCIS Brand Film (ES).mp4"
};

const KNOWN_HERO_FILENAMES = new Set(Object.values(homeHeroVideoFilenames));

/** Bust browser/CDN caches after URL scheme changes. */
const HERO_VIDEO_CACHE_VERSION = "7";

export function encodeHeroVideoSegment(filename: string): string {
  return encodeURIComponent(filename);
}

export function resolveHomeHeroVideoPublicPath(locale: MarketingLocale): string {
  const filename = homeHeroVideoFilenames[locale] ?? homeHeroVideoFilenames.en;
  return `/videos/home/hero/${encodeHeroVideoSegment(filename)}`;
}

/**
 * Same-origin hero video URL — `/videos/*` proxies to R2/CDN with Range streaming.
 * Locale → filename → encoded path. No slug indirection.
 */
export function resolveHomeHeroVideoPlaybackSrc(locale: MarketingLocale): string {
  return `${resolveHomeHeroVideoPublicPath(locale)}?cv=${HERO_VIDEO_CACHE_VERSION}`;
}

export function resolveHomeHeroVideoSrc(locale: MarketingLocale): string {
  return resolveHomeHeroVideoPlaybackSrc(locale);
}

export const homeHeroVideoPublicPaths: Record<MarketingLocale, string> = Object.fromEntries(
  Object.entries(homeHeroVideoFilenames).map(([locale]) => [
    locale,
    resolveHomeHeroVideoPublicPath(locale as MarketingLocale)
  ])
) as Record<MarketingLocale, string>;

/** @deprecated Use `homeHeroVideoFilenames`. */
export const homeHeroVideoR2Filenames = homeHeroVideoFilenames;

/** @deprecated Use `homeHeroVideoPublicPaths`. */
export const homeHeroVideoRelativePaths = homeHeroVideoPublicPaths;

export function marketingCdnBaseUrl(): string | null {
  const upstream = process.env.MARKETING_CDN_UPSTREAM?.trim();
  if (upstream) return upstream.replace(/\/+$/u, "");
  const base = process.env.NEXT_PUBLIC_MARKETING_CDN_URL?.trim();
  if (!base) return null;
  return base.replace(/\/+$/u, "");
}

export function resolveHeroPathSegment(pathname: string): string {
  return decodeURIComponent(pathname.split("/").pop()?.split("?")[0] ?? "");
}

export function resolveHeroFilenameFromPathname(pathname: string): string | null {
  if (!pathname.startsWith("/videos/home/hero/")) return null;
  const segment = resolveHeroPathSegment(pathname);
  if (!segment || !KNOWN_HERO_FILENAMES.has(segment)) return null;
  return segment;
}

/** R2 keys to probe — standard folder first, then flat dashboard upload. */
export function heroR2ObjectKeyCandidates(pathname: string): string[] {
  const filename = resolveHeroFilenameFromPathname(pathname);
  if (!filename) return [];
  return [`videos/home/hero/${filename}`, filename];
}

export function resolveHeroR2ObjectKey(pathname: string): string | null {
  return heroR2ObjectKeyCandidates(pathname)[0] ?? null;
}

export function resolveHeroLocalRelativePath(pathname: string): string | null {
  const filename = resolveHeroFilenameFromPathname(pathname);
  return filename ? `videos/home/hero/${filename}` : null;
}
