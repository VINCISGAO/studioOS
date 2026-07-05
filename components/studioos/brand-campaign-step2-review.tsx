"use client";

import { useEffect, useState } from "react";
import { BrandCampaignStep2FeaturedScheme } from "@/components/studioos/brand-campaign-step2-featured-scheme";
import { BrandCampaignStep2CompactScheme } from "@/components/studioos/brand-campaign-step2-scheme-cards";
import { BrandCampaignStep2SchemeSidebar } from "@/components/studioos/brand-campaign-step2-scheme-sidebar";
import { BrandCampaignStep2Footer } from "@/components/studioos/brand-campaign-step2-footer";
import { BrandCreatorGlobeMatchingLoader } from "@/components/studioos/brand-creator-globe-matching-loader";
import { useBrandCampaignDirections } from "@/components/studioos/use-brand-campaign-directions";
import { WizardStepper } from "@/components/studioos/ui/wizard-stepper";
import type { StoredProject } from "@/lib/project-types";
import { buildSchemeDisplayMetrics } from "@/lib/studioos/brand-campaign-scheme-metrics";
import type { Locale } from "@/lib/i18n";
import type { WizardBriefSnapshot } from "@/lib/studioos/brand-wizard-brief-snapshot";
import { STEP2_SCHEME_LAYOUT } from "@/lib/studioos/brand-campaign-step2-layout";
import { Brain, Loader2, Sparkles, Target, TrendingUp, Zap } from "lucide-react";

const copy = {
  en: {
    headline: "AI generated 3 high-conversion creative schemes for you",
    subtitle:
      "Each scheme is tailored to your brief, product strengths, and audience — pick one to freeze into your Production Brief.",
    tagInsight: "Deep product insight",
    tagAudience: "Audience psychology",
    tagPlatform: "Platform algorithm fit",
    tagPerformance: "Performance forecast",
    loadingImages: "Step 2/3 — Loading product visuals…",
    chooseError: "Choose one creative direction"
  },
  zh: {
    headline: "AI 已为你生成 3 套高转化创意方案",
    subtitle: "每套方案均基于你的需求、产品卖点与目标受众定制 — 选择一套后将冻结为 Production Brief。",
    tagInsight: "深度洞察产品卖点",
    tagAudience: "匹配受众心理",
    tagPlatform: "平台算法偏好",
    tagPerformance: "预测投放效果",
    loadingImages: "第 2/3 步 — 正在加载产品配图…",
    chooseError: "请先选择一个创意方向"
  }
} as const;

function parseBudgetFallback(budget: string) {
  const match = budget.replace(/,/g, "").match(/\d+/);
  return match ? Number(match[0]) : 300;
}

const MAIN_SIDEBAR_GRID =
  "grid gap-5 xl:grid-cols-[minmax(0,1fr)_min(380px,34%)] 2xl:grid-cols-[minmax(0,1fr)_400px]";

