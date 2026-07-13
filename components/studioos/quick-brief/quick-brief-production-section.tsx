"use client";

import { BrandCreativeBriefProductionFields } from "@/components/studioos/brand-creative-brief/brand-creative-brief-production-section";
import type { BriefFormState } from "@/components/studioos/brand-campaign-step-brief";
import {
  QuickBriefSectionCard,
  QuickBriefSectionHeader
} from "@/components/studioos/quick-brief/quick-brief-section-header";
import type { Locale } from "@/lib/i18n";
import type { BrandVideoAspectRatio } from "@/lib/studioos/brand-campaign-options";
import { quickBriefCopy } from "@/lib/studioos/quick-brief-copy";

export function QuickBriefProductionSection({
  locale,
  form,
  patch,
  onAspectRatioSelect,
  isPending
}: {
  locale: Locale;
  form: BriefFormState;
  patch: <K extends keyof BriefFormState>(key: K, value: BriefFormState[K]) => void;
  onAspectRatioSelect: (value: BrandVideoAspectRatio) => void;
  isPending?: boolean;
}) {
  const t = quickBriefCopy(locale);

  return (
    <QuickBriefSectionCard className="h-full min-w-0">
      <QuickBriefSectionHeader number={3} title={t.productionLabel} />
      <BrandCreativeBriefProductionFields
        locale={locale}
        form={form}
        patch={patch}
        onAspectRatioSelect={onAspectRatioSelect}
        isPending={isPending}
        variant="quick"
      />
    </QuickBriefSectionCard>
  );
}
