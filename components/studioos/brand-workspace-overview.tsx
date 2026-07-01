import { BrandCampaignList } from "@/components/studioos/brand-campaign-list";
import { BrandWorkspaceHero } from "@/components/studioos/brand-workspace-hero";
import type { Locale } from "@/lib/i18n";
import type { BrandProjectRow } from "@/lib/studioos/brand-dashboard";

const copy = {
  en: {
    projectsTitle: "My ads",
    projectsHint:
      process.env.NODE_ENV === "development"
        ? "Dev mode: select rows on the left to batch-delete test projects"
        : "Only draft briefs can be deleted · orders are locked"
  },
  zh: {
    projectsTitle: "我的广告",
    projectsHint:
      process.env.NODE_ENV === "development"
        ? "开发模式：勾选左侧项目可批量删除测试数据"
        : "仅草稿可删除 · 正式订单不可删除"
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
  const total = rows.length;
  const drafts = rows.filter((row) => row.phase === "draft").length;
  const active = rows.filter((row) => row.phase === "active").length;

  return (
    <div className="space-y-8">
      <BrandWorkspaceHero locale={locale} name={name} total={total} drafts={drafts} active={active} />
      <section id="my-ads" className="space-y-4 scroll-mt-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-950">{t.projectsTitle}</h2>
          <p className="mt-1 text-sm text-zinc-500">{t.projectsHint}</p>
        </div>
        <BrandCampaignList locale={locale} rows={rows} orderProjectMap={orderProjectMap} />
      </section>
    </div>
  );
}
