import type { MarketingShowcaseWorkDto } from "@/features/marketing-showcase/marketing-showcase.types";
import { resolveShowcaseCover } from "@/lib/marketing/showcase-official";

/** Poster URL for homepage cards — official showcase cover only. */
export function homeShowcasePosterSrc(work: Pick<MarketingShowcaseWorkDto, "thumbnail_url" | "video_url" | "title">) {
  const cover = resolveShowcaseCover(work);
  return cover.kind === "image" ? cover.src : null;
}
