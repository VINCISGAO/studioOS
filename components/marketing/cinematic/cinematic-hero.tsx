"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  FolderKanban,
  Layers3,
  ShieldCheck,
  Star
} from "lucide-react";
import { CinematicHeroFeatures } from "@/components/marketing/cinematic/cinematic-hero-features";
import { landingText } from "@/lib/marketing/landing-copy";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { marketingHeadlineClassName } from "@/lib/studioos/marketing-headline-font";
import { cn } from "@/lib/utils";

/** Static public asset — avoids Next/Image + missing API bg breaking the page. */
const HERO_BG = "/images/home-hero-space.png";

const TRUST_BRANDS = ["Google", "Coca-Cola", "Samsung", "Airbnb", "TikTok", "Shopify", "Amazon", "Meta"] as const;
const PANEL_STEPS = [
  { label: { en: "Brief confirmed", zh: "简报确认" }, meta: "01", icon: FileCheck2 },
  { label: { en: "Studio matched", zh: "匹配Studio" }, meta: "02", icon: Layers3 },
  { label: { en: "Escrow funded", zh: "资金托管" }, meta: "03", icon: ShieldCheck },
  { label: { en: "In review", zh: "审核中" }, meta: "04", icon: CheckCircle2 }
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
  const contentScale = useTransform(scrollYProgress, [0, 0.58, 0.88], [1, 1, 0.965]);

  const primaryLabel = isLoggedIn
    ? (portalLabel ?? (locale === "zh" ? "品牌方门户" : "Brand portal"))
    : t.primary;
  const primaryHref = isLoggedIn ? portalHref : withLocale("/login?role=brand", locale);
  const secondaryLabel = t.secondary;
  const secondaryHref = withLocale("/login?role=creator", locale);
  const isEnglish = locale === "en";
  const primaryDescription = locale === "zh"
    ? "匹配优质创作者"
    : "Match with vetted AI Studios";
  const secondaryDescription = locale === "zh"
    ? "入驻获取全球订单"
    : "Join to get global orders";

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
          <div className={cn("max-w-3xl", isEnglish ? "md:max-w-2xl lg:max-w-[42rem] xl:max-w-[46rem]" : undefined)}>
            <p className="inline-flex max-w-full items-start gap-2 rounded-md border border-white/12 bg-white/[0.06] px-3 py-1.5 text-[10px] font-medium leading-5 text-zinc-200 sm:items-center sm:px-3.5 sm:text-[11px]">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c7d1df] sm:mt-0" />
              <span className="min-w-0 text-wrap">{t.eyebrow}</span>
            </p>

            <h1
              className={cn(
                "mt-5 font-semibold sm:mt-6",
                isEnglish
                  ? "max-w-[14em] text-[clamp(1.85rem,6.2vw,2.35rem)] leading-[1.08] sm:text-[clamp(2.05rem,4vw,2.5rem)] md:text-[2.5rem] lg:text-[2.5rem] xl:text-[2.5rem]"
                  : "max-w-[8.8em] text-[clamp(2.35rem,10vw,3.35rem)] leading-[1.03] sm:max-w-[9.2em] sm:text-[clamp(2.8rem,6vw,3.65rem)] lg:text-[3.25rem] xl:text-[3.55rem]",
                isEnglish ? marketingHeadlineClassName("en") : "text-pretty"
              )}
            >
              <span className={cn("block text-white", locale === "zh" || isEnglish ? "whitespace-nowrap" : undefined)}>
                {t.titleLine1}
              </span>
              {isEnglish && (t.titleHighlight || t.titleLine2) ? (
                <>
                  <span className="mt-3 block whitespace-nowrap text-white sm:mt-4">{t.titleHighlight}</span>
                  {t.titleLine2 ? <span className="mt-3 block text-zinc-300 sm:mt-4">{t.titleLine2}</span> : null}
                </>
              ) : t.titleHighlight || t.titleLine2 ? (
                <span className="mt-2 block whitespace-nowrap text-zinc-300">
                  {t.titleHighlight}
                  {t.titleLine2 ? ` ${t.titleLine2}` : null}
                </span>
              ) : null}
            </h1>

            <p
              className={cn(
                "mt-5 max-w-2xl whitespace-pre-line text-[15px] leading-7 text-zinc-300 sm:mt-6 sm:text-base md:text-[17px] md:leading-8",
                isEnglish ? "md:max-w-xl lg:max-w-[36rem]" : undefined
              )}
            >
              {t.subtitle}
            </p>

            <div className="mt-7 grid max-w-xl grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2">
              <Link
                href={primaryHref}
                className="group flex min-h-[78px] items-center justify-between gap-4 rounded-lg border border-white bg-white px-5 py-4 text-left text-black shadow-[0_24px_64px_-28px_rgba(255,255,255,0.75)] transition duration-300 hover:-translate-y-0.5 hover:bg-zinc-100 hover:shadow-[0_30px_70px_-30px_rgba(255,255,255,0.9)] active:translate-y-0 active:scale-[0.985]"
              >
                <span className="min-w-0">
                  <span className="block text-[18px] font-semibold leading-6">{primaryLabel}</span>
                  <span className="mt-1 block text-[13px] font-medium leading-5 text-zinc-500">{primaryDescription}</span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 transition duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href={secondaryHref}
                className="group flex min-h-[78px] items-center justify-between gap-4 rounded-lg border border-white/28 bg-white/[0.035] px-5 py-4 text-left text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-white/45 hover:bg-white/[0.075] active:translate-y-0 active:scale-[0.985]"
              >
                <span className="min-w-0">
                  <span className="block text-[18px] font-semibold leading-6">{secondaryLabel}</span>
                  <span className="mt-1 block text-[13px] font-medium leading-5 text-zinc-400">{secondaryDescription}</span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 transition duration-300 group-hover:translate-x-1" />
              </Link>
              </div>

            <div className="mt-7 grid max-w-xl grid-cols-3 gap-2 border-y border-white/10 py-4 text-center sm:mt-8 sm:gap-3 sm:py-5 sm:text-left">
              <div className="rounded-md bg-black/15 px-2 py-3 sm:bg-transparent sm:px-0 sm:py-0">
                <p className="text-lg font-semibold text-white sm:text-xl">$200+</p>
                <p className="mt-1 text-[10px] leading-4 text-zinc-400 sm:text-xs sm:text-zinc-500">{locale === "zh" ? "起步制作预算" : "Starting production budget"}</p>
              </div>
              <div className="rounded-md bg-black/15 px-2 py-3 sm:bg-transparent sm:px-0 sm:py-0">
                <p className="text-lg font-semibold text-white sm:text-xl">72h</p>
                <p className="mt-1 text-[10px] leading-4 text-zinc-400 sm:text-xs sm:text-zinc-500">{locale === "zh" ? "首轮方案窗口" : "First concept window"}</p>
              </div>
              <div className="rounded-md bg-black/15 px-2 py-3 sm:bg-transparent sm:px-0 sm:py-0">
                <p className="text-lg font-semibold text-white sm:text-xl">1080P/4K</p>
                <p className="mt-1 text-[10px] leading-4 text-zinc-400 sm:text-xs sm:text-zinc-500">{locale === "zh" ? "交付与版权标准" : "Delivery and rights standard"}</p>
              </div>
            </div>

          </div>

          <div className="relative hidden animate-studio-panel-float transition duration-500 hover:-translate-y-2 hover:scale-[1.01] md:block">
            <div className="relative overflow-hidden rounded-lg border border-white/12 bg-[#070809]/92 shadow-[0_34px_100px_-42px_rgba(0,0,0,0.98),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(64,88,132,0.22),transparent_36%)]" />

              <div className="relative flex h-12 items-center justify-between border-b border-white/10 px-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <p className="truncate text-[13px] font-medium text-zinc-500">
                    studioOS://campaign-control
                  </p>
                </div>
                <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                  {locale === "zh" ? "审核中" : "In review"}
                </span>
              </div>

              <div className="relative grid min-h-[430px] grid-cols-[172px_minmax(0,1fr)] xl:min-h-[470px] xl:grid-cols-[192px_minmax(0,1fr)]">
                <aside className="border-r border-white/10 p-4 xl:p-5">
                  <p className="text-[11px] font-medium text-zinc-600">
                    {locale === "zh" ? "制作流程" : "Production flow"}
                  </p>
                  <div className="mt-5 space-y-2">
                    {PANEL_STEPS.map((step, index) => {
                      const Icon = step.icon;
                      return (
                        <div
                          key={step.meta}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-3 text-[13px] font-medium",
                            index === 3 ? "bg-white/[0.11] text-zinc-100" : "text-zinc-500"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                          <span className="min-w-0 truncate">{step.label[locale]}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-10 rounded-lg border border-white/10 bg-white/[0.025] p-4">
                    <div className="flex items-center gap-2 text-[12px] font-medium text-emerald-300">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      <span>{locale === "zh" ? "当前状态" : "Current status"}</span>
                    </div>
                    <p className="mt-4 text-[22px] font-semibold leading-none text-white">
                      {locale === "zh" ? "进行中" : "In progress"}
                    </p>
                  </div>
                </aside>

                <div className="p-5 xl:p-6">
                  <div className="grid grid-cols-4 gap-3">
                    {PANEL_STEPS.map((step, index) => {
                      const Icon = step.icon;
                      return (
                        <div key={step.meta} className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-4 text-center">
                          <p className="font-mono text-[11px] leading-none text-zinc-500">{step.meta}</p>
                          <span
                            className={cn(
                              "mx-auto mt-3 flex h-10 w-10 items-center justify-center rounded-full border",
                              index === 3
                                ? "border-white/24 bg-white/[0.09] text-white"
                                : "border-white/14 bg-black/18 text-zinc-300"
                            )}
                          >
                            <Icon className="h-[17px] w-[17px]" strokeWidth={1.7} />
                          </span>
                          <p className="mt-3 whitespace-nowrap text-[12px] font-semibold text-zinc-200 xl:text-[13px]">
                            {step.label[locale]}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4 xl:p-5">
                      <p className="text-[12px] font-medium text-zinc-500">{locale === "zh" ? "制作进度" : "Production progress"}</p>
                      <p className="mt-3 text-2xl font-semibold leading-none text-white">68%</p>
                      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-[68%] rounded-full bg-white" />
                      </div>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4 xl:p-5">
                      <p className="text-[12px] font-medium text-zinc-500">{locale === "zh" ? "预算保护" : "Budget protection"}</p>
                      <div className="mt-4 flex items-center gap-3">
                        <CircleDollarSign className="h-5 w-5 text-zinc-500" strokeWidth={1.7} />
                        <p className="text-2xl font-semibold leading-none text-white">$200</p>
                      </div>
                      <p className="mt-4 text-[13px] font-medium text-zinc-500">{locale === "zh" ? "托管中" : "held in escrow"}</p>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4 xl:p-5">
                      <p className="text-[12px] font-medium text-zinc-500">{locale === "zh" ? "下一里程碑" : "Next milestone"}</p>
                      <div className="mt-4 flex items-start gap-3">
                        <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#d0c19a]" strokeWidth={1.7} />
                        <p className="text-[15px] font-semibold leading-6 text-white">
                          {locale === "zh" ? "首版审片交付" : "First cut review"}
                        </p>
                      </div>
                      <p className="mt-3 text-[13px] font-medium text-zinc-500">18:30 UTC</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-4">
                    {[
                      {
                        label: locale === "zh" ? "制作方评分" : "Studio quality",
                        value: "4.9 / 5",
                        suffix: <Star className="h-4 w-4 fill-zinc-500 text-zinc-500" />
                      },
                      {
                        label: locale === "zh" ? "已完成项目" : "Completed projects",
                        value: "12"
                      },
                      {
                        label: locale === "zh" ? "平均交付周期" : "Average delivery",
                        value: locale === "zh" ? "7.2 天" : "7.2 days"
                      },
                      {
                        label: locale === "zh" ? "当前状态" : "Current status",
                        value: locale === "zh" ? "进行中" : "In progress",
                        prefix: <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      }
                    ].map((item) => (
                      <div key={item.label} className="bg-[#0a0b0e]/92 px-4 py-4 xl:px-5 xl:py-5">
                        <p className="text-[12px] font-medium text-zinc-500">{item.label}</p>
                        <div className="mt-4 flex items-center gap-2">
                          {"prefix" in item ? item.prefix : null}
                          <p className="text-base font-semibold text-white xl:text-lg">{item.value}</p>
                          {"suffix" in item ? item.suffix : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative flex items-center justify-between border-t border-white/10 px-5 py-4 xl:px-6">
                <p className="text-[12px] font-medium text-zinc-600">
                  {locale === "zh" ? "基于 StudioOS 制作控制台" : "Based on the StudioOS production console"}
                </p>
                <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-zinc-300">
                  {locale === "zh" ? "查看制作控制台" : "View production console"}
                  <ArrowRight className="h-4 w-4" />
                </span>
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
        </div>
      </div>
    </section>
  );
}
