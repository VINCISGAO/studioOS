"use client";

import type { Locale } from "@/lib/i18n";
import type { OrderPaymentStatus, OrderStatus } from "@/lib/order-types";
import {
  brandUserPhaseLabel,
  brandUserPhaseLabels,
  brandUserPhaseSubtitles,
  creatorUserPhaseLabel,
  creatorUserPhaseLabels,
  creatorUserPhaseSubtitles,
  isBrandAwaitingPayment,
  isCreatorAwaitingPayment,
  mapBrandStepToPhase,
  mapCreatorStepToPhase,
  resolveBrandNextActorHint,
  resolveCreatorNextActorHint,
  userCommercialPhaseIndex,
  userCommercialPhases,
  type BrandCommercialContext,
  type BrandCommercialStep,
  type CreatorCommercialStep,
  type UserCommercialPhase
} from "@/lib/studioos/commercial-lifecycle";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";
import { portalChrome } from "@/lib/studioos/product-theme";
import { cn } from "@/lib/utils";
import { Hourglass } from "lucide-react";

const copy = {
  en: {
    brandTitle: "Project progress",
    creatorTitle: "Project progress",
    current: "Current stage",
    next: "Next step",
    eta: "Estimated time remaining"
  },
  zh: {
    brandTitle: "项目进度",
    creatorTitle: "项目进度",
    current: "当前阶段",
    next: "下一步",
    eta: "预计剩余时间"
  }
};

function recruitingEtaLabel(locale: Locale, pendingInvitations: number) {
  if (pendingInvitations <= 0) {
    return locale === "zh" ? "1-2 天" : "1–2 days";
  }
  if (pendingInvitations >= 3) {
    return locale === "zh" ? "2-3 天" : "2–3 days";
  }
  return locale === "zh" ? "1-2 天" : "1–2 days";
}

