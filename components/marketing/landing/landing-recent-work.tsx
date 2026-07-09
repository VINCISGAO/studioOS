"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { WorkCoverImage } from "@/components/creator/work-cover-image";
import { MarketingEyebrowPill } from "@/components/marketing/landing/landing-ui";
import { RevealSection, cinematicEase } from "@/components/marketing/landing/landing-motion";
import { landingText } from "@/lib/marketing/landing-copy";
import { creators } from "@/lib/data";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { isChineseLanguage, withLocale } from "@/lib/i18n";
import { labelPlatform, labelWorkCategory } from "@/lib/localized-options";
import { resolveVideoEmbed, resolveWorkThumbnail } from "@/lib/media-url";
import type { CreatorWork } from "@/lib/types";
import type { WorkEngagementSnapshot } from "@/lib/work-engagement-utils";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function WorkCardMedia({
  work,
  className,
  featured = false,
  videoRef,
  muted,
  onError
}: {
  work: CreatorWork;
  className: string;
  featured?: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  muted: boolean;
  onError: () => void;
}) {
  const embed = resolveVideoEmbed(work.video_url);
  const poster = resolveWorkThumbnail(work.video_url, work.thumbnail_url);

  if (embed.kind === "video") {
    return (
      <video
        ref={videoRef}
        src={embed.src}
        poster={poster ?? undefined}
        className={cn(className, "absolute inset-0")}
        muted={muted}
        loop
        playsInline
        autoPlay
        preload={featured ? "auto" : "metadata"}
        aria-label={work.title}
        onError={onError}
      />
    );
  }

  if (poster) {
    return <WorkCoverImage src={poster} alt={work.title} className={className} />;
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-xs text-zinc-500">
      {work.title}
    </div>
  );
}

function WorkCard({
  work,
  locale,
  copyLocale = locale,
  featured = false
}: {
  work: CreatorWork;
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
  featured?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const embed = resolveVideoEmbed(work.video_url);
  const hasInlineVideo = embed.kind === "video" && !useFallback;

  const creator = creators.find((item) => item.id === work.creator_id);
  const href = creator
    ? withLocale(`/creators/${creator.id}?work=${work.id}`, copyLocale)
    : withLocale("/case-studies", copyLocale);
  const mediaClassName = "h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]";
  const meta = `${labelWorkCategory(work.category, locale)} · ${labelPlatform(work.platform, locale)}`;
  const featuredLabel = landingText("work", copyLocale).featured;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasInlineVideo) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    setIsPlaying(!video.paused);
    void video.play().catch(() => setIsPlaying(false));
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [hasInlineVideo, embed.kind === "video" ? embed.src : ""]);

  function toggleInlineVideo(event: MouseEvent) {
    if (!hasInlineVideo) return;
    event.preventDefault();
    event.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      setMuted(false);
      video.muted = false;
      void video.play().catch(() => undefined);
      return;
    }
    video.pause();
  }

  const shellClassName = cn(
    "group block h-full",
    !featured && "rounded-2xl bg-white shadow-[0_14px_40px_-28px_rgba(0,0,0,0.35)]",
    hasInlineVideo && "cursor-pointer"
  );

  const mediaBlock = (
    <div
      className={cn(
        "relative overflow-hidden bg-zinc-900 transition duration-500",
        featured
          ? "h-[260px] rounded-2xl shadow-[0_18px_60px_-30px_rgba(0,0,0,0.45)] sm:h-[360px]"
          : "h-[118px] rounded-t-2xl sm:h-[112px]"
      )}
      onClick={hasInlineVideo ? toggleInlineVideo : undefined}
      role={hasInlineVideo ? "button" : undefined}
      aria-label={
        hasInlineVideo
          ? isChineseLanguage(copyLocale)
            ? `播放或暂停 ${work.title}`
            : `Play or pause ${work.title}`
          : undefined
      }
    >
      <WorkCardMedia
        work={work}
        className={mediaClassName}
        featured={featured}
        videoRef={videoRef}
        muted={muted}
        onError={() => setUseFallback(true)}
      />
      {hasInlineVideo && !isPlaying ? (
        <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md sm:h-11 sm:w-11">
            <Play className="ml-0.5 h-4 w-4 fill-current" />
          </span>
        </div>
      ) : null}
      {featured ? (
        <>
          <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/75 via-black/20 to-black/5" />
          <span className="pointer-events-none absolute left-5 top-5 z-[2] inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm">
            <span className="text-violet-300">✦</span>
            {featuredLabel}
          </span>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex items-end justify-between gap-4 p-5 sm:p-6">
            <span className="inline-flex shrink-0 items-center gap-2 text-xs font-medium text-white">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-zinc-950">
                <Play className="ml-0.5 h-3 w-3 fill-zinc-950" />
              </span>
              {isChineseLanguage(copyLocale) ? "观看案例视频" : "Watch case video"}
            </span>
            <span className="min-w-0 text-right">
              <p className="text-xs text-zinc-300 sm:text-sm">{meta}</p>
            </span>
          </div>
        </>
      ) : null}
    </div>
  );

  const footer = !featured ? (
    <div className="flex items-center justify-between gap-3 p-3">
      <span className="min-w-0">
        <h3 className="text-sm font-semibold text-zinc-950 line-clamp-1">{work.title}</h3>
        <p className="mt-1 text-xs text-zinc-500">{meta}</p>
      </span>
      {!hasInlineVideo ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-zinc-950 transition group-hover:border-black/20 group-hover:bg-zinc-950 group-hover:text-white">
          <ArrowRight className="h-4 w-4" />
        </span>
      ) : null}
    </div>
  ) : null;

  if (hasInlineVideo) {
    return (
      <div className={shellClassName}>
        {mediaBlock}
        {footer}
      </div>
    );
  }

  return (
    <Link href={href} className={shellClassName}>
      {mediaBlock}
      {footer}
    </Link>
  );
}

