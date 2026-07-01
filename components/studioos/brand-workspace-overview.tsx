import { BrandCampaignList } from "@/components/studioos/brand-campaign-list";
import { BrandStartBriefButton } from "@/components/studioos/brand-start-brief-button";
import type { Locale } from "@/lib/i18n";
import type { BrandProjectRow } from "@/lib/studioos/brand-dashboard";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

const copy = {
  en: {
    eyebrow: "Brand workspace",
    greeting: (name: string) => `Hi, ${name}`,
    headline: "What ad do you want to make today?",
    steps: "Three steps — brief, pick a studio, review and approve.",
    publish: "Publish ad brief",
    all: "All",
    draft: "Drafts",
    active: "In progress",
    projectsTitle: "My ads",
    projectsHint: "Only draft briefs can be deleted · orders are locked"
  },
  zh: {
    eyebrow: "品牌工作台",
    greeting: (name: string) => `${name}，你好`,
    headline: "今天想做什么广告？",
    steps: "三步搞定 — 说清需求、选制作团队、审片验收。",
    publish: "发布广告需求",
    all: "全部",
    draft: "草稿",
    active: "进行中",
    projectsTitle: "我的广告",
    projectsHint: "仅草稿可删除 · 正式订单不可删除"
  }
};

export function BrandWorkspaceOverview({
  locale,
  name,
  rows,
  orderProjectMap
}: {
  locale: Locale;
  name: string;
  rows: BrandProjectRow[];
  orderProjectMap: Record<string, string | null | undefined>;
}) {
  const t = copy[locale];
  const displayName = name.trim() || (locale === "zh" ? "朋友" : "there");
  const total = rows.length;
  const drafts = rows.filter((row) => row.phase === "draft").length;
  const active = rows.filter((row) => row.phase === "active").length;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">{t.eyebrow}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              {t.greeting(displayName)}
            </h1>
            <p className="mt-2 text-lg font-medium text-zinc-800">{t.headline}</p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500">{t.steps}</p>
            <BrandStartBriefButton
              locale={locale}
              size="lg"
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-zinc-900 px-6 text-sm font-medium text-white hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4" />
              {t.publish}
            </BrandStartBriefButton>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:min-w-[280px]">
            {[
              { label: t.all, value: total },
              { label: t.draft, value: drafts },
              { label: t.active, value: active }
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-4 text-center"
              >
                <p className="text-2xl font-semibold tabular-nums tracking-tight text-zinc-950">{stat.value}</p>
                <p className="mt-1 text-xs font-medium text-zinc-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="my-ads" className="space-y-4 scroll-mt-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-950">{t.projectsTitle}</h2>
          <p className={cn("mt-1 text-sm text-zinc-500")}>{t.projectsHint}</p>
        </div>
        <BrandCampaignList locale={locale} rows={rows} orderProjectMap={orderProjectMap} />
      </section>
    </div>
  );
}
