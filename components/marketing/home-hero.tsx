import Link from "next/link";
import { Sparkles } from "lucide-react";
import { HomeHeroPrimaryCta } from "@/components/marketing/home-hero-primary-cta";
import { HomeHeroProductPreview } from "@/components/marketing/home-hero-product-preview";
import { HomeHeroVideo } from "@/components/marketing/home-hero-video";
import { HomeTrustStrip } from "@/components/marketing/home-trust-bar";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { studioOS, formatHeroHeadlineLine1 } from "@/lib/studioos/vocabulary";
import { marketingHeadlineClassName } from "@/lib/studioos/marketing-headline-font";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    eyebrow: "Commercial production OS",
    slogan:
      "Brief, match studios, review cuts, and measure performance — one workspace for global brand teams.",
    primary: "Create ad brief",
    secondary: "Explore studios",
    stat1: "72h",
    stat1Label: "Brief to first cut",
    stat2: "100%",
    stat2Label: "Escrow-backed",
    stat3: "6-step",
    stat3Label: "Campaign wizard"
  },
  zh: {
    eyebrow: "商业制作操作系统",
    slogan: "需求简报、匹配制作方、审片、效果归因 — 全球品牌团队的一个工作区。",
    primary: "创建广告需求",
    secondary: "探索制作方",
    stat1: "72h",
    stat1Label: "简报到初剪",
    stat2: "100%",
    stat2Label: "托管结算",
    stat3: "6 步",
    stat3Label: "投放向导"
  }
};

export function HomeHero({
  locale,
  portalHref
}: {
  locale: Locale;
  portalHref: string;
}) {
  const t = copy[locale];

  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#09090b] text-white">
        <HomeHeroVideo />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[min(68vh,640px)]"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% -20%, rgba(255,255,255,0.05), transparent 60%), radial-gradient(ellipse 40% 30% at 100% 0%, rgba(59,130,246,0.07), transparent 50%)"
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-36 lg:px-8 lg:pb-24">
          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-xs font-medium text-zinc-400">
              <Sparkles className="h-3.5 w-3.5 text-zinc-300" />
              {t.eyebrow}
            </p>

            <h1
              className={cn(
                "mt-7 text-pretty text-4xl font-semibold sm:text-5xl md:text-6xl lg:text-[3.5rem]",
                locale === "zh"
                  ? "leading-[1.12] tracking-[0.04em]"
                  : cn(marketingHeadlineClassName("en"), "leading-[1.12] tracking-[-0.02em]")
              )}
            >
              <span className="block">{formatHeroHeadlineLine1(studioOS.heroHeadline[locale].line1)}</span>
              <span className="mt-3 block">
                <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
                  {studioOS.heroHeadline[locale].highlight}
                </span>
                {studioOS.heroHeadline[locale].line2.replace(studioOS.heroHeadline[locale].highlight, "")}
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-balance text-base leading-7 text-zinc-400 sm:text-lg">
              {t.slogan}
            </p>

            <div className="relative z-30 mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <HomeHeroPrimaryCta href={portalHref} label={t.primary} />
              <Link
                href={withLocale("/creators", locale)}
                className={cn(
                  "inline-flex h-11 w-full items-center justify-center rounded-lg border border-white/25 px-6 text-sm font-medium text-white transition",
                  "bg-white/5 hover:border-white/40 hover:bg-white/10 sm:w-auto"
                )}
              >
                {t.secondary}
              </Link>
            </div>

            <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-white/10 pt-10">
              {[
                [t.stat1, t.stat1Label],
                [t.stat2, t.stat2Label],
                [t.stat3, t.stat3Label]
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="font-mono text-2xl font-semibold tracking-tight sm:text-3xl">{value}</dt>
                  <dd className="mt-1 text-xs text-zinc-500 sm:text-sm">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative z-10 mx-auto mt-16 max-w-5xl lg:mt-20">
            <HomeHeroProductPreview locale={locale} />
          </div>

          <HomeTrustStrip locale={locale} />
        </div>
      </section>
    </>
  );
}
