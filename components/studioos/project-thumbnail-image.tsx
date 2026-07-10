"use client";

import { useState } from "react";
import { fallbackProjectThumbnail } from "@/lib/studioos/project-thumbnail";
import { cn } from "@/lib/utils";

export function ProjectThumbnailImage({
  src,
  seed,
  alt = "",
  className
}: {
  src: string;
  seed: string;
  alt?: string;
  className?: string;
}) {
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={cn("h-full w-full object-cover", className)}
      loading="lazy"
      onError={() => {
        const fallback = fallbackProjectThumbnail(seed);
        if (currentSrc !== fallback) {
          setCurrentSrc(fallback);
        }
      }}
    />
  );
}