export function LandingRecentWork({
  locale,
  copyLocale = locale,
  works
}: {
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
  works: CreatorWork[];
  engagement?: Record<string, WorkEngagementSnapshot>;
  isLoggedIn?: boolean;
}) {
  const t = landingText("work", copyLocale);
  const [hero, ...rest] = works.slice(0, 5);
  const subtitle = isChineseLanguage(copyLocale)
    ? "来自全球品牌的真实项目，创意驱动结果。"
    : "Real projects from global brands, creative built to drive outcomes.";

  return (
    <section className="bg-[#f7f6f1] pb-11 pt-10 sm:pb-16 sm:pt-16">
      <div className="mx-auto max-w-[1060px] px-4 sm:px-6 lg:px-0">
        <RevealSection className="mx-auto max-w-3xl text-center">
          <MarketingEyebrowPill tone="light">{t.eyebrow}</MarketingEyebrowPill>
          <h2 className="mt-2 text-[2rem] font-semibold leading-none tracking-[-0.045em] text-zinc-950 sm:text-[2.45rem]">{t.title}</h2>
          <p className="mt-4 text-sm text-zinc-500">{subtitle}</p>
        </RevealSection>

        {hero ? (
          <>
            <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-9 sm:gap-4 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1.1fr)]">
              <motion.div
                className="col-span-2 lg:col-span-1"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: cinematicEase }}
              >
                <WorkCard work={hero} locale={locale} copyLocale={copyLocale} featured />
              </motion.div>

              <div className="contents lg:grid lg:grid-cols-2 lg:gap-4">
                {rest.map((work, index) => (
                  <motion.div
                    key={work.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: cinematicEase, delay: index * 0.06 }}
                  >
                    <WorkCard work={work} locale={locale} copyLocale={copyLocale} />
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="mt-7 flex justify-center sm:mt-8">
              <Link
                href={withLocale("/case-studies", copyLocale)}
                className="inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-2 text-center text-sm font-semibold leading-snug text-white shadow-[0_18px_40px_-24px_rgba(0,0,0,0.85)] transition hover:bg-zinc-800"
              >
                {t.viewAll}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
