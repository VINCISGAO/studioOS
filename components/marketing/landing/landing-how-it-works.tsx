"use client";

import { Clapperboard, FileText, Focus, Play, Users } from "lucide-react";
import {
  MarketingEyebrowPill,
  MarketingSectionTitle
} from "@/components/marketing/landing/landing-ui";
import { landingText } from "@/lib/marketing/landing-copy";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const stepIcons = [Focus, Users, Clapperboard, Play];

export function LandingHowItWorks({
  locale,
  copyLocale = locale,
  tone = "light"
}: {
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
  tone?: "dark" | "light";
}) {
  const t = landingText("steps", copyLocale);
  const dark = tone === "dark";

  return (
    <section
      id="how-it-works"
      className={cn(
        dark
          ? "pb-6 pt-2 text-white sm:pb-8 sm:pt-4 lg:pb-10 lg:pt-6"
          : "bg-white pb-6 pt-4 text-zinc-950 sm:pb-8 sm:pt-6 lg:pb-10 lg:pt-8"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <MarketingEyebrowPill tone={dark ? "dark" : "light"}>{t.eyebrow}</MarketingEyebrowPill>
          <MarketingSectionTitle tone={dark ? "dark" : "light"} className="mx-auto mt-4 max-w-4xl">
            {t.title}
          </MarketingSectionTitle>
          {t.subtitle ? (
            <p
              className={cn(
                "mx-auto mt-3 max-w-2xl text-sm leading-6 sm:text-base",
                dark ? "text-zinc-400" : "text-zinc-500"
              )}
            >
              {t.subtitle}
            </p>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {t.items.map((item, index) => {
            const Icon = stepIcons[index] ?? FileText;
            return (
              <article
                key={item.num}
                className={cn(
                  "group relative flex items-center gap-3 overflow-hidden rounded-xl p-4 transition duration-300 hover:-translate-y-0.5",
                  dark ? "marketing-home-dark-card" : "marketing-home-light-card"
                )}
              >
                <div
                  className={cn(
                    "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                    dark
                      ? "bg-white/[0.06] text-[#e8e0d0] ring-1 ring-white/10"
                      : "bg-[#f3f0ea] text-[#8a7f68] ring-1 ring-[#e8e0d0]/60"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <p className="relative shrink-0 font-mono text-[11px] text-zinc-500">{item.num}</p>
                <h3
                  className={cn(
                    "relative shrink-0 text-base font-semibold tracking-tight",
                    dark ? "text-white" : "text-zinc-950"
                  )}
                >
                  {item.title}
                </h3>
                <p
                  className={cn(
                    "relative min-w-0 truncate text-xs leading-5",
                    dark ? "text-zinc-400" : "text-zinc-500"
                  )}
                >
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
