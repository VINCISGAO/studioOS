"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { CinematicHeroFeatures } from "@/components/marketing/cinematic/cinematic-hero-features";
import { landingText } from "@/lib/marketing/landing-copy";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { isChineseLanguage, withLocale } from "@/lib/i18n";
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
  copyLocale = locale,
  portalHref,
  portalLabel,
  isLoggedIn = false
}: {
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
  portalHref: string;
  portalLabel?: string;
  isLoggedIn?: boolean;
}) {
  const t = landingText("hero", copyLocale);
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
  const primaryHref = isLoggedIn ? portalHref : withLocale("/login?role=brand", copyLocale);
  const secondaryLabel = t.secondary;
  const secondaryHref = withLocale("/login?role=creator", copyLocale);
  const heroLocale = copyLocale === "zh" ? "zh-CN" : copyLocale;
  const isEnglish = heroLocale === "en";
  const isCjkHero = isChineseLanguage(heroLocale) || heroLocale === "ja" || heroLocale === "ko";
  const isLongHeroLanguage = !isEnglish && !isCjkHero;
  const primaryDescription = t.primaryDescription;
  const secondaryDescription = t.secondaryDescription;

  return (
    <section
      ref={sectionRef}
      className="relative flex flex-col overflow-hidden bg-[#050607] text-white sm:min-h-[100dvh]"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[length:auto_86%] bg-no-repeat bg-[86%_0%] sm:bg-cover sm:bg-[88%_42%] md:bg-[82%_42%] xl:bg-[82%_42%]"
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
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-0 pt-[5.35rem] sm:px-8 sm:pb-8 sm:pt-24 md:pt-28 lg:pb-10 lg:pt-20">
        <motion.div
          style={reduce ? undefined : { opacity: contentOpacity, y: contentY }}
          className="flex flex-none flex-col justify-start pt-12 sm:flex-1 sm:justify-center sm:pt-0"
        >
          <div className="w-full max-w-3xl text-center sm:max-w-xl sm:text-left">
            <p className="mx-auto inline-flex max-w-full items-center justify-center gap-2 rounded-md border border-white/18 bg-white/[0.07] px-3 py-1.5 text-center text-[10px] font-medium leading-5 text-zinc-200 shadow-[0_12px_36px_-24px_rgba(255,255,255,0.7)] backdrop-blur-md sm:mx-0 sm:justify-start sm:px-3.5 sm:text-left sm:text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#c7d1df]" />
              <span className="min-w-0 text-wrap">{t.eyebrow}</span>
            </p>

            <h1
              className={cn(
                "mt-4 max-w-full font-semibold tracking-[-0.04em] sm:mt-6",
                isEnglish
                  ? "w-full max-w-none text-[clamp(1.7rem,7.2vw,2.9rem)] leading-[1.04] sm:text-[3rem] md:text-[3.15rem] lg:text-[3.15rem] xl:text-[4.3rem]"
                  : isLongHeroLanguage
                    ? "w-full text-[clamp(1.75rem,6.2vw,2.65rem)] leading-[1.08] sm:max-w-[60rem] sm:text-[clamp(2.35rem,4.7vw,3.55rem)]"
                  : "w-[min(100vw-2rem,52rem)] max-w-none text-[clamp(1.7rem,7.2vw,2.9rem)] leading-[1.04] sm:text-[clamp(2.5rem,4.35vw,4.1rem)]",
                isEnglish ? marketingHeadlineClassName("en") : "text-pretty"
              )}
            >
              <span
                className={cn(
                  "block w-full max-w-full break-words",
                  isLongHeroLanguage ? "whitespace-normal" : "whitespace-nowrap",
                  isEnglish ? "text-white" : marketingSilverGradientClassName()
                )}
              >
                {t.titleLine1}
              </span>
              {isEnglish && t.titleHighlight ? (
                <span className="mt-3 block max-w-full break-words whitespace-normal text-white sm:mt-4">{t.titleHighlight}</span>
              ) : null}
              {t.titleLine2 ? (
                <span
                  className={cn(
                    "mt-3 block max-w-full break-words sm:mt-4",
                    isLongHeroLanguage ? "whitespace-normal" : "whitespace-nowrap",
                    isEnglish ? "text-zinc-300" : marketingSilverGradientClassName()
                  )}
                >
                  {t.titleLine2}
                </span>
              ) : null}
            </h1>

            <p className="mx-auto mt-4 max-w-2xl whitespace-pre-line text-center text-[13px] leading-6 text-zinc-300 sm:mx-0 sm:mt-6 sm:text-left sm:text-base md:text-[17px] md:leading-8">
              {t.subtitle}
            </p>

            <div className="mx-auto mt-5 grid w-[88%] grid-cols-2 gap-2.5 sm:mx-0 sm:mt-8 sm:w-full sm:gap-3">
              <Link
                href={primaryHref}
                className="group flex min-h-[70px] items-center justify-between gap-2.5 rounded-xl border border-white bg-white px-3.5 py-3 text-left text-black shadow-[0_24px_64px_-30px_rgba(255,255,255,0.82)] transition duration-300 hover:-translate-y-0.5 hover:bg-zinc-100 sm:min-h-[78px] sm:gap-4 sm:rounded-lg sm:px-5 sm:py-4"
              >
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold leading-5 sm:text-[18px] sm:leading-6">{primaryLabel}</span>
                  <span className="mt-0.5 block text-[12px] font-medium leading-4 text-zinc-500 sm:mt-1 sm:text-[13px] sm:leading-5">
                    {primaryDescription}
                  </span>
                </span>
                <ArrowRight className="h-4.5 w-4.5 shrink-0 transition duration-300 group-hover:translate-x-1 sm:h-5 sm:w-5" />
              </Link>
              <Link
                href={secondaryHref}
                className="group flex min-h-[70px] items-center justify-between gap-2.5 rounded-xl border border-white/32 bg-white/[0.05] px-3.5 py-3 text-left text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-white/45 hover:bg-white/[0.075] sm:min-h-[78px] sm:gap-4 sm:rounded-lg sm:px-5 sm:py-4"
              >
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold leading-5 sm:text-[18px] sm:leading-6">{secondaryLabel}</span>
                  <span className="mt-0.5 block text-[12px] font-medium leading-4 text-zinc-400 sm:mt-1 sm:text-[13px] sm:leading-5">
                    {secondaryDescription}
                  </span>
                </span>
                <ArrowRight className="h-4.5 w-4.5 shrink-0 transition duration-300 group-hover:translate-x-1 sm:h-5 sm:w-5" />
              </Link>
            </div>

            <div className="mt-6 grid w-full grid-cols-3 gap-2 border-y border-white/10 py-3.5 text-center sm:mt-8 sm:gap-3 sm:py-5 sm:text-left">
              <div>
                <p className="text-[1.15rem] font-semibold tracking-[-0.02em] text-white sm:text-xl">$200+</p>
                <p className="mt-1 text-[10px] leading-4 text-white sm:text-xs sm:text-white">
                  {locale === "zh" ? "起步制作预算" : "Starting production budget"}
                </p>
              </div>
              <div>
                <p className="text-[1.15rem] font-semibold tracking-[-0.02em] text-white sm:text-xl">72h</p>
                <p className="mt-1 text-[10px] leading-4 text-white sm:text-xs sm:text-white">
                  {locale === "zh" ? "首轮方案窗口" : "First concept window"}
                </p>
              </div>
              <div>
                <p className="text-[1.15rem] font-semibold tracking-[-0.02em] text-white sm:text-xl">1080P/4K</p>
                <p className="mt-1 text-[10px] leading-4 text-white sm:text-xs sm:text-white">
                  {locale === "zh" ? "交付与版权标准" : "Delivery and rights standard"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-0 sm:mt-auto">
            <CinematicHeroFeatures locale={copyLocale} />

          <div className="mt-5 overflow-hidden border-y border-white/[0.08] py-4 sm:mt-6 sm:py-6">
            <p className="text-center text-[10px] font-medium tracking-[0.18em] text-zinc-500 sm:text-[11px] sm:tracking-[0.24em]">
              {locale === "zh" ? "全球品牌信赖" : "TRUSTED BY GLOBAL BRAND TEAMS"}
            </p>
            <div className="relative mt-3 sm:mt-4">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#050607] to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#050607] to-transparent" />
              <div className="animate-cinematic-marquee flex w-max items-center gap-x-7 pr-7 sm:gap-x-12 sm:pr-12">
                {[...TRUST_BRANDS, ...TRUST_BRANDS].map((brand, index) => (
                  <span
                    key={`${brand}-${index}`}
                    className="text-[15px] font-semibold tracking-tight text-zinc-500/80 grayscale sm:text-lg"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
