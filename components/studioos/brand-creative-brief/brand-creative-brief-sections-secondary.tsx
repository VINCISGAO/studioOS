"use client";

import { useMemo, useState } from "react";
import {
  BriefFieldLabel,
  BriefPurpleChip,
  BriefSectionCard
} from "@/components/studioos/brand-creative-brief/brand-creative-brief-ui";
import {
  AspectIcon,
  toggleList,
  type BriefSectionsProps
} from "@/components/studioos/brand-creative-brief/brand-creative-brief-sections-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  FPS_OPTIONS,
  MUST_AVOID_OPTIONS,
  MUST_INCLUDE_OPTIONS,
  RESOLUTION_OPTIONS,
  VIDEO_DURATION_OPTIONS,
  labelForOption
} from "@/lib/studioos/brand-creative-brief-options";
import { getBrandBudgetPresets, BRAND_DELIVERY_TIMELINES, BRAND_VIDEO_ASPECT_RATIOS } from "@/lib/studioos/brand-campaign-options";
import {
  briefScheduleRangeError,
  getBriefMaxStartDate,
  getBriefMinDeliveryDate,
  hasBriefScheduleMinGap,
  isBriefScheduleDayAfter,
  isBriefScheduleDayBefore,
  parseBriefScheduleDate
} from "@/lib/studioos/brand-creative-brief-form";
import { BRIEF_FIELD_TARGETS } from "@/lib/studioos/brand-creative-brief-scroll";
import {
  budgetRangeLabel,
  convertUsdToDisplayAmount,
  formatMoneyFromUsd,
  formatMoneyRangeFromUsd,
  settlementUsdNote
} from "@/lib/money/display-money";
import { cn } from "@/lib/utils";
import { Bot, CalendarDays, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

function parseDateValue(value: string) {
  return parseBriefScheduleDate(value);
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function displayDateValue(value: string, locale: "zh" | "en") {
  const date = parseDateValue(value);
  if (!date) return locale === "zh" ? "选择日期" : "Select date";
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return locale === "zh" ? `${date.getFullYear()}/${month}/${day}` : `${date.getFullYear()}-${month}-${day}`;
}

function LargeDateField({
  locale,
  label,
  value,
  onChange,
  required = false,
  fieldId,
  minDate = null,
  maxDate = null,
  error = null
}: {
  locale: "zh" | "en";
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  fieldId?: string;
  minDate?: Date | null;
  maxDate?: Date | null;
  error?: string | null;
}) {
  const selected = parseDateValue(value);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const date = selected ?? new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const monthLabel = useMemo(
    () =>
      locale === "zh"
        ? `${viewMonth.getFullYear()} 年 ${viewMonth.getMonth() + 1} 月`
        : viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    [locale, viewMonth]
  );
  const days = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: firstDay + daysInMonth }, (_, index) =>
      index < firstDay ? null : new Date(year, month, index - firstDay + 1)
    );
  }, [viewMonth]);
  const selectedKey = selected ? formatDateValue(selected) : "";
  const weekdayLabels = locale === "zh" ? ["日", "一", "二", "三", "四", "五", "六"] : ["S", "M", "T", "W", "T", "F", "S"];

  function moveMonth(delta: number) {
    setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function openCalendar() {
    if (selected) {
      setViewMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
    }
    setOpen((current) => !current);
  }

  function isDayDisabled(day: Date) {
    if (minDate && isBriefScheduleDayBefore(day, minDate)) return true;
    if (maxDate && isBriefScheduleDayAfter(day, maxDate)) return true;
    return false;
  }

  return (
    <div id={fieldId} className="scroll-mt-32 relative space-y-2 rounded-xl">
      <BriefFieldLabel label={label} required={required} />
      <button
        type="button"
        onClick={openCalendar}
        className={cn(
          "flex h-[3.25rem] w-full items-center justify-between rounded-xl border bg-white px-4 text-left text-base shadow-sm transition hover:bg-violet-50/20",
          error
            ? "border-red-300 text-red-700 hover:border-red-400"
            : "border-zinc-200 text-zinc-700 hover:border-violet-200"
        )}
      >
        <span>{displayDateValue(value, locale)}</span>
        <CalendarDays className="h-5 w-5 text-zinc-400" />
      </button>
      {open ? (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl shadow-zinc-900/15">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100"
              aria-label={locale === "zh" ? "上个月" : "Previous month"}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="text-base font-semibold text-zinc-900">{monthLabel}</p>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100"
              aria-label={locale === "zh" ? "下个月" : "Next month"}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center text-sm font-semibold text-zinc-500">
            {weekdayLabels.map((day, index) => (
              <span key={`${day}-${index}`}>{day}</span>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1.5">
            {days.map((day, index) => {
              if (!day) {
                return <span key={`blank-${index}`} className="h-10" />;
              }
              const key = formatDateValue(day);
              const isSelected = key === selectedKey;
              const disabled = isDayDisabled(day);
              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (disabled) return;
                    onChange(key);
                    setOpen(false);
                  }}
                  className={
                    disabled
                      ? "flex h-10 cursor-not-allowed items-center justify-center rounded-xl text-base font-medium text-zinc-300"
                      : isSelected
                        ? "flex h-10 items-center justify-center rounded-xl bg-violet-600 text-base font-semibold text-white shadow-lg shadow-violet-600/25"
                        : "flex h-10 items-center justify-center rounded-xl text-base font-medium text-zinc-700 hover:bg-violet-50 hover:text-violet-700"
                  }
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function parseMoneyRange(value: string) {
  const numbers = value.match(/\d[\d,]*/g)?.map((item) => Number(item.replace(/,/g, ""))) ?? [];
  if (!numbers.length) return null;
  if (value.includes("+")) {
    return { min: numbers[0] ?? 0, max: null };
  }
  if (numbers.length === 1) {
    const amount = numbers[0] ?? 0;
    return { min: amount, max: amount };
  }
  const first = numbers[0] ?? 0;
  const second = numbers[1] ?? first;
  return { min: Math.min(first, second), max: Math.max(first, second) };
}

function roundToMarketStep(amount: number) {
  if (amount < 1000) return Math.round(amount / 25) * 25;
  return Math.round(amount / 50) * 50;
}

function durationBasePrice(duration: string, customDuration = "") {
  if (duration === "custom") {
    const seconds = durationSeconds(duration, customDuration);
    if (seconds <= 15) return 380;
    if (seconds <= 30) return 650;
    if (seconds <= 45) return 900;
    if (seconds <= 60) return 1200;
    if (seconds <= 90) return 1800;
    return Math.max(1800, Math.round(seconds * 20));
  }
  if (duration === "6s") return 220;
  if (duration === "10s") return 280;
  if (duration === "15s") return 380;
  if (duration === "30s") return 650;
  if (duration === "45s") return 900;
  if (duration === "60s") return 1200;
  if (duration === "90s") return 1800;
  return 1200;
}

function durationSeconds(duration: string, customDuration = "") {
  if (duration === "custom") {
    const raw = customDuration.trim().toLowerCase();
    const secMatch = raw.match(/(\d+)\s*s/);
    if (secMatch) return Number(secMatch[1]);
    const minMatch = raw.match(/(\d+)\s*m/);
    if (minMatch) return Number(minMatch[1]) * 60;
    const numeric = Number(raw.replace(/[^\d]/g, ""));
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
    return 60;
  }
  const seconds = Number(duration.replace(/[^0-9]/g, ""));
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 60;
}

function marketQuoteForBrief(form: BriefSectionsProps["form"], locale: BriefSectionsProps["locale"]) {
  let multiplier = 1;

  if (form.deliveryTimeline === "3-5") multiplier += 0.25;
  if (form.deliveryTimeline === "5-7") multiplier += 0.12;
  if (form.deliveryTimeline === "14plus") multiplier -= 0.08;

  if (form.aspectRatio === "16:9") multiplier += 0.1;
  if (form.aspectRatio === "4:5") multiplier += 0.05;
  if (form.aspectRatio === "1:1") multiplier -= 0.05;

  if (form.resolution === "4K") multiplier += 0.2;
  if (form.resolution === "720p") multiplier -= 0.12;
  if (form.frameRate === "60 fps") multiplier += 0.1;
  if (form.frameRate === "24 fps") multiplier += 0.04;

  const premiumStyles = new Set(["cinematic", "luxury", "premium", "fashion", "animation", "cartoon", "ai", "viral"]);
  const premiumStyleCount = form.creativeStyles.filter((style) => premiumStyles.has(style)).length;
  multiplier += Math.min(0.3, premiumStyleCount * 0.06);

  const quantity = Math.max(1, form.videoQuantity || 1);
  const quantityDiscount = quantity >= 4 ? 0.82 : quantity >= 2 ? 0.9 : 1;
  const base = durationBasePrice(form.videoDuration, form.videoDurationCustom) * multiplier * quantity * quantityDiscount;
  const seconds = durationSeconds(form.videoDuration, form.videoDurationCustom);
  const averageShotSeconds = premiumStyleCount >= 3 ? 3 : premiumStyleCount >= 1 ? 4 : 5;
  const estimatedShots = Math.max(3, Math.ceil((seconds / averageShotSeconds) * quantity));
  const generationMultiplier =
    premiumStyleCount >= 4 ? 4.5 : premiumStyleCount >= 2 ? 3.5 : premiumStyleCount >= 1 ? 2.8 : 2.5;
  const estimatedGenerations = Math.ceil(estimatedShots * generationMultiplier);
  const estimatedHours = Math.ceil(
    estimatedShots * 0.65 +
      seconds / 18 +
      quantity * 1.4 +
      premiumStyleCount * 1.2 +
      (form.deliveryTimeline === "3-5" ? 3 : 0)
  );
  const toolCost = Math.max(45, estimatedGenerations * 6);
  const laborCost = estimatedHours * 40;
  const revisionReserve = (toolCost + laborCost) * (premiumStyleCount >= 3 ? 0.22 : 0.15);
  const riskBufferRate =
    form.deliveryTimeline === "3-5" || premiumStyleCount >= 4 ? 0.25 : premiumStyleCount >= 2 ? 0.18 : 0.1;
  const creatorProductionCost = toolCost + laborCost + revisionReserve + (toolCost + laborCost) * riskBufferRate;
  const creatorIncome = roundToMarketStep(Math.max(base * 0.78, creatorProductionCost * 1.35));
  const platformDeductionRate = 0.17;
  const brandMinimum = roundToMarketStep(creatorIncome / (1 - platformDeductionRate));
  const recommended = roundToMarketStep(brandMinimum * 1.16);
  const priority = roundToMarketStep(brandMinimum * 1.38);
  const topCreator = roundToMarketStep(brandMinimum * 1.75);
  const low = Math.max(200, roundToMarketStep(Math.max(base * 0.88, brandMinimum)));
  const high = Math.max(low + 100, roundToMarketStep(Math.max(base * 1.2, recommended)));
  const userBudget = parseMoneyRange(form.budgetRange);
  const riskLevel =
    userBudget?.max !== null && userBudget?.max !== undefined && userBudget.max < brandMinimum
      ? locale === "zh"
        ? "预算不足"
        : "Under budget"
      : userBudget?.min !== undefined && userBudget.min > recommended
        ? locale === "zh"
          ? "低风险"
          : "Low risk"
        : riskBufferRate >= 0.25
          ? locale === "zh"
            ? "较高"
            : "Elevated"
          : locale === "zh"
            ? "标准"
            : "Standard";
  const riskTone =
    riskLevel === "预算不足" || riskLevel === "Under budget"
      ? "danger"
      : riskLevel === "低风险" || riskLevel === "Low risk"
        ? "low"
        : riskLevel === "较高" || riskLevel === "Elevated"
          ? "elevated"
          : "standard";
  const complexity =
    generationMultiplier >= 4
      ? locale === "zh"
        ? "高难"
        : "Advanced"
      : generationMultiplier >= 3
        ? locale === "zh"
          ? "较难"
          : "Complex"
        : locale === "zh"
          ? "标准"
          : "Standard";
  const status =
    userBudget?.max !== null && userBudget?.max !== undefined && userBudget.max < brandMinimum
      ? locale === "zh"
        ? "当前预算低于最低可执行价，建议提高预算或降低制作要求"
        : "Current budget is below the reference quote; reduce scope or increase budget"
      : userBudget?.min !== undefined && userBudget.min > recommended
        ? locale === "zh"
          ? "当前预算充足，可匹配更高质量创作者"
          : "Budget is strong enough for higher-tier creators"
        : locale === "zh"
          ? "当前预算与参考报价基本匹配"
          : "Current budget broadly matches the reference quote";

  return {
    range: formatMoneyRangeFromUsd(low, high, locale),
    status,
    minimum: brandMinimum,
    recommended,
    priority,
    topCreator,
    creatorIncome,
    estimatedHours,
    estimatedShots,
    estimatedGenerations,
    riskLevel,
    riskTone,
    complexity,
    tiers: [
      {
        key: "base",
        label: locale === "zh" ? "基础匹配" : "Base match",
        price: brandMinimum,
        probability: "60%",
        time: locale === "zh" ? "24–48 小时" : "24–48h",
        description: locale === "zh" ? "覆盖基本制作标准" : "Covers basic production standards"
      },
      {
        key: "recommended",
        label: locale === "zh" ? "推荐匹配" : "Recommended",
        price: recommended,
        probability: "82%",
        time: locale === "zh" ? "6–18 小时" : "6–18h",
        description: locale === "zh" ? "更多专业创作者可见" : "Visible to more qualified creators"
      },
      {
        key: "priority",
        label: locale === "zh" ? "优先匹配" : "Priority",
        price: priority,
        probability: "94%",
        time: locale === "zh" ? "1–6 小时" : "1–6h",
        description: locale === "zh" ? "优先推荐给高评分创作者" : "Prioritized for high-rated creators"
      },
      {
        key: "top",
        label: locale === "zh" ? "顶级创作者" : "Top creators",
        price: topCreator,
        probability: "98%",
        time: locale === "zh" ? "最快响应" : "Fastest",
        description: locale === "zh" ? "匹配优秀 Studio 和强创意能力" : "Best studios and creative capability"
      }
    ]
  };
}

function riskBadgeClass(tone: string) {
  if (tone === "low") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (tone === "elevated") return "bg-orange-50 text-orange-700 ring-orange-200";
  if (tone === "danger") return "bg-rose-50 text-rose-700 ring-rose-200";
  return "bg-amber-50 text-amber-700 ring-amber-200";
}

function riskDotClass(tone: string) {
  if (tone === "low") return "bg-emerald-500";
  if (tone === "elevated") return "bg-orange-500";
  if (tone === "danger") return "bg-rose-500";
  return "bg-amber-500";
}

export function BrandCreativeBriefSecondarySections(props: BriefSectionsProps) {
  const {
    locale,
    form,
    patch,
    onAspectRatioSelect,
    budgetCustom,
    budgetIsCustom,
    onSelectPresetBudget,
    onBudgetCustomChange,
    onBudgetCustomBlur,
    isPending,
    copy: t
  } = props;

  const timelineOptions = BRAND_DELIVERY_TIMELINES[locale];
  const aspectRatioOptions = BRAND_VIDEO_ASPECT_RATIOS[locale];
  const budgetPresets = useMemo(() => getBrandBudgetPresets(locale), [locale]);
  const marketQuote = marketQuoteForBrief(form, locale);
  const fmt = (amount: number) => formatMoneyFromUsd(amount, locale);
  const settlementNote = settlementUsdNote(locale);
  const startDate = parseBriefScheduleDate(form.scheduleStart);
  const deliveryDate = parseBriefScheduleDate(form.scheduleDelivery);
  const minDeliveryDate = startDate ? getBriefMinDeliveryDate(startDate) : null;
  const maxStartDate = deliveryDate ? getBriefMaxStartDate(deliveryDate) : null;
  const scheduleRangeErrorMessage = briefScheduleRangeError(
    form.scheduleStart,
    form.scheduleDelivery,
    locale
  );

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

  return (
    <>
      <BriefSectionCard
        id="brief-section-details"
        number={3}
        locale={locale}
        optional
        title={locale === "zh" ? "更多细节" : "More details"}
      >
        <div className="space-y-2">
          <BriefFieldLabel label={locale === "zh" ? "必须包含的内容" : "Must include"} />
          <div className="flex flex-wrap gap-2">
            {MUST_INCLUDE_OPTIONS.map((item) => (
              <BriefPurpleChip
                key={item.id}
                active={form.mustInclude.includes(item.id)}
                onClick={() => patch("mustInclude", toggleList(form.mustInclude, item.id))}
              >
                {labelForOption(item, locale)}
              </BriefPurpleChip>
            ))}
          </div>
          <Input
            value={form.mustIncludeCustom}
            onChange={(e) => patch("mustIncludeCustom", e.target.value)}
            placeholder={locale === "zh" ? "其他必须包含" : "Other must-include"}
            className="h-10 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <BriefFieldLabel label={locale === "zh" ? "需要避免的内容" : "Must avoid"} />
          <div className="flex flex-wrap gap-2">
            {MUST_AVOID_OPTIONS.map((item) => (
              <BriefPurpleChip
                key={item.id}
                active={form.mustAvoid.includes(item.id)}
                onClick={() => patch("mustAvoid", toggleList(form.mustAvoid, item.id))}
              >
                {labelForOption(item, locale)}
              </BriefPurpleChip>
            ))}
          </div>
          <Input
            value={form.mustAvoidCustom}
            onChange={(e) => patch("mustAvoidCustom", e.target.value)}
            placeholder={locale === "zh" ? "其他需要避免" : "Other to avoid"}
            className="h-10 rounded-xl"
          />
        </div>
      </BriefSectionCard>

      <BriefSectionCard id="brief-section-production" number={4} locale={locale} title={locale === "zh" ? "制作要求" : "Production requirements"}>
        <div id={BRIEF_FIELD_TARGETS.videoDuration} className="scroll-mt-32 space-y-2 rounded-xl">
          <BriefFieldLabel label={locale === "zh" ? "视频时长" : "Video duration"} required />
          <div className="flex flex-wrap items-center gap-2">
            {VIDEO_DURATION_OPTIONS.map((item) => (
              <BriefPurpleChip
                key={item}
                active={form.videoDuration === item}
                disabled={isPending}
                onClick={() => patch("videoDuration", item)}
              >
                {item === "custom" ? (locale === "zh" ? "自定义" : "Custom") : item}
              </BriefPurpleChip>
            ))}
            {form.videoDuration === "custom" ? (
              <Input
                value={form.videoDurationCustom}
                onChange={(e) => patch("videoDurationCustom", e.target.value)}
                placeholder={locale === "zh" ? "例如 120s 或 2min" : "e.g. 120s or 2min"}
                className="h-10 min-w-[10rem] flex-1 rounded-xl sm:max-w-[14rem]"
                disabled={isPending}
              />
            ) : null}
          </div>
        </div>
        <div id={BRIEF_FIELD_TARGETS.aspectRatio} className="scroll-mt-32 space-y-2 rounded-xl">
          <BriefFieldLabel label={locale === "zh" ? "视频比例" : "Aspect ratio"} required />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {aspectRatioOptions.map((option) => {
              const active = form.aspectRatio === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => onAspectRatioSelect(option.id)}
                  className={cn(
                    "rounded-2xl border px-3 py-4 text-left transition",
                    active
                      ? "border-violet-600 bg-violet-50 text-violet-700"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                  )}
                >
                  <div className={cn("mb-2", active ? "text-violet-600" : "text-zinc-400")}>
                    <AspectIcon ratio={option.id} />
                  </div>
                  <p className="text-sm font-semibold">{option.label}</p>
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>{locale === "zh" ? "分辨率" : "Resolution"}</Label>
            <Select value={form.resolution} onValueChange={(value) => patch("resolution", value)}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTION_OPTIONS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{locale === "zh" ? "帧率" : "Frame rate"}</Label>
            <Select value={form.frameRate} onValueChange={(value) => patch("frameRate", value)}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FPS_OPTIONS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{locale === "zh" ? "视频数量" : "Quantity"}</Label>
            <div className="flex h-11 items-center rounded-xl border border-zinc-200">
              <button
                type="button"
                className="px-4 text-lg text-zinc-500"
                onClick={() => patch("videoQuantity", Math.max(1, form.videoQuantity - 1))}
              >
                −
              </button>
              <span className="flex-1 text-center text-sm font-semibold">{form.videoQuantity}</span>
              <button
                type="button"
                className="px-4 text-lg text-zinc-500"
                onClick={() => patch("videoQuantity", Math.min(10, form.videoQuantity + 1))}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </BriefSectionCard>

      <BriefSectionCard id="brief-section-budget" number={5} locale={locale} title={locale === "zh" ? "预算与时间" : "Budget & schedule"}>
        <div className="grid gap-5 lg:grid-cols-2">
          <div id={BRIEF_FIELD_TARGETS.budget} className="scroll-mt-32 space-y-2 rounded-xl">
            <BriefFieldLabel label={budgetRangeLabel(locale)} required />
            <div className="grid grid-cols-2 gap-2">
              {budgetPresets.map((option) => (
                <BriefPurpleChip
                  key={option.value}
                  active={!budgetIsCustom && form.budgetRange === option.value}
                  disabled={isPending}
                  onClick={() => onSelectPresetBudget(option.value)}
                >
                  {option.label}
                </BriefPurpleChip>
              ))}
            </div>
            <Input
              value={budgetCustom}
              onChange={(e) => onBudgetCustomChange(e.target.value)}
              onBlur={onBudgetCustomBlur}
              placeholder={t.budgetCustomPlaceholder}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <BriefFieldLabel label={locale === "zh" ? "预计周期" : "Timeline"} required />
            <div className="grid grid-cols-2 gap-2">
              {timelineOptions.map((option) => (
                <BriefPurpleChip
                  key={option.id}
                  active={form.deliveryTimeline === option.id}
                  disabled={isPending}
                  onClick={() => patch("deliveryTimeline", option.id)}
                >
                  {option.label}
                </BriefPurpleChip>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-[0_18px_60px_rgba(88,28,135,0.08)]">
          <div className="bg-[radial-gradient(circle_at_8%_20%,rgba(124,58,237,0.16),transparent_28%),linear-gradient(135deg,#faf5ff_0%,#ffffff_52%,#ecfdf5_100%)] px-5 py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between xl:gap-6">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/25">
                  <Bot className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-base font-semibold tracking-tight text-zinc-950">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                    {locale === "zh" ? "VINCIS 智能制作估价引擎" : "VINCIS Production Pricing Engine"}
                  </p>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-600">
                    {locale === "zh"
                      ? "系统先估算可用镜头、生成次数、创作者工时、修改和风险成本，再反推出能让创作者有利润、品牌能成功匹配的平台价格。"
                      : "The engine estimates usable shots, generations, creator hours, revisions, and risk before calculating a viable marketplace price."}
                  </p>
                </div>
              </div>
              <div className="w-full shrink-0 rounded-2xl bg-white/90 px-4 py-3 shadow-sm ring-1 ring-violet-100 sm:px-5 sm:py-4 xl:w-auto xl:min-w-[15rem]">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                  {locale === "zh" ? "建议预算" : "Recommended budget"}
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                  {fmt(marketQuote.recommended)}
                </p>
                {settlementNote ? (
                  <p className="mt-1 text-[10px] leading-4 text-zinc-400">{settlementNote}</p>
                ) : null}
                <p className="mt-1 text-xs leading-5 text-zinc-500">{marketQuote.status}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px border-y border-zinc-100 bg-zinc-100 sm:grid-cols-3 xl:grid-cols-6">
            {[
              [locale === "zh" ? "最低可执行" : "Minimum", fmt(marketQuote.minimum)],
              [locale === "zh" ? "创作者收益" : "Creator income", fmt(marketQuote.creatorIncome)],
              [locale === "zh" ? "预计工时" : "Hours", `${marketQuote.estimatedHours}h`],
              [locale === "zh" ? "可用镜头" : "Shots", `${marketQuote.estimatedShots}`],
              [locale === "zh" ? "生成次数" : "Generations", `${marketQuote.estimatedGenerations}`]
            ].map(([label, value]) => (
              <div key={label} className="bg-white px-4 py-3">
                <p className="text-xs text-zinc-500">{label}</p>
                <p className="mt-1 text-base font-semibold text-zinc-950">{value}</p>
              </div>
            ))}
            <div className="bg-white px-4 py-3">
              <p className="text-xs text-zinc-500">{locale === "zh" ? "风险等级" : "Risk"}</p>
              <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${riskBadgeClass(marketQuote.riskTone)}`}>
                <span className={`h-2 w-2 rounded-full ${riskDotClass(marketQuote.riskTone)}`} />
                {marketQuote.riskLevel}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
            {marketQuote.tiers.map((tier) => {
              const selectedBudget = parseMoneyRange(form.budgetRange);
              const isSelected = selectedBudget?.min === tier.price && selectedBudget.max === tier.price;

              return (
                <button
                  key={tier.key}
                  type="button"
                  disabled={isPending}
                  onClick={() => onBudgetCustomChange(String(convertUsdToDisplayAmount(tier.price, locale)))}
                  className={
                    isSelected
                      ? "rounded-2xl border border-violet-500 bg-violet-50 p-3 text-left shadow-[0_12px_30px_rgba(124,58,237,0.16)] ring-2 ring-violet-200 sm:p-4"
                      : "rounded-2xl border border-zinc-200 bg-zinc-50/50 p-3 text-left transition hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white sm:p-4"
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-zinc-950 sm:text-sm">{tier.label}</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-500">{tier.description}</p>
                    </div>
                    {tier.key === "recommended" ? (
                      <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                        {locale === "zh" ? "推荐" : "Best"}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-xl font-semibold tracking-tight text-zinc-950 sm:mt-4 sm:text-2xl">{fmt(tier.price)}</p>
                  <div className="mt-2 grid gap-2 text-xs sm:mt-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-white px-2.5 py-2 text-zinc-600 ring-1 ring-zinc-100">
                      <span className="block text-zinc-400">{locale === "zh" ? "接单概率" : "Chance"}</span>
                      <span className="font-semibold text-zinc-900">{tier.probability}</span>
                    </div>
                    <div className="rounded-xl bg-white px-2.5 py-2 text-zinc-600 ring-1 ring-zinc-100">
                      <span className="block text-zinc-400">{locale === "zh" ? "匹配时间" : "Match time"}</span>
                      <span className="font-semibold text-zinc-900">{tier.time}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="border-t border-zinc-100 bg-zinc-50/60 px-5 py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:gap-8">
              <div className="min-w-0 xl:max-w-sm">
                <p className="text-sm font-semibold text-zinc-950">
                  {locale === "zh" ? "AI 为什么推荐这个预算？" : "Why does AI recommend this budget?"}
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  {locale === "zh"
                    ? "本次估价不是按单次生成成本粗算，而是根据真实制作投入、创作者利润和市场匹配效率综合计算。"
                    : "This quote is based on real production effort, creator margin, and marketplace matching efficiency, not raw generation cost."}
                </p>
              </div>
              <div className="grid min-w-0 flex-1 gap-2 text-xs sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {(locale === "zh"
                  ? ["视频时长", "项目复杂度", "AI 生成成本", "创作者制作工时", "修改轮次", "交付周期", "历史成交数据", "当前市场供需"]
                  : ["Video duration", "Project complexity", "AI generation cost", "Creator hours", "Revision reserve", "Timeline", "Historical deals", "Market supply"]
                ).map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 font-medium text-zinc-700 ring-1 ring-zinc-100">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-600">
                      ✓
                    </span>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <LargeDateField
            locale={locale}
            label={locale === "zh" ? "开始时间" : "Start date"}
            value={form.scheduleStart}
            onChange={handleScheduleStartChange}
            required
            fieldId={BRIEF_FIELD_TARGETS.scheduleStart}
            maxDate={maxStartDate}
          />
          <LargeDateField
            locale={locale}
            label={locale === "zh" ? "交付时间" : "Delivery date"}
            value={form.scheduleDelivery}
            onChange={handleScheduleDeliveryChange}
            required
            fieldId={BRIEF_FIELD_TARGETS.scheduleDelivery}
            minDate={minDeliveryDate}
            error={scheduleRangeErrorMessage}
          />
        </div>
      </BriefSectionCard>
    </>
  );
}
