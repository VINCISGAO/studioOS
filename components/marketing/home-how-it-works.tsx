import { ChevronRight } from "lucide-react";
import { HomeScrollReveal } from "@/components/marketing/home-scroll-reveal";
import { homeCopy } from "@/lib/marketing/home-copy";
import type { Locale } from "@/lib/i18n";

export function HomeHowItWorks({ locale }: { locale: Locale }) {
  const t = homeCopy("howItWorks", locale);

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <HomeScrollReveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">{t.eyebrow}</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            {t.title}
          </h2>
        </HomeScrollReveal>

        <HomeScrollReveal delay={1} className="mt-14">
          <ol className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-0">
            {t.steps.map((step, index) => (
              <li key={step} className="flex flex-1 items-center gap-2 lg:flex-col lg:gap-4">
                <div className="flex w-full flex-1 flex-col rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 transition hover:border-zinc-300 hover:bg-white lg:min-h-[120px]">
                  <span className="font-mono text-xs text-zinc-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-2 text-sm font-semibold leading-snug text-zinc-900 sm:text-base">{step}</p>
                </div>
                {index < t.steps.length - 1 ? (
                  <ChevronRight className="hidden h-5 w-5 shrink-0 text-zinc-300 lg:block" aria-hidden />
                ) : null}
              </li>
            ))}
          </ol>
        </HomeScrollReveal>
      </div>
    </section>
  );
}
