"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { CinematicHeroFeatures } from "@/components/marketing/cinematic/cinematic-hero-features";
import { landingText } from "@/lib/marketing/landing-copy";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { marketingHeadlineClassName, marketingSilverGradientClassName } from "@/lib/studioos/marketing-headline-font";
import { cn } from "@/lib/utils";

const HERO_BG = "/api/home-hero-space";

const TRUST_BRANDS = [
  "Samsung",
  "Airbnb",
  "TikTok",
  "Shopify",
  "Amazon",
  "Meta",
  "Google",
  "Coca-Cola"
] as const;

export function CinematicHero({
  locale,
  portalHref,
  portalLabel,
  isLoggedIn = false
}: {
  locale: Locale;
  portalHref: string;
  portalLabel?: string;
  isLoggedIn?: boolean;
}) {
  const t = landingText("hero", locale);
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });
  const contentOpacity = useTransform(scrollYProgress, [0, 0.58, 0.88], [1, 1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.58, 0.88], [0, 0, -80]);

  const primaryLabel = isLoggedIn
    ? (portalLabel ?? (locale === "zh" ? "品牌方门户" : "Brand portal"))
    : t.primary;
  const primaryHref = isLoggedIn ? portalHref : withLocale("/login?role=brand", locale);
  const secondaryLabel = t.secondary;
  const secondaryHref = withLocale("/login?role=creator", locale);
  const isEnglish = locale === "en";
  const primaryDescription = locale === "zh" ? "匹配优质创作者" : "Match with vetted AI Studios";
  const secondaryDescription = locale === "zh" ? "入驻获取全球订单" : "Join to get global orders";

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#050607] text-white"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-no-repeat bg-[102%_26%] sm:bg-[88%_42%] lg:bg-[98%_42%]"
        style={{ backgroundImage: `url(${HERO_BG})` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,7,0.94)_0%,rgba(5,6,7,0.76)_40%,rgba(5,6,7,0.38)_62%,rgba(5,6,7,0.12)_78%,transparent_100%)] sm:bg-[linear-gradient(90deg,rgba(5,6,7,0.92)_0%,rgba(5,6,7,0.72)_38%,rgba(5,6,7,0.28)_62%,rgba(5,6,7,0.12)_100%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,7,0.04)_0%,rgba(5,6,7,0.26)_62%,rgba(5,6,7,0.7)_100%)] sm:bg-[linear-gradient(180deg,rgba(5,6,7,0.08)_0%,rgba(5,6,7,0.42)_72%,rgba(5,6,7,0.88)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_46%_34%_at_86%_24%,rgba(96,156,220,0.18),transparent_60%)] sm:hidden"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" aria-hidden />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-8 pt-24 sm:px-8 sm:pt-24 md:pt-28 lg:pb-10 lg:pt-20">
        <motion.div
          style={reduce ? undefined : { opacity: contentOpacity, y: contentY }}
          className="flex flex-1 flex-col justify-center"
        >
          <div className={cn(isEnglish ? "max-w-none" : "w-full max-w-3xl sm:max-w-xl")}>
            <p className="inline-flex max-w-full items-center gap-2 rounded-md border border-white/12 bg-white/[0.06] px-3 py-1.5 text-[10px] font-medium leading-5 text-zinc-200 sm:px-3.5 sm:text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#c7d1df]" />
              <span className="min-w-0 text-wrap">{t.eyebrow}</span>
            </p>

            <h1
              className={cn(
                "mt-5 font-semibold tracking-[-0.04em] sm:mt-6",
                isEnglish
                  ? "max-w-none text-[clamp(1.65rem,4.6vw,4.1rem)] leading-[1.02] sm:text-[clamp(2.35rem,3.8vw,3.85rem)] lg:text-[3.85rem] xl:text-[4.1rem]"
                  : "w-full max-w-none text-[clamp(2.9rem,11.8vw,4.35rem)] leading-[1.01] sm:text-[4.35rem] md:text-[4.5rem] lg:text-[4.5rem] xl:text-[4.55rem]",
                isEnglish ? marketingHeadlineClassName("en") : "text-pretty"
              )}
            >
              <span
                className={cn(
                  "block w-full whitespace-nowrap",
                  isEnglish ? "text-white" : marketingSilverGradientClassName()
                )}
              >
                {t.titleLine1}
              </span>
              {isEnglish && t.titleHighlight ? (
                <span className="mt-3 block whitespace-nowrap text-white sm:mt-4">{t.titleHighlight}</span>
              ) : null}
              {isEnglish && t.titleLine2 ? (
                <span className="mt-3 block whitespace-nowrap text-zinc-300 sm:mt-4">{t.titleLine2}</span>
              ) : null}
            </h1>

            <p className="mt-5 max-w-2xl whitespace-pre-line text-[15px] leading-7 text-zinc-300 sm:mt-6 sm:text-base md:text-[17px] md:leading-8">
              {t.subtitle}
            </p>

            <div className="mt-7 grid w-full grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2">
              <Link
                href={primaryHref}
                className="group flex min-h-[78px] items-center justify-between gap-4 rounded-lg border border-white bg-white px-5 py-4 text-left text-black shadow-[0_24px_64px_-28px_rgba(255,255,255,0.75)] transition duration-300 hover:-translate-y-0.5 hover:bg-zinc-100"
              >
                <span className="min-w-0">
                  <span className="block text-[18px] font-semibold leading-6">{primaryLabel}</span>
                  <span className="mt-1 block text-[13px] font-medium leading-5 text-zinc-500">
                    {primaryDescription}
                  </span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 transition duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href={secondaryHref}
                className="group flex min-h-[78px] items-center justify-between gap-4 rounded-lg border border-white/28 bg-white/[0.035] px-5 py-4 text-left text-white backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-white/45 hover:bg-white/[0.075]"
              >
                <span className="min-w-0">
                  <span className="block text-[18px] font-semibold leading-6">{secondaryLabel}</span>
                  <span className="mt-1 block text-[13px] font-medium leading-5 text-zinc-400">
                    {secondaryDescription}
                  </span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 transition duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="mt-7 grid w-full grid-cols-3 gap-2 border-y border-white/10 py-4 sm:mt-8 sm:gap-3 sm:py-5">
              <div>
                <p className="text-lg font-semibold text-white sm:text-xl">$200+</p>
                <p className="mt-1 text-[10px] leading-4 text-zinc-400 sm:text-xs sm:text-zinc-500">
                  {locale === "zh" ? "起步制作预算" : "Starting production budget"}
                </p>
              </div>
              <div>
                <p className="text-lg font-semibold text-white sm:text-xl">72h</p>
                <p className="mt-1 text-[10px] leading-4 text-zinc-400 sm:text-xs sm:text-zinc-500">
                  {locale === "zh" ? "首轮方案窗口" : "First concept window"}
                </p>
              </div>
              <div>
                <p className="text-lg font-semibold text-white sm:text-xl">1080P/4K</p>
                <p className="mt-1 text-[10px] leading-4 text-zinc-400 sm:text-xs sm:text-zinc-500">
                  {locale === "zh" ? "交付与版权标准" : "Delivery and rights standard"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-auto">
          <div className="overflow-hidden border-y border-white/[0.08] py-5 sm:py-6">
            <p className="text-center text-[10px] font-medium tracking-[0.18em] text-zinc-500 sm:text-[11px] sm:tracking-[0.24em]">
              {locale === "zh" ? "全球品牌信赖" : "TRUSTED BY GLOBAL BRAND TEAMS"}
            </p>
            <div className="relative mt-4">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#050607] to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#050607] to-transparent" />
              <div className="animate-cinematic-marquee flex w-max items-center gap-x-8 pr-8 sm:gap-x-12 sm:pr-12">
                {[...TRUST_BRANDS, ...TRUST_BRANDS].map((brand, index) => (
                  <span
                    key={`${brand}-${index}`}
                    className="text-base font-semibold tracking-tight text-zinc-500/80 grayscale sm:text-lg"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <CinematicHeroFeatures locale={locale} />
        </div>
      </div>
    </section>
  );
}
