"use client";

import { cn } from "@/lib/utils";

export function CinematicHeroBackdrop({
  src,
  src2x
}: {
  src: string;
  src2x?: string;
}) {
  const srcSet = src2x ? `${src} 1x, ${src2x} 2x` : undefined;

  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
      <img
        src={src}
        srcSet={srcSet}
        alt=""
        aria-hidden
        decoding="async"
        fetchPriority="high"
        draggable={false}
        className={cn(
          "pointer-events-none absolute z-0 max-w-none select-none",
          "left-[80%] right-auto w-auto object-contain",
          "h-[73%] top-[38%] -translate-x-1/2 -translate-y-[38%]",
          "md:inset-auto md:left-[77%] md:right-auto md:top-[48%] md:h-[118%] md:max-h-none md:w-auto md:-translate-x-1/2 md:-translate-y-1/2 md:object-contain"
        )}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(to_right,rgba(0,0,0,0.34)_0%,rgba(0,0,0,0.14)_42%,transparent_72%)] md:bg-[linear-gradient(to_right,rgba(0,0,0,0.3)_0%,rgba(0,0,0,0.1)_46%,transparent_76%)]"
      />
    </div>
  );
}
