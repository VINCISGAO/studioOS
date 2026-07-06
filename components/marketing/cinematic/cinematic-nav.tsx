"use client";

import Link from "next/link";
import { BrandLogoLockup } from "@/components/brand-logo-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { cinematicText } from "@/lib/marketing/cinematic-copy";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { motion, useScroll, useTransform } from "framer-motion";

export function CinematicNav({
  locale,
  portalHref,
  portalLabel
}: {
  locale: Locale;
  portalHref: string;
  portalLabel: string;
}) {
  const t = cinematicText("nav", locale);
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 120], ["rgba(0,0,0,0)", "rgba(0,0,0,0.82)"]);
  const border = useTransform(scrollY, [0, 120], ["rgba(255,255,255,0)", "rgba(255,255,255,0.06)"]);

  return (
    <motion.header
      style={{ backgroundColor: bg, borderBottomColor: border }}
      className="fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl"
    >
      <div className="relative mx-auto flex min-h-[4.25rem] max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:min-h-16 sm:px-8">
        <Link href={withLocale("/", locale)} className="flex min-w-0 items-center text-white">
          <BrandLogoLockup
            contrastOn="dark"
            className="gap-2.5 sm:gap-3"
            markClassName="h-6 w-6 rounded-md ring-1 ring-white/15 sm:h-9 sm:w-9 sm:rounded-xl"
            wordmarkClassName="h-[13px] w-[81px] sm:h-[21px] sm:w-[134px]"
            priority
          />
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 text-sm text-zinc-400 lg:flex">
          <a href="#how-it-works" className="transition hover:text-white">
            {t.process}
          </a>
          <Link href={withLocale("/case-studies", locale)} className="transition hover:text-white">
            {t.cases}
          </Link>
          <Link href={withLocale("/pricing", locale)} className="transition hover:text-white">
            {t.pricing}
          </Link>
          <a href="#network" className="transition hover:text-white">
            {t.resources}
          </a>
          <Link href={withLocale("/contact", locale)} className="transition hover:text-white">
            {t.about}
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <LanguageSwitcher locale={locale} tone="dark" />
          <Link
            href={portalHref}
            className="inline-flex h-9 items-center rounded-md border border-white/25 px-3 text-sm text-white transition hover:bg-white/10 sm:px-4"
          >
            {portalLabel || t.login}
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
