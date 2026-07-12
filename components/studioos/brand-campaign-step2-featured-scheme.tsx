"use client";

import Image from "next/image";
import type { CreativeDirection } from "@/features/ai/creative-direction.types";
import { SchemeMetricSparkline } from "@/components/studioos/brand-campaign-step2-scheme-charts";
import { BRAND_CAMPAIGN_STEP2_SCHEME_COPY } from "@/lib/studioos/brand-campaign-step2-copy";
import { STEP2_SCHEME_LAYOUT } from "@/lib/studioos/brand-campaign-step2-layout";
import type { SchemeDisplayMetrics } from "@/lib/studioos/brand-campaign-scheme-metrics";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const PREVIEW_FRAME_COUNT = 3;

function displaySceneLabel(
  label: string,
  locale: Locale,
  index: number,
  fallback: (sceneIndex: number) => string
) {
  const trimmed = label.trim();
  if (locale === "zh") {
    const sceneMatch = trimmed.match(/scene\s*0*(\d+)/i);
    if (sceneMatch) {
      return `${BRAND_CAMPAIGN_STEP2_SCHEME_COPY.zh.sceneLabel} ${sceneMatch[1].padStart(2, "0")}`;
    }
  }
  return trimmed || fallback(index);
}

function resolvePreviewFrames(productImageUrl: string | null, frameUrls?: string[]): (string | null)[] {
  const fromApi = frameUrls?.map((url) => url.trim()).filter(Boolean).slice(0, PREVIEW_FRAME_COUNT);
  if (fromApi && fromApi.length > 0) {
    while (fromApi.length < PREVIEW_FRAME_COUNT) {
      fromApi.push(fromApi[fromApi.length - 1] ?? productImageUrl);
    }
    return fromApi.slice(0, PREVIEW_FRAME_COUNT);
  }
  return Array.from({ length: PREVIEW_FRAME_COUNT }, () => productImageUrl);
}

function FeaturedStoryboardStrip({
  locale,
  productImageUrl,
  frameUrls,
  showImages
}: {
  locale: Locale;
  productImageUrl: string | null;
  frameUrls?: string[];
  showImages: boolean;
}) {
  const t = BRAND_CAMPAIGN_STEP2_SCHEME_COPY[locale];
  const frames = resolvePreviewFrames(productImageUrl, frameUrls);
  const revealImages = showImages || Boolean(productImageUrl);

  return (
    <div className={STEP2_SCHEME_LAYOUT.featuredMediaRow} aria-label={t.storyboardPreview}>
      {frames.map((frameUrl, index) => (
        <div key={`${index}-${frameUrl ?? "empty"}`} className={STEP2_SCHEME_LAYOUT.featuredMediaFrame}>
          {revealImages && frameUrl ? (
            <Image src={frameUrl} alt="" fill className="object-cover" unoptimized />
          ) : (
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                revealImages
                  ? "bg-gradient-to-br from-zinc-800 to-violet-950"
                  : "border border-dashed border-zinc-200 bg-zinc-50"
              )}
            >
              {!revealImages ? <p className="px-1 text-center text-[9px] text-zinc-400">{t.mediaComingSoon}</p> : null}
            </div>
          )}
          <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1 py-px text-[9px] font-medium tabular-nums text-white/90">
            {t.frame} {index + 1}
          </span>
        </div>
      ))}
    </div>
  );
}

