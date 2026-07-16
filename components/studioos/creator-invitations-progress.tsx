"use client";

import { CircleDollarSign, Clapperboard, Handshake, Hourglass, Megaphone } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import {
  creatorUserCommercialPhaseLabel,
  creatorUserCommercialPhaseLabels,
  creatorUserCommercialPhaseSubtitles,
  creatorUserCommercialPhaseIndex,
  creatorUserCommercialPhases,
  mapCreatorStepToUserPhase,
  resolveCreatorNextActorHint,
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

const phaseIcons = [Megaphone, Handshake, Clapperboard, CircleDollarSign];

export function CreatorInvitationsProgress({
  locale,
  currentStep
}: {
  locale: Locale;
  currentStep: CreatorCommercialStep;
}) {
  const t = copy[locale];
  const currentPhase = mapCreatorStepToUserPhase(currentStep);
  const currentIndex = creatorUserCommercialPhaseIndex(currentPhase);
  const currentLabel = creatorUserCommercialPhaseLabel(currentPhase, locale);
  const nextHint = resolveCreatorNextActorHint(currentStep, locale);
  const showWaitingBrandBody = currentStep === "waiting_brand_selection";

  return (
    <section className="rounded-[1.75rem] border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-950">{t.title}</h2>
        <span className="w-fit rounded-full bg-violet-50 px-3.5 py-1.5 text-xs font-semibold text-violet-700 ring-1 ring-violet-100">
          {t.current}：{currentLabel}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {creatorUserCommercialPhases.map((phase, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          const Icon = phaseIcons[index] ?? Megaphone;

          return (
            <div key={phase} className="relative min-w-0">
              {index > 0 ? (
                <span
                  className="pointer-events-none absolute -left-3 top-1/2 hidden w-2 border-t border-dashed border-zinc-200 xl:block"
                  aria-hidden
                />
              ) : null}
              <div
                className={cn(
                  "relative min-h-[150px] overflow-hidden rounded-2xl border p-4 transition sm:min-h-[170px]",
                  active
                    ? "border-violet-200 bg-gradient-to-br from-violet-50 to-white shadow-[0_14px_34px_rgba(109,40,217,0.10)]"
                    : done
                      ? "border-zinc-200 bg-white"
                      : "border-zinc-100 bg-zinc-50/60"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                      active
                        ? "bg-violet-600 text-white"
                        : done
                          ? "bg-zinc-900 text-white"
                          : "border border-zinc-200 bg-white text-zinc-400"
                    )}
                  >
                    {index + 1}
                  </span>
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                      active ? "bg-violet-100 text-violet-600" : "bg-white text-zinc-300"
                    )}
                    aria-hidden
                  >
                    <Icon className={cn(active ? "h-6 w-6" : "h-5 w-5")} />
                  </div>
                </div>

                <div className="mt-5 min-w-0">
                  <p
                    className={cn(
                      "text-base font-semibold leading-tight sm:whitespace-nowrap",
                      active ? "text-violet-950" : "text-zinc-800"
                    )}
                  >
                    {creatorUserCommercialPhaseLabels[locale][phase]}
                  </p>
                  <p className={cn("mt-2 text-sm leading-6", active ? "text-violet-800/80" : "text-zinc-400")}>
                    {active || done
                      ? creatorUserCommercialPhaseSubtitles[locale][phase]
                      : locale === "zh"
                        ? "等待进入该阶段"
                        : "Waiting for this stage"}
                  </p>
                </div>
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
