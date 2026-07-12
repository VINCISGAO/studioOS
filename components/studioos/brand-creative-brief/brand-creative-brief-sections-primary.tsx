"use client";

import { BrandBriefOptimizerPanel } from "@/components/studioos/brand-brief-optimizer-panel";
import {
  BriefCharCount,
  BriefFieldLabel,
  BriefPurpleChip,
  BriefSectionCard
} from "@/components/studioos/brand-creative-brief/brand-creative-brief-ui";
import {
  styleIconMap,
  toggleList,
  type BriefSectionsProps
} from "@/components/studioos/brand-creative-brief/brand-creative-brief-sections-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  BRAND_ASSET_SLOTS,
  INDUSTRY_OPTIONS,
  STYLE_OPTIONS,
  labelForOption
} from "@/lib/studioos/brand-creative-brief-options";
import type { BrandBriefAssetPreviews } from "@/components/studioos/brand-creative-brief/use-brand-brief-asset-uploads";
import { coerceOptimizerText } from "@/lib/studioos/brand-brief-optimizer-coerce";
import { BRIEF_FIELD_TARGETS } from "@/lib/studioos/brand-creative-brief-scroll";
import { cn } from "@/lib/utils";
import { ImageIcon, Loader2, Sparkles, Film, CheckCircle2 } from "lucide-react";
import type { BrandAssetSlotId } from "@/lib/studioos/brand-creative-brief-options";

const EMPTY_ASSET_PREVIEWS: BrandBriefAssetPreviews = {
  logo: null,
  product_photos: null,
  reference_videos: null
};

function assetPreviewLabel(slotId: BrandAssetSlotId, locale: "zh" | "en") {
  if (slotId === "logo") return locale === "zh" ? "Logo 已上传" : "Logo uploaded";
  if (slotId === "product_photos") return locale === "zh" ? "产品图已上传" : "Product photo uploaded";
  return locale === "zh" ? "参考视频已上传" : "Reference video uploaded";
}

