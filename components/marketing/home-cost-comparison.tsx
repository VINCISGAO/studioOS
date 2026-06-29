import { HomeScrollReveal } from "@/components/marketing/home-scroll-reveal";
import { homeCopy } from "@/lib/marketing/home-copy";
import type { Locale } from "@/lib/i18n";

export function HomeCostComparison({ locale }: { locale: Locale }) {
  const t = homeCopy("costComparison", locale);

  return (
    <section className="border-b border-zinc-200 bg-[#fafaf8] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <HomeScrollReveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">{t.eyebrow}</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            {t.title}
          </h2>
        </HomeScrollReveal>

        <HomeScrollReveal delay={1} className="mx-auto mt-14 max-w-4xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{t.traditional}</p>
              <ul className="mt-5 space-y-3">
                {t.traditionalItems.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-zinc-600">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8 h-3 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full w-full rounded-full bg-zinc-400" />
              </div>
              <p className="mt-2 text-right font-mono text-xs text-zinc-400">100%</p>
            </article>

            <article className="relative overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950 p-6 text-white sm:p-8">
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{t.studio}</p>
              <ul className="relative mt-5 space-y-3">
                {t.studioItems.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="relative mt-8 h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[28%] rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500" />
              </div>
              <p className="relative mt-2 text-right font-mono text-xs text-emerald-400">~28%</p>
            </article>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5 text-center sm:flex-row sm:gap-4">
            <span className="text-sm font-medium text-emerald-900">{t.saveLabel}</span>
            <span className="font-mono text-4xl font-semibold tracking-tight text-emerald-700">{t.saveRange}</span>
          </div>
        </HomeScrollReveal>
      </div>
    </section>
  );
}
