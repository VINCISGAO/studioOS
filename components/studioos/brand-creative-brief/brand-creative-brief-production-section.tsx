"use client";

import {
  AspectIcon
} from "@/components/studioos/brand-creative-brief/brand-creative-brief-sections-shared";
import {
  BriefFieldLabel,
  BriefPurpleChip,
  BriefSectionCard
} from "@/components/studioos/brand-creative-brief/brand-creative-brief-ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BriefFormState } from "@/components/studioos/brand-campaign-step-brief";
import type { Locale } from "@/lib/i18n";
import { BRAND_VIDEO_ASPECT_RATIOS, QUICK_BRIEF_ASPECT_RATIOS, type BrandVideoAspectRatio } from "@/lib/studioos/brand-campaign-options";
import {
  RESOLUTION_OPTIONS,
  safeBriefResolutionValue,
  VIDEO_DURATION_OPTIONS
} from "@/lib/studioos/brand-creative-brief-options";
import { BRIEF_FIELD_TARGETS } from "@/lib/studioos/brand-creative-brief-scroll";
import { cn } from "@/lib/utils";

const RESOLUTION_CHIP_OPTIONS = [...RESOLUTION_OPTIONS].reverse();

function resolutionChipLabel(value: (typeof RESOLUTION_OPTIONS)[number]) {
  return value === "1080p" ? "1080P" : value;
}

export function BrandCreativeBriefProductionFields({
  locale,
  form,
  patch,
  onAspectRatioSelect,
  isPending,
  variant = "default",
  visibleFields = "all"
}: {
  locale: Locale;
  form: BriefFormState;
  patch: <K extends keyof BriefFormState>(key: K, value: BriefFormState[K]) => void;
  onAspectRatioSelect: (value: BrandVideoAspectRatio) => void;
  isPending?: boolean;
  variant?: "default" | "quick";
  visibleFields?: "all" | "duration" | "aspect" | "resolutionQuantity";
}) {
  const isQuick = variant === "quick";
  const aspectRatioOptions =
    variant === "quick" ? QUICK_BRIEF_ASPECT_RATIOS[locale] : BRAND_VIDEO_ASPECT_RATIOS[locale];
  const resolutionValue = safeBriefResolutionValue(form.resolution);

  const durationField = (
    <div id={BRIEF_FIELD_TARGETS.videoDuration} className="scroll-mt-32 space-y-2.5 rounded-xl">
      <BriefFieldLabel label={locale === "zh" ? "视频时长" : "Video duration"} required />
      <div className={cn("flex flex-wrap items-center gap-2")}>
        {VIDEO_DURATION_OPTIONS.map((item) => (
          <BriefPurpleChip
            key={item}
            active={form.videoDuration === item}
            disabled={isPending}
            onClick={() => patch("videoDuration", item)}
            className={
              isQuick
                ? "h-9 shrink-0 rounded-full px-3.5 text-xs font-medium"
                : undefined
            }
          >
            {item === "custom" ? (locale === "zh" ? "自定义" : "Custom") : item}
          </BriefPurpleChip>
        ))}
        {form.videoDuration === "custom" ? (
          <Input
            value={form.videoDurationCustom}
            onChange={(e) => patch("videoDurationCustom", e.target.value)}
            placeholder={locale === "zh" ? "例如 120s 或 2min" : "e.g. 120s or 2min"}
            className="h-9 min-w-[10rem] flex-1 rounded-xl sm:max-w-[14rem]"
            disabled={isPending}
          />
        ) : null}
      </div>
    </div>
  );

  const aspectRatioField = (
    <div id={BRIEF_FIELD_TARGETS.aspectRatio} className="scroll-mt-32 space-y-2.5 rounded-xl">
      <BriefFieldLabel label={locale === "zh" ? "视频比例" : "Aspect ratio"} required />
      <div
        className={cn(
          "grid gap-2.5",
          isQuick ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"
        )}
      >
        {aspectRatioOptions.map((option) => {
          const active = form.aspectRatio === option.id;
          const isCustomOption = option.id === "custom";
          return (
            <button
              key={option.id}
              type="button"
              disabled={isPending}
              onClick={() => onAspectRatioSelect(option.id)}
              className={cn(
                "rounded-xl border px-2.5 py-3 text-center transition",
                isQuick && isCustomOption ? "col-span-2" : "",
                isQuick ? "sm:px-3" : "rounded-2xl px-3 py-4 text-left",
                active
                  ? "border-violet-500 bg-violet-50 text-violet-700"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
              )}
            >
              <div
                className={cn(
                  "mb-1.5 flex justify-center",
                  isQuick ? "" : "mb-2",
                  active ? "text-violet-600" : "text-zinc-400"
                )}
              >
                <AspectIcon ratio={option.id} />
              </div>
              <p className={cn("font-semibold", isQuick ? "text-[11px] leading-tight sm:text-xs" : "text-sm")}>
                {option.label}
              </p>
            </button>
          );
        })}
      </div>
      {form.aspectRatio === "custom" ? (
        <Input
          value={form.aspectRatioCustom}
          onChange={(e) => patch("aspectRatioCustom", e.target.value)}
          placeholder={locale === "zh" ? "例如 16:9 或 2.35:1" : "e.g. 16:9 or 2.35:1"}
          className="h-9 rounded-xl"
          disabled={isPending}
        />
      ) : null}
    </div>
  );

  const resolutionQuantityRow = (
    <div className={cn("grid gap-4", isQuick ? "sm:grid-cols-2" : "sm:grid-cols-2")}>
      <div id={BRIEF_FIELD_TARGETS.resolution} className="scroll-mt-32 space-y-2.5">
        <BriefFieldLabel
          label={locale === "zh" ? "视频分辨率" : "Video resolution"}
          required
        />
        <div className="flex flex-wrap items-center gap-2">
          {RESOLUTION_CHIP_OPTIONS.map((item) => (
            <BriefPurpleChip
              key={item}
              active={resolutionValue === item}
              disabled={isPending}
              onClick={() => patch("resolution", item)}
              className={
                isQuick
                  ? "h-9 shrink-0 rounded-full px-4 text-xs font-medium"
                  : "h-10 rounded-full px-5 text-sm font-medium"
              }
            >
              {resolutionChipLabel(item)}
            </BriefPurpleChip>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium text-zinc-900">
          {locale === "zh" ? "视频数量" : "Quantity"}
        </Label>
        <div className="flex h-11 w-full items-center rounded-xl border border-zinc-200 bg-white">
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
  );

  if (visibleFields === "duration") {
    return durationField;
  }

  if (visibleFields === "aspect") {
    return aspectRatioField;
  }

  if (visibleFields === "resolutionQuantity") {
    return resolutionQuantityRow;
  }

  if (isQuick) {
    return (
      <div className="space-y-4">
        {durationField}
        {aspectRatioField}
        {resolutionQuantityRow}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {durationField}
      {aspectRatioField}
      {resolutionQuantityRow}
    </div>
  );
}

export function BrandCreativeBriefProductionSection({
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
    <BriefSectionCard
      id="brief-section-production"
      number={4}
      locale={locale}
      title={locale === "zh" ? "制作要求" : "Production requirements"}
    >
      <BrandCreativeBriefProductionFields
        locale={locale}
        form={form}
        patch={patch}
        onAspectRatioSelect={onAspectRatioSelect}
        isPending={isPending}
      />
    </BriefSectionCard>
  );
}
