"use client";

import Image from "next/image";
import type { CreativeDirection } from "@/features/ai/creative-direction.types";
import { SchemeMetricSparkline, SchemeRadarChart } from "@/components/studioos/brand-campaign-step2-scheme-charts";
import { STEP2_SCHEME_LAYOUT } from "@/lib/studioos/brand-campaign-step2-layout";
import type { SchemeDisplayMetrics } from "@/lib/studioos/brand-campaign-scheme-metrics";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const PREVIEW_FRAME_COUNT = 3;

const copy = {
  en: {
    recommended: "Recommended",
    scheme: "Creative Strategy",
    coreInsight: "Core Insight",
    bigIdea: "Big Idea",
    openingHook: "Opening Hook",
    storyStructure: "Story Structure",
    visualStyle: "Visual Style",
    cameraLanguage: "Camera Language",
    colorPalette: "Color Palette",
    musicDirection: "Music Direction",
    creatorRequirements: "Creator Requirements",
    whyRecommended: "Why AI Recommends This",
    audienceMatch: "Audience Match",
    emotionalResonance: "Emotional Resonance",
    productIntegration: "Product Integration",
    estimatedCtr: "Estimated CTR",
    duration: "Recommended Duration",
    difficulty: "AI Production Difficulty",
    industries: "Suitable Industries",
    aiScore: "AI Score",
    excellent: "Excellent",
    mediaComingSoon: "Coming soon",
    frame: "Frame"
  },
  zh: {
    recommended: "推荐",
    scheme: "Creative Strategy",
    coreInsight: "Core Insight 消费者洞察",
    bigIdea: "Big Idea 创意核心",
    openingHook: "Opening Hook 前 3 秒",
    storyStructure: "Story Structure 故事结构",
    visualStyle: "Visual Style 画面风格",
    cameraLanguage: "Camera Language 镜头语言",
    colorPalette: "Color Palette 色彩",
    musicDirection: "Music Direction 音乐",
    creatorRequirements: "Creator Requirements 创作者要求",
    whyRecommended: "Why AI Recommends This",
    audienceMatch: "Audience Match",
    emotionalResonance: "Emotional Resonance",
    productIntegration: "Product Integration",
    estimatedCtr: "Estimated CTR",
    duration: "Recommended Duration",
    difficulty: "AI Production Difficulty",
    industries: "Suitable Industries",
    aiScore: "AI 评分",
    excellent: "Excellent",
    mediaComingSoon: "即将开放",
    frame: "分镜"
  }
} as const;

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
  const t = copy[locale];
  const frames = resolvePreviewFrames(productImageUrl, frameUrls);
  const revealImages = showImages || Boolean(productImageUrl);

  return (
    <div className={STEP2_SCHEME_LAYOUT.featuredMediaRow} aria-label={locale === "zh" ? "分镜预览" : "Storyboard preview"}>
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
  const t = copy[locale];
  const items = [
    { label: t.audienceMatch, value: `${metrics.audienceMatch}%`, seed: metrics.audienceMatch, accent: true },
    { label: t.emotionalResonance, value: `${metrics.emotionalResonance}%`, seed: metrics.emotionalResonance, accent: false },
    { label: t.productIntegration, value: `${metrics.productIntegration}%`, seed: metrics.productIntegration, accent: false },
    { label: t.estimatedCtr, value: metrics.estimatedCtr, seed: metrics.audienceMatch + 7, accent: false },
    { label: t.duration, value: metrics.recommendedDuration, seed: 42, accent: false },
    { label: t.difficulty, value: metrics.aiProductionDifficulty, seed: 58, accent: false },
    {
      label: t.industries,
      value: metrics.suitableIndustries.length
        ? metrics.suitableIndustries.slice(0, 2).join(", ")
        : locale === "zh"
          ? "待 AI 判断"
          : "AI pending",
      seed: 76,
      accent: false
    }
  ];

  return (
    <div className={cn("grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7", STEP2_SCHEME_LAYOUT.featuredMetricsCol)}>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "min-w-0 rounded-xl border px-3 py-2.5",
            item.accent ? "border-violet-100 bg-violet-50/70" : "border-zinc-100 bg-zinc-50/80"
          )}
        >
          <p className="truncate text-[10px] leading-4 text-zinc-500">{item.label}</p>
          <div className="mt-1.5 flex items-end justify-between gap-1">
            <p className="min-w-0 truncate tabular-nums leading-none">
              <span className={cn("text-sm font-semibold", item.accent ? "text-violet-700" : "text-zinc-900")}>
                {item.value}
              </span>
            </p>
            <SchemeMetricSparkline seed={item.seed} className="shrink-0 opacity-70" />
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
  const t = copy[locale];
  const storyScenes = (direction.storyStructure?.length
    ? direction.storyStructure
    : metrics.highlights.map((item, index) => ({
        label: `Scene 0${index + 1}`,
        title: item,
        purpose: item
      }))).slice(0, 5);
  const storyGridClass =
    storyScenes.length <= 3
      ? "md:grid-cols-3"
      : storyScenes.length === 4
        ? "md:grid-cols-4"
        : "md:grid-cols-5";

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="grid gap-4 border-t border-zinc-100 pt-5 lg:grid-cols-2">
        <div className="min-w-0 rounded-xl bg-violet-50/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-400">{t.bigIdea}</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-800">{direction.bigIdea || direction.coreIdea}</p>
        </div>
        <div className="min-w-0 rounded-xl bg-zinc-50/80 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{t.openingHook}</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-700">{direction.openingHook || direction.hook}</p>
        </div>
      </div>

      <div className="border-t border-zinc-100 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{t.storyStructure}</p>
        <div className={cn("mt-3 grid gap-3 sm:grid-cols-2", storyGridClass)}>
          {storyScenes.map((scene) => (
            <div key={`${scene.label}-${scene.title}`} className="min-h-[132px] rounded-xl border border-zinc-100 bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-500">{scene.label}</p>
              <p className="mt-2 text-sm font-semibold leading-5 text-zinc-900">{scene.title}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{scene.purpose}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 border-t border-zinc-100 pt-5 md:grid-cols-2 xl:grid-cols-3">
        {[
          [t.visualStyle, direction.visualStyle],
          [t.cameraLanguage, direction.cameraLanguage],
          [t.colorPalette, direction.colorPalette],
          [t.musicDirection, direction.musicDirection],
          [t.creatorRequirements, direction.creatorRequirements || direction.recommendedCreatorType],
          [t.whyRecommended, direction.whyAiRecommendsThis || direction.rationale]
        ].filter(([, value]) => Boolean(value)).map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-xl bg-zinc-50/80 p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-700">{value}</p>
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
  const t = copy[locale];

  return (
    <article
      className="w-full min-w-0 rounded-2xl border border-violet-300 bg-white p-5 shadow-md ring-2 ring-violet-100 md:p-6"
      aria-label={`${t.scheme} ${metrics.label}`}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="inline-flex items-center rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
          {t.scheme} {metrics.label}
          {metrics.recommended ? ` · ${t.recommended}` : ""}
        </span>
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="rounded-2xl bg-gradient-to-br from-white via-white to-violet-50/50 p-5 ring-1 ring-zinc-100">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-500">{t.coreInsight}</p>
          <h2 className="mt-3 max-w-2xl text-2xl font-semibold leading-tight tracking-tight text-zinc-950 sm:text-3xl">
            {direction.creativeStrategy || direction.title}
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-600">{direction.coreInsight || direction.coreIdea}</p>
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">{t.aiScore}</p>
          <div className="mt-3 grid items-center gap-4 sm:grid-cols-[88px_minmax(0,1fr)] xl:grid-cols-1 2xl:grid-cols-[88px_minmax(0,1fr)]">
            <div className="min-w-0">
              <p className="text-4xl font-semibold tracking-tight text-zinc-950">{metrics.audienceMatch}</p>
              <p className="text-xs font-medium text-violet-600">/100</p>
              <p className="mt-2 text-sm font-semibold text-violet-700">{t.excellent}</p>
            </div>
            <div className="flex min-w-0 justify-center overflow-hidden">
              <SchemeRadarChart locale={locale} scores={metrics.radar} size={118} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <FeaturedMetricsPanel locale={locale} metrics={metrics} />
      </div>

      <div className={cn("mt-5", STEP2_SCHEME_LAYOUT.featuredBodyGrid)}>
        <FeaturedCopyBlock locale={locale} direction={direction} metrics={metrics} />
      </div>
    </article>
  );
}