function HorizontalPhaseTimeline({
  locale,
  side,
  currentPhase,
  nextHint,
  currentLabelOverride,
  estimatedRemaining
}: {
  locale: Locale;
  side: "brand" | "creator";
  currentPhase: UserCommercialPhase;
  nextHint: string;
  currentLabelOverride?: string;
  estimatedRemaining?: string | null;
}) {
  const t = copy[locale];
  const currentIndex = userCommercialPhaseIndex(currentPhase);
  const phaseLabels = side === "brand" ? brandUserPhaseLabels[locale] : creatorUserPhaseLabels[locale];
  const phaseSubtitles = side === "brand" ? brandUserPhaseSubtitles[locale] : creatorUserPhaseSubtitles[locale];
  const currentLabel =
    currentLabelOverride ??
    (side === "brand" ? brandUserPhaseLabel(currentPhase, locale) : creatorUserPhaseLabel(currentPhase, locale));
  const showEta = currentPhase === "recruiting" && estimatedRemaining;

  return (
    <section className={cn(portalChrome.card, "overflow-hidden")}>
      <div className="flex flex-col gap-2 border-b border-zinc-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h2 className="text-sm font-semibold text-zinc-950">{side === "brand" ? t.brandTitle : t.creatorTitle}</h2>
        <span className="w-fit rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
          {t.current}：{currentLabel}
        </span>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <ol className="grid gap-4 sm:grid-cols-4">
          {userCommercialPhases.map((phase, index) => {
            const done = index < currentIndex;
            const active = index === currentIndex;

            return (
              <li key={phase} className="relative min-w-0">
                {index < userCommercialPhases.length - 1 ? (
                  <span
                    className={cn(
                      "absolute left-[calc(50%+14px)] top-3.5 hidden h-px sm:block",
                      done ? "w-[calc(100%-28px)] bg-violet-200" : "w-[calc(100%-28px)] bg-zinc-200"
                    )}
                    aria-hidden
                  />
                ) : null}
                <div className="flex flex-col items-center text-center">
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold",
                      done || active
                        ? "bg-violet-600 text-white"
                        : "border border-zinc-200 bg-white text-zinc-400"
                    )}
                  >
                    {index + 1}
                  </span>
                  <p
                    className={cn(
                      "mt-2 text-sm font-semibold",
                      active ? "text-violet-700" : done ? "text-zinc-800" : "text-zinc-400"
                    )}
                  >
                    {phaseLabels[phase]}
                  </p>
                  <p className={cn("mt-1 text-xs leading-relaxed", active ? "text-violet-600/80" : "text-zinc-400")}>
                    {phaseSubtitles[phase]}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex flex-col gap-2 border-t border-violet-100 bg-violet-50/70 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex items-center gap-2 text-sm text-violet-900">
          <Hourglass className="h-4 w-4 shrink-0 text-violet-500" />
          <span>
            <span className="font-medium">{t.next}：</span>
            {nextHint.replace(/^(下一步：|Next: )/, "")}
          </span>
        </p>
        {showEta ? (
          <p className="text-sm text-violet-700/80">
            {t.eta}：{estimatedRemaining}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function UserPhaseTimeline({
  locale,
  side,
  currentPhase,
  nextHint,
  compact = false,
  currentLabelOverride,
  estimatedRemaining
}: {
  locale: Locale;
  side: "brand" | "creator";
  currentPhase: UserCommercialPhase;
  nextHint: string;
  compact?: boolean;
  currentLabelOverride?: string;
  estimatedRemaining?: string | null;
}) {
  if (compact) {
    return (
      <HorizontalPhaseTimeline
        locale={locale}
        side={side}
        currentPhase={currentPhase}
        nextHint={nextHint}
        currentLabelOverride={currentLabelOverride}
        estimatedRemaining={estimatedRemaining}
      />
    );
  }

  const t = copy[locale];
  const currentIndex = userCommercialPhaseIndex(currentPhase);
  const phaseLabels = side === "brand" ? brandUserPhaseLabels[locale] : creatorUserPhaseLabels[locale];
  const phaseSubtitles = side === "brand" ? brandUserPhaseSubtitles[locale] : creatorUserPhaseSubtitles[locale];
  const currentLabel =
    currentLabelOverride ??
    (side === "brand" ? brandUserPhaseLabel(currentPhase, locale) : creatorUserPhaseLabel(currentPhase, locale));

  return (
    <section className={cn(portalChrome.card, "p-5 sm:p-6")}>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-zinc-950">{side === "brand" ? t.brandTitle : t.creatorTitle}</h2>
        <span className="w-fit rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700">
          {t.current}: {currentLabel}
        </span>
      </div>

      <ol className="space-y-0">
        {userCommercialPhases.map((phase, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          const upcoming = index > currentIndex;

          return (
            <li key={phase}>
              <div
                className={cn(
                  "flex items-start gap-3 rounded-xl px-3 py-3",
                  active && "bg-violet-50 ring-1 ring-violet-100",
                  done && !active && "text-zinc-700",
                  upcoming && "text-zinc-400"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                    done ? "bg-violet-600 text-white" : active ? "bg-violet-600 text-white" : "border border-zinc-200 bg-white text-zinc-400"
                  )}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-semibold leading-snug", active && "text-violet-950")}>
                    {phaseLabels[phase]}
                  </p>
                  {(active || done) && (
                    <p className={cn("mt-0.5 text-xs leading-relaxed", active ? "text-violet-800/80" : "text-zinc-500")}>
                      {phaseSubtitles[phase]}
                    </p>
                  )}
                </div>
              </div>
              {index < userCommercialPhases.length - 1 ? (
                <div className="ml-[23px] flex h-5 items-center">
                  <span className="h-full w-px bg-zinc-200" aria-hidden />
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      <p className="mt-4 rounded-xl bg-violet-50 px-3 py-2.5 text-sm text-violet-900">
        <span className="font-medium">{t.next}：</span>
        {nextHint.replace(/^(下一步：|Next: )/, "")}
      </p>
    </section>
  );
}

export function BrandCommercialTimeline({
  locale,
  currentStep,
  compact = false,
  orderStatus = null,
  paymentStatus = null,
  projectStatus = null,
  hasOpenComments = false,
  pendingInvitationCount = 0
}: {
  locale: Locale;
  currentStep: BrandCommercialStep;
  compact?: boolean;
  orderStatus?: string | null;
  paymentStatus?: string | null;
  projectStatus?: string | null;
  hasOpenComments?: boolean;
  pendingInvitationCount?: number;
}) {
  const commercialContext: BrandCommercialContext = {
    order:
      paymentStatus || orderStatus
        ? {
            ...(paymentStatus ? { payment_status: paymentStatus as OrderPaymentStatus } : {}),
            ...(orderStatus ? { status: orderStatus as OrderStatus } : {})
          }
        : null,
    project: projectStatus ? { status: normalizeCampaignStatus(projectStatus) } : null
  };
  const awaitingPayment = isBrandAwaitingPayment(commercialContext);
  const currentPhase = mapBrandStepToPhase(currentStep, commercialContext);
  const currentLabel =
    currentStep === "creator_selected" && awaitingPayment
      ? locale === "zh"
        ? "待付款"
        : "Awaiting payment"
      : brandUserPhaseLabel(currentPhase, locale);

  return (
    <UserPhaseTimeline
      locale={locale}
      side="brand"
      currentPhase={currentPhase}
      currentLabelOverride={currentLabel}
      nextHint={resolveBrandNextActorHint(currentStep, locale, {
        orderStatus,
        hasOpenComments,
        commercialContext
      })}
      estimatedRemaining={
        currentPhase === "recruiting" ? recruitingEtaLabel(locale, pendingInvitationCount) : null
      }
      compact={compact}
    />
  );
}

export function CreatorCommercialTimeline({
  locale,
  currentStep,
  compact = false,
  orderStatus = null,
  paymentStatus = null
}: {
  locale: Locale;
  currentStep: CreatorCommercialStep;
  compact?: boolean;
  orderStatus?: string | null;
  paymentStatus?: OrderPaymentStatus | null;
}) {
  const commercialContext = {
    order:
      paymentStatus || orderStatus
        ? {
            ...(paymentStatus ? { payment_status: paymentStatus } : {}),
            ...(orderStatus ? { status: orderStatus as OrderStatus } : {})
          }
        : null
  };
  const awaitingPayment =
    currentStep === "selected" && isCreatorAwaitingPayment(commercialContext);
  const currentPhase = mapCreatorStepToPhase(currentStep, commercialContext);
  const currentLabel =
    awaitingPayment
      ? locale === "zh"
        ? "待品牌付款"
        : "Awaiting brand payment"
      : creatorUserPhaseLabel(currentPhase, locale);

  return (
    <UserPhaseTimeline
      locale={locale}
      side="creator"
      currentPhase={currentPhase}
      currentLabelOverride={currentLabel}
      nextHint={resolveCreatorNextActorHint(currentStep, locale, {
        orderStatus,
        commercialContext
      })}
      compact={compact}
    />
  );
}

export {
  brandCommercialPhaseLabel,
  creatorCommercialPhaseLabel
} from "@/lib/studioos/commercial-lifecycle";
