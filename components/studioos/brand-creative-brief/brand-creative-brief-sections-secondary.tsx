"use client";

import { useMemo } from "react";
import {
  BriefFieldLabel,
  BriefPurpleChip,
  BriefSectionCard
} from "@/components/studioos/brand-creative-brief/brand-creative-brief-ui";
import {
  toggleList,
  type BriefSectionsProps
} from "@/components/studioos/brand-creative-brief/brand-creative-brief-sections-shared";
import { BrandCreativeBriefProductionSection } from "@/components/studioos/brand-creative-brief/brand-creative-brief-production-section";
import { BrandCreativeBriefScheduleFields } from "@/components/studioos/brand-creative-brief/brand-creative-brief-schedule-fields";
import { BrandBudgetStepExperience } from "@/components/studioos/brand-budget/brand-budget-step-experience";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MUST_AVOID_OPTIONS,
  MUST_INCLUDE_OPTIONS,
  labelForOption
} from "@/lib/studioos/brand-creative-brief-options";
import { getBrandBudgetPresets, BRAND_DELIVERY_TIMELINES } from "@/lib/studioos/brand-campaign-options";
import { BRIEF_FIELD_TARGETS } from "@/lib/studioos/brand-creative-brief-scroll";
import {
  durationSeconds,
  marketQuoteForBrief
} from "@/lib/studioos/brand-market-quote";
import {
  budgetRangeLabel,
  convertUsdToDisplayAmount,
  formatMoneyFromUsd,
  parseStoredMoneyRange,
  settlementUsdNote
} from "@/lib/money/display-money";
import { cn } from "@/lib/utils";
import { Bot, Sparkles } from "lucide-react";

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

  const budgetPresets = useMemo(() => getBrandBudgetPresets(locale), [locale]);
  const marketQuote = useMemo(
    () => marketQuoteForBrief(form, locale),
    [
      locale,
      form.videoDuration,
      form.videoDurationCustom,
      form.aspectRatio,
      form.aspectRatioCustom,
      form.resolution,
      form.frameRate,
      form.videoQuantity,
      form.estimatedShotCount,
      form.deliveryTimeline,
      form.budgetRange,
      form.creativeStyles.join(",")
    ]
  );
  const budgetSectionNumber = props.budgetSectionNumber ?? 5;
  const hideTimeline = props.hideTimeline === true;
  const budgetSectionTitle = hideTimeline
    ? locale === "zh"
      ? "预算"
      : "Budget"
    : locale === "zh"
      ? "预算与时间"
      : "Budget & schedule";
  const videoLengthLabel = useMemo(() => {
    const seconds = durationSeconds(form.videoDuration, form.videoDurationCustom);
    if (seconds >= 60 && seconds % 60 === 0) {
      const minutes = seconds / 60;
      return locale === "zh" ? `${minutes} 分钟` : `${minutes} min`;
    }
    return locale === "zh" ? `${seconds} 秒` : `${seconds}s`;
  }, [form.videoDuration, form.videoDurationCustom, locale]);
  const fmt = (amount: number) => formatMoneyFromUsd(amount, locale);
  const settlementNote = settlementUsdNote(locale);

  return (
    <>
      {props.budgetOnly ? null : (
        <>
      {props.hideMoreDetails ? null : (
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
      )}

      {props.hideProduction ? null : (
        <BrandCreativeBriefProductionSection
          locale={locale}
          form={form}
          patch={patch}
          onAspectRatioSelect={onAspectRatioSelect}
          isPending={isPending}
        />
      )}
        </>
      )}

      {props.hideBudget && !props.budgetOnly ? null : props.budgetOnly ? (
        <BrandBudgetStepExperience {...props} />
      ) : (
      <BriefSectionCard
        id="brief-section-budget"
        number={budgetSectionNumber}
        locale={locale}
        title={budgetSectionTitle}
      >
        <div className={hideTimeline ? "space-y-2" : "grid gap-5 lg:grid-cols-2"}>
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
          {hideTimeline ? null : (
            <div className="space-y-2">
              <BriefFieldLabel label={locale === "zh" ? "预计周期" : "Timeline"} required />
              <div className="grid grid-cols-2 gap-2">
                {BRAND_DELIVERY_TIMELINES[locale].map((option) => (
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
          )}
        </div>
        {hideTimeline ? (
          <p className="text-xs leading-5 text-zinc-500">
            {locale === "zh"
              ? `基于第 1 步规格实时估算：${videoLengthLabel} · ${marketQuote.aspectRatioLabel} · ${marketQuote.resolutionLabel}。交付周期、4K 与风格会在 Starter 曲线基础上叠加系数。`
              : `Live estimate from step 1: ${videoLengthLabel} · ${marketQuote.aspectRatioLabel} · ${marketQuote.resolutionLabel}. Rush, 4K, and style stack on the Starter curve.`}
          </p>
        ) : null}
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
                    {hideTimeline
                      ? locale === "zh"
                        ? "根据视频时长曲线、分辨率、交付周期与风格，估算 Starter → Enterprise 四档预算。"
                        : "Estimates Starter → Enterprise tiers from duration curve, resolution, timeline, and style."
                      : locale === "zh"
                        ? "根据视频时长曲线、制作规格、交付周期与风格，估算 Starter → Enterprise 四档预算。"
                        : "Estimates Starter → Enterprise tiers from duration curve, specs, timeline, and style."}
                  </p>
                </div>
              </div>
              <div className="w-full shrink-0 rounded-2xl bg-white/90 px-4 py-3 shadow-sm ring-1 ring-violet-100 sm:px-5 sm:py-4 xl:w-auto xl:min-w-[15rem]">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                  {locale === "zh" ? "Professional 参考价" : "Professional reference"}
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

          <div className="grid grid-cols-2 gap-px border-y border-zinc-100 bg-zinc-100 sm:grid-cols-3">
            {[
              [locale === "zh" ? "视频时长" : "Video length", videoLengthLabel],
              [locale === "zh" ? "视频比例" : "Aspect ratio", marketQuote.aspectRatioLabel],
              [locale === "zh" ? "视频分辨率" : "Video resolution", marketQuote.resolutionLabel],
              [locale === "zh" ? "项目复杂度" : "Complexity", marketQuote.complexity],
              [locale === "zh" ? "Starter" : "Starter", fmt(marketQuote.minimum)],
              [locale === "zh" ? "预算区间" : "Budget range", marketQuote.range]
            ].map(([label, value]) => (
              <div key={label} className="bg-white px-4 py-3">
                <p className="text-xs text-zinc-500">{label}</p>
                <p className="mt-1 text-base font-semibold text-zinc-950">{value}</p>
              </div>
            ))}
            <div className="bg-white px-4 py-3 sm:col-span-3">
              <p className="text-xs text-zinc-500">{locale === "zh" ? "风险等级" : "Risk"}</p>
              <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${riskBadgeClass(marketQuote.riskTone)}`}>
                <span className={`h-2 w-2 rounded-full ${riskDotClass(marketQuote.riskTone)}`} />
                {marketQuote.riskLevel}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
            {marketQuote.tiers.map((tier) => {
              const selectedBudget = parseStoredMoneyRange(form.budgetRange);
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
                    {tier.key === "professional" ? (
                      <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                        {locale === "zh" ? "推荐" : "Default"}
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
                {(hideTimeline
                  ? locale === "zh"
                    ? ["视频时长", "项目复杂度", "AI 生成成本", "创作者制作工时", "修改轮次", "历史成交数据", "当前市场供需"]
                    : ["Video duration", "Project complexity", "AI generation cost", "Creator hours", "Revision reserve", "Historical deals", "Market supply"]
                  : locale === "zh"
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
        {props.hideScheduleFields ? null : (
          <BrandCreativeBriefScheduleFields locale={locale} form={form} patch={patch} />
        )}
      </BriefSectionCard>
      )}
    </>
  );
}
