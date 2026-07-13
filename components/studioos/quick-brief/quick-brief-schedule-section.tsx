"use client";

import { CalendarDays } from "lucide-react";
import type { BriefFormState } from "@/components/studioos/brand-campaign-step-brief";
import { BrandCreativeBriefScheduleFields } from "@/components/studioos/brand-creative-brief/brand-creative-brief-schedule-fields";
import {
  QuickBriefSectionCard,
  QuickBriefSectionHeader
} from "@/components/studioos/quick-brief/quick-brief-section-header";
import type { Locale } from "@/lib/i18n";
import { quickBriefCopy } from "@/lib/studioos/quick-brief-copy";

export function QuickBriefScheduleSection({
  locale,
  form,
  patch
}: {
  locale: Locale;
  form: BriefFormState;
  patch: <K extends keyof BriefFormState>(key: K, value: BriefFormState[K]) => void;
}) {
  const t = quickBriefCopy(locale);

  return (
    <QuickBriefSectionCard className="h-full min-w-0">
      <QuickBriefSectionHeader number={2} title={t.timelineLabel} icon={CalendarDays} />
      <BrandCreativeBriefScheduleFields locale={locale} form={form} patch={patch} layout="stacked" />
    </QuickBriefSectionCard>
  );
}
