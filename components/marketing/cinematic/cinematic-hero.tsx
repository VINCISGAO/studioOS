"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  Layers3,
  ShieldCheck,
  Star
} from "lucide-react";
import { CinematicHeroFeatures } from "@/components/marketing/cinematic/cinematic-hero-features";
import { CinematicHeroStats } from "@/components/marketing/cinematic/cinematic-hero-stats";
import { landingText } from "@/lib/marketing/landing-copy";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { marketingHeadlineClassName } from "@/lib/studioos/marketing-headline-font";
import { cn } from "@/lib/utils";

/** Static public asset — avoids Next/Image + missing API bg breaking the page. */
const HERO_BG = "/images/home-hero-space.png";

const PIPELINE = [
  { label: { en: "Brief locked", zh: "简报已确认" }, meta: "01", icon: FileCheck2 },
  { label: { en: "Studio matched", zh: "制作方已匹配" }, meta: "02", icon: Layers3 },
  { label: { en: "Escrow protected", zh: "资金托管中" }, meta: "03", icon: ShieldCheck },
  { label: { en: "First cut in review", zh: "首版审片中" }, meta: "04", icon: CheckCircle2 }
] as const;

const BRIEF_TAGS = {
  en: ["DTC launch film", "Beauty", "Meta/TikTok", "4K master"],
  zh: ["DTC 发布片", "美妆", "Meta/TikTok", "4K 母版"]
} as const;

