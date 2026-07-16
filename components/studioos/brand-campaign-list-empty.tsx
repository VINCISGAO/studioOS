"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { BrandWorkspaceEmptyMascot } from "@/components/studioos/brand-workspace/brand-workspace-art";
import { BrandStartBriefButton } from "@/components/studioos/brand-start-brief-button";
import type { Locale } from "@/lib/i18n";
import { brandWizardStep1Href } from "@/lib/i18n";
import type { BrandNewCampaignGate } from "@/lib/studioos/brand-active-campaign-limit";

const copy = {
  en: {
    empty: "No ad briefs yet",
    emptyBody: "Publish your first ad brief — AI helps you organize it in minutes.",
    emptyFiltered: "No items match this filter.",
    publish: "Publish ad brief",
    resumeDraft: "Resume last draft"
  },
  zh: {
    empty: "还没有广告需求",
    emptyBody: "发布第一个广告需求，AI 帮你在几分钟内整理好说明。",
    emptyFiltered: "当前筛选下没有项目。",
    publish: "发布广告需求",
    resumeDraft: "继续上次未完成草稿"
  }
} as const;

export function BrandCampaignListEmpty({
  locale,
  hasRows,
  resumeWizardProjectId,
  activeCampaignCount = 0,
  creationGate,
  rateLimitCode = null
}: {
  locale: Locale;
  hasRows: boolean;
  resumeWizardProjectId?: string;
  activeCampaignCount?: number;
  creationGate?: BrandNewCampaignGate;
  rateLimitCode?: "rate_limit_10m" | "rate_limit_24h" | null;
}) {
  const t = copy[locale];

  if (hasRows) {
    return (
      <div className="px-6 py-14 text-center">
        <p className="text-sm text-zinc-500">{t.emptyFiltered}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-6 py-14 text-center sm:py-16">
      <BrandWorkspaceEmptyMascot className="h-auto w-full max-w-[224px] object-contain sm:max-w-[256px]" />
      <p className="mt-5 text-base font-medium text-zinc-800">{t.empty}</p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500">{t.emptyBody}</p>
      <div className="mt-6 flex flex-col items-center gap-3">
        <BrandStartBriefButton
          locale={locale}
          activeCampaignCount={activeCampaignCount}
          creationGate={creationGate}
          rateLimitCode={rateLimitCode}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-violet-600 px-6 text-sm font-medium text-white hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          {t.publish}
        </BrandStartBriefButton>
        {resumeWizardProjectId ? (
          <Link
            href={brandWizardStep1Href(locale, resumeWizardProjectId)}
            className="text-sm font-medium text-violet-700 underline-offset-4 hover:text-violet-900 hover:underline"
          >
            {t.resumeDraft}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
