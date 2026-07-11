"use client";

import Image from "next/image";
import type { CreativeDirection } from "@/features/ai/creative-direction.types";
import { STEP2_SCHEME_LAYOUT } from "@/lib/studioos/brand-campaign-step2-layout";
import type { SchemeDisplayMetrics } from "@/lib/studioos/brand-campaign-scheme-metrics";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Check, Play } from "lucide-react";

const copy = {
  en: {
    scheme: "Strategy",
    audience: "Audience",
    emotion: "Emotion",
    integration: "Integration",
    mediaComingSoon: "Coming soon"
  },
  zh: {
    scheme: "Strategy",
    audience: "受众",
    emotion: "情绪",
    integration: "植入",
    mediaComingSoon: "即将开放"
  }
} as const;

function CompactSchemeThumb({
  locale,
  productImageUrl,
  title,
  showImages
}: {
  locale: Locale;
  productImageUrl: string | null;
  title: string;
  showImages: boolean;
}) {
  const activeImageUrl = productImageUrl;

  if (!showImages) {
    return (
      <div className="flex h-[96px] w-[96px] items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50">
        <p className="px-1 text-center text-[10px] text-zinc-400">{copy[locale].mediaComingSoon}</p>
      </div>
    );
  }

  return (
    <div className={STEP2_SCHEME_LAYOUT.compactThumb}>
      {activeImageUrl ? (
        <Image src={activeImageUrl} alt={title} fill className="object-cover" unoptimized />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-violet-950" />
      )}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 shadow-sm">
          <Play className="ml-0.5 h-3.5 w-3.5 fill-zinc-800 text-zinc-800" />
        </span>
      </span>
    </div>
  );
}

export function BrandCampaignStep2CompactScheme({
  locale,
  direction,
  metrics,
  selected,
  productImageUrl,
  showImages,
  textOnly = false,
  onSelect
}: {
  locale: Locale;
  direction: CreativeDirection;
  metrics: SchemeDisplayMetrics;
  selected: boolean;
  productImageUrl: string | null;
  showImages?: boolean;
  textOnly?: boolean;
  onSelect: () => void;
}) {
  const t = copy[locale];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group w-full min-w-0 rounded-xl border bg-white p-4 text-left shadow-sm transition-shadow",
        selected
          ? "border-violet-300 ring-2 ring-violet-100"
          : "border-zinc-200 hover:border-zinc-300 hover:shadow-md"
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-violet-700">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
            {metrics.label}
          </span>
          {t.scheme} {metrics.label}
        </span>
        {selected ? (
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          </span>
        ) : (
          <span className="h-4 w-4 shrink-0 rounded-full border-2 border-zinc-300 group-hover:border-zinc-400" />
        )}
      </div>

      <div className={cn(textOnly ? "space-y-2.5" : STEP2_SCHEME_LAYOUT.compactBodyGrid)}>
        {!textOnly ? (
          <CompactSchemeThumb
            locale={locale}
            productImageUrl={productImageUrl}
            title={direction.title}
            showImages={showImages ?? false}
          />
        ) : null}

        <div className="min-w-0 space-y-2.5">
          <div>
            <h4 className="text-sm font-semibold leading-snug text-zinc-900">
              {direction.creativeStrategy || direction.title}
            </h4>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">
              {direction.coreInsight || direction.bigIdea || direction.hook}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 py-1.5">
              <p className="text-[10px] text-zinc-500">{t.audience}</p>
              <p className="text-sm font-semibold text-violet-700">{metrics.audienceMatch}%</p>
            </div>
            <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 py-1.5">
              <p className="text-[10px] text-zinc-500">{t.emotion}</p>
              <p className="text-sm font-semibold text-violet-700">{metrics.emotionalResonance}%</p>
            </div>
            <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 py-1.5">
              <p className="text-[10px] text-zinc-500">{t.integration}</p>
              <p className="text-sm font-semibold text-violet-700">{metrics.productIntegration}%</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {metrics.psychologyTags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}