export function BrandCreativeBriefPrimarySections(props: BriefSectionsProps) {
  const {
    locale,
    form,
    patch,
    onPolish,
    isPending,
    isPolishing,
    copy,
    assetPreviews,
    assetUploadErrors,
    uploadingAssetSlot,
    referenceVideoUploadProgress,
    imageInputRef,
    onAssetSlotClick,
    onImageFileSelected,
    referenceVideoInputRef,
    onReferenceVideoFileSelected
  } = props;
  const previews = assetPreviews ?? EMPTY_ASSET_PREVIEWS;
  const descriptionPromptTags =
    locale === "zh"
      ? ["创意想法", "受众群体", "风格偏好", "所含元素", "基调氛围", "主要目标"]
      : ["Creative idea", "Target audience", "Style preference", "Must-have elements", "Tone", "Primary goal"];

  return (
    <>
      <BriefSectionCard
        id="brief-section-overview"
        number={1}
        locale={locale}
        title={locale === "zh" ? "项目概览" : "Project overview"}
        subtitle={locale === "zh" ? "告诉我们你的项目和品牌基本信息" : "Tell us about your project and brand"}
      >
        <div id={BRIEF_FIELD_TARGETS.productImage} className="scroll-mt-32 space-y-2 rounded-xl">
          <BriefFieldLabel label={locale === "zh" ? "品牌素材" : "Brand assets"} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {BRAND_ASSET_SLOTS.map((slot) => {
              const previewUrl = previews[slot.id];
              const isUploading = uploadingAssetSlot === slot.id;
              const slotError = assetUploadErrors[slot.id];
              const isReferenceVideo = slot.id === "reference_videos";
              const hasPreview = Boolean(previewUrl);

              const uploadProgress =
                isReferenceVideo && isUploading ? referenceVideoUploadProgress : null;

              return (
                <div key={slot.id} className="space-y-1.5">
                  <button
                    type="button"
                    disabled={isPending || isUploading}
                    onClick={() => onAssetSlotClick?.(slot.id)}
                    className={cn(
                      "flex min-h-[132px] w-full flex-col items-center justify-center rounded-2xl border border-dashed px-3 py-4 text-center transition disabled:cursor-not-allowed disabled:opacity-60",
                      hasPreview && !isUploading
                        ? "border-emerald-200 bg-emerald-50/40 hover:border-emerald-300"
                        : isUploading
                          ? "border-violet-200 bg-violet-50/40"
                          : "border-zinc-200 bg-zinc-50/50 hover:border-violet-300 hover:bg-violet-50/30"
                    )}
                  >
                    {isUploading && uploadProgress !== null ? (
                      <div className="mb-2 w-full max-w-[9rem] space-y-1.5">
                        <div className="h-1.5 overflow-hidden rounded-full bg-violet-100">
                          <div
                            className="h-full rounded-full bg-violet-600 transition-[width] duration-150 ease-out"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-[11px] font-medium text-violet-700">
                          {locale === "zh" ? `上传中 ${uploadProgress}%` : `Uploading ${uploadProgress}%`}
                        </p>
                      </div>
                    ) : isUploading ? (
                      <Loader2 className="mb-2 h-5 w-5 animate-spin text-violet-500" />
                    ) : hasPreview && isReferenceVideo ? (
                      <Film className="mb-2 h-5 w-5 text-emerald-600" />
                    ) : hasPreview && !isReferenceVideo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl ?? ""}
                        alt=""
                        className="mb-2 h-14 w-14 rounded-lg object-cover ring-1 ring-white"
                      />
                    ) : (
                      <ImageIcon className="mb-2 h-5 w-5 text-zinc-400" />
                    )}
                    <span className="text-xs font-medium text-zinc-700">{labelForOption(slot, locale)}</span>
                    {isReferenceVideo ? (
                      <span className="mt-1 text-[11px] text-zinc-400">MP4 / MOV / WebM · ≤200MB</span>
                    ) : null}
                    {hasPreview ? (
                      <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        {assetPreviewLabel(slot.id, locale)}
                      </span>
                    ) : null}
                  </button>
                  {slotError ? <p className="text-xs text-red-600">{slotError}</p> : null}
                </div>
              );
            })}
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImageFileSelected(file);
              e.target.value = "";
            }}
          />
          <input
            ref={referenceVideoInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onReferenceVideoFileSelected(file);
              e.target.value = "";
            }}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
            <div id={BRIEF_FIELD_TARGETS.projectTitle} className="scroll-mt-32 space-y-2 rounded-xl">
              <BriefFieldLabel label={locale === "zh" ? "项目（品牌）名称" : "Project / brand name"} required />
              <div className="relative">
                <Input
                  value={form.projectTitle}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 60);
                    patch("projectTitle", value);
                    patch("brandName", value);
                  }}
                  placeholder={locale === "zh" ? "例如：VINCIS 夏季 Campaign" : "e.g. VINCIS Summer Campaign"}
                  className="h-11 rounded-xl pr-16"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                  {form.projectTitle.length} / 60
                </span>
              </div>
            </div>
            <div id={BRIEF_FIELD_TARGETS.adOneLiner} className="scroll-mt-32 space-y-2 rounded-xl">
              <BriefFieldLabel label={locale === "zh" ? "您需要什么广告？" : "What kind of ad do you need?"} required />
              <div className="relative">
                <Input
                  value={form.adOneLiner}
                  onChange={(e) => patch("adOneLiner", e.target.value.slice(0, 100))}
                  placeholder={locale === "zh" ? "用一句话描述您的需求" : "Describe your need in one sentence"}
                  className="h-11 rounded-xl pr-[4.5rem]"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                  {form.adOneLiner.length} / 100
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <BriefFieldLabel label={locale === "zh" ? "所属行业" : "Industry"} />
              <Select value={form.industry} onValueChange={(value) => patch("industry", value)}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder={locale === "zh" ? "选择行业" : "Select industry"} />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_OPTIONS[locale].map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <BriefFieldLabel label={locale === "zh" ? "品牌官网" : "Brand website"} />
              <Input
                value={form.brandWebsite || form.productUrl}
                onChange={(e) => {
                  patch("brandWebsite", e.target.value);
                  patch("productUrl", e.target.value);
                }}
                placeholder="https://"
                className="h-11 rounded-xl"
              />
            </div>
        </div>
        <div id={BRIEF_FIELD_TARGETS.productDescription} className="scroll-mt-32 space-y-2 rounded-xl">
            <BriefFieldLabel
              label={locale === "zh" ? "详细描述您的需求" : "Detailed description"}
              required
              hint={locale === "zh" ? "描述创意想法、目标受众、风格偏好等" : "Creative ideas, audience, style preferences…"}
            />
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex flex-wrap gap-2 border-b border-zinc-100 bg-zinc-50/90 px-3 py-3">
                <p className="w-full text-xs font-medium text-zinc-500">
                  {locale === "zh" ? "可从这些角度展开：" : "Cover these angles:"}
                </p>
                {descriptionPromptTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-violet-100 bg-white px-3 py-1 text-xs font-semibold text-violet-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Textarea
                value={coerceOptimizerText(form.productDescription || form.rawSummary)}
                onChange={(e) => {
                  patch("productDescription", e.target.value.slice(0, 1500));
                  patch("rawSummary", e.target.value.slice(0, 1500));
                }}
                rows={12}
                className="min-h-[18rem] resize-y rounded-none border-0 bg-transparent px-3 py-3 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder={
                  locale === "zh"
                    ? "请详细描述您的创意想法、目标受众、风格偏好等…"
                    : "Describe your creative idea, audience, style preferences, and goals…"
                }
              />
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 shrink-0 gap-2 whitespace-nowrap rounded-xl border-violet-200 bg-violet-50 px-5 text-sm font-semibold text-violet-700 shadow-sm hover:border-violet-300 hover:bg-violet-100 hover:text-violet-800"
                  disabled={isPending || isPolishing}
                  onClick={onPolish}
                >
                  {isPolishing ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Sparkles className="h-4 w-4 shrink-0" />}
                  <span>{isPolishing ? copy.aiPolishing : copy.aiPolish}</span>
                </Button>
                <BriefCharCount current={(form.productDescription || form.rawSummary).length} max={1500} />
              </div>
              <p className="text-xs leading-relaxed text-zinc-500">
                {copy.aiPolishSubtitle}
              </p>
              {form.refined?.optimizer ? (
                <BrandBriefOptimizerPanel
                  locale={locale}
                  optimizer={form.refined.optimizer}
                  source={form.refined.source}
                />
              ) : null}
            </div>
        </div>
      </BriefSectionCard>

      <BriefSectionCard id="brief-section-creative" number={2} locale={locale} title={locale === "zh" ? "创意方向" : "Creative direction"}>
        <div className="space-y-2">
          <BriefFieldLabel label={locale === "zh" ? "风格（可多选）" : "Style (multi-select)"} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {STYLE_OPTIONS.map((item) => {
              const Icon = styleIconMap[item.icon];
              const active = form.creativeStyles.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => patch("creativeStyles", toggleList(form.creativeStyles, item.id))}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition",
                    active
                      ? "border-violet-600 bg-violet-50 text-violet-700"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{labelForOption(item, locale)}</span>
                </button>
              );
            })}
          </div>
          <Input
            value={form.creativeStyleCustom}
            onChange={(e) => patch("creativeStyleCustom", e.target.value)}
            placeholder={locale === "zh" ? "自定义风格" : "Custom style"}
            className="mt-2 h-10 rounded-xl"
          />
        </div>
      </BriefSectionCard>
    </>
  );
}
