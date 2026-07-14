import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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

const logoToneClassDark =
  "h-5 w-auto max-w-[6.75rem] object-contain object-left brightness-0 invert opacity-45 sm:h-[1.375rem] sm:max-w-[7.5rem] sm:opacity-50";

const logoToneClassLight =
  "h-5 w-auto max-w-[6.75rem] object-contain object-left brightness-0 opacity-35 sm:h-[1.375rem] sm:max-w-[7.5rem] sm:opacity-40";

function HeroBrandMarquee({ lightHero = false }: { lightHero?: boolean }) {
  const logoToneClass = lightHero ? logoToneClassLight : logoToneClassDark;
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

function HeroBrandPanel({
  trustLabel,
  children,
  lightHero = false
}: {
  trustLabel: string;
  children: ReactNode;
  lightHero?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl px-5 py-5 sm:px-6 sm:py-6",
        lightHero
          ? "border border-zinc-200/80 bg-zinc-50/60"
          : "border border-white/10 bg-white/[0.035] backdrop-blur-md"
      )}
    >
      <p
        className={cn(
          "text-center text-sm font-medium tracking-wide",
          lightHero ? "text-zinc-500" : "text-zinc-400"
        )}
      >
        {trustLabel}
      </p>
      <div className="mt-5 sm:mt-6">{children}</div>
    </div>
  );
}

export function CinematicHeroBrandsDesktop({
  trustLabel,
  className,
  lightHero = false
}: {
  trustLabel: string;
  className?: string;
  lightHero?: boolean;
}) {
  return (
    <div className={cn("marketing-hero-brands-wrap min-w-0 pt-8", className)}>
      <HeroBrandPanel trustLabel={trustLabel} lightHero={lightHero}>
        <HeroBrandMarquee lightHero={lightHero} />
      </HeroBrandPanel>
    </div>
  );
}

export function CinematicHeroBrandsMobile({
  trustLabel,
  lightHero = false
}: {
  trustLabel: string;
  lightHero?: boolean;
}) {
  return (
    <div className="mt-10 md:hidden">
      <HeroBrandPanel trustLabel={trustLabel} lightHero={lightHero}>
        <HeroBrandMarquee lightHero={lightHero} />
      </HeroBrandPanel>
    </div>
  );
}
