import type { MarketingShowcaseWorkDto } from "@/features/marketing-showcase/marketing-showcase.types";
import { showcaseThumbnailForDisplay } from "@/lib/marketing/showcase-official";

/** Poster URL for homepage cards — CDN `.jpg` alongside recent-work video. */
export function homeShowcasePosterSrc(
  work: Pick<MarketingShowcaseWorkDto, "thumbnail_url" | "video_url" | "title">
) {
  return showcaseThumbnailForDisplay(work) ?? null;
}
