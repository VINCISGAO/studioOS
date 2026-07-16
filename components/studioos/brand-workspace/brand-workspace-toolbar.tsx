"use client";

import { Plus } from "lucide-react";
import { BrandStartBriefButton } from "@/components/studioos/brand-start-brief-button";
import type { Locale } from "@/lib/i18n";
import type { BrandNewCampaignGate } from "@/lib/studioos/brand-active-campaign-limit";

const copy = {
  en: {
    publish: "Publish ad brief"
  },
  zh: {
    publish: "发布广告需求"
  }
} as const;

export function BrandWorkspaceToolbar({
  locale,
  activeCampaignCount = 0,
  creationGate,
  rateLimitCode = null
}: {
  locale: Locale;
  activeCampaignCount?: number;
  creationGate?: BrandNewCampaignGate;
  rateLimitCode?: "rate_limit_10m" | "rate_limit_24h" | null;
}) {
  const t = copy[locale];

  return (
    <BrandStartBriefButton
      locale={locale}
      activeCampaignCount={activeCampaignCount}
      creationGate={creationGate}
      rateLimitCode={rateLimitCode}
      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-violet-600 px-5 text-sm font-medium text-white hover:bg-violet-700"
    >
      <Plus className="h-4 w-4" />
      {t.publish}
    </BrandStartBriefButton>
  );
}
