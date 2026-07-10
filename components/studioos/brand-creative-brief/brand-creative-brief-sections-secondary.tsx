"use client";

import {
  BriefFieldLabel,
  BriefPurpleChip,
  BriefSectionCard
} from "@/components/studioos/brand-creative-brief/brand-creative-brief-ui";
import {
  toggleList,
  type BriefSectionsProps
} from "@/components/studioos/brand-creative-brief/brand-creative-brief-sections-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BRAND_ASSET_SLOTS,
  MUST_AVOID_OPTIONS,
  MUST_INCLUDE_OPTIONS,
  labelForOption
} from "@/lib/studioos/brand-creative-brief-options";
import { BRAND_BUDGET_PRESETS, BRAND_DELIVERY_TIMELINES } from "@/lib/studioos/brand-campaign-options";
import { ImageIcon, Link2, Loader2 } from "lucide-react";

export function BrandCreativeBriefSecondarySections(props: BriefSectionsProps) {
  const {
    locale,
    form,
    patch,
    budgetCustom,
    budgetIsCustom,
    onSelectPresetBudget,
    onBudgetCustomChange,
    onBudgetCustomBlur,
    references,
    refUrl,
    setRefUrl,
    onAddRef,
    onRemoveRef,
    isRefPending,
    isPending,
    previewUrl,
    onUploadClick,
    fileInputRef,
    onUploadFile,
    uploadError,
    copy: t
  } = props;

  const timelineOptions = BRAND_DELIVERY_TIMELINES[locale];

  return (
    <>
      <BriefSectionCard id="brief-section-assets" number={4} locale={locale} title={locale === "zh" ? "素材与参考" : "Assets & references"}>
        <div className="space-y-2">
          <BriefFieldLabel label={locale === "zh" ? "品牌素材" : "Brand assets"} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {BRAND_ASSET_SLOTS.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={onUploadClick}
                className="flex min-h-[108px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 px-3 py-4 text-center transition hover:border-violet-300 hover:bg-violet-50/30"
              >
                <ImageIcon className="mb-2 h-5 w-5 text-zinc-400" />
                <span className="text-xs font-medium text-zinc-700">{labelForOption(slot, locale)}</span>
              </button>
            ))}
          </div>
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
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="h-20 w-20 rounded-xl object-cover" />
          ) : null}
          {uploadError ? <p className="text-xs text-red-600">{uploadError}</p> : null}
        </div>
        <div className="space-y-2">
          <BriefFieldLabel label={locale === "zh" ? "参考链接" : "Reference links"} />
          <div className="flex flex-wrap gap-2">
            {["TikTok", "YouTube", "Instagram", "Facebook", "X", "Pinterest"].map((platform) => (
              <span key={platform} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                {platform}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={refUrl}
              onChange={(e) => setRefUrl(e.target.value)}
              placeholder="https://"
              className="h-11 flex-1 rounded-xl"
              disabled={isRefPending || isPending}
            />
            <Button type="button" variant="outline" className="h-11 rounded-xl px-5" onClick={onAddRef} disabled={isRefPending || !refUrl.trim()}>
              {isRefPending ? <Loader2 className="h-4 w-4 animate-spin" /> : locale === "zh" ? "添加" : "Add"}
            </Button>
          </div>
          {references.length ? (
            <ul className="space-y-2">
              {references.map((ref) => (
                <li key={ref.id} className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 text-sm">
                  <span className="truncate text-zinc-600">{ref.source_url}</span>
                  <button type="button" className="text-xs text-zinc-400 hover:text-red-600" onClick={() => onRemoveRef(ref.id)}>
                    {t.removeRef}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <button
          type="button"
          disabled
          className="flex min-h-[120px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/40 px-4 py-6 text-center"
        >
          <Link2 className="mb-2 h-5 w-5 text-zinc-400" />
          <p className="text-sm font-medium text-zinc-700">{t.uploadSample}</p>
          <p className="mt-1 text-xs text-zinc-400">MP4 · MOV · JPG · PNG · PDF</p>
        </button>
      </BriefSectionCard>

      <BriefSectionCard
        id="brief-section-details"
        number={5}
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

      <BriefSectionCard id="brief-section-budget" number={6} locale={locale} title={locale === "zh" ? "预算与时间" : "Budget & schedule"}>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <BriefFieldLabel label={locale === "zh" ? "预算范围（USD）" : "Budget range (USD)"} required />
            <div className="grid grid-cols-2 gap-2">
              {BRAND_BUDGET_PRESETS.map((option) => (
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
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>{locale === "zh" ? "开始时间" : "Start date"}</Label>
            <Input type="date" value={form.scheduleStart} onChange={(e) => patch("scheduleStart", e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>{locale === "zh" ? "交付时间" : "Delivery date"}</Label>
            <Input type="date" value={form.scheduleDelivery} onChange={(e) => patch("scheduleDelivery", e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>{locale === "zh" ? "发布时间" : "Publish window"}</Label>
            <Input type="date" value={form.schedulePublish} onChange={(e) => patch("schedulePublish", e.target.value)} className="h-11 rounded-xl" />
          </div>
        </div>
      </BriefSectionCard>
    </>
  );
}
