import { HomeScrollReveal } from "@/components/marketing/home-scroll-reveal";
import { homeCopy } from "@/lib/marketing/home-copy";
import type { Locale } from "@/lib/i18n";

export function HomeWhyStudioOS({ locale }: { locale: Locale }) {
  const t = homeCopy("whyStudioOS", locale);

  return (
    <section className="relative overflow-hidden bg-[#09090b] py-24 text-white sm:py-32">
      <div className="pointer-events-none absolute inset-0 premium-grid-bg opacity-30" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <HomeScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">{t.eyebrow}</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold leading-snug tracking-tight sm:text-4xl lg:text-5xl">
            {t.title}
            <span className="mt-2 block bg-gradient-to-r from-violet-300 via-white to-indigo-300 bg-clip-text text-transparent">
              {t.highlight}
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-zinc-400">{t.body}</p>
        </HomeScrollReveal>

        <HomeScrollReveal delay={1} className="mx-auto mt-12 flex max-w-3xl flex-wrap justify-center gap-3">
          {t.notItems.map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-500 line-through decoration-zinc-600"
            >
              {item}
            </span>
          ))}
        </HomeScrollReveal>
      </div>
    </section>
  );
}
