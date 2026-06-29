import Link from "next/link";
import { Sparkles } from "lucide-react";
import { HomeHeroPrimaryCta } from "@/components/marketing/home-hero-primary-cta";
import { HomeHeroProductPreview } from "@/components/marketing/home-hero-product-preview";
import { HomeHeroVideo } from "@/components/marketing/home-hero-video";
import { HomeLogoMarquee } from "@/components/marketing/home-logo-marquee";
import { homeCopy } from "@/lib/marketing/home-copy";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { marketingHeadlineClassName } from "@/lib/studioos/marketing-headline-font";
import { cn } from "@/lib/utils";

export function HomeHero({
  locale,
  portalHref
}: {
  locale: Locale;
  portalHref: string;
}) {
  const t = homeCopy("hero", locale);

  return (
    <section className="relative isolate min-h-[88vh] overflow-hidden bg-[#09090b] text-white">
      <HomeHeroVideo />

      <div className="pointer-events-none absolute inset-0 z-[1] premium-grid-bg opacity-30" />
      <div className="pointer-events-none absolute -left-24 top-24 z-[1] h-80 w-80 animate-hero-orb rounded-full bg-violet-600/25 blur-[120px]" />
      <div className="pointer-events-none absolute -right-16 top-40 z-[1] h-64 w-64 animate-hero-orb rounded-full bg-indigo-500/20 blur-[100px] [animation-delay:4s]" />

      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[min(72vh,680px)]"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% -20%, rgba(255,255,255,0.06), transparent 60%), radial-gradient(ellipse 40% 30% at 100% 0%, rgba(99,102,241,0.12), transparent 50%)"
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-[88vh] max-w-7xl flex-col px-4 pb-8 pt-28 sm:px-6 sm:pt-36 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="animate-fade-up-in inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-xs font-medium text-zinc-400 [animation-delay:0.05s]">
            <Sparkles className="h-3.5 w-3.5 text-zinc-300" />
            {t.eyebrow}
          </p>

          <h1
            className={cn(
              "animate-fade-up-in mt-7 text-pretty text-4xl font-semibold sm:text-5xl md:text-6xl lg:text-[3.5rem]",
              locale === "zh"
                ? "leading-[1.15] tracking-[0.02em]"
                : cn(marketingHeadlineClassName("en"), "leading-[1.08] tracking-[-0.025em]"),
              "[animation-delay:0.12s]"
            )}
          >
            <span className="block">{t.titleLine1}</span>
            <span className="mt-1 block sm:mt-2">
              <span className="bg-gradient-to-r from-violet-300 via-white to-indigo-300 bg-clip-text text-transparent">
                {t.titleHighlight}
              </span>
              {t.titleLine2}
            </span>
          </h1>

          <p className="animate-fade-up-in mx-auto mt-6 max-w-2xl text-balance text-base leading-7 text-zinc-400 sm:text-lg [animation-delay:0.2s]">
            {t.subtitle}
          </p>

          <div className="animate-fade-up-in relative z-30 mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row [animation-delay:0.28s]">
            <HomeHeroPrimaryCta href={portalHref} label={t.primary} />
            <Link
              href={withLocale("/login?role=creator", locale)}
              className={cn(
                "inline-flex h-11 w-full items-center justify-center rounded-lg border border-white/25 px-6 text-sm font-medium text-white transition",
                "bg-white/5 hover:border-white/40 hover:bg-white/10 sm:w-auto"
              )}
            >
              {t.secondary}
            </Link>
          </div>
        </div>

        <div className="animate-fade-up-in relative z-10 mx-auto mt-16 w-full max-w-5xl lg:mt-20 [animation-delay:0.36s]">
          <HomeHeroProductPreview locale={locale} />
        </div>

        <HomeLogoMarquee locale={locale} />
      </div>
    </section>
  );
}
