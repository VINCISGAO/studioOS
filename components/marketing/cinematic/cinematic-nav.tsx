"use client";

import Link from "next/link";
import { Layers3 } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { cinematicText } from "@/lib/marketing/cinematic-copy";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { motion, useScroll, useTransform } from "framer-motion";

export function CinematicNav({
  locale,
  workspaceCta
}: {
  locale: Locale;
  workspaceCta?: { href: string; label: string } | null;
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
      <div className="relative mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
        <Link href={withLocale("/", locale)} className="flex min-w-0 items-center gap-2.5 text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-black">
            <Layers3 className="h-4 w-4" />
          </span>
          <span className="truncate text-sm font-semibold tracking-tight sm:text-base">StudioOS</span>
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
          {workspaceCta ? (
            <Link
              href={workspaceCta.href}
              className="inline-flex h-9 items-center rounded-md border border-white/25 bg-white px-3 text-sm font-medium text-black transition hover:bg-zinc-100 sm:px-4"
            >
              {workspaceCta.label}
            </Link>
          ) : (
            <Link
              href={withLocale("/login", locale)}
              className="inline-flex h-9 items-center rounded-md border border-white/25 px-3 text-sm text-white transition hover:bg-white/10 sm:px-4"
            >
              {t.login}
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
}
