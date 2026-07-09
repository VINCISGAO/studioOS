import Image from "next/image";
import type { ReactNode } from "react";

const HERO_BRAND_LOGOS = [
  { label: "Shopify", src: "/images/social-sources/brand/shopify-2.svg", width: 88, height: 24 },
  { label: "Amazon", src: "/images/social-sources/brand/logo-amazon.svg", width: 96, height: 28 },
  { label: "Google", src: "/images/social-sources/brand/google-1-1.svg", width: 88, height: 28 },
  { label: "Coca-Cola", src: "/images/social-sources/brand/cocacola.svg", width: 108, height: 28 },
  { label: "Samsung", src: "/images/social-sources/brand/samsung-8.svg", width: 108, height: 22 },
  { label: "Airbnb", src: "/images/social-sources/brand/airbnb.svg", width: 92, height: 28 },
  { label: "TikTok", src: "/images/social-sources/brand/tiktok-plain-1.svg", width: 88, height: 24 },
  { label: "Meta", src: "/images/social-sources/brand/meta-quest-1.svg", width: 88, height: 24 }
] as const;

function HeroBrandLogo({
  label,
  src,
  width,
  height,
  className
}: {
  label: string;
  src: string;
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={label}
      width={width}
      height={height}
      className={className}
      unoptimized
    />
  );
}

const logoToneClass =
  "h-5 w-auto max-w-[6.75rem] object-contain object-left brightness-0 invert opacity-45 sm:h-[1.375rem] sm:max-w-[7.5rem] sm:opacity-50";

function HeroBrandMarquee() {
  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="animate-hero-brand-marquee flex w-max">
        {[0, 1].map((setIndex) => (
          <div
            key={setIndex}
            className="flex shrink-0 items-center gap-10 pr-10 sm:gap-14 sm:pr-14"
            aria-hidden={setIndex === 1}
          >
            {HERO_BRAND_LOGOS.map((brand) => (
              <HeroBrandLogo
                key={`${setIndex}-${brand.label}`}
                label={brand.label}
                src={brand.src}
                width={brand.width}
                height={brand.height}
                className={`${logoToneClass} shrink-0`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroBrandPanel({ trustLabel, children }: { trustLabel: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-5 backdrop-blur-md sm:px-6 sm:py-6">
      <p className="text-center text-sm font-medium tracking-wide text-zinc-400">{trustLabel}</p>
      <div className="mt-5 sm:mt-6">{children}</div>
    </div>
  );
}

export function CinematicHeroBrandsDesktop({ trustLabel }: { trustLabel: string }) {
  return (
    <div className="hidden sm:block sm:pt-8">
      <HeroBrandPanel trustLabel={trustLabel}>
        <HeroBrandMarquee />
      </HeroBrandPanel>
    </div>
  );
}

export function CinematicHeroBrandsMobile({ trustLabel }: { trustLabel: string }) {
  return (
    <div className="mt-10 sm:hidden">
      <HeroBrandPanel trustLabel={trustLabel}>
        <HeroBrandMarquee />
      </HeroBrandPanel>
    </div>
  );
}
