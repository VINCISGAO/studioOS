"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { BrandCampaignList } from "@/components/studioos/brand-campaign-list";
import { BrandWorkspaceHero } from "@/components/studioos/brand-workspace-hero";
import { BrandWorkspaceMiddleRow } from "@/components/studioos/brand-workspace/brand-workspace-middle-row";
import type { Locale } from "@/lib/i18n";
import type { BrandProjectRow } from "@/lib/studioos/brand-dashboard-types";
import { computeBrandWorkspaceHeroStats } from "@/lib/studioos/brand-workspace-hero-stats";
import type { BrandNewCampaignGate } from "@/lib/studioos/brand-active-campaign-limit";
import { scrollToBrandMyAds, scheduleBrandMyAdsScroll } from "@/lib/studioos/brand-my-ads-scroll";

const copy = {
  en: {
    projectsTitle: "My ad briefs",
    projectsHint:
      process.env.NODE_ENV === "development"
        ? "Dev mode: select rows on the left to batch-delete test projects"
        : "Only drafts can be deleted · paid orders are locked"
  },
  zh: {
    projectsTitle: "我的广告需求",
    projectsHint:
      process.env.NODE_ENV === "development"
        ? "开发模式：勾选左侧项目可批量删除测试数据"
        : "仅草稿可删除，正式订单不可删除"
  }
};

export function BrandWorkspaceOverview({
  locale,
  name,
  rows,
  orderProjectMap,
  resumeWizardProjectId,
  activeCampaignCount,
  creationGate,
  rateLimitCode = null
}: {
  locale: Locale;
  name: string;
  rows: BrandProjectRow[];
  orderProjectMap: Record<string, string | null | undefined>;
  resumeWizardProjectId?: string;
  activeCampaignCount: number;
  creationGate?: BrandNewCampaignGate;
  rateLimitCode?: "rate_limit_10m" | "rate_limit_24h" | null;
}) {
  const t = copy[locale];
  const [items, setItems] = useState(rows);

  useEffect(() => {
    setItems(rows);
  }, [rows]);

  const { total, drafts, active } = useMemo(() => computeBrandWorkspaceHeroStats(items), [items]);

  useLayoutEffect(() => {
    if (window.location.hash !== "#my-ads") return;
    scrollToBrandMyAds({ behavior: "auto", force: true });
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash === "#my-ads") {
        scheduleBrandMyAdsScroll({ behavior: "auto", force: true });
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      <BrandWorkspaceHero
        locale={locale}
        name={name}
        total={total}
        drafts={drafts}
        active={active}
        activeCampaignCount={activeCampaignCount}
        creationGate={creationGate}
        rateLimitCode={rateLimitCode}
      />

      <BrandWorkspaceMiddleRow locale={locale} activeCount={activeCampaignCount} />

      <section id="my-ads" className="scroll-mt-28">
        <BrandCampaignList
          locale={locale}
          rows={items}
          onRowsChange={setItems}
          orderProjectMap={orderProjectMap}
          resumeWizardProjectId={resumeWizardProjectId}
          activeCampaignCount={activeCampaignCount}
          creationGate={creationGate}
          rateLimitCode={rateLimitCode}
          sectionTitle={t.projectsTitle}
          sectionHint={t.projectsHint}
        />
      </section>
    </div>
  );
}
