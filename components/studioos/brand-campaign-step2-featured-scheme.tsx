"use client";

import Image from "next/image";
import type { CreativeDirection } from "@/features/ai/creative-direction.types";
import { SchemeMetricSparkline, SchemeRadarChart } from "@/components/studioos/brand-campaign-step2-scheme-charts";
import { STEP2_SCHEME_LAYOUT } from "@/lib/studioos/brand-campaign-step2-layout";
import type { SchemeDisplayMetrics } from "@/lib/studioos/brand-campaign-scheme-metrics";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Check, Crown } from "lucide-react";

const PREVIEW_FRAME_COUNT = 3;

const copy = {
  en: {
    recommended: "Recommended",
    scheme: "Scheme",
    coreCreative: "Core creative",
    highlights: "Creative highlights",
    aiScore: "AI score",
    ctr: "Est. CTR lift",
    conversion: "Est. conversion lift",
    roi: "ROI forecast",
    mediaComingSoon: "Coming soon",
    frame: "Frame"
  },
  zh: {
    recommended: "推荐",
    scheme: "方案",
    coreCreative: "核心创意",
    highlights: "创意亮点",
    aiScore: "智能评分",
    ctr: "预计点击率提升",
    conversion: "预计转化提升",
    roi: "回报率预测",
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
    { label: t.aiScore, value: `${metrics.aiScore}`, suffix: "/100", seed: metrics.aiScore, accent: true },
    { label: t.ctr, value: `+${metrics.ctrLift}%`, suffix: "", seed: metrics.ctrLift + 10, accent: false },
    { label: t.conversion, value: `+${metrics.conversionLift}%`, suffix: "", seed: metrics.conversionLift + 20, accent: false },
    { label: t.roi, value: `${metrics.roi}x`, suffix: "", seed: Math.round(metrics.roi * 10), accent: false }
  ];

  return (
    <div className={cn("flex flex-col gap-3", STEP2_SCHEME_LAYOUT.featuredMetricsCol)}>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className={cn(
              "rounded-lg border px-3 py-2.5",
              item.accent ? "border-violet-100 bg-violet-50/60" : "border-zinc-100 bg-zinc-50/80"
            )}
          >
            <p className="text-[10px] leading-4 text-zinc-500">{item.label}</p>
            <div className="mt-1.5 flex items-end justify-between gap-1">
              <p className="tabular-nums leading-none">
                <span className={cn("text-base font-semibold", item.accent ? "text-violet-700" : "text-zinc-900")}>
                  {item.value}
                </span>
                {item.suffix ? <span className="text-xs font-medium text-zinc-400">{item.suffix}</span> : null}
              </p>
              <SchemeMetricSparkline seed={item.seed} className="opacity-80" />
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-3">
        <SchemeRadarChart locale={locale} scores={metrics.radar} size={96} compactLabels />
      </div>
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

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="space-y-2">
        <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-zinc-950">
          {direction.title}
          <Crown className="h-4 w-4 shrink-0 text-violet-600" aria-hidden />
        </h3>
        <p className="max-w-prose text-sm leading-relaxed text-zinc-600">{direction.coreIdea}</p>
        <p className="max-w-prose text-sm leading-relaxed text-zinc-500">{direction.hook}</p>
      </div>

      <div className="grid gap-6 border-t border-zinc-100 pt-5 sm:grid-cols-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{t.coreCreative}</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-700">{direction.story}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{t.highlights}</p>
          <ul className="mt-2 space-y-2">
            {metrics.highlights.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-relaxed text-zinc-700">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" strokeWidth={2.5} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {metrics.psychologyTags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-violet-200/80 bg-violet-50 px-2.5 py-0.5 text-[11px] font-medium text-violet-700"
          >
            {tag}
          </span>
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

      <div className={cn("mt-5", STEP2_SCHEME_LAYOUT.featuredBodyGrid)}>
        <FeaturedCopyBlock locale={locale} direction={direction} metrics={metrics} />
        <FeaturedMetricsPanel locale={locale} metrics={metrics} />
      </div>
    </article>
  );
}
