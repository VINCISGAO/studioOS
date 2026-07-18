import type { MarketingLocale } from "@/lib/i18n";
import {
  encodeHeroVideoSegment,
  homeAiCompanionVideoFilename
} from "@/lib/marketing/home-hero-video-sources";

const AI_COMPANION_VIDEO_CACHE_VERSION = "1";

export { homeAiCompanionVideoFilename };

export function resolveHomeAiCompanionVideoPublicPath(): string {
  return `/videos/home/hero/${encodeHeroVideoSegment(homeAiCompanionVideoFilename)}`;
}

/**
 * Same-origin companion video URL — `/videos/*` proxies to R2/CDN with Range streaming.
 * All locales share one animation asset; playback uses `HomeHeroVideo`.
 */
export function resolveHomeAiCompanionVideoPlaybackSrc(_locale: MarketingLocale): string {
  const override =
    process.env.NEXT_PUBLIC_HOME_AI_COMPANION_VIDEO_SRC?.trim() ||
    process.env.HOME_AI_COMPANION_VIDEO_SRC?.trim();

  if (override?.startsWith("/videos/")) {
    return override.includes("?cv=") ? override : `${override}?cv=${AI_COMPANION_VIDEO_CACHE_VERSION}`;
  }

  return `${resolveHomeAiCompanionVideoPublicPath()}?cv=${AI_COMPANION_VIDEO_CACHE_VERSION}`;
}
