import Link from "next/link";
import { BrandAttributionInsightCard } from "@/components/studioos/brand-attribution-insight-card";
import { SocialPerformanceSourcesPanel } from "@/components/studioos/social-performance-sources-panel";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type {
  AttributionCampaignOption,
  AttributionDeliverableRow
} from "@/lib/studioos/attribution-service";
import type { SerializedPerformanceSource } from "@/features/attribution/performance-source.types";
import type { StoredCreativeInsight } from "@/lib/studioos/creative-performance-types";
import { BarChart3, CheckCircle2, Sparkles } from "lucide-react";

const copy = {
  en: {
    heroTitle: "Ad attribution",
    heroBody:
      "Bind TikTok and YouTube performance data to each deliverable. AI finds why ads worked and pre-fills the next Campaign wizard.",
    statsAttributed: "Attributed",
    statsPending: "Pending",
    statsInsights: "Insights",
    emptyTitle: "No deliverables yet",
    emptyBody: "Once the studio submits a review cut, you can upload platform performance data here.",
    createCampaign: "Create ad project",
    howTitle: "How it works",
    stepOneTitle: "Link ads or content",
    stepOneBody: "Connect social URLs, upload reports, or add dashboard files.",
    stepTwoTitle: "AI attribution match",
    stepTwoBody: "AI reads performance evidence and matches it to deliverables.",
    stepThreeTitle: "Generate learnings",
    stepThreeBody: "Insights are saved into brand memory for future campaigns.",
    intelligence: "Learned for next campaign",
    intelligenceBody: "Create a new Campaign and these signals will auto-suggest hooks, duration, and style.",
    fallbackInsightTitle: "AI insights coming soon",
    fallbackInsightBody: "Import performance sources to start generating repeatable attribution learnings.",
    readySoon: "Almost ready",
    currentConnected: "Currently connected",
    dataSources: "data sources",
    stillNeed: "More data sources needed",
    unlock: "Unlock AI insights"
  },
  zh: {
    heroTitle: "广告效果归因",
    heroBody:
      "将 TikTok、YouTube 投放数据绑定到每条交付物。AI 归纳表现原因，并自动预填下一次 Campaign 向导。",
    statsAttributed: "已归因",
    statsPending: "待归因",
    statsInsights: "洞察",
    emptyTitle: "暂无交付物",
    emptyBody: "制作团队提交审片后，可在此上传平台后台数据，AI 将帮你分析效果并给出归因洞察。",
    createCampaign: "发布广告需求",
    howTitle: "如何使用",
    stepOneTitle: "关联你的广告或内容链接",
    stepOneBody: "粘贴视频链接，上传截图或文件。",
    stepTwoTitle: "AI 读取 & 匹配数据",
    stepTwoBody: "自动识别关键指标并与交付物匹配。",
    stepThreeTitle: "生成归因洞察",
    stepThreeBody: "AI 归纳表现原因并沉淀为学习资产。",
    intelligence: "已学习 · 用于下次 Campaign",
    intelligenceBody: "创建新 Campaign 时，以下洞察会自动预填 Hook、时长与风格。",
    fallbackInsightTitle: "AI 洞察即将出现",
    fallbackInsightBody: "导入表现数据后，系统会自动生成可复用的归因洞察。",
    readySoon: "即将就绪",
    currentConnected: "当前已连接",
    dataSources: "个数据源",
    stillNeed: "还需连接",
    unlock: "解锁 AI 洞察"
  }
};

