"use client";

import { useEffect, useState } from "react";
import { useAcknowledgeAlert } from "@/components/studioos/acknowledge-alert-provider";
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
import { STEP2_SCHEME_LAYOUT, BRAND_WIZARD_MAIN_SIDEBAR_GRID } from "@/lib/studioos/brand-campaign-step2-layout";
import { BRAND_CAMPAIGN_STEP2_REVIEW_COPY } from "@/lib/studioos/brand-campaign-step2-copy";
import { localizeCreativeDirection } from "@/lib/studioos/creative-direction-localization";
import { CREATOR_SUBMITTED_CREATIVE_DIRECTION_ID } from "@/lib/studioos/creative-direction-selection";
import { cn } from "@/lib/utils";
import { Brain, Info, Target, TrendingUp, Zap } from "lucide-react";

function parseBudgetFallback(budget: string) {
  const match = budget.replace(/,/g, "").match(/\d+/);
  return match ? Number(match[0]) : 300;
}

const MAIN_SIDEBAR_GRID = BRAND_WIZARD_MAIN_SIDEBAR_GRID;

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
  isConfirming = false,
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
  isConfirming?: boolean;
  onBack: () => void;
  onSaveDraft?: () => void;
  onConfirmed: (directionId: string) => void;
}) {
  const t = BRAND_CAMPAIGN_STEP2_REVIEW_COPY[locale];
  const { alert } = useAcknowledgeAlert();
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

  useEffect(() => {
    if (displayError) alert(displayError);
  }, [alert, displayError]);

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
      alert(t.chooseError);
      return;
    }
    setLocalError(null);
    onConfirmed(selectedId);
  }

  const featureTags = [
    {
      icon: Brain,
      label: t.tagInsight,
      chipClass:
        "border border-violet-200/70 bg-gradient-to-r from-violet-50 via-violet-50/90 to-fuchsia-50 text-violet-800 shadow-sm shadow-violet-100/70",
      iconClass: "text-violet-600"
    },
    {
      icon: Target,
      label: t.tagAudience,
      chipClass:
        "border border-sky-200/70 bg-gradient-to-r from-sky-50 via-sky-50/90 to-cyan-50 text-sky-800 shadow-sm shadow-sky-100/70",
      iconClass: "text-sky-600"
    },
    {
      icon: Zap,
      label: t.tagPlatform,
      chipClass:
        "border border-amber-200/70 bg-gradient-to-r from-amber-50 via-orange-50/90 to-yellow-50 text-amber-900 shadow-sm shadow-amber-100/70",
      iconClass: "text-amber-600"
    },
    {
      icon: TrendingUp,
      label: t.tagPerformance,
      chipClass:
        "border border-emerald-200/70 bg-gradient-to-r from-emerald-50 via-green-50/90 to-teal-50 text-emerald-800 shadow-sm shadow-emerald-100/70",
      iconClass: "text-emerald-600"
    }
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
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {showGeneratingOverlay ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-white/96 p-4 backdrop-blur-md sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-busy="true"
          aria-label={t.generatingOverlay}
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
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-[26px]">
                {t.headline}
              </h1>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{t.subtitle}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {featureTags.map(({ icon: Icon, label, chipClass, iconClass }) => (
                  <span
                    key={label}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
                      chipClass
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5 shrink-0", iconClass)} strokeWidth={2.25} />
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
                    <div
                      className="inline-flex w-full max-w-lg rounded-xl border border-zinc-200 bg-zinc-50/80 p-1 sm:w-auto"
                      role="tablist"
                      aria-label={locale === "zh" ? "创意方案" : "Creative strategies"}
                    >
                      {displayDirections.map((direction) => {
                        const label = String.fromCharCode(65 + directionIndex(direction));
                        const active = selectedDirection.id === direction.id;
                        return (
                          <button
                            key={direction.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => {
                              setSelectedId(direction.id);
                              setPreviewId(direction.id);
                              setLocalError(null);
                            }}
                            className={
                              active
                                ? "min-w-0 flex-1 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 shadow-sm ring-1 ring-zinc-200/80 sm:min-w-[5.5rem] sm:flex-none"
                                : "min-w-0 flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-800 sm:min-w-[5.5rem] sm:flex-none"
                            }
                          >
                            {`${t.schemeTab} ${label}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border border-violet-100/90 bg-gradient-to-br from-violet-50/80 via-white to-white px-4 py-3.5 sm:px-5">
                    <span
                      className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-violet-500"
                      aria-hidden
                    />
                    <div className="flex items-start gap-3 pl-2 sm:items-center">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                        <Info className="h-4 w-4" strokeWidth={2.25} />
                      </span>
                      <p className="text-sm font-medium leading-6 tracking-[-0.01em] text-zinc-800 sm:text-[0.9375rem]">
                        {t.referenceNotice}
                      </p>
                    </div>
                  </div>

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
        </div>

        <BrandCampaignStep2Footer
          locale={locale}
          directionsReady={showContent}
          selectedId={selectedId}
          isConfirming={isConfirming}
          confirmLabel={creatorSubmissionSelected ? t.creatorConfirm : undefined}
          onBack={onBack}
          onSaveDraft={onSaveDraft}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
}
