"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { cinematicText } from "@/lib/marketing/cinematic-copy";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { motion, useScroll, useTransform } from "framer-motion";

export function CinematicNav({ locale }: { locale: Locale }) {
  const t = cinematicText("nav", locale);
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 120], ["rgba(0,0,0,0)", "rgba(0,0,0,0.82)"]);
  const border = useTransform(scrollY, [0, 120], ["rgba(255,255,255,0)", "rgba(255,255,255,0.06)"]);

  return (
    <motion.header
      style={{ backgroundColor: bg, borderBottomColor: border }}
      className="fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl"
    >
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href={withLocale("/", locale)} className="flex items-center gap-2.5 text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">StudioOS</span>
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
          <Link href={withLocale("/resources", locale)} className="transition hover:text-white">
            {t.resources}
          </Link>
          <Link href={withLocale("/about", locale)} className="transition hover:text-white">
            {t.about}
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher locale={locale} tone="dark" />
          <Link
            href={withLocale("/login", locale)}
            className="inline-flex h-9 items-center rounded-lg border border-white/25 px-4 text-sm text-white transition hover:bg-white/10"
          >
            {t.login}
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