function MiniSparkline() {
  return (
    <svg viewBox="0 0 80 28" className="h-7 w-20 text-[#6d4cff]">
      <path
        d="M2 19 C9 12 15 17 21 15 S31 8 39 13 S50 22 57 11 S68 8 78 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BrandAttributionHub({
  locale,
  insights,
  sources,
  campaignOptions,
  pendingCount,
  attributedCount
}: {
  locale: Locale;
  rows: AttributionDeliverableRow[];
  insights: StoredCreativeInsight[];
  sources: SerializedPerformanceSource[];
  campaignOptions: AttributionCampaignOption[];
  pendingCount: number;
  attributedCount: number;
}) {
  const t = copy[locale];
  const topInsight = insights[0];
  const connectedSourceCount = sources.length;
  const remainingSourceCount = Math.max(0, 3 - connectedSourceCount);

  return (
    <div className="mx-auto max-w-6xl space-y-9">
      <section className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.03em] text-zinc-950">
            {t.heroTitle}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-zinc-500">{t.heroBody}</p>
        </div>
        <div className="grid grid-cols-3 gap-3 lg:min-w-[330px]">
          {[
            { label: t.statsAttributed, value: attributedCount },
            { label: t.statsPending, value: pendingCount },
            { label: t.statsInsights, value: insights.length, chart: true }
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex min-h-[78px] flex-col items-center justify-center rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 text-center shadow-sm"
            >
              <p className="text-[28px] font-semibold leading-none tabular-nums tracking-tight text-zinc-950">
                {stat.value}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <p className="text-xs font-medium text-zinc-500">{stat.label}</p>
                {stat.chart ? <MiniSparkline /> : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[26px] border border-dashed border-zinc-300/90 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[1fr_360px]">
          <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-[#6d4cff]">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-zinc-950">{t.emptyTitle}</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-zinc-500">{t.emptyBody}</p>
            <Button asChild className="mt-6 rounded-full bg-zinc-950 px-6 hover:bg-zinc-800">
              <Link href={withLocale("/brand/projects/new", locale)}>{t.createCampaign}</Link>
            </Button>
          </div>

          <div className="border-t border-zinc-100 bg-zinc-50/50 px-8 py-8 lg:border-l lg:border-t-0">
            <h3 className="text-sm font-semibold text-zinc-950">{t.howTitle}</h3>
            <div className="mt-5 space-y-5">
              {[
                { title: t.stepOneTitle, body: t.stepOneBody },
                { title: t.stepTwoTitle, body: t.stepTwoBody },
                { title: t.stepThreeTitle, body: t.stepThreeBody }
              ].map((step, index) => (
                <div key={step.title} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#6d4cff] shadow-sm ring-1 ring-zinc-200">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{step.title}</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SocialPerformanceSourcesPanel
        locale={locale}
        campaignOptions={campaignOptions}
        sources={sources}
      />

      {topInsight ? (
        <BrandAttributionInsightCard locale={locale} insight={topInsight} />
      ) : (
      <section className="overflow-hidden rounded-[28px] border border-violet-100 bg-gradient-to-br from-white via-white to-[#f5f0ff] p-7 shadow-[0_18px_55px_rgba(109,76,255,0.10)]">
        <div className="grid gap-6 md:grid-cols-[1fr_220px] md:items-start">
          <div className="flex gap-5">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#7c4dff] text-white shadow-[0_14px_30px_rgba(124,77,255,0.35)] ring-8 ring-violet-100">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">{t.fallbackInsightTitle}</h2>
                <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-[#6d4cff]">
                  {t.readySoon}
                </span>
              </div>
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-zinc-500">{t.fallbackInsightBody}</p>
            </div>
          </div>

          <div className="relative hidden min-h-[130px] md:block">
            <div className="absolute right-4 top-2 rotate-6 rounded-2xl bg-white p-4 shadow-[0_16px_35px_rgba(109,76,255,0.16)]">
              <BarChart3 className="h-16 w-28 text-[#6d4cff]" />
            </div>
            <div className="absolute right-28 top-24 flex h-9 w-9 items-center justify-center rounded-full bg-[#6d4cff] text-white shadow-lg">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <Sparkles className="absolute right-36 top-0 h-4 w-4 text-violet-300" />
            <Sparkles className="absolute right-2 top-24 h-4 w-4 text-violet-200" />
          </div>
        </div>

        <div className="mt-8 rounded-[22px] border border-zinc-200/80 bg-white/90 p-6 shadow-sm">
          <div className="grid gap-6 md:grid-cols-[160px_1fr_160px] md:items-center">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-50 text-2xl font-semibold text-[#6d4cff]">
                {connectedSourceCount}
              </div>
              <p className="mt-3 text-sm font-medium text-zinc-700">{t.currentConnected}</p>
              <p className="mt-1 text-2xl font-semibold text-[#6d4cff]">{connectedSourceCount}</p>
              <p className="text-sm text-zinc-500">{t.dataSources}</p>
            </div>

            <div className="flex flex-col items-center justify-center gap-4">
              <div className="flex w-full max-w-md items-center justify-center">
                <span className="h-px flex-1 bg-violet-200" />
                <span className="mx-3 h-6 w-6 rounded-full border-4 border-[#6d4cff] bg-white" />
                <span className="h-px flex-1 border-t border-dashed border-zinc-300" />
                <span className="mx-3 h-6 w-6 rounded-full border-2 border-zinc-300 bg-white" />
                <span className="h-px flex-1 border-t border-dashed border-zinc-300" />
                <span className="mx-3 h-6 w-6 rounded-full border-2 border-zinc-300 bg-white" />
                <span className="h-px flex-1 border-t border-dashed border-zinc-300" />
              </div>
              <p className="text-sm text-zinc-500">
                {remainingSourceCount > 0
                  ? locale === "zh"
                    ? `${t.stillNeed} ${remainingSourceCount} ${t.dataSources}`
                    : `${t.stillNeed}: ${remainingSourceCount}`
                  : t.unlock}
              </p>
              <div className="flex items-center gap-4 text-[#6d4cff]">
                <Link className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50" href={withLocale("/brand/attribution", locale)}>
                  <span className="text-lg">↗</span>
                </Link>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                  <span className="text-lg">◔</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-50 text-2xl font-semibold text-[#6d4cff]">
                3+
              </div>
              <p className="mt-3 text-sm font-medium text-zinc-700">{t.unlock}</p>
              <div className="mt-4 flex justify-center text-[#6d4cff]">
                <Sparkles className="h-8 w-8" />
                <Sparkles className="-ml-1 mt-5 h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </section>
      )}
    </div>
  );
}