function FeaturedMetricsPanel({ locale, metrics }: { locale: Locale; metrics: SchemeDisplayMetrics }) {
  const t = BRAND_CAMPAIGN_STEP2_SCHEME_COPY[locale];
  const items = [
    { label: t.audienceMatch, value: `${metrics.audienceMatch}%`, seed: metrics.audienceMatch },
    { label: t.emotionalResonance, value: `${metrics.emotionalResonance}%`, seed: metrics.emotionalResonance },
    { label: t.productIntegration, value: `${metrics.productIntegration}%`, seed: metrics.productIntegration },
    { label: t.estimatedCtr, value: metrics.estimatedCtr, seed: metrics.audienceMatch + 7 },
    { label: t.duration, value: metrics.recommendedDuration, seed: 42 },
    { label: t.difficulty, value: metrics.aiProductionDifficulty, seed: 58 },
    {
      label: t.industries,
      value: metrics.suitableIndustries.length
        ? metrics.suitableIndustries.slice(0, 2).join(", ")
        : t.aiPending,
      seed: 76
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-0 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2.5 sm:rounded-xl"
        >
          <p className="line-clamp-2 text-[10px] leading-4 text-zinc-500 sm:truncate">{item.label}</p>
          <div className="mt-1.5 flex items-end justify-between gap-1">
            <p className="min-w-0 truncate text-sm font-semibold tabular-nums leading-none text-zinc-900">
              {item.value}
            </p>
            <SchemeMetricSparkline seed={item.seed} className="hidden shrink-0 opacity-60 sm:block" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FeaturedCopyBlock({
  locale,
  direction,
  metrics
}: {
  locale: Locale;
  direction: CreativeDirection;
  metrics: SchemeDisplayMetrics;
}) {
  const t = BRAND_CAMPAIGN_STEP2_SCHEME_COPY[locale];
  const sceneFallbackLabel = (index: number) =>
    `${t.sceneLabel} ${String(index + 1).padStart(2, "0")}`;
  const storyScenes = (direction.storyStructure?.length
    ? direction.storyStructure
    : metrics.highlights.map((item, index) => ({
        label: sceneFallbackLabel(index),
        title: item,
        purpose: item
      }))).slice(0, 5);

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="grid gap-3 border-t border-zinc-100 pt-4 sm:gap-4 sm:pt-5 lg:grid-cols-2">
        <div className="min-w-0 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2.5 sm:rounded-xl sm:p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{t.bigIdea}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-800 sm:mt-2">{direction.bigIdea || direction.coreIdea}</p>
        </div>
        <div className="min-w-0 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2.5 sm:rounded-xl sm:p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{t.openingHook}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-700 sm:mt-2">{direction.openingHook || direction.hook}</p>
        </div>
      </div>

      <div className="border-t border-zinc-100 pt-4 sm:pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{t.storyStructure}</p>
        <ol
          className={cn(
            "mt-2 divide-y divide-zinc-100 overflow-hidden rounded-lg border border-zinc-100 bg-zinc-50/40",
            "md:mt-3 md:grid md:divide-y-0 md:gap-2 md:rounded-none md:border-0 md:bg-transparent",
            storyScenes.length <= 3 ? "md:grid-cols-3" : storyScenes.length === 4 ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          )}
        >
          {storyScenes.map((scene, index) => (
            <li
              key={`${scene.label}-${scene.title}-${index}`}
              className="flex min-w-0 gap-2.5 px-3 py-2 sm:py-2.5 md:flex-col md:rounded-lg md:border md:border-zinc-100 md:bg-white md:px-2.5 md:py-2.5"
            >
              <span className="w-9 shrink-0 pt-px text-[10px] font-semibold tabular-nums leading-4 text-zinc-400 md:w-auto md:text-[9px]">
                {displaySceneLabel(scene.label, locale, index, sceneFallbackLabel)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-5 text-zinc-900">{scene.title}</p>
                {scene.purpose && scene.purpose !== scene.title ? (
                  <p className="mt-0.5 text-xs leading-4 text-zinc-500">{scene.purpose}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-2 border-t border-zinc-100 pt-4 sm:gap-3 sm:pt-5 md:grid-cols-2 xl:grid-cols-3">
        {[
          [t.visualStyle, direction.visualStyle],
          [t.cameraLanguage, direction.cameraLanguage],
          [t.colorPalette, direction.colorPalette],
          [t.musicDirection, direction.musicDirection],
          [t.creatorRequirements, direction.creatorRequirements || direction.recommendedCreatorType],
          [t.whyRecommended, direction.whyAiRecommendsThis || direction.rationale]
        ].filter(([, value]) => Boolean(value)).map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-lg bg-zinc-50/80 px-3 py-2.5 sm:rounded-xl sm:p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
            <p className="mt-1.5 text-sm leading-5 text-zinc-700 sm:mt-2 sm:leading-6">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BrandCampaignStep2FeaturedScheme({
  locale,
  direction,
  metrics,
  productImageUrl,
  previewFrameUrls,
  showImages,
  textOnly = false
}: {
  locale: Locale;
  direction: CreativeDirection;
  metrics: SchemeDisplayMetrics;
  productImageUrl: string | null;
  previewFrameUrls?: string[];
  showImages?: boolean;
  textOnly?: boolean;
}) {
  const t = BRAND_CAMPAIGN_STEP2_SCHEME_COPY[locale];

  return (
    <article
      className="w-full min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 md:p-6"
      aria-label={`${t.scheme} ${metrics.label}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
        <span className="inline-flex items-center rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
          {t.scheme} {metrics.label}
          {metrics.recommended ? ` · ${t.recommended}` : ""}
        </span>
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      </div>

      {!textOnly ? (
        <FeaturedStoryboardStrip
          locale={locale}
          productImageUrl={productImageUrl}
          frameUrls={previewFrameUrls}
          showImages={showImages ?? false}
        />
      ) : null}

      <section className="min-w-0 space-y-3 border-b border-zinc-100 pb-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">{t.coreInsight}</p>
        <h2 className="text-xl font-semibold leading-snug tracking-tight text-zinc-950 sm:text-2xl sm:leading-tight lg:text-[1.75rem]">
          {direction.creativeStrategy || direction.title}
        </h2>
        <p className="text-sm leading-6 text-zinc-600 sm:leading-7">{direction.coreInsight || direction.coreIdea}</p>
      </section>

      <div className="mt-4 sm:mt-5">
        <FeaturedMetricsPanel locale={locale} metrics={metrics} />
      </div>

      <div className={cn("mt-5", STEP2_SCHEME_LAYOUT.featuredBodyGrid)}>
        <FeaturedCopyBlock locale={locale} direction={direction} metrics={metrics} />
      </div>
    </article>
  );
}
