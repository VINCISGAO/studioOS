"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Menu, Play, Sparkles, Star } from "lucide-react";
import { HomeHeroProductPreview } from "@/components/marketing/home-hero-product-preview";
import { WorkCoverImage } from "@/components/creator/work-cover-image";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  MaskRevealLine,
  RevealSection,
  cinematicEase
} from "@/components/marketing/landing/landing-motion";
import { HOME_HERO_STUDIO_SRC } from "@/lib/hero-studio";
import { landingText } from "@/lib/marketing/landing-copy";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LandingHero({
  locale,
  showreelPoster,
  isLoggedIn = false,
  portalHref
}: {
  locale: Locale;
  showreelPoster?: string | null;
  isLoggedIn?: boolean;
  portalHref?: string;
}) {
  const t = landingText("hero", locale);
  const reduce = useReducedMotion();
  const workspaceHref = portalHref ?? withLocale("/login", locale);
  const workspaceLabel = locale === "zh" ? "进入工作台" : "Go to workspace";

  return (
    <section className="landing-film-grain relative min-h-[100svh] overflow-hidden bg-black text-white">
      <motion.img
        src={HOME_HERO_STUDIO_SRC}
        alt=""
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover object-[center_35%]"
        initial={reduce ? false : { scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2, ease: cinematicEase }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/60" />
      <div className="pointer-events-none absolute -right-32 top-1/4 h-[480px] w-[480px] rounded-full bg-violet-600/10 blur-[120px] animate-hero-orb" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-4 pb-16 pt-24 sm:px-6 lg:grid lg:min-h-[100svh] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-12 lg:px-8 lg:pb-20 lg:pt-28">
        <RevealSection className="max-w-xl lg:max-w-none">
          <p className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
            <Sparkles className="h-3.5 w-3.5" />
            {t.eyebrow}
          </p>

          <h1 className="mt-7 text-[2.75rem] font-semibold leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.25rem] xl:text-6xl">
            <MaskRevealLine>{t.titleLine1}</MaskRevealLine>
            <span className="mt-1 block overflow-hidden sm:mt-2">
              <motion.span
                variants={{
                  hidden: { opacity: 0, y: "100%" },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.95, ease: cinematicEase, delay: 0.1 } }
                }}
                className="block"
              >
                <span className="font-serif italic text-[#C5A880]">{t.titleHighlight}</span>{" "}
                {t.titleLine2}
              </motion.span>
            </span>
          </h1>

          <motion.p
            variants={{
              hidden: { opacity: 0, y: 18 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: cinematicEase, delay: 0.18 } }
            }}
            className="mt-6 max-w-lg text-base leading-7 text-zinc-300 sm:text-lg"
          >
            {t.subtitle}
          </motion.p>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 18 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: cinematicEase, delay: 0.26 } }
            }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Link
              href={isLoggedIn ? workspaceHref : withLocale("/login?role=brand", locale)}
              className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-black shadow-[0_0_40px_-8px_rgba(255,255,255,0.5)] transition hover:bg-zinc-100"
            >
              {isLoggedIn ? workspaceLabel : t.primary}
            </Link>
            {isLoggedIn ? null : (
            <Link
              href={withLocale("/login?role=creator", locale)}
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 bg-white/5 px-8 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              {t.secondary}
            </Link>
            )}
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { delay: 0.34 } }
            }}
            className="mt-10 flex flex-wrap items-center gap-5"
          >
            <div className="flex -space-x-2.5">
              {["A", "B", "C", "D", "E"].map((initial, i) => (
                <span
                  key={initial}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 border-black text-xs font-medium shadow-lg",
                    i % 2 === 0 ? "bg-zinc-700 text-zinc-200" : "bg-zinc-600 text-zinc-100"
                  )}
                >
                  {initial}
                </span>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mt-1 text-xs text-zinc-400">{t.trusted}</p>
            </div>
          </motion.div>
        </RevealSection>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.1, ease: cinematicEase, delay: 0.2 }}
          className="relative mt-14 lg:mt-0"
        >
          <div className="absolute -inset-4 rounded-[28px] bg-gradient-to-br from-violet-500/20 via-transparent to-amber-500/10 blur-2xl" />

          <div className="relative space-y-4">
            <div className="hero-shimmer-border overflow-hidden rounded-2xl border border-white/15 shadow-[0_32px_80px_-24px_rgba(0,0,0,0.9)]">
              <div className="relative aspect-[16/10] bg-zinc-950">
                {showreelPoster ? (
                  <WorkCoverImage src={showreelPoster} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-950 to-black" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <button
                    type="button"
                    className="flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur transition hover:scale-105 hover:bg-white/20"
                    aria-label={t.showreel}
                  >
                    <Play className="ml-0.5 h-7 w-7 fill-white text-white" />
                  </button>
                  <span className="rounded-full border border-white/20 bg-black/50 px-3 py-1 text-xs font-medium text-zinc-200 backdrop-blur">
                    {t.showreel}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] text-zinc-400">
                  <span className="font-mono">00:00 / 01:24</span>
                  <span className="rounded bg-white/10 px-1.5 py-0.5">4K</span>
                </div>
              </div>
            </div>

            <div className="hidden sm:block lg:-mr-6 lg:translate-y-2">
              <HomeHeroProductPreview locale={locale} />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function LandingHeaderNav({
  locale,
  isLoggedIn = false,
  portalHref,
  portalLabel
}: {
  locale: Locale;
  isLoggedIn?: boolean;
  portalHref?: string;
  portalLabel?: string;
}) {
  const t = landingText("nav", locale);
  const [scrolled, setScrolled] = useState(false);
  const workspaceHref = portalHref ?? withLocale("/login", locale);
  const workspaceLabel = portalLabel ?? t.login;

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 16);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#how-it-works", label: t.howItWorks },
    {
      href: isLoggedIn ? "/brand" : "/login?role=brand",
      label: t.forBrands
    },
    {
      href: isLoggedIn ? "/studio/profile" : "/login?role=creator",
      label: t.forCreators
    },
    { href: "/case-studies", label: t.caseStudies },
    { href: "/pricing", label: t.pricing }
  ];

  return (
    <header
      className={cn(
        "absolute inset-x-0 top-0 z-50 border-b transition-all duration-500",
        scrolled
          ? "fixed border-white/10 bg-black/75 backdrop-blur-xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.8)]"
          : "border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={withLocale("/", locale)} className="flex items-center gap-2 font-semibold text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black">
            <Sparkles className="h-4 w-4" />
          </span>
          StudioOS
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-zinc-300 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href.startsWith("#") ? link.href : withLocale(link.href, locale)}
              className="transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher locale={locale} tone="dark" />
          <Link
            href={workspaceHref}
            className={cn(
              "hidden text-sm transition sm:inline",
              isLoggedIn
                ? "rounded-full border border-white/20 bg-white/10 px-4 py-2 font-medium text-white hover:bg-white/15"
                : "text-zinc-300 hover:text-white"
            )}
          >
            {workspaceLabel}
          </Link>
          <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-zinc-300 lg:hidden" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