export function BrandCampaignStep2Review({
  locale,
  project,
  budget,
  productImageUrl,
  error,
  directionsEnabled = true,
  briefSnapshot = null,
  awaitingBriefSave = false,
  onBack,
  onSaveDraft,
  onConfirmed
}: {
  locale: Locale;
  project: StoredProject;
  budget: string;
  productImageUrl?: string | null;
  delivery: string;
  error?: string | null;
  directionsEnabled?: boolean;
  briefSnapshot?: WizardBriefSnapshot | null;
  awaitingBriefSave?: boolean;
  onBack: () => void;
  onSaveDraft?: () => void;
  onConfirmed: (directionId: string) => void;
}) {
  const t = copy[locale];
  const [localError, setLocalError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { directions, status, showImages, error: loadError, isLoading } = useBrandCampaignDirections(
    locale,
    project.id,
    { enabled: directionsEnabled, briefSnapshot, wizardFastPath: true }
  );

  const platforms =
    project.target_platform?.split(",").map((item) => item.trim()).filter(Boolean) ??
    ((project.settings_json?.brand_questionnaire as { platforms?: string[] } | undefined)?.platforms ?? [
      "TikTok",
      "Meta"
    ]);

  const fallbackBudget = parseBudgetFallback(budget);
  const displayError = localError || error || loadError;
  const showGeneratingOverlay = awaitingBriefSave || isLoading;
  const showContent = directions.length > 0 && status === "ready";
  const progressHint = showContent && !showImages ? t.loadingImages : null;

  useEffect(() => {
    if (directions.length && !selectedId) {
      setSelectedId(directions[0]?.id ?? null);
    }
  }, [directions, selectedId]);

  function handleConfirm() {
    if (!selectedId) {
      setLocalError(t.chooseError);
      return;
    }
    setLocalError(null);
    onConfirmed(selectedId);
  }

  const featureTags = [
    { icon: Brain, label: t.tagInsight },
    { icon: Target, label: t.tagAudience },
    { icon: Zap, label: t.tagPlatform },
    { icon: TrendingUp, label: t.tagPerformance }
  ];

  /** 上方预览 = 当前选中方案；下方两枚 = 其余方案缩略图，点击切换预览 */
  const selectedDirection =
    directions.find((item) => item.id === selectedId) ?? directions[0] ?? null;
  const thumbnailDirections = directions.filter((item) => item.id !== selectedDirection?.id);

  function directionIndex(direction: (typeof directions)[number]) {
    return Math.max(
      directions.findIndex((item) => item.id === direction.id),
      0
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      {showGeneratingOverlay ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-white/96 p-4 backdrop-blur-md sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-busy="true"
          aria-label={locale === "zh" ? "正在生成创意方案" : "Generating creative schemes"}
        >
          <div className="w-full max-w-4xl animate-in fade-in zoom-in-95 duration-300">
            <BrandCreatorGlobeMatchingLoader
              locale={locale}
              variant="schemes"
              complete={false}
              className="shadow-lg"
            />
          </div>
        </div>
      ) : null}

      <div
        className={
          showGeneratingOverlay
            ? "pointer-events-none flex min-h-full flex-1 flex-col opacity-0"
            : "flex min-h-full flex-1 flex-col"
        }
      >
        <div className="flex-1 space-y-6 bg-[#f8f9fb] px-3 pb-6 pt-4 sm:px-4 sm:pt-5 lg:px-5 lg:pt-6">
          <div className={MAIN_SIDEBAR_GRID}>
            <WizardStepper locale={locale} currentStep={2} variant="brand" />
            <div className="hidden xl:block" aria-hidden />
          </div>

          <div className={MAIN_SIDEBAR_GRID}>
            <div>
              <h1 className="flex items-start gap-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-[26px]">
                <Sparkles className="mt-1 h-6 w-6 shrink-0 text-violet-600" />
                {t.headline}
              </h1>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{t.subtitle}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {featureTags.map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50/80 px-3 py-1.5 text-xs font-medium text-violet-700"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </span>
                ))}
              </div>
              {progressHint ? (
                <p className="mt-3 flex items-center gap-2 text-sm text-violet-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progressHint}
                </p>
              ) : null}
            </div>
            <div className="hidden xl:block" aria-hidden />
          </div>

          <div className={MAIN_SIDEBAR_GRID}>
            <div className={STEP2_SCHEME_LAYOUT.schemesStack}>
              {showContent && selectedDirection ? (
                <>
                  <BrandCampaignStep2FeaturedScheme
                    locale={locale}
                    direction={selectedDirection}
                    metrics={buildSchemeDisplayMetrics(
                      selectedDirection,
                      directionIndex(selectedDirection),
                      locale,
                      fallbackBudget
                    )}
                    productImageUrl={productImageUrl ?? null}
                    showImages={showImages}
                  />

                  {thumbnailDirections.length > 0 ? (
                    <div className={STEP2_SCHEME_LAYOUT.schemesCompactRow}>
                      {thumbnailDirections.map((direction) => (
                        <BrandCampaignStep2CompactScheme
                          key={direction.id}
                          locale={locale}
                          direction={direction}
                          metrics={buildSchemeDisplayMetrics(
                            direction,
                            directionIndex(direction),
                            locale,
                            fallbackBudget
                          )}
                          selected={false}
                          productImageUrl={productImageUrl ?? null}
                          showImages={showImages}
                          onSelect={() => {
                            setSelectedId(direction.id);
                            setLocalError(null);
                          }}
                        />
                      ))}
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>

            {showContent ? (
              <BrandCampaignStep2SchemeSidebar
                locale={locale}
                directions={directions}
                selectedId={selectedId}
                platforms={platforms}
                fallbackBudget={fallbackBudget}
              />
            ) : null}
          </div>

          {displayError ? <p className="text-sm text-red-600">{displayError}</p> : null}
        </div>

        <BrandCampaignStep2Footer
          locale={locale}
          directionsReady={showContent}
          selectedId={selectedId}
          onBack={onBack}
          onSaveDraft={onSaveDraft}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
}
