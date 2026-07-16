"use client";

import type { KnowledgeCitationGapDto, KnowledgeDashboardStatsDto } from "@/features/knowledge-center/knowledge-center.types";
import type { Locale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { KNOWLEDGE_EDITOR_CATEGORY_LABELS_ZH } from "@/lib/knowledge/knowledge-editor-copy";

function coverageLabel(coverage: KnowledgeCitationGapDto["coverage"], zh: boolean) {
  if (coverage === "strong") return zh ? "充分" : "strong";
  if (coverage === "partial") return zh ? "部分" : "partial";
  return zh ? "缺失" : "missing";
}

function topicLabel(gap: KnowledgeCitationGapDto, zh: boolean) {
  if (!zh) return gap.topic;
  return (
    KNOWLEDGE_EDITOR_CATEGORY_LABELS_ZH[
      gap.category as keyof typeof KNOWLEDGE_EDITOR_CATEGORY_LABELS_ZH
    ] ?? gap.topic
  );
}

export function AdminKnowledgeCitationPanel({ locale }: { locale: Locale }) {
  const zh = locale === "zh";
  const [gaps, setGaps] = useState<KnowledgeCitationGapDto[]>([]);
  const [stats, setStats] = useState<KnowledgeDashboardStatsDto | null>(null);

  useEffect(() => {
    void fetch("/api/admin/knowledge/citations", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { data?: { gaps?: KnowledgeCitationGapDto[]; stats?: KnowledgeDashboardStatsDto } }) => {
        setGaps(payload.data?.gaps ?? []);
        setStats(payload.data?.stats ?? null);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">{zh ? "AI 引用监控" : "AI Citation Monitor"}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {zh
              ? "按编辑器分类统计真实文章、已发布语言版本与 Lucien 索引覆盖。"
              : "Real article counts by editor category, published locales, and Lucien index coverage."}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={adminPortalRoutes.knowledge}>{zh ? "返回知识中心" : "Back to Knowledge Center"}</Link>
        </Button>
      </div>

      {stats ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric
            label={zh ? "Lucien 已索引（已发布语言）" : "Lucien indexed (published)"}
            value={stats.lucien_indexed}
          />
          <Metric label={zh ? "平均 SEO 分" : "Avg SEO score"} value={stats.avg_seo} />
          <Metric label={zh ? "月浏览量（真实访问）" : "Monthly views (real)"} value={stats.monthly_views} />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.2fr_0.5fr_0.6fr_0.5fr_0.5fr_0.6fr] gap-3 border-b border-zinc-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
          <span>{zh ? "分类" : "Category"}</span>
          <span>{zh ? "文章" : "Articles"}</span>
          <span>{zh ? "已发布语言" : "Published"}</span>
          <span>Lucien</span>
          <span>SEO</span>
          <span>{zh ? "覆盖" : "Coverage"}</span>
        </div>
        {gaps.map((gap) => (
          <div key={gap.category} className="grid grid-cols-[1.2fr_0.5fr_0.6fr_0.5fr_0.5fr_0.6fr] gap-3 border-b border-zinc-50 px-4 py-4 text-sm">
            <span className="font-medium text-zinc-900">{topicLabel(gap, zh)}</span>
            <span>{gap.articles}</span>
            <span>{gap.published_translations}</span>
            <span>
              {gap.published_translations
                ? `${gap.lucien_indexed}/${gap.published_translations}`
                : gap.lucien_indexed}
            </span>
            <span>{gap.avg_seo || "—"}</span>
            <span
              className={cn(
                "font-medium",
                gap.coverage === "strong" && "text-emerald-600",
                gap.coverage === "partial" && "text-amber-600",
                gap.coverage === "missing" && "text-rose-600"
              )}
            >
              {coverageLabel(gap.coverage, zh)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-950">{value}</p>
    </div>
  );
}