const TRUST_BRANDS = ["Google", "Coca-Cola", "Samsung", "Airbnb", "TikTok", "Shopify", "Amazon", "Meta"] as const;

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
  const contentScale = useTransform(scrollYProgress, [0, 0.58, 0.88], [1, 1, 0.965]);

  const primaryLabel = isLoggedIn
    ? (portalLabel ?? (locale === "zh" ? "品牌方门户" : "Brand portal"))
    : t.primary;
  const primaryHref = isLoggedIn ? portalHref : withLocale("/login?role=brand", locale);
  const secondaryLabel = t.secondary;
  const secondaryHref = withLocale("/login?role=creator", locale);
  const isEnglish = locale === "en";

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#050607] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-[62%_42%] bg-no-repeat opacity-[0.9]"
        style={{ backgroundImage: `url(${HERO_BG})` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,7,0.94)_0%,rgba(5,6,7,0.78)_34%,rgba(5,6,7,0.46)_66%,rgba(5,6,7,0.74)_100%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,7,0.1)_0%,rgba(5,6,7,0.34)_58%,#050607_100%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_68%_28%,rgba(188,198,214,0.12),transparent_34%),radial-gradient(circle_at_34%_40%,rgba(255,255,255,0.055),transparent_28%)]"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" aria-hidden />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-10 pt-24 sm:px-8 sm:pt-24 md:pt-28 lg:pb-14 lg:pt-20">
        <motion.div
          style={reduce ? undefined : { opacity: contentOpacity, y: contentY, scale: contentScale }}
          className="grid gap-9 md:gap-11 lg:min-h-[680px] lg:grid-cols-[minmax(0,1.08fr)_minmax(390px,0.92fr)] lg:items-center lg:gap-8 xl:min-h-[720px] xl:grid-cols-[minmax(0,0.94fr)_minmax(440px,1.06fr)] xl:gap-12"
        >
          <div className={cn("max-w-3xl", isEnglish ? "md:max-w-2xl lg:max-w-[38rem] xl:max-w-[42rem]" : undefined)}>
            <p className="inline-flex max-w-full items-start gap-2 rounded-md border border-white/12 bg-white/[0.06] px-3 py-1.5 text-[10px] font-medium leading-5 text-zinc-200 sm:items-center sm:px-3.5 sm:text-[11px]">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c7d1df] sm:mt-0" />
              <span className="min-w-0 text-wrap">{t.eyebrow}</span>
            </p>

            <h1
              className={cn(
                "mt-5 font-semibold sm:mt-6",
                isEnglish
                  ? "max-w-[8.8em] text-[clamp(2.7rem,10.2vw,3.8rem)] leading-[1.02] sm:max-w-[9.4em] sm:text-[clamp(3.2rem,6.4vw,4rem)] md:text-[clamp(3.4rem,5.6vw,4.25rem)] lg:text-[3.65rem] xl:text-[4.05rem]"
                  : "max-w-[11em] text-[clamp(2.55rem,12vw,4rem)] leading-[1.08] sm:max-w-[10.5em] sm:text-[clamp(3.25rem,8.2vw,4.8rem)] lg:text-[4rem] xl:text-[4.6rem]",
                isEnglish ? marketingHeadlineClassName("en") : "text-pretty"
              )}
            >
              <span className={cn("block text-white", locale === "zh" ? "whitespace-nowrap" : undefined)}>
                {t.titleLine1}
              </span>
              {isEnglish ? (
                <>
                  <span className="mt-3 block text-zinc-300 sm:mt-4">{t.titleHighlight}</span>
                  {t.titleLine2 ? <span className="mt-3 block text-zinc-300 sm:mt-4">{t.titleLine2}</span> : null}
                </>
              ) : (
                <span className="mt-2 block whitespace-nowrap text-zinc-300">
                  {t.titleHighlight}
                  {t.titleLine2 ? ` ${t.titleLine2}` : null}
                </span>
              )}
            </h1>

            <p
              className={cn(
                "mt-5 max-w-2xl text-[15px] leading-7 text-zinc-300 sm:mt-6 sm:text-base md:text-[17px] md:leading-8",
                isEnglish ? "md:max-w-xl lg:max-w-[36rem]" : undefined
              )}
            >
              {t.subtitle}
            </p>

            <div className="mt-7 grid grid-cols-2 gap-2 sm:mt-8 sm:flex sm:items-center sm:gap-3">
              <Link
                href={primaryHref}
                className="inline-flex h-12 min-w-0 items-center justify-center rounded-md bg-white px-3 text-[13px] font-semibold text-black shadow-[0_18px_48px_-20px_rgba(255,255,255,0.65)] transition duration-300 hover:-translate-y-0.5 hover:bg-zinc-200 hover:shadow-[0_24px_60px_-24px_rgba(255,255,255,0.85)] active:translate-y-0 active:scale-[0.98] sm:min-w-[150px] sm:px-7 sm:text-sm"
              >
                {primaryLabel}
              </Link>
              <Link
                href={secondaryHref}
                className="inline-flex h-12 min-w-0 items-center justify-center rounded-md border border-white/18 bg-white/[0.04] px-3 text-[13px] font-semibold text-white backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/10 active:translate-y-0 active:scale-[0.98] sm:min-w-[150px] sm:px-7 sm:text-sm"
              >
                {secondaryLabel}
              </Link>
            </div>

            <div className="mt-7 grid max-w-xl grid-cols-3 gap-2 border-y border-white/10 py-4 text-center sm:mt-8 sm:gap-3 sm:py-5 sm:text-left">
              <div className="rounded-md bg-black/15 px-2 py-3 sm:bg-transparent sm:px-0 sm:py-0">
                <p className="text-lg font-semibold text-white sm:text-xl">$8k</p>
                <p className="mt-1 text-[10px] leading-4 text-zinc-400 sm:text-xs sm:text-zinc-500">{locale === "zh" ? "起步制作预算" : "Starting production lane"}</p>
              </div>
              <div className="rounded-md bg-black/15 px-2 py-3 sm:bg-transparent sm:px-0 sm:py-0">
                <p className="text-lg font-semibold text-white sm:text-xl">72h</p>
                <p className="mt-1 text-[10px] leading-4 text-zinc-400 sm:text-xs sm:text-zinc-500">{locale === "zh" ? "首轮方案窗口" : "First concept window"}</p>
              </div>
              <div className="rounded-md bg-black/15 px-2 py-3 sm:bg-transparent sm:px-0 sm:py-0">
                <p className="text-lg font-semibold text-white sm:text-xl">4K</p>
                <p className="mt-1 text-[10px] leading-4 text-zinc-400 sm:text-xs sm:text-zinc-500">{locale === "zh" ? "交付与版权标准" : "Delivery and rights standard"}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-col items-center justify-center gap-2 text-center sm:mt-6 sm:flex-row sm:justify-start sm:gap-4 sm:text-left">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-3.5 w-3.5 fill-[#d0c19a] text-[#d0c19a]" />
                ))}
              </div>
              <p className="max-w-[18rem] text-xs leading-5 text-zinc-400 sm:max-w-none sm:text-zinc-500">{t.trusted}</p>
            </div>
          </div>

          <div className="relative hidden animate-studio-panel-float transition duration-500 hover:-translate-y-2 hover:scale-[1.01] md:block">
            <div className="overflow-hidden rounded-lg border border-white/12 bg-[#0b0d0f]/88 shadow-[0_32px_90px_-44px_rgba(0,0,0,0.95)] backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <p className="text-[11px] font-medium text-zinc-500">studioOS://campaign-control</p>
              </div>

              <div className="grid border-b border-white/10 lg:grid-cols-[1fr_220px]">
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    {BRIEF_TAGS[locale].map((tag) => (
                      <span key={tag} className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-zinc-300 transition duration-300 hover:border-white/25 hover:bg-white/[0.08] hover:text-white">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="mt-5 text-2xl font-semibold leading-tight text-white sm:text-3xl">
                    {locale === "zh" ? "Spring launch hero film" : "Spring launch hero film"}
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
                    {locale === "zh"
                      ? "品牌简报、创意方向、制作方匹配、审片进度与交付权限集中在同一个工作流"
                      : "Brief, creative direction, studio matching, review progress, and delivery permissions in one operating flow."}
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {PIPELINE.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.meta} className="group rounded-lg border border-white/10 bg-black/35 p-4 transition duration-300 hover:-translate-y-1 hover:border-[#d8d2c4]/35 hover:bg-white/[0.055]">
                          <div className="flex items-center justify-between gap-3">
                            <Icon className="h-4 w-4 text-[#d8d2c4] transition duration-300 group-hover:text-white" />
                            <span className="font-mono text-[10px] text-zinc-600 transition duration-300 group-hover:text-zinc-400">{item.meta}</span>
                          </div>
                          <p className="mt-4 text-sm font-medium text-white transition duration-300 group-hover:text-[#f4f0e7]">{item.label[locale]}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-white/10 p-5 lg:border-l lg:border-t-0">
                  <p className="text-[11px] uppercase text-zinc-500">{locale === "zh" ? "预算保护" : "Budget protection"}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#aeb9a6]/12 text-[#c0cab8]">
                      <CircleDollarSign className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xl font-semibold text-white">$12,400</p>
                      <p className="text-xs text-zinc-500">{locale === "zh" ? "托管中" : "held in escrow"}</p>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">{locale === "zh" ? "制作进度" : "Production progress"}</span>
                      <span className="text-zinc-300">68%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-[68%] rounded-full bg-[#c7d1df]" />
                    </div>
                  </div>
                  <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <Clock3 className="h-4 w-4 text-[#d0c19a]" />
                      {locale === "zh" ? "下一次里程碑" : "Next milestone"}
                    </div>
                    <p className="mt-2 text-sm font-medium text-white">
                      {locale === "zh" ? "首版审片交付" : "First cut review"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">18:30 UTC</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-px bg-white/10 sm:grid-cols-3">
                {[
                  [locale === "zh" ? "制作方评分" : "Studio quality", "4.9/5"],
                  [locale === "zh" ? "版本记录" : "Version history", "12"],
                  [locale === "zh" ? "权限资产" : "Rights assets", "Ready"]
                ].map(([label, value]) => (
                  <div key={label} className="bg-[#0b0d0f] px-5 py-4">
                    <p className="text-[11px] text-zinc-500">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 overflow-hidden border-y border-white/[0.08] py-5 sm:mt-6 sm:py-6">
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
                  className="text-base font-semibold tracking-tight text-zinc-500/80 grayscale transition hover:text-zinc-300 sm:text-lg"
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 w-full max-w-6xl sm:mt-6">
          <CinematicHeroFeatures locale={locale} />

          <div className="mt-6 sm:mt-7">
            <CinematicHeroStats locale={locale} />
          </div>
        </div>
      </div>
    </section>
  );
}
