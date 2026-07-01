"use client";

import { ClipboardCheck, Hourglass, Paintbrush, PartyPopper, Send } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import {
  creatorUserPhaseLabel,
  creatorUserPhaseLabels,
  creatorUserPhaseSubtitles,
  mapCreatorStepToPhase,
  resolveCreatorNextActorHint,
  userCommercialPhaseIndex,
  userCommercialPhases,
  type CreatorCommercialStep
} from "@/lib/studioos/commercial-lifecycle";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    title: "Project progress",
    current: "Current stage",
    next: "Next step",
    waitingBrandBody: "The brand is choosing from shortlisted creators — please check back soon."
  },
  zh: {
    title: "项目进度",
    current: "当前阶段",
    next: "下一步",
    waitingBrandBody: "项目方正在从候选的 Creator 中进行选择，请耐心等待。"
  }
} as const;

const phaseIcons = [Send, Paintbrush, ClipboardCheck, PartyPopper];

export function CreatorInvitationsProgress({
  locale,
  currentStep
}: {
  locale: Locale;
  currentStep: CreatorCommercialStep;
}) {
  const t = copy[locale];
  const currentPhase = mapCreatorStepToPhase(currentStep);
  const currentIndex = userCommercialPhaseIndex(currentPhase);
  const currentLabel = creatorUserPhaseLabel(currentPhase, locale);
  const nextHint = resolveCreatorNextActorHint(currentStep, locale);
  const showWaitingBrandBody = currentStep === "waiting_brand_selection";

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-zinc-950">{t.title}</h2>
        <span className="w-fit rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
          {t.current}：{currentLabel}
        </span>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        {userCommercialPhases.map((phase, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          const Icon = phaseIcons[index] ?? Send;

          return (
            <div key={phase} className="flex min-w-0 flex-1 items-stretch gap-3">
              {index > 0 ? (
                <div className="hidden w-6 shrink-0 items-center lg:flex" aria-hidden>
                  <span className="h-px w-full border-t border-dashed border-zinc-200" />
                </div>
              ) : null}
              <div
                className={cn(
                  "relative min-w-0 flex-1 overflow-hidden rounded-2xl border px-4 py-4",
                  active
                    ? "border-violet-100 bg-violet-50/90"
                    : done
                      ? "border-zinc-100 bg-white"
                      : "border-zinc-100 bg-zinc-50/50"
                )}
              >
                <div className="flex items-start gap-3 pr-12 sm:pr-14">
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                      active
                        ? "bg-violet-600 text-white"
                        : done
                          ? "bg-zinc-900 text-white"
                          : "border border-zinc-200 bg-white text-zinc-400"
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className={cn("text-sm font-semibold", active ? "text-violet-950" : "text-zinc-700")}>
                      {creatorUserPhaseLabels[locale][phase]}
                    </p>
                    {active ? (
                      <p className="mt-1 text-xs leading-relaxed text-violet-800/80">
                        {creatorUserPhaseSubtitles[locale][phase]}
                      </p>
                    ) : null}
                  </div>
                </div>
                {active ? (
                  <div
                    className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 sm:block"
                    aria-hidden
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100/80 text-violet-500">
                      <Icon className="h-7 w-7" />
                    </div>
                  </div>
                ) : (
                  <div
                    className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 opacity-70 sm:block"
                    aria-hidden
                  >
                    <Icon className="h-8 w-8 text-zinc-300" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex gap-3 rounded-2xl bg-violet-50/70 px-4 py-3.5 ring-1 ring-violet-100">
        <Hourglass className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
        <div>
          <p className="text-sm font-medium text-violet-950">
            {nextHint.startsWith("下一步") || nextHint.startsWith("Next")
              ? nextHint
              : `${t.next}：${nextHint}`}
          </p>
          {showWaitingBrandBody ? (
            <p className="mt-1 text-sm leading-relaxed text-violet-800/80">{t.waitingBrandBody}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
