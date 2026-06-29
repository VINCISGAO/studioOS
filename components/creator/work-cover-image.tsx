"use client";

import Image from "next/image";
import { useState } from "react";
import { canOptimizeImageSrc } from "@/lib/media-url";
import { cn } from "@/lib/utils";

function CoverPlaceholder({
  alt,
  className,
  fill
}: {
  alt: string;
  className?: string;
  fill?: boolean;
}) {
  return (
    <div
      className={cn(
        fill ? "absolute inset-0" : "",
        "flex items-center justify-center bg-zinc-200",
        className
      )}
      aria-label={alt}
    />
  );
}

export function WorkCoverImage({
  src,
  alt,
  className,
  fill = true
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fill?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <CoverPlaceholder alt={alt} className={className} fill={fill} />;
  }

  if (canOptimizeImageSrc(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        sizes="(max-width: 640px) 50vw, 33vw"
        className={cn(fill ? "object-cover" : "", className)}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn(fill ? "absolute inset-0 h-full w-full object-cover" : "object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}
