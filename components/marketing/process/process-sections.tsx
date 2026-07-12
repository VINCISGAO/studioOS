import { Globe2, Lock, Sparkles, Users } from "lucide-react";
import { ProcessStepIcon } from "@/components/marketing/process/process-step-icon";
import { processText } from "@/lib/marketing/process-copy";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const HIGHLIGHT_ICONS = [Users, Sparkles, Lock, Globe2] as const;
const FEATURED_STEP_COUNT = 5;

export function ProcessHeroSection({ locale }: { locale: Locale }) {
  const t = processText(locale);

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-violet-100/70 bg-white p-6 shadow-[0_18px_60px_-48px_rgba(76,29,149,0.35)] sm:p-8">
      <p className="text-sm font-semibold text-violet-700">{t.pageTitle}</p>
      <div className="mt-2 h-0.5 w-6 rounded-full bg-violet-600" />
      <h1 className="mt-5 max-w-4xl text-3xl font-semibold tracking-[-0.035em] text-zinc-950 sm:text-4xl lg:text-[2.5rem] lg:leading-[1.08]">
        {t.subtitle}
      </h1>
      <div className="mt-5 max-w-4xl space-y-3 text-sm leading-7 text-zinc-600">
        {t.intro.map((paragraph) => (
          <p key={paragraph.slice(0, 20)}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}

export function ProcessHighlightsSection({ locale }: { locale: Locale }) {
  const t = processText(locale);

  return (
    <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {t.highlights.map((highlight, index) => {
        const Icon = HIGHLIGHT_ICONS[index] ?? Sparkles;
        return (
          <article
            key={highlight.title}
            className="flex gap-4 rounded-2xl border border-zinc-200/80 bg-white px-4 py-4 shadow-[0_10px_30px_-28px_rgba(0,0,0,0.18)]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-zinc-950">{highlight.title}</h2>
              <p className="mt-1 text-xs leading-5 text-zinc-500">{highlight.body}</p>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export function ProcessStepsSection({ locale }: { locale: Locale }) {
  const t = processText(locale);
  const featuredSteps = t.steps.slice(0, FEATURED_STEP_COUNT);

  return (
    <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-white p-6 shadow-[0_18px_60px_-48px_rgba(0,0,0,0.22)] sm:p-8">
      <div className="relative max-w-4xl">
        <div
          aria-hidden
          className="absolute bottom-6 left-5 top-5 hidden w-px bg-zinc-200 sm:block"
        />
        <div className="space-y-8">
          {featuredSteps.map((step, index) => (
            <article key={step.id} className="relative flex gap-5 sm:gap-6">
              <div className="relative z-[1] flex w-10 shrink-0 flex-col items-center sm:w-11">
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold sm:h-11 sm:w-11",
                    index === 0
                      ? "bg-violet-600 text-white"
                      : "border border-violet-200 bg-violet-50 text-violet-700"
                  )}
                >
                  {step.number}
                </span>
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-violet-700">
                    <ProcessStepIcon id={step.id} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-zinc-950 sm:text-lg">{step.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-zinc-600">{step.body}</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
