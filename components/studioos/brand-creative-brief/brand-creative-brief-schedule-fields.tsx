"use client";

import type { BriefFormState } from "@/components/studioos/brand-campaign-step-brief";
import { BrandCreativeBriefDateField } from "@/components/studioos/brand-creative-brief/brand-creative-brief-date-field";
import type { Locale } from "@/lib/i18n";
import {
  briefScheduleRangeError,
  getBriefMaxStartDate,
  getBriefMinDeliveryDate,
  getBriefMinStartDate,
  hasBriefScheduleMinGap,
  isBriefScheduleDayBefore,
  parseBriefScheduleDate
} from "@/lib/studioos/brand-creative-brief-form";
import { BRIEF_FIELD_TARGETS } from "@/lib/studioos/brand-creative-brief-scroll";

export function BrandCreativeBriefScheduleFields({
  locale,
  form,
  patch,
  layout = "grid",
  visibleFields = "both"
}: {
  locale: Locale;
  form: BriefFormState;
  patch: <K extends keyof BriefFormState>(key: K, value: BriefFormState[K]) => void;
  layout?: "grid" | "stacked";
  visibleFields?: "both" | "start" | "delivery";
}) {
  const startDate = parseBriefScheduleDate(form.scheduleStart);
  const deliveryDate = parseBriefScheduleDate(form.scheduleDelivery);
  const minStartDate = getBriefMinStartDate();
  const minDeliveryDate = startDate
    ? getBriefMinDeliveryDate(startDate)
    : getBriefMinDeliveryDate(minStartDate);
  const maxStartDate = deliveryDate ? getBriefMaxStartDate(deliveryDate) : null;
  const scheduleRangeErrorMessage = briefScheduleRangeError(
    form.scheduleStart,
    form.scheduleDelivery,
    locale
  );
  const startDateError =
    startDate && isBriefScheduleDayBefore(startDate, minStartDate)
      ? locale === "zh"
        ? "开始时间不能早于今天"
        : "Start date cannot be before today"
      : null;

  function handleScheduleStartChange(value: string) {
    patch("scheduleStart", value);
    const nextStart = parseBriefScheduleDate(value);
    const currentDelivery = parseBriefScheduleDate(form.scheduleDelivery);
    if (nextStart && currentDelivery && !hasBriefScheduleMinGap(nextStart, currentDelivery)) {
      patch("scheduleDelivery", "");
    }
  }

  function handleScheduleDeliveryChange(value: string) {
    const nextDelivery = parseBriefScheduleDate(value);
    if (startDate && nextDelivery && !hasBriefScheduleMinGap(startDate, nextDelivery)) {
      return;
    }
    patch("scheduleDelivery", value);
  }

  const startField = (
    <BrandCreativeBriefDateField
      locale={locale}
      label={locale === "zh" ? "开始时间" : "Start date"}
      value={form.scheduleStart}
      onChange={handleScheduleStartChange}
      required
      fieldId={BRIEF_FIELD_TARGETS.scheduleStart}
      minDate={minStartDate}
      maxDate={maxStartDate}
      error={startDateError}
    />
  );

  const deliveryField = (
    <BrandCreativeBriefDateField
      locale={locale}
      label={locale === "zh" ? "交付时间" : "Delivery date"}
      value={form.scheduleDelivery}
      onChange={handleScheduleDeliveryChange}
      required
      fieldId={BRIEF_FIELD_TARGETS.scheduleDelivery}
      minDate={minDeliveryDate}
      error={scheduleRangeErrorMessage}
    />
  );

  if (visibleFields === "start") {
    return startField;
  }

  if (visibleFields === "delivery") {
    return deliveryField;
  }

  return (
    <div className={layout === "stacked" ? "grid grid-cols-1 gap-3" : "grid gap-4 sm:grid-cols-2"}>
      {startField}
      {deliveryField}
    </div>
  );
}
