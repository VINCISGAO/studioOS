"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { cinematicText } from "@/lib/marketing/cinematic-copy";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform } from "framer-motion";

export function CinematicNav({ locale }: { locale: Locale }) {
  const t = cinematicText("nav", locale);
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 120], ["rgba(0,0,0,0.15)", "rgba(0,0,0,0.72)"]);

  return (
    <motion.header
      style={{ backgroundColor: bg }}
      className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href={withLocale("/", locale)} className="flex items-center gap-2.5 text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">StudioOS</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
          <a href="#process" className="transition hover:text-white">
            {t.process}
          </a>
          <Link href={withLocale("/case-studies", locale)} className="transition hover:text-white">
            {t.cases}
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher locale={locale} tone="dark" />
          <Link
            href={withLocale("/login", locale)}
            className="hidden text-sm text-zinc-300 transition hover:text-white sm:inline"
          >
            {t.login}
          </Link>
          <Link
            href={withLocale("/login?role=brand", locale)}
            className={cn(
              "rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition",
              "hover:bg-zinc-100 sm:text-sm"
            )}
          >
            {t.start}
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
