"use client";

import { ShowcaseVideoPoster } from "@/components/marketing/showcase/showcase-video-poster";
import { WorkCoverImage } from "@/components/creator/work-cover-image";
import type { MarketingShowcaseWorkDto } from "@/features/marketing-showcase/marketing-showcase.types";
import { resolveShowcaseCover } from "@/lib/marketing/showcase-official";
import { cn } from "@/lib/utils";

/** Unified showcase cover — direct video files always render middle-frame stills. */
export function ShowcaseCover({
  work,
  className,
  priority = false,
  imageClassName
}: {
  work: Pick<MarketingShowcaseWorkDto, "thumbnail_url" | "video_url" | "title">;
  className?: string;
  priority?: boolean;
  imageClassName?: string;
}) {
  const cover = resolveShowcaseCover(work);

  if (cover.kind === "video") {
    return <ShowcaseVideoPoster src={cover.src} className={className} priority={priority} />;
  }

  if (cover.kind === "image") {
    return (
      <WorkCoverImage
        src={cover.src}
        alt={work.title}
        className={cn("h-full w-full object-cover", imageClassName, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-zinc-800 px-3 text-center text-xs text-zinc-500",
        className
      )}
    >
      {cover.label}
    </div>
  );
}
