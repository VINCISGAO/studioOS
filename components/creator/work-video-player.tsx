"use client";

import { useMemo } from "react";
import { WorkCoverImage } from "@/components/creator/work-cover-image";
import { resolveVideoEmbed, resolveWorkThumbnail, sanitizeVideoUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";

export function WorkVideoPlayer({
  videoUrl,
  thumbnailUrl,
  title,
  className
}: {
  videoUrl: string;
  thumbnailUrl?: string;
  title: string;
  className?: string;
}) {
  const embed = useMemo(() => resolveVideoEmbed(sanitizeVideoUrl(videoUrl)), [videoUrl]);
  const poster = resolveWorkThumbnail(videoUrl, thumbnailUrl) ?? undefined;

  if (embed.kind === "iframe") {
    return (
      <iframe
        key={embed.src}
        src={embed.src}
        title={title}
        className={cn("h-full w-full border-0", className)}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    );
  }

  if (embed.kind === "video") {
    return (
      <video
        src={embed.src}
        controls
        playsInline
        autoPlay
        poster={poster}
        className={cn("h-full w-full bg-black object-contain", className)}
      />
    );
  }

  return (
    <div className={cn("relative h-full w-full", className)}>
      <WorkCoverImage src={poster} alt={title} />
    </div>
  );
}
