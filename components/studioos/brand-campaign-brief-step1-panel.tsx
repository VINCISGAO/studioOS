"use client";

import type { StoredProjectReference } from "@/lib/campaign-types";
import type { Locale } from "@/lib/i18n";
import {
  BRAND_BUDGET_MIN_USD,
  BRAND_BUDGET_PRESETS,
  BRAND_DELIVERY_TIMELINES,
  BRAND_VIDEO_ASPECT_RATIOS,
  type BrandDeliveryTimelineId,
  type BrandVideoAspectRatio
} from "@/lib/studioos/brand-campaign-options";
import type { ReorganizedBrandBrief } from "@/lib/studioos/brand-brief-ai";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Clock3,
  ImageIcon,
  Lightbulb,
  Link2,
  Loader2,
  Monitor,
  Ratio,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Square,
  Wallet
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BriefFormState } from "@/components/studioos/brand-campaign-step-brief";

const RAW_SUMMARY_MAX = 800;

function PurpleChip({
  active,
  disabled,
  onClick,
  children,
  className
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3 py-2 text-sm font-medium transition",
        active
          ? "border-violet-600 bg-violet-50 text-violet-700 shadow-[inset_0_0_0_1px_rgba(124,58,237,0.12)]"
          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
    >
      {children}
    </button>
  );
}

function AspectIcon({ ratio }: { ratio: BrandVideoAspectRatio }) {
  if (ratio === "16:9") {
    return <Monitor className="h-5 w-5" />;
  }
  if (ratio === "1:1") {
    return <Square className="h-5 w-5" />;
  }
  if (ratio === "4:5") {
    return <Smartphone className="h-5 w-5 scale-90" />;
  }
  return <Smartphone className="h-5 w-5" />;
}

function productPreviewSrc(url: string) {
  if (url.startsWith("blob:") || url.startsWith("http")) return url;
  return url;
}

