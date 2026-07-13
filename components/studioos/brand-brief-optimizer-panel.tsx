"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BriefGapCard,
  BriefModuleCard,
  BriefSellingPointCard,
  BriefStatPill,
  BriefTagGroup
} from "@/components/studioos/brand-brief-optimizer-ui";
import type { Locale } from "@/lib/i18n";
import { formatProfessionalBriefDocument } from "@/lib/studioos/brand-brief-optimizer-format";
import type { BrandBriefOptimizerResult } from "@/lib/studioos/brand-brief-optimizer.types";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Clapperboard,
  Lightbulb,
  Megaphone,
  Sparkles,
  Target,
  Users
} from "lucide-react";

type BrandBriefOptimizerPanelProps = {
  locale: Locale;
  optimizer: BrandBriefOptimizerResult;
  source: "openai" | "template";
};

function usesChinese(locale: Locale) {
  return locale === "zh" || locale.startsWith("zh");
}

export function BrandBriefOptimizerPanel({ locale, optimizer, source }: BrandBriefOptimizerPanelProps) {
  const zh = usesChinese(locale);
  const [showDocument, setShowDocument] = useState(false);
  const sourceLabel =
    source === "openai" ? (zh ? "AI 创意总监" : "AI Creative Director") : zh ? "智能模板" : "Smart template";
  const documentText = formatProfessionalBriefDocument(optimizer, locale);
  const secondaryObjectives = optimizer.secondary_objectives.filter(Boolean);

  return (
    <article className="overflow-hidden rounded-[1.35rem] border border-zinc-200/90 bg-[#fafbfc] shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
      <header className="border-b border-zinc-200/70 bg-white px-6 py-6 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600">
              {zh ? "广告需求简报" : "Campaign Brief"}
            </p>
            <h3 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-[1.65rem]">
              {optimizer.campaign_name}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border-0 bg-zinc-900 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-900">
                {optimizer.primary_objective}
              </Badge>
              {secondaryObjectives.map((objective) => (
                <Badge
                  key={objective}
                  variant="secondary"
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600"
                >
                  {objective}
                </Badge>
              ))}
            </div>
          </div>
          <Badge
            variant="secondary"
            className="shrink-0 rounded-full border border-violet-200 bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-600"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            {sourceLabel}
          </Badge>
        </div>
      </header>

      <div className="space-y-4 px-4 py-5 sm:px-6 sm:py-6">
        <div className="rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50/40 p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-violet-600" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
              {zh ? "核心信息" : "Key Message"}
            </p>
          </div>
          <p className="text-base font-medium leading-relaxed text-zinc-900 sm:text-[1.05rem]">
            {optimizer.key_message}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <BriefStatPill
            label={zh ? "目标受众" : "Audience"}
            value={optimizer.audience_primary}
            highlight
          />
          <BriefStatPill
            label={zh ? "置信度" : "Confidence"}
            value={`${optimizer.audience_confidence}%`}
          />
          <BriefStatPill
            label={zh ? "视频时长" : "Duration"}
            value={optimizer.recommended_video_duration}
          />
          <BriefStatPill
            label={zh ? "行动号召" : "CTA"}
            value={optimizer.recommended_cta}
          />
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              {zh ? "消费者洞察" : "Consumer Insight"}
            </p>
          </div>
          <p className="text-sm leading-7 text-zinc-700 sm:text-[0.95rem]">{optimizer.consumer_insight}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <BriefModuleCard title={zh ? "目标受众" : "Audience"} icon={Users} accent="violet">
            <div className="space-y-4">
              <BriefTagGroup
                label={zh ? "人群分层" : "Segments"}
                items={optimizer.audience_segments}
              />
              {!optimizer.audience_segments.length ? (
                <p className="text-sm leading-relaxed text-zinc-600">{optimizer.audience_primary}</p>
              ) : null}
            </div>
          </BriefModuleCard>

          <BriefModuleCard title={zh ? "传播策略" : "Strategy"} icon={Target} accent="sky">
            <div className="space-y-4">
              <BriefTagGroup label={zh ? "推荐 KPI" : "KPIs"} items={optimizer.recommended_kpis} />
              {optimizer.selling_points.length ? (
                <div className="space-y-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                    {zh ? "卖点优先级" : "Selling Points"}
                  </p>
                  {optimizer.selling_points.map((point) => (
                    <BriefSellingPointCard
                      key={`${point.priority}-${point.label}`}
                      priority={point.priority}
                      label={point.label}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </BriefModuleCard>

          <BriefModuleCard title={zh ? "制作执行" : "Production"} icon={Clapperboard} accent="emerald">
            <div className="space-y-4">
              <BriefTagGroup
                label={zh ? "投放平台" : "Platforms"}
                items={optimizer.recommended_platforms}
              />
              <BriefTagGroup
                label={zh ? "创作者类型" : "Creators"}
                items={optimizer.recommended_creator_types}
              />
              <BriefTagGroup label={zh ? "品牌调性" : "Tone"} items={optimizer.recommended_tones} />
              <BriefTagGroup label={zh ? "视觉风格" : "Visual"} items={optimizer.visual_style} />
            </div>
          </BriefModuleCard>
        </div>

        {optimizer.gaps.length ? (
          <section className="rounded-2xl border border-amber-200/70 bg-white p-5 sm:p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
              {zh ? "待补充信息" : "Missing Inputs"}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {optimizer.gaps.map((gap) => (
                <BriefGapCard key={gap.id} message={gap.message} suggestion={gap.suggestion} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-zinc-200/80 bg-white px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 gap-2 px-0 text-sm font-medium text-zinc-600 hover:text-zinc-900"
            onClick={() => setShowDocument((open) => !open)}
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", showDocument && "rotate-180")} />
            {showDocument
              ? zh
                ? "收起完整广告需求"
                : "Hide full brief document"
              : zh
                ? "展开完整广告需求"
                : "View full brief document"}
          </Button>
          {showDocument ? (
            <div className="mt-4 max-h-64 overflow-auto rounded-xl border border-zinc-100 bg-zinc-50/70 p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-zinc-700">{documentText}</pre>
            </div>
          ) : null}
        </section>
      </div>
    </article>
  );
}
