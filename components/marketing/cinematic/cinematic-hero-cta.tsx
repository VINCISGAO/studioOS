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
  compactLocale = false
}: {
  target: MarketingHeroCtaTarget;
  title: string;
  description: string;
  isActive: boolean;
  onHover: () => void;
  onBlocked: (notice: string) => void;
  compactLocale?: boolean;
}) {
  const className = cn(
    "group flex min-h-[4.5rem] flex-1 items-center justify-between gap-2 rounded-2xl px-3.5 py-3 transition duration-300 sm:min-h-[6.35rem] sm:gap-4 sm:rounded-[1.25rem] sm:px-5 sm:py-5 md:min-h-[6.35rem] md:gap-4 md:rounded-[1.25rem] md:px-5 md:py-5",
    isActive
      ? "border border-transparent bg-white text-black hover:bg-zinc-100"
      : "border border-white/35 bg-black/35 text-white backdrop-blur-sm hover:border-white/35 hover:bg-black/35",
    !target.allowed && "cursor-not-allowed opacity-90"
  );

  const content = (
    <>
      <span className="min-w-0 text-left">
        <span
          className={cn(
            "block font-semibold leading-tight",
            compactLocale
              ? "text-[11.2px] sm:text-[16px] md:text-[20px]"
              : "text-[14px] sm:text-[20px] md:text-[20px]",
            isActive ? "text-black" : "text-white"
          )}
        >
          {title}
        </span>
        <span
          className={cn(
            "mt-1 block leading-tight",
            compactLocale
              ? "text-[8.8px] sm:mt-1.5 sm:text-[12.8px] md:mt-1.5 md:text-base"
              : "text-[11px] sm:mt-1.5 sm:text-base md:mt-1.5 md:text-base",
            isActive ? "text-zinc-500" : "text-white/55"
          )}
        >
          {description}
        </span>
      </span>
      <ArrowRight
        className={cn(
          "h-4 w-4 shrink-0 transition group-hover:translate-x-0.5 sm:h-5 sm:w-5 md:h-5 md:w-5",
          isActive ? "text-black" : "text-white"
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
  compactLocale = false
}: {
  brandCta: MarketingHeroCtaTarget;
  creatorCta: MarketingHeroCtaTarget;
  primary: string;
  secondary: string;
  primaryDescription: string;
  secondaryDescription: string;
  className?: string;
  compactLocale?: boolean;
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
        compactLocale={compactLocale}
      />
      <HeroCtaButton
        target={creatorCta}
        title={secondary}
        description={secondaryDescription}
        isActive={activeIndex === 1}
        onHover={() => setActiveIndex(1)}
        onBlocked={setBlockedNotice}
        compactLocale={compactLocale}
      />
      {blockedNotice ? (
        <p
          role="alert"
          className="basis-full rounded-xl border border-amber-400/30 bg-amber-500/10 px-3.5 py-2.5 text-sm leading-6 text-amber-100"
        >
          {blockedNotice}
        </p>
      ) : null}
    </div>
  );
}
