"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function PortalAccountAvatar({
  initials,
  avatarUrl,
  size = "md",
  accent = "zinc",
  className
}: {
  initials: string;
  avatarUrl?: string;
  size?: "sm" | "md";
  accent?: "zinc" | "violet" | "indigo";
  className?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  const bg =
    accent === "violet" ? "bg-violet-600" : accent === "indigo" ? "bg-indigo-600" : "bg-zinc-900";
  const imageSrc = avatarUrl && !imageFailed ? avatarUrl : null;

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white",
        dim,
        !imageSrc && bg,
        className
      )}
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt=""
          fill
          className="object-cover"
          sizes="40px"
          loading="eager"
          fetchPriority="high"
          unoptimized
          onError={() => setImageFailed(true)}
        />
      ) : (
        initials.slice(0, 2)
      )}
    </div>
  );
}
