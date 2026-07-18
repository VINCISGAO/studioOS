"use client";

import {
  LandingGhostButton,
  LandingPrimaryButton
} from "@/components/marketing/landing/landing-ui";
import { landingText } from "@/lib/marketing/landing-copy";
import { marketingHomeHref } from "@/lib/marketing/localized-href";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { isChineseLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LandingCta({
  locale,
  copyLocale = locale
}: {
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
}) {
  const t = landingText("cta", copyLocale);
  const compactTitle = isChineseLanguage(copyLocale) || copyLocale === "ja" || copyLocale === "ko";

  return (
    <section id="cta" className="bg-[#050505] pb-12 pt-0 text-white sm:pb-20 sm:pt-2">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="marketing-home-cta-panel relative overflow-hidden rounded-2xl p-8 sm:rounded-[1.35rem] sm:p-12">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e8e0d0]/35 to-transparent" />
          <div className="relative grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="text-center sm:text-left">
              <h2
                className={cn(
                  "mx-auto max-w-2xl font-semibold leading-tight tracking-tight text-white sm:mx-0 lg:text-4xl",
                  compactTitle ? "text-[1.45rem] sm:text-[2.05rem]" : "text-[1.6rem] sm:text-[2.05rem]"
                )}
              >
                {t.title}
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:mx-0 sm:mt-4 sm:text-base sm:leading-7">
                {t.subtitle}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <LandingPrimaryButton href={marketingHomeHref.brand(copyLocale)} className="w-full sm:w-auto">
                {t.primary}
              </LandingPrimaryButton>
              <LandingGhostButton href={marketingHomeHref.contact(copyLocale)} className="w-full sm:w-auto">
                {t.secondary}
              </LandingGhostButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
