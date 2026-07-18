"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { HomeHeroVideo } from "@/components/marketing/home-hero-video";
import type { MarketingLocale } from "@/lib/i18n";

function CompanionVideoBand({
  sectionTitle,
  children
}: {
  sectionTitle?: string;
  children: ReactNode;
}) {
  return (
    <section id="network" className="home-ai-companion-video-band" aria-label={sectionTitle}>
      <div className="home-ai-companion-video-band__top">
        <div className="home-ai-companion-video-band__frame">{children}</div>
      </div>
    </section>
  );
}

function LazyHomeHeroVideo({
  locale,
  videoSrc
}: {
  locale: MarketingLocale;
  videoSrc: string;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const node = shellRef.current;
    if (!node || shouldLoad) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "320px 0px", threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <div ref={shellRef} className="w-full">
      {shouldLoad ? (
        <HomeHeroVideo locale={locale} videoSrc={videoSrc} embedded />
      ) : (
        <div
          className="relative mx-auto aspect-[21/9] w-full overflow-hidden rounded-none bg-zinc-950 lg:max-w-[1216px] lg:rounded-lg lg:border lg:border-white/[0.12]"
          aria-hidden
        />
      )}
    </div>
  );
}

export function LandingAiCompanionVideoSlot({
  locale,
  videoSrc,
  placeholderLabel,
  sectionTitle,
  tone = "hero"
}: {
  locale: MarketingLocale;
  videoSrc: string;
  placeholderLabel: string;
  sectionTitle?: string;
  tone?: "hero" | "dark";
}) {
  const darkEmbedded = tone === "dark";

  if (videoSrc) {
    const player = <LazyHomeHeroVideo locale={locale} videoSrc={videoSrc} />;

    if (darkEmbedded) {
      return <CompanionVideoBand sectionTitle={sectionTitle}>{player}</CompanionVideoBand>;
    }

    return <section aria-label={sectionTitle}>{player}</section>;
  }

  const placeholder = (
    <div
      className="home-ai-companion-video-band__placeholder"
      aria-hidden={darkEmbedded ? undefined : true}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(139,92,246,0.18),transparent_58%)]" />
      <p className="relative z-[1] px-6 text-center text-xs text-zinc-400 sm:text-sm">{placeholderLabel}</p>
    </div>
  );

  if (darkEmbedded) {
    return <CompanionVideoBand sectionTitle={sectionTitle}>{placeholder}</CompanionVideoBand>;
  }

  return (
    <section
      className="home-hero-video-section bg-zinc-950 px-0 pb-0 pt-0 lg:px-8"
      aria-label={sectionTitle}
    >
      {placeholder}
    </section>
  );
}