export type BrandCampaignBriefStep1PanelProps = {
  locale: Locale;
  copy: Record<string, string>;
  form: BriefFormState;
  patch: <K extends keyof BriefFormState>(key: K, value: BriefFormState[K]) => void;
  budgetCustom: string;
  budgetCustomError: string | null;
  budgetIsCustom: boolean;
  aspectRatioError: string | null;
  displayError: string | null;
  refinedApplied: boolean;
  applyNotice: string | null;
  isPolishing: boolean;
  isPending: boolean;
  isSavingDraft: boolean;
  isUploading: boolean;
  isRefPending: boolean;
  continueDisabled: boolean;
  productReady: boolean;
  previewUrl: string | null;
  uploadError: string | null;
  references: StoredProjectReference[];
  refUrl: string;
  setRefUrl: (value: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onPolish: () => void;
  onApplyRefined: () => void;
  onUploadClick: () => void;
  onUploadFile: (file: File) => void;
  onAddRef: () => void;
  onRemoveRef: (id: string) => void;
  onSelectPresetBudget: (value: string) => void;
  onBudgetCustomChange: (raw: string) => void;
  onBudgetCustomBlur: () => void;
  onAspectRatioSelect: (value: BrandVideoAspectRatio) => void;
  onContinue: () => void;
  onSaveDraft?: () => void;
  updateRefined: (patchValue: Partial<ReorganizedBrandBrief>) => void;
};

export function BrandCampaignBriefStep1Panel(props: BrandCampaignBriefStep1PanelProps) {
  const {
    locale,
    copy: t,
    form,
    patch,
    budgetCustom,
    budgetCustomError,
    budgetIsCustom,
    aspectRatioError,
    displayError,
    refinedApplied,
    applyNotice,
    isPolishing,
    isPending,
    isSavingDraft,
    isUploading,
    isRefPending,
    continueDisabled,
    productReady,
    previewUrl,
    uploadError,
    references,
    refUrl,
    setRefUrl,
    fileInputRef,
    onPolish,
    onApplyRefined,
    onUploadClick,
    onUploadFile,
    onAddRef,
    onRemoveRef,
    onSelectPresetBudget,
    onBudgetCustomChange,
    onBudgetCustomBlur,
    onAspectRatioSelect,
    onContinue,
    onSaveDraft,
    updateRefined
  } = props;

  const timelineOptions = BRAND_DELIVERY_TIMELINES[locale];
  const aspectRatioOptions = BRAND_VIDEO_ASPECT_RATIOS[locale];

  return (
    <div className="space-y-5 pb-28">
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-violet-100/80 bg-gradient-to-r from-violet-50/80 via-white to-indigo-50/40 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-950">{t.aiHeroTitle}</h2>
              <p className="mt-1 text-sm leading-relaxed text-zinc-500">{t.aiHeroHint}</p>
            </div>
          </div>
          <Button
            type="button"
            className="h-10 shrink-0 rounded-xl bg-violet-600 px-4 hover:bg-violet-700"
            disabled={isPolishing || isPending}
            onClick={onPolish}
          >
            {isPolishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {isPolishing ? t.aiPolishing : t.aiPolish}
          </Button>
        </div>

        <div className="p-5 sm:p-6">
          <div className="relative rounded-xl border border-zinc-200 bg-zinc-50/40 focus-within:border-violet-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-violet-100">
            <div className="flex items-start gap-3 px-4 pt-4">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-violet-500" />
              <Textarea
                id="raw_summary"
                value={form.rawSummary}
                onChange={(e) => patch("rawSummary", e.target.value.slice(0, RAW_SUMMARY_MAX))}
                rows={5}
                maxLength={RAW_SUMMARY_MAX}
                className="min-h-[132px] resize-none border-0 bg-transparent p-0 text-base leading-relaxed shadow-none focus-visible:ring-0"
                placeholder={t.aiPlaceholder}
              />
            </div>
            <div className="px-4 pb-3 text-right text-xs text-zinc-400">
              {form.rawSummary.length} / {RAW_SUMMARY_MAX}
            </div>
          </div>

          {form.refined ? (
            <div className="mt-5 space-y-4 rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-zinc-900">{t.aiReady}</p>
                <Badge variant="secondary" className="font-normal">
                  {form.refined.source === "openai" ? t.aiOpenai : t.aiTemplate}
                </Badge>
              </div>
              <Textarea
                value={form.refined.campaign_goal}
                onChange={(e) => updateRefined({ campaign_goal: e.target.value })}
                rows={3}
                className="resize-none border-zinc-200 bg-white text-sm"
              />
              <Input
                value={form.refined.target_audience}
                onChange={(e) => updateRefined({ target_audience: e.target.value })}
                className="border-zinc-200 bg-white"
              />
              <Button type="button" variant={refinedApplied ? "outline" : "default"} onClick={onApplyRefined}>
                {refinedApplied ? t.applied : t.apply}
              </Button>
            </div>
          ) : null}

          {refinedApplied || applyNotice ? (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {applyNotice ?? t.appliedSuccess}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-950">{t.budgetLabel}</p>
              <p className="mt-1 text-xs text-zinc-500">{t.budgetHint}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {BRAND_BUDGET_PRESETS.map((option) => (
              <PurpleChip
                key={option.value}
                active={!budgetIsCustom && form.budgetRange === option.value}
                disabled={isPending || isPolishing}
                onClick={() => onSelectPresetBudget(option.value)}
              >
                {option.label}
              </PurpleChip>
            ))}
          </div>
          <div className="mt-3">
            <div
              className={cn(
                "flex h-11 items-center gap-2 rounded-xl border bg-white px-3",
                budgetIsCustom ? "border-violet-600 ring-2 ring-violet-100" : "border-zinc-200"
              )}
            >
              <span className="text-sm font-semibold text-zinc-400">$</span>
              <Input
                value={budgetCustom}
                onChange={(e) => onBudgetCustomChange(e.target.value)}
                onBlur={onBudgetCustomBlur}
                placeholder={t.budgetCustomPlaceholder}
                disabled={isPending || isPolishing}
                className="h-8 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
              />
            </div>
            {budgetCustomError ? (
              <p className="mt-1.5 text-xs text-red-600">{budgetCustomError}</p>
            ) : (
              <p className="mt-1.5 text-xs text-zinc-400">
                {locale === "zh"
                  ? `最低 $${BRAND_BUDGET_MIN_USD} 美金 · 支持单个金额或区间`
                  : `Minimum $${BRAND_BUDGET_MIN_USD} USD · single amount or range`}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Clock3 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-950">{t.timelineLabel}</p>
              <p className="mt-1 text-xs text-zinc-500">{t.timelineHint}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {timelineOptions.map((option) => (
              <PurpleChip
                key={option.id}
                active={form.deliveryTimeline === option.id}
                disabled={isPending || isPolishing}
                onClick={() => patch("deliveryTimeline", option.id as BrandDeliveryTimelineId)}
              >
                {option.label}
              </PurpleChip>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <Ratio className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-950">
              {t.aspectRatioTitle}
              <span className="ml-1 text-red-500">*</span>
            </p>
            <p className="mt-1 text-xs text-zinc-500">{t.aspectRatioHint}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {aspectRatioOptions.map((option) => {
            const active = form.aspectRatio === option.id;
            return (
              <button
                key={option.id}
                type="button"
                disabled={isPending || isPolishing}
                onClick={() => onAspectRatioSelect(option.id)}
                className={cn(
                  "rounded-2xl border px-3 py-4 text-left transition",
                  active
                    ? "border-violet-600 bg-violet-50 text-violet-700 shadow-[inset_0_0_0_1px_rgba(124,58,237,0.12)]"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                )}
              >
                <div className={cn("mb-3", active ? "text-violet-600" : "text-zinc-400")}>
                  <AspectIcon ratio={option.id} />
                </div>
                <p className="text-sm font-semibold">{option.label}</p>
                <p className={cn("mt-1 text-[11px]", active ? "text-violet-600/80" : "text-zinc-500")}>
                  {option.hint}
                </p>
              </button>
            );
          })}
        </div>
        {aspectRatioError ? <p className="mt-2 text-xs text-red-600">{aspectRatioError}</p> : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold text-zinc-950">{t.productSection}</h2>
          <p className="mt-1 text-sm text-zinc-500">{t.productBasicsHint}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="product_name">{t.productName}</Label>
              <Input
                id="product_name"
                value={form.productName}
                onChange={(e) => patch("productName", e.target.value)}
                placeholder={locale === "zh" ? "Arc 旅行收纳包" : "Arc Travel Case"}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product_url">{t.productLink}</Label>
              <Input
                id="product_url"
                value={form.productUrl}
                onChange={(e) => patch("productUrl", e.target.value)}
                placeholder="https://"
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Label>{t.uploadProduct}</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUploadFile(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={isUploading || isPending}
              onClick={onUploadClick}
              className={cn(
                "flex min-h-[132px] w-full flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-6 text-center transition",
                productReady
                  ? "border-emerald-300 bg-emerald-50/40"
                  : "border-zinc-200 bg-zinc-50/40 hover:border-violet-300 hover:bg-violet-50/30"
              )}
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={productPreviewSrc(previewUrl)}
                  alt=""
                  className="mb-3 h-16 w-16 rounded-xl object-cover"
                />
              ) : (
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-zinc-400 shadow-sm ring-1 ring-zinc-200/80">
                  {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
                </div>
              )}
              <p className="text-sm font-medium text-zinc-800">
                {isUploading ? t.uploading : productReady ? t.uploaded : t.clickToUploadDrag}
              </p>
              {!productReady && !isUploading ? (
                <p className="mt-1 text-xs text-zinc-400">{t.formats}</p>
              ) : null}
            </button>
            {uploadError ? <p className="text-xs text-red-600">{uploadError}</p> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold text-zinc-950">{t.refsTitle}</h2>
          <p className="mt-1 text-sm text-zinc-500">{t.refsHint}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["TikTok", "YouTube", "Instagram"].map((platform) => (
              <span
                key={platform}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600"
              >
                {platform}
              </span>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Input
              value={refUrl}
              onChange={(e) => setRefUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onAddRef();
                }
              }}
              placeholder={t.refPlaceholder}
              className="h-11 flex-1 rounded-xl"
              disabled={isRefPending || isPending}
            />
            <Button
              type="button"
              variant="outline"
              className="h-11 shrink-0 rounded-xl px-5"
              onClick={onAddRef}
              disabled={isRefPending || isPending || !refUrl.trim()}
            >
              {isRefPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t.addRef}
            </Button>
          </div>
          {references.length ? (
            <ul className="mt-3 space-y-2">
              {references.map((ref) => (
                <li
                  key={ref.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-zinc-50 px-3 py-2 text-sm"
                >
                  <span className="truncate text-zinc-600">{ref.source_url}</span>
                  <button
                    type="button"
                    className="shrink-0 text-xs text-zinc-400 hover:text-red-600"
                    onClick={() => onRemoveRef(ref.id)}
                    disabled={isRefPending || isPending}
                  >
                    {t.removeRef}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            disabled
            className="mt-4 flex min-h-[132px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/40 px-4 py-6 text-center"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-zinc-400 shadow-sm ring-1 ring-zinc-200/80">
              <Link2 className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-zinc-800">{t.uploadSample}</p>
            <p className="mt-1 text-xs text-zinc-400">{t.uploadSampleHint}</p>
          </button>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-h-[20px] flex-1">
            {displayError ? (
              <p className="text-sm text-red-600">{displayError}</p>
            ) : (
              <p className="flex items-center gap-2 text-sm text-zinc-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                {t.draftSaved}
              </p>
            )}
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {onSaveDraft ? (
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="h-11 rounded-xl border-zinc-200"
                disabled={continueDisabled}
                onClick={onSaveDraft}
              >
                {isSavingDraft ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSavingDraft ? t.savingDraft : t.saveDraft}
              </Button>
            ) : null}
            <Button
              type="button"
              size="lg"
              className="h-11 rounded-xl bg-violet-600 px-6 hover:bg-violet-700"
              disabled={continueDisabled}
              onClick={onContinue}
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isPending ? t.continuePending : t.continue}
              {!isPending ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
