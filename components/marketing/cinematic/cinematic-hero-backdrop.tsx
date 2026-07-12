"use client";

export function CinematicHeroBackdrop({
  src,
  src2x
}: {
  src: string;
  src2x?: string;
}) {
  const srcSet = src2x ? `${src} 1x, ${src2x} 2x` : undefined;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-white" aria-hidden>
      <img
        src={src}
        srcSet={srcSet}
        alt=""
        aria-hidden
        decoding="async"
        fetchPriority="high"
        draggable={false}
        className="pointer-events-none absolute inset-0 z-[1] h-full w-full select-none object-cover object-[78%_center] sm:object-[80%_center] md:object-[82%_center]"
      />
    </div>
  );
}
