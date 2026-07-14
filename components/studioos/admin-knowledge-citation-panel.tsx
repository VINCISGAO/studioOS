"use client";

import type { KnowledgeCitationGapDto, KnowledgeDashboardStatsDto } from "@/features/knowledge-center/knowledge-center.types";
import type { Locale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
            {zh ? "跟踪 Lucien 知识覆盖、EEAT 与主题空白。" : "Track Lucien coverage, EEAT gaps, and topic whitespace."}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={adminPortalRoutes.knowledge}>{zh ? "返回知识中心" : "Back to Knowledge Center"}</Link>
        </Button>
      </div>

      {stats ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label={zh ? "Lucien 已索引" : "Lucien indexed"} value={stats.lucien_indexed} />
          <Metric label={zh ? "平均 SEO" : "Avg SEO"} value={stats.avg_seo} />
          <Metric label={zh ? "月浏览量" : "Monthly views"} value={stats.monthly_views} />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.2fr_0.6fr_0.6fr_0.6fr_0.7fr] gap-3 border-b border-zinc-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
          <span>{zh ? "主题" : "Topic"}</span>
          <span>{zh ? "文章数" : "Articles"}</span>
          <span>Lucien</span>
          <span>SEO</span>
          <span>{zh ? "覆盖" : "Coverage"}</span>
        </div>
        {gaps.map((gap) => (
          <div key={gap.category} className="grid grid-cols-[1.2fr_0.6fr_0.6fr_0.6fr_0.7fr] gap-3 border-b border-zinc-50 px-4 py-4 text-sm">
            <span className="font-medium text-zinc-900">{gap.topic}</span>
            <span>{gap.articles}</span>
            <span>{gap.lucien_indexed}</span>
            <span>{gap.avg_seo}</span>
            <span
              className={cn(
                "font-medium",
                gap.coverage === "strong" && "text-emerald-600",
                gap.coverage === "partial" && "text-amber-600",
                gap.coverage === "missing" && "text-rose-600"
              )}
            >
              {gap.coverage}
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
