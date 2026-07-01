import Link from "next/link";
import { BrandAttributionInsightCard } from "@/components/studioos/brand-attribution-insight-card";
import { PerformanceAttributionPanel } from "@/components/studioos/performance-attribution-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { AttributionDeliverableRow } from "@/lib/studioos/attribution-service";
import type { StoredCreativeInsight } from "@/lib/studioos/creative-performance-types";
import { CheckCircle2, CircleDashed, Lightbulb, Sparkles } from "lucide-react";

const copy = {
  en: {
    heroTitle: "Ad attribution",
    heroBody:
      "Bind TikTok and YouTube performance to each deliverable. AI summarizes why ads worked — and pre-fills your next Campaign wizard.",
    pending: "Awaiting attribution",
    attributed: "Attributed",
    version: "Version",
    openReview: "Open review",
    emptyTitle: "No deliverables yet",
    emptyBody: "Once a studio submits a cut for review, upload platform data here.",
    createCampaign: "Create ad project",
    intelligence: "Learned for next campaign",
    intelligenceBody: "Insights auto-apply when you start a new Campaign wizard.",
    statsAttributed: "Attributed",
    statsPending: "Pending",
    statsInsights: "Insights"
  },
  zh: {
    heroTitle: "广告效果归因",
    heroBody:
      "将 TikTok、YouTube 投放数据绑定到每条交付物。AI 归纳表现原因，并自动预填下一次 Campaign 向导。",
    pending: "待归因",
    attributed: "已归因",
    version: "版本",
    openReview: "打开审片",
    emptyTitle: "暂无交付物",
    emptyBody: "制作团队提交审片后，可在此上传平台后台数据。",
    createCampaign: "发布广告需求",
    intelligence: "已学习 · 用于下次 Campaign",
    intelligenceBody: "创建新 Campaign 时，以下洞察会自动预填 Hook、时长与风格。",
    statsAttributed: "已归因",
    statsPending: "待归因",
    statsInsights: "洞察"
  }
};

export function BrandAttributionHub({
  locale,
  rows,
  insights,
  pendingCount,
  attributedCount
}: {
  locale: Locale;
  rows: AttributionDeliverableRow[];
  insights: StoredCreativeInsight[];
  pendingCount: number;
  attributedCount: number;
}) {
  const t = copy[locale];

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Creative Intelligence
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">{t.heroTitle}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">{t.heroBody}</p>
        </div>
        <div className="grid grid-cols-3 gap-3 lg:min-w-[280px]">
          {[
            { label: t.statsAttributed, value: attributedCount },
            { label: t.statsPending, value: pendingCount },
            { label: t.statsInsights, value: insights.length }
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-zinc-200/80 bg-white px-4 py-3 text-center shadow-sm"
            >
              <p className="text-2xl font-semibold tabular-nums tracking-tight text-zinc-950">{stat.value}</p>
              <p className="mt-1 text-[11px] font-medium text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {rows.length ? (
        <section className="space-y-4">
          {rows.map((row) => {
            const latest = row.deliverables[row.deliverables.length - 1];
            const title = row.order.title || row.order.company_name;

            return (
              <article key={row.order.id} className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-zinc-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-zinc-900">{title}</h2>
                      {row.attributed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                          <CheckCircle2 className="h-3 w-3" />
                          {t.attributed}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                          <CircleDashed className="h-3 w-3" />
                          {t.pending}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {t.version} {latest?.version ?? 1} · {row.order.status}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="rounded-full border-zinc-200">
                    <Link href={withLocale(row.reviewHref, locale)}>{t.openReview}</Link>
                  </Button>
                </div>

                <div className="p-4 sm:p-5">
                  <PerformanceAttributionPanel
                    locale={locale}
                    orderId={row.order.id}
                    deliverables={row.deliverables.map((item) => ({
                      id: item.id,
                      version: item.version,
                      notes: item.notes
                    }))}
                    existingRecords={row.records}
                    compact
                  />
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <Card className="border-dashed border-zinc-300 shadow-none">
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <Sparkles className="h-8 w-8 text-zinc-400" />
            <h2 className="mt-4 text-lg font-semibold">{t.emptyTitle}</h2>
            <p className="mt-2 max-w-md text-sm text-zinc-500">{t.emptyBody}</p>
            <Button asChild className="mt-6 rounded-full">
              <Link href={withLocale("/brand/projects/new", locale)}>{t.createCampaign}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {insights.length ? (
        <section>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-zinc-950">{t.intelligence}</h2>
          </div>
          <p className="mt-1 text-sm text-zinc-500">{t.intelligenceBody}</p>
          <div className="mt-4 space-y-3">
            {insights.slice(0, 4).map((insight) => (
              <BrandAttributionInsightCard key={insight.id} locale={locale} insight={insight} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
