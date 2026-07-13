"use client";

import type { BriefFormState } from "@/components/studioos/brand-campaign-step-brief";
import { BrandCreativeBriefProductionFields } from "@/components/studioos/brand-creative-brief/brand-creative-brief-production-section";
import { BrandCreativeBriefScheduleFields } from "@/components/studioos/brand-creative-brief/brand-creative-brief-schedule-fields";
import { QuickBriefSectionCard } from "@/components/studioos/quick-brief/quick-brief-section-header";
import type { Locale } from "@/lib/i18n";
import type { BrandVideoAspectRatio } from "@/lib/studioos/brand-campaign-options";

export function QuickBriefSidePanel({
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
  return (
    <QuickBriefSectionCard className="h-full">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] sm:gap-x-4">
        <div className="min-w-0">
          <BrandCreativeBriefScheduleFields
            locale={locale}
            form={form}
            patch={patch}
            layout="stacked"
            visibleFields="start"
          />
        </div>
        <div className="min-w-0">
          <BrandCreativeBriefScheduleFields
            locale={locale}
            form={form}
            patch={patch}
            layout="stacked"
            visibleFields="delivery"
          />
        </div>

        <div className="min-w-0">
          <BrandCreativeBriefProductionFields
            locale={locale}
            form={form}
            patch={patch}
            onAspectRatioSelect={onAspectRatioSelect}
            isPending={isPending}
            variant="quick"
            visibleFields="duration"
          />
        </div>
        <div className="min-w-0">
          <BrandCreativeBriefProductionFields
            locale={locale}
            form={form}
            patch={patch}
            onAspectRatioSelect={onAspectRatioSelect}
            isPending={isPending}
            variant="quick"
            visibleFields="aspect"
          />
        </div>

        <div className="min-w-0 sm:col-span-2">
          <BrandCreativeBriefProductionFields
            locale={locale}
            form={form}
            patch={patch}
            onAspectRatioSelect={onAspectRatioSelect}
            isPending={isPending}
            variant="quick"
            visibleFields="resolutionQuantity"
          />
        </div>
      </div>
    </QuickBriefSectionCard>
  );
}
