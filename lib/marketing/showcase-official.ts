import type { MarketingShowcaseWorkDto } from "@/features/marketing-showcase/marketing-showcase.types";
import { CURATED_HOMEPAGE_SHOWCASE_WORKS } from "@/lib/marketing/home-showcase-curated";
import { resolveVideoEmbed, resolveWorkThumbnail, sanitizeVideoUrl } from "@/lib/media-url";

const LEGACY_VIDEO_PREFIX = "/videos/home/recent-work/";
const LEGACY_UNSPLASH_HOST = "images.unsplash.com";
const VIDEO_FILE_PATTERN = /\.(mp4|webm|mov|m4v)(\?|#|$)/iu;

function normalizeShowcaseVideoUrl(videoUrl: string): string {
  const video = sanitizeVideoUrl(videoUrl);
  const r2Match = video.match(/\/videos\/home\/recent-work\/[^?#]+/u);
  if (r2Match) return r2Match[0];
  return video;
}

function isHostedRecentWorkVideo(videoUrl: string): boolean {
  const video = normalizeShowcaseVideoUrl(videoUrl);
  if (!video.startsWith(LEGACY_VIDEO_PREFIX)) return false;
  const decoded = decodeURIComponent(video);
  return VIDEO_FILE_PATTERN.test(video) || VIDEO_FILE_PATTERN.test(decoded);
}

/** Unified rule: direct video files always use middle-frame capture in UI. */
export function isDirectShowcaseVideoFile(videoUrl: string): boolean {
  const video = normalizeShowcaseVideoUrl(videoUrl);
  if (!video) return false;
  if (resolveVideoEmbed(video).kind === "video") return true;
  if (video.startsWith("/videos/marketing/showcase/")) return true;
  if (isHostedRecentWorkVideo(video)) return true;
  const decoded = decodeURIComponent(video);
  return VIDEO_FILE_PATTERN.test(video) || VIDEO_FILE_PATTERN.test(decoded);
}

export function showcaseVideoSrc(
  work: Pick<MarketingShowcaseWorkDto, "video_url" | "thumbnail_url" | "title">
): string | null {
  const cover = resolveShowcaseCover(work);
  return cover.kind === "video" ? cover.src : null;
}

export function sanitizeShowcaseWorkForDisplay(work: MarketingShowcaseWorkDto): MarketingShowcaseWorkDto {
  const cover = resolveShowcaseCover(work);
  if (cover.kind !== "video") {
    return {
      ...work,
      thumbnail_url: showcaseThumbnailForDisplay(work) ?? ""
    };
  }

  return {
    ...work,
    thumbnail_url: "",
    video_url: cover.src
  };
}

export function dedupeShowcaseWorks(works: MarketingShowcaseWorkDto[]): MarketingShowcaseWorkDto[] {
  const curatedVideoUrls = new Set(
    CURATED_HOMEPAGE_SHOWCASE_WORKS.map((work) => normalizeShowcaseVideoUrl(work.video_url))
  );

  const seenVideoUrls = new Set<string>();
  const result: MarketingShowcaseWorkDto[] = [];

  for (const work of works) {
    const normalizedVideo = normalizeShowcaseVideoUrl(work.video_url);
    if (!normalizedVideo) continue;

    if (work.id.startsWith("work_")) continue;

    if (curatedVideoUrls.has(normalizedVideo) && !work.id.startsWith("curated_")) continue;

    if (seenVideoUrls.has(normalizedVideo)) continue;
    seenVideoUrls.add(normalizedVideo);

    result.push(sanitizeShowcaseWorkForDisplay(work));
  }

  return result;
}

export function isOfficialShowcaseWork(
  work: Pick<MarketingShowcaseWorkDto, "video_url" | "thumbnail_url">
): boolean {
  const video = normalizeShowcaseVideoUrl(work.video_url);
  if (!video) return false;
  if (video.includes("example.com")) return false;
  if (video.startsWith(LEGACY_VIDEO_PREFIX)) {
    return isHostedRecentWorkVideo(video);
  }
  return true;
}

export function filterOfficialShowcaseWorks(works: MarketingShowcaseWorkDto[]): MarketingShowcaseWorkDto[] {
  return works.filter(isOfficialShowcaseWork);
}

export function showcaseThumbnailForDisplay(
  work: Pick<MarketingShowcaseWorkDto, "thumbnail_url" | "video_url">
): string | undefined {
  const video = normalizeShowcaseVideoUrl(work.video_url);
  if (isDirectShowcaseVideoFile(video)) return undefined;
  const thumb = work.thumbnail_url?.trim() ?? "";
  if (thumb.includes(LEGACY_UNSPLASH_HOST)) return undefined;
  return thumb || undefined;
}

export function resolveShowcaseCover(
  work: Pick<MarketingShowcaseWorkDto, "thumbnail_url" | "video_url" | "title">
) {
  const video = normalizeShowcaseVideoUrl(work.video_url);

  if (isDirectShowcaseVideoFile(video)) {
    const embed = resolveVideoEmbed(video);
    return { kind: "video" as const, src: embed.kind === "video" ? embed.src : video };
  }

  const poster = resolveWorkThumbnail(video, showcaseThumbnailForDisplay(work));
  if (poster) {
    return { kind: "image" as const, src: poster };
  }

  return { kind: "placeholder" as const, label: work.title };
}
