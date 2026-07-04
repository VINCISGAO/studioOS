"use client";

import Image from "next/image";
import type { CreativeDirection } from "@/features/ai/creative-direction.types";
import { SchemeRadarChart } from "@/components/studioos/brand-campaign-step2-scheme-charts";
import type { SchemeDisplayMetrics } from "@/lib/studioos/brand-campaign-scheme-metrics";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Check, FileText, Film, MoreHorizontal, Play, Sparkles } from "lucide-react";

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
    viewScript: "Full script",
    storyboard: "Storyboard (PDF)",
    shootingRef: "Shooting refs"
  },
  zh: {
    recommended: "推荐",
    scheme: "方案",
    coreCreative: "核心创意",
    highlights: "创意亮点",
    aiScore: "AI 评分",
    ctr: "预估 CTR 提升",
    conversion: "预估转化提升",
    roi: "ROI 预测",
    viewScript: "查看完整脚本",
    storyboard: "分镜表 (PDF)",
    shootingRef: "拍摄参考"
  }
} as const;

function MetricTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl border px-3 py-3", accent ? "border-violet-200 bg-violet-50/70" : "border-zinc-100 bg-zinc-50/60")}>
      <p className="text-[11px] text-zinc-500">{label}</p>
      <p className={cn("mt-1 text-xl font-semibold tracking-tight", accent ? "text-violet-700" : "text-zinc-950")}>
        {value}
      </p>
    </div>
  );
}

function VideoPreview({ productImageUrl, title }: { productImageUrl: string | null; title: string }) {
  const thumbs = Array.from({ length: 5 }, (_, index) => index);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-violet-950">
        {productImageUrl ? (
          <Image src={productImageUrl} alt={title} fill className="object-cover opacity-90" unoptimized />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(167,139,250,0.35),transparent_55%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
        <button
          type="button"
          className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-violet-700 shadow-lg"
          aria-label="Play preview"
        >
          <Play className="ml-0.5 h-6 w-6 fill-current" />
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {thumbs.map((index) => (
          <div
            key={index}
            className={cn(
              "relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border",
              index === 0 ? "border-violet-500 ring-2 ring-violet-200" : "border-zinc-200"
            )}
          >
            {productImageUrl ? (
              <Image src={productImageUrl} alt="" fill className="object-cover" unoptimized />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-violet-100 to-zinc-100" />
            )}
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
  selected,
  productImageUrl,
  platforms,
  onSelect
}: {
  locale: Locale;
  direction: CreativeDirection;
  metrics: SchemeDisplayMetrics;
  selected: boolean;
  productImageUrl: string | null;
  platforms: string[];
  onSelect: () => void;
}) {
  const t = copy[locale];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-[24px] border bg-white p-4 text-left shadow-sm transition sm:p-5",
        selected ? "border-violet-400 ring-2 ring-violet-100" : "border-zinc-200 hover:border-violet-200"
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
            <Sparkles className="h-3.5 w-3.5" />
            {t.scheme} {metrics.label}
          </span>
          {metrics.recommended ? (
            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
              · {t.recommended}
            </span>
          ) : null}
        </div>
        {selected ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700">
            <Check className="h-4 w-4" />
          </span>
        ) : (
          <span className="h-5 w-5 rounded-full border-2 border-zinc-200" />
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,340px)_1fr]">
        <VideoPreview productImageUrl={productImageUrl} title={direction.title} />

        <div className="min-w-0 space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-zinc-950">{direction.title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{direction.coreIdea}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.coreCreative}</p>
            <p className="mt-1 text-sm leading-6 text-zinc-700">{direction.story}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.highlights}</p>
            <ul className="mt-2 space-y-1.5">
              {metrics.highlights.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-zinc-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricTile label={t.aiScore} value={String(metrics.aiScore)} accent />
            <MetricTile label={t.ctr} value={`+${metrics.ctrLift}%`} />
            <MetricTile label={t.conversion} value={`+${metrics.conversionLift}%`} />
            <MetricTile label={t.roi} value={`${metrics.roi}x`} />
          </div>

          <div className="flex flex-wrap gap-2">
            {metrics.psychologyTags.map((tag) => (
              <span key={tag} className="rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-xs text-violet-700">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap gap-1.5">
              {platforms.slice(0, 5).map((platform) => (
                <span key={platform} className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-600">
                  {platform}
                </span>
              ))}
            </div>
            <SchemeRadarChart locale={locale} scores={metrics.radar} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700">
          <FileText className="h-3.5 w-3.5" />
          {t.viewScript}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700">
          <Film className="h-3.5 w-3.5" />
          {t.storyboard}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700">
          {t.shootingRef}
        </span>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500">
          <MoreHorizontal className="h-4 w-4" />
        </span>
      </div>
    </button>
  );
}

export function BrandCampaignStep2CompactScheme({
  locale,
  direction,
  metrics,
  selected,
  productImageUrl,
  onSelect
}: {
  locale: Locale;
  direction: CreativeDirection;
  metrics: SchemeDisplayMetrics;
  selected: boolean;
  productImageUrl: string | null;
  onSelect: () => void;
}) {
  const t = copy[locale];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex h-full flex-col rounded-2xl border bg-white p-4 text-left shadow-sm transition",
        selected ? "border-violet-400 ring-2 ring-violet-100" : "border-zinc-200 hover:border-violet-200"
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="text-xs font-semibold text-violet-700">
          {t.scheme} {metrics.label}
        </span>
        {selected ? <Check className="h-4 w-4 text-violet-600" /> : <span className="h-4 w-4 rounded-full border-2 border-zinc-200" />}
      </div>

      <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-xl bg-zinc-100">
        {productImageUrl ? (
          <Image src={productImageUrl} alt={direction.title} fill className="object-cover" unoptimized />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-indigo-100 to-violet-50" />
        )}
      </div>

      <h4 className="text-sm font-semibold text-zinc-950">{direction.title}</h4>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{direction.hook}</p>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-violet-50 px-2 py-2">
          <p className="text-[10px] text-zinc-500">{t.aiScore}</p>
          <p className="text-sm font-semibold text-violet-700">{metrics.aiScore}</p>
        </div>
        <div className="rounded-xl bg-zinc-50 px-2 py-2">
          <p className="text-[10px] text-zinc-500">CTR</p>
          <p className="text-sm font-semibold text-emerald-600">+{metrics.ctrLift}%</p>
        </div>
        <div className="rounded-xl bg-zinc-50 px-2 py-2">
          <p className="text-[10px] text-zinc-500">{locale === "zh" ? "转化" : "Conv."}</p>
          <p className="text-sm font-semibold text-emerald-600">+{metrics.conversionLift}%</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {metrics.psychologyTags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600">
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}
