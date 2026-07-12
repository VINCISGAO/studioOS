"use client";

import { BrandCampaignList } from "@/components/studioos/brand-campaign-list";
import { BrandActiveCampaignCapacity } from "@/components/studioos/brand-active-campaign-capacity";
import { BrandWorkspaceHero } from "@/components/studioos/brand-workspace-hero";
import type { Locale } from "@/lib/i18n";
import type { BrandProjectRow } from "@/lib/studioos/brand-dashboard";
import type { BrandNewCampaignGate } from "@/lib/studioos/brand-active-campaign-limit";
import { syncBrandMyAdsHashScroll } from "@/lib/studioos/brand-my-ads-scroll";
import { useEffect } from "react";

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
  orderProjectMap,
  wizardProjectId,
  activeCampaignCount,
  creationGate,
  rateLimitCode = null
}: {
  locale: Locale;
  name: string;
  rows: BrandProjectRow[];
  orderProjectMap: Record<string, string | null | undefined>;
  wizardProjectId?: string;
  activeCampaignCount: number;
  creationGate?: BrandNewCampaignGate;
  rateLimitCode?: "rate_limit_10m" | "rate_limit_24h" | null;
}) {
  const t = copy[locale];
  const total = rows.length;
  const drafts = rows.filter((row) => row.phase === "draft").length;
  const active = rows.filter((row) => row.phase === "active").length;

  useEffect(() => {
    syncBrandMyAdsHashScroll();
    const onHashChange = () => syncBrandMyAdsHashScroll();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <div className="space-y-8">
      <BrandWorkspaceHero
        locale={locale}
        name={name}
        total={total}
        drafts={drafts}
        active={active}
        wizardProjectId={wizardProjectId}
        activeCampaignCount={activeCampaignCount}
        creationGate={creationGate}
        rateLimitCode={rateLimitCode}
      />
      <BrandActiveCampaignCapacity locale={locale} activeCount={activeCampaignCount} />
      <section id="my-ads" className="space-y-4 scroll-mt-28">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-950">{t.projectsTitle}</h2>
          <p className="mt-1 text-sm text-zinc-500">{t.projectsHint}</p>
        </div>
        <BrandCampaignList
          locale={locale}
          rows={rows}
          orderProjectMap={orderProjectMap}
          wizardProjectId={wizardProjectId}
          activeCampaignCount={activeCampaignCount}
          creationGate={creationGate}
          rateLimitCode={rateLimitCode}
        />
      </section>
    </div>
  );
}
