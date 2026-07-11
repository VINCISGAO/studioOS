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
import type { StoredProjectReference } from "@/lib/campaign-types";
import { buildSchemeDisplayMetrics } from "@/lib/studioos/brand-campaign-scheme-metrics";
import type { Locale } from "@/lib/i18n";
import { syncBrandWizardStepUrl } from "@/lib/studioos/instant-nav";
import type { WizardBriefSnapshot } from "@/lib/studioos/brand-wizard-brief-snapshot";
import { STEP2_SCHEME_LAYOUT } from "@/lib/studioos/brand-campaign-step2-layout";
import { localizeCreativeDirection } from "@/lib/studioos/creative-direction-localization";
import { CREATOR_SUBMITTED_CREATIVE_DIRECTION_ID } from "@/lib/studioos/creative-direction-selection";
import { Brain, Sparkles, Target, TrendingUp, Zap } from "lucide-react";

const copy = {
  en: {
    headline: "AI generated 3 Creative Strategy routes for you",
    subtitle:
      "Each route is structured like an agency pitch deck: insight, big idea, hook, execution language, and production fit.",
    tagInsight: "Deep product insight",
    tagAudience: "Audience psychology",
    tagPlatform: "Platform algorithm fit",
    tagPerformance: "Performance forecast",
    chooseError: "Choose one creative direction or let creators submit ideas",
    creatorOptionTitle: "Do not choose these schemes",
    creatorOptionBody: "Let matched creators submit their own creative ideas after the campaign is published.",
    creatorOptionBadge: "Creator-led creative",
    creatorConfirm: "Let creators submit ideas",
    referenceNotice:
      "The following creative strategies are for reference only. Final creative direction will be confirmed jointly by the brand and Creator."
  },
  zh: {
    headline: "智能系统已为你生成 3 套 Creative Strategy",
    subtitle: "每套策略都像广告公司 Pitch Deck：包含消费者洞察、Big Idea、前三秒 Hook、执行语法与制作适配。",
    tagInsight: "深度洞察产品卖点",
    tagAudience: "匹配受众心理",
    tagPlatform: "平台算法偏好",
    tagPerformance: "预测投放效果",
    chooseError: "请先选择一个创意方向，或选择交给创作者提交创意",
    creatorOptionTitle: "以上方案都不选",
    creatorOptionBody: "交给后续匹配到的创作者提交创意方向，品牌再从创作者方案中确认最终制作方向。",
    creatorOptionBadge: "创作者提交创意",
    creatorConfirm: "交给创作者提交创意",
    referenceNotice: "以下创意仅供参考，最终创作方向由品牌方与 Creator 共同确认。"
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
  references = [],
  budget,
  productImageUrl,
  error,
  directionsEnabled = true,
  briefSnapshot = null,
  awaitingBriefSave = false,
  minGeneratingUntil = 0,
  isActive = true,
  onBack,
  onSaveDraft,
  onConfirmed
}: {
  locale: Locale;
  project: StoredProject;
  references?: StoredProjectReference[];
  budget: string;
  productImageUrl?: string | null;
  delivery: string;
  error?: string | null;
  directionsEnabled?: boolean;
  briefSnapshot?: WizardBriefSnapshot | null;
  awaitingBriefSave?: boolean;
  minGeneratingUntil?: number;
  /** Only sync wizard URL while this step is visible — avoids jumping from step 1 during background prefetch. */
  isActive?: boolean;
  onBack: () => void;
  onSaveDraft?: () => void;
  onConfirmed: (directionId: string) => void;
}) {
  const t = copy[locale];
  const [localError, setLocalError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const { directions, status, error: loadError, isLoading } = useBrandCampaignDirections(
    locale,
    project.id,
    { enabled: directionsEnabled, briefSnapshot, wizardFastPath: true, textOnly: true }
  );

  const platforms =
    project.target_platform?.split(",").map((item) => item.trim()).filter(Boolean) ??
    ((project.settings_json?.brand_questionnaire as { platforms?: string[] } | undefined)?.platforms ?? [
      "TikTok",
      "Meta"
    ]);

  const fallbackBudget = parseBudgetFallback(budget);
  const displayError = localError || error || loadError;
  const minGeneratingActive = now < minGeneratingUntil;
  const directionsReady = directions.length > 0 && status === "ready";
  const showGeneratingOverlay =
    isActive && !directionsReady && (awaitingBriefSave || isLoading || minGeneratingActive);
  const showContent = directionsReady;
  const displayDirections = directions.map((direction) => localizeCreativeDirection(direction, locale));

  useEffect(() => {
    if (Date.now() >= minGeneratingUntil) {
      setNow(Date.now());
      return;
    }
    const timer = window.setTimeout(() => setNow(Date.now()), minGeneratingUntil - Date.now());
    return () => window.clearTimeout(timer);
  }, [minGeneratingUntil]);

  useEffect(() => {
    if (directions.length && !selectedId) {
      setSelectedId(directions[0]?.id ?? null);
    }
    if (directions.length && !previewId) {
      setPreviewId(directions[0]?.id ?? null);
    }
  }, [directions, previewId, selectedId]);

  useEffect(() => {
    if (!isActive || status !== "ready") return;
    syncBrandWizardStepUrl(project.id, 2, locale);
  }, [isActive, status, project.id, locale]);

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
    displayDirections.find((item) => item.id === previewId) ??
    displayDirections.find((item) => item.id === selectedId) ??
    displayDirections[0] ??
    null;
  const thumbnailDirections = displayDirections.filter((item) => item.id !== selectedDirection?.id);
  const creatorSubmissionSelected = selectedId === CREATOR_SUBMITTED_CREATIVE_DIRECTION_ID;

  function directionIndex(direction: (typeof directions)[number]) {
    return Math.max(
      displayDirections.findIndex((item) => item.id === direction.id),
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
        <div className="flex-1 space-y-6 bg-[#f8f9fb] px-3 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-4 sm:pt-5 lg:px-5 lg:pt-6">
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
            </div>
            <div className="hidden xl:block" aria-hidden />
          </div>

          <div className={MAIN_SIDEBAR_GRID}>
            <div className={STEP2_SCHEME_LAYOUT.schemesStack}>
              {showContent && selectedDirection ? (
                <>
                  <div className="flex w-full justify-center lg:justify-start">
                    <div className="inline-flex rounded-[1.6rem] border border-violet-200 bg-white p-1.5 shadow-[0_16px_45px_rgba(124,58,237,0.18)] ring-1 ring-violet-100">
                      {displayDirections.map((direction) => {
                        const label = String.fromCharCode(65 + directionIndex(direction));
                        const active = selectedDirection.id === direction.id;
                        return (
                          <button
                            key={direction.id}
                            type="button"
                            onClick={() => {
                              setSelectedId(direction.id);
                              setPreviewId(direction.id);
                              setLocalError(null);
                            }}
                            className={
                              active
                                ? "min-w-32 rounded-[1.25rem] bg-gradient-to-r from-violet-600 to-fuchsia-600 px-7 py-3 text-base font-bold text-white shadow-[0_10px_28px_rgba(124,58,237,0.35)]"
                                : "min-w-32 rounded-[1.25rem] px-7 py-3 text-base font-bold text-zinc-500 transition hover:bg-violet-50 hover:text-violet-700"
                            }
                          >
                            {locale === "zh" ? `方案 ${label}` : `Strategy ${label}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <p className="rounded-2xl border border-violet-100 bg-violet-50/70 px-4 py-3 text-center text-xs font-medium leading-5 text-violet-700 lg:text-left">
                    {t.referenceNotice}
                  </p>

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
                    textOnly
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
                          textOnly
                          onSelect={() => {
                            setSelectedId(direction.id);
                            setPreviewId(direction.id);
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
                project={project}
                references={references}
                directions={displayDirections}
                selectedId={selectedId}
                platforms={platforms}
                fallbackBudget={fallbackBudget}
                budget={budget}
                creatorOption={{
                  selected: creatorSubmissionSelected,
                  badge: t.creatorOptionBadge,
                  title: t.creatorOptionTitle,
                  body: t.creatorOptionBody,
                  onSelect: () => {
                    setSelectedId(CREATOR_SUBMITTED_CREATIVE_DIRECTION_ID);
                    setLocalError(null);
                  }
                }}
              />
            ) : null}
          </div>

          {displayError ? <p className="text-sm text-red-600">{displayError}</p> : null}
        </div>

        <BrandCampaignStep2Footer
          locale={locale}
          directionsReady={showContent}
          selectedId={selectedId}
          confirmLabel={creatorSubmissionSelected ? t.creatorConfirm : undefined}
          onBack={onBack}
          onSaveDraft={onSaveDraft}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
}
