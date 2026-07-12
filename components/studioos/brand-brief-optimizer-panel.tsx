"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { formatProfessionalBriefDocument } from "@/lib/studioos/brand-brief-optimizer-format";
import type { BrandBriefOptimizerResult } from "@/lib/studioos/brand-brief-optimizer.types";
import { cn } from "@/lib/utils";
import { ChevronDown, Sparkles } from "lucide-react";

type BrandBriefOptimizerPanelProps = {
  locale: Locale;
  optimizer: BrandBriefOptimizerResult;
  source: "openai" | "template";
};

function usesChinese(locale: Locale) {
  return locale === "zh" || locale.startsWith("zh");
}

function BriefSpecRow({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-3 border-b border-zinc-100 py-2.5 last:border-b-0 sm:grid-cols-[6.5rem_1fr]">
      <dt className="text-xs font-medium text-zinc-400">{label}</dt>
      <dd className="text-sm leading-relaxed text-zinc-800">{value}</dd>
    </div>
  );
}

function BriefSpecSection({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-5 py-4">
      <h4 className="mb-2 text-xs font-semibold tracking-wide text-zinc-500">{title}</h4>
      <dl>{children}</dl>
    </section>
  );
}

export function BrandBriefOptimizerPanel({ locale, optimizer, source }: BrandBriefOptimizerPanelProps) {
  const zh = usesChinese(locale);
  const [showDocument, setShowDocument] = useState(false);
  const sourceLabel =
    source === "openai" ? (zh ? "AI 创意总监" : "AI Creative Director") : zh ? "智能模板" : "Smart template";
  const documentText = formatProfessionalBriefDocument(optimizer, locale);
  const secondaryObjectives = optimizer.secondary_objectives.join(zh ? "、" : ", ");

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <header className="border-b border-zinc-100 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-violet-600">
              {zh ? "广告需求简报" : "CAMPAIGN BRIEF"}
            </p>
            <h3 className="text-lg font-semibold tracking-tight text-zinc-950">{optimizer.campaign_name}</h3>
            <p className="text-sm text-zinc-600">
              {optimizer.primary_objective}
              {secondaryObjectives ? (
                <span className="text-zinc-400">
                  {zh ? " · 次要目标 " : " · Secondary "}
                  {secondaryObjectives}
                </span>
              ) : null}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0 rounded-full bg-violet-600 text-white hover:bg-violet-600">
            <Sparkles className="mr-1 h-3 w-3" />
            {sourceLabel}
          </Badge>
        </div>

        <p className="mt-4 border-l-[3px] border-violet-500 pl-3 text-sm font-medium leading-relaxed text-zinc-900">
          {optimizer.key_message}
        </p>
      </header>

      <blockquote className="border-b border-zinc-100 bg-zinc-50/70 px-5 py-3.5 text-sm leading-relaxed text-zinc-700">
        <span className="font-medium text-zinc-500">{zh ? "消费者洞察｜" : "Insight | "}</span>
        {optimizer.consumer_insight}
      </blockquote>

      <div className="grid divide-y border-b border-zinc-100 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        <BriefSpecSection title={zh ? "目标受众" : "Audience"}>
          <BriefSpecRow label={zh ? "核心人群" : "Primary"} value={optimizer.audience_primary} />
          <BriefSpecRow
            label={zh ? "置信度" : "Confidence"}
            value={`${optimizer.audience_confidence}%`}
          />
          {optimizer.audience_segments.length ? (
            <BriefSpecRow
              label={zh ? "人群分层" : "Segments"}
              value={optimizer.audience_segments.join(zh ? "、" : ", ")}
            />
          ) : null}
        </BriefSpecSection>

        <BriefSpecSection title={zh ? "传播策略" : "Strategy"}>
          <BriefSpecRow
            label={zh ? "推荐 KPI" : "KPIs"}
            value={optimizer.recommended_kpis.join(zh ? " · " : " · ")}
          />
          {optimizer.selling_points.map((point) => (
            <BriefSpecRow
              key={`${point.priority}-${point.label}`}
              label={zh ? `卖点 ${point.priority}` : `Point ${point.priority}`}
              value={point.label}
            />
          ))}
        </BriefSpecSection>

        <BriefSpecSection title={zh ? "制作执行" : "Production"}>
          <BriefSpecRow
            label={zh ? "投放平台" : "Platforms"}
            value={optimizer.recommended_platforms.join(zh ? "、" : ", ")}
          />
          <BriefSpecRow label={zh ? "视频时长" : "Duration"} value={optimizer.recommended_video_duration} />
          <BriefSpecRow
            label={zh ? "创作者" : "Creators"}
            value={optimizer.recommended_creator_types.join(zh ? "、" : ", ")}
          />
          <BriefSpecRow
            label={zh ? "品牌调性" : "Tone"}
            value={optimizer.recommended_tones.join(zh ? "、" : ", ")}
          />
          <BriefSpecRow
            label={zh ? "视觉风格" : "Visual"}
            value={optimizer.visual_style.join(zh ? "、" : ", ")}
          />
          <BriefSpecRow label={zh ? "行动号召" : "CTA"} value={optimizer.recommended_cta} />
        </BriefSpecSection>
      </div>

      {optimizer.gaps.length ? (
        <div className="border-b border-zinc-100 px-5 py-3.5">
          <p className="text-xs font-semibold text-zinc-500">{zh ? "待补充信息" : "Missing inputs"}</p>
          <ul className="mt-2 space-y-1.5">
            {optimizer.gaps.map((gap) => (
              <li key={gap.id} className="text-sm leading-relaxed text-zinc-700">
                <span className="font-medium text-zinc-900">{gap.message}</span>
                <span className="text-zinc-500"> — {gap.suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="px-5 py-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-0 text-xs text-zinc-500 hover:text-zinc-800"
          onClick={() => setShowDocument((open) => !open)}
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showDocument && "rotate-180")} />
          {showDocument
            ? zh
              ? "收起完整广告需求"
              : "Hide full brief document"
            : zh
              ? "展开完整广告需求"
              : "View full brief document"}
        </Button>
        {showDocument ? (
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-zinc-100 bg-zinc-50/80 p-3 font-sans text-xs leading-relaxed text-zinc-700">
            {documentText}
          </pre>
        ) : null}
      </div>
    </article>
  );
}
