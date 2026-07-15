"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { MarketingHeroCtaTarget } from "@/lib/marketing/portal-entry";
import { cn } from "@/lib/utils";

function HeroCtaButton({
  target,
  title,
  description,
  isActive,
  onHover,
  onBlocked,
  lightHero = false
}: {
  target: MarketingHeroCtaTarget;
  title: string;
  description: string;
  isActive: boolean;
  onHover: () => void;
  onBlocked: (notice: string) => void;
  lightHero?: boolean;
}) {
  const className = cn(
    "group flex min-h-[4.5rem] flex-1 items-center justify-between gap-2 rounded-2xl px-3.5 py-3 transition duration-300 sm:min-h-[6.35rem] sm:gap-4 sm:rounded-[1.25rem] sm:px-5 sm:py-5 md:min-h-[6.35rem] md:gap-4 md:rounded-[1.25rem] md:px-5 md:py-5",
    lightHero
      ? isActive
        ? "border border-transparent bg-black text-white hover:bg-zinc-900"
        : "border border-zinc-200 bg-white text-black hover:border-zinc-300 hover:bg-zinc-50"
      : isActive
        ? "border border-transparent bg-white text-black hover:bg-zinc-100"
        : "border border-white/35 bg-black/35 text-white backdrop-blur-sm hover:border-white/35 hover:bg-black/35",
    !target.allowed && "cursor-not-allowed opacity-90"
  );

  const content = (
    <>
      <span className="min-w-0 text-left">
        <span
          className={cn(
            "block text-[14px] font-semibold leading-tight sm:text-[20px] md:text-[20px]",
            lightHero
              ? isActive
                ? "text-white"
                : "text-black"
              : isActive
                ? "text-black"
                : "text-white"
          )}
        >
          {title}
        </span>
        <span
          className={cn(
            "mt-1 block text-[11px] leading-tight sm:mt-1.5 sm:text-base md:mt-1.5 md:text-base",
            lightHero
              ? isActive
                ? "text-white/70"
                : "text-zinc-500"
              : isActive
                ? "text-zinc-500"
                : "text-white/55"
          )}
        >
          {description}
        </span>
      </span>
      <ArrowRight
        className={cn(
          "h-4 w-4 shrink-0 transition group-hover:translate-x-0.5 sm:h-5 sm:w-5 md:h-5 md:w-5",
          lightHero
            ? isActive
              ? "text-white"
              : "text-black"
            : isActive
              ? "text-black"
              : "text-white"
        )}
      />
    </>
  );

  if (!target.allowed) {
    return (
      <button
        type="button"
        onMouseEnter={onHover}
        onClick={() => onBlocked(target.blockedNotice ?? "")}
        className={className}
        aria-disabled="true"
      >
        {content}
      </button>
    );
  }

  return (
    <Link href={target.href} prefetch onMouseEnter={onHover} className={className}>
      {content}
    </Link>
  );
}

export function HeroCtaGroup({
  brandCta,
  creatorCta,
  primary,
  secondary,
  primaryDescription,
  secondaryDescription,
  className,
  lightHero = false
}: {
  brandCta: MarketingHeroCtaTarget;
  creatorCta: MarketingHeroCtaTarget;
  primary: string;
  secondary: string;
  primaryDescription: string;
  secondaryDescription: string;
  className?: string;
  lightHero?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [blockedNotice, setBlockedNotice] = useState<string | null>(null);

  return (
    <div className={className} onMouseLeave={() => setActiveIndex(0)}>
      <HeroCtaButton
        target={brandCta}
        title={primary}
        description={primaryDescription}
        isActive={activeIndex === 0}
        onHover={() => setActiveIndex(0)}
        onBlocked={setBlockedNotice}
        lightHero={lightHero}
      />
      <HeroCtaButton
        target={creatorCta}
        title={secondary}
        description={secondaryDescription}
        isActive={activeIndex === 1}
        onHover={() => setActiveIndex(1)}
        onBlocked={setBlockedNotice}
        lightHero={lightHero}
      />
      {blockedNotice ? (
        <p
          role="alert"
          className={cn(
            "basis-full rounded-xl border px-3.5 py-2.5 text-sm leading-6",
            lightHero
              ? "border-amber-300/60 bg-amber-50 text-amber-900"
              : "border-amber-400/30 bg-amber-500/10 text-amber-100"
          )}
        >
          {blockedNotice}
        </p>
      ) : null}
    </div>
  );
}
