"use client";

import { Lock, ShieldCheck, Unlock } from "lucide-react";
import { RevealSection } from "@/components/marketing/cinematic/motion-primitives";
import { MarketingEyebrowPill, marketingSectionTitleClassName } from "@/components/marketing/landing/landing-ui";
import { cinematicText } from "@/lib/marketing/cinematic-copy";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const icons = [Lock, ShieldCheck, Unlock];

export function CinematicEscrow({
  locale,
  copyLocale = locale
}: {
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
}) {
  const t = cinematicText("escrow", copyLocale);

  return (
    <section id="escrow" className="bg-[#050505] pb-4 pt-8 text-white sm:pb-6 sm:pt-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <RevealSection className="text-center">
          <MarketingEyebrowPill tone="dark">{t.chapter}</MarketingEyebrowPill>
          <h2 className={cn("mx-auto mt-4 max-w-2xl text-white", marketingSectionTitleClassName)}>{t.title}</h2>
        </RevealSection>

        <div className="mt-6 grid gap-3 md:grid-cols-3 md:gap-5 lg:mt-10">
          {t.items.map((item, index) => {
            const Icon = icons[index] ?? ShieldCheck;
            return (
              <article
                key={item.title}
                className="marketing-home-dark-card group relative flex items-center gap-3 overflow-hidden rounded-xl p-4 transition duration-300 hover:-translate-y-0.5"
              >
                <span
                  className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#e8e0d0]/0 to-transparent transition duration-500 group-hover:via-[#e8e0d0]/35"
                  aria-hidden
                />
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-[#e8e0d0] ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-0.5 group-hover:bg-white/[0.09]">
                  <Icon className="h-4 w-4" />
                </span>
                <h3 className="shrink-0 text-base font-semibold text-white transition duration-300 group-hover:text-zinc-100">
                  {item.title}
                </h3>
                <p className="min-w-0 truncate text-xs leading-5 text-zinc-400 transition duration-300 group-hover:text-zinc-300">
                  {item.desc}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
