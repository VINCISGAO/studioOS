import { HomeScrollReveal } from "@/components/marketing/home-scroll-reveal";
import { homeCopy } from "@/lib/marketing/home-copy";
import type { Locale } from "@/lib/i18n";

export function HomeQualityProof({ locale }: { locale: Locale }) {
  const t = homeCopy("qualityProof", locale);

  return (
    <section className="border-y border-zinc-200 bg-[#fafaf8] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <HomeScrollReveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">{t.eyebrow}</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            {t.title}
          </h2>
        </HomeScrollReveal>

        <HomeScrollReveal delay={1} className="mt-12 flex flex-wrap justify-center gap-3">
          {t.formats.map((format) => (
            <span
              key={format}
              className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
            >
              {format}
            </span>
          ))}
        </HomeScrollReveal>
      </div>
    </section>
  );
}
