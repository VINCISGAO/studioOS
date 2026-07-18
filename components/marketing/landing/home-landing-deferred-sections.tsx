"use client";

import dynamic from "next/dynamic";
import { landingText } from "@/lib/marketing/landing-copy";
import { asMarketingLocale } from "@/lib/marketing/i18n/resolve-marketing-copy";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import type { MarketingShowcaseWorkDto } from "@/features/marketing-showcase/marketing-showcase.types";

const LandingHowItWorks = dynamic(
  () =>
    import("@/components/marketing/landing/landing-how-it-works").then((m) => ({
      default: m.LandingHowItWorks
    })),
  { ssr: true }
);

const LandingCostComparison = dynamic(
  () =>
    import("@/components/marketing/landing/landing-cost-comparison").then((m) => ({
      default: m.LandingCostComparison
    })),
  { ssr: true }
);

const LandingAiCompanionVideoSlot = dynamic(
  () =>
    import("@/components/marketing/landing/landing-ai-companion-video-slot").then((m) => ({
      default: m.LandingAiCompanionVideoSlot
    })),
  { ssr: true }
);

const LandingRecentWork = dynamic(
  () =>
    import("@/components/marketing/landing/landing-recent-work").then((m) => ({
      default: m.LandingRecentWork
    })),
  { ssr: true }
);

const CinematicEscrow = dynamic(
  () =>
    import("@/components/marketing/cinematic/cinematic-escrow").then((m) => ({
      default: m.CinematicEscrow
    })),
  { ssr: true }
);

const LandingCta = dynamic(
  () =>
    import("@/components/marketing/landing/landing-sections").then((m) => ({
      default: m.LandingCta
    })),
  { ssr: true }
);

export function HomeLandingHowItWorksSection({
  locale,
  copyLocale
}: {
  locale: Locale;
  copyLocale: Locale | MarketingLocale;
}) {
  return <LandingHowItWorks locale={locale} copyLocale={copyLocale} tone="light" />;
}

export function HomeLandingCostSection({
  locale,
  copyLocale
}: {
  locale: Locale;
  copyLocale: Locale | MarketingLocale;
}) {
  return <LandingCostComparison locale={locale} copyLocale={copyLocale} />;
}

export function HomeLandingCompanionSection({
  copyLocale,
  companionVideoSrc = ""
}: {
  copyLocale: Locale | MarketingLocale;
  companionVideoSrc?: string;
}) {
  const t = landingText("aiCompanion", copyLocale);
  const marketingLocale = asMarketingLocale(String(copyLocale));

  return (
    <LandingAiCompanionVideoSlot
      locale={marketingLocale}
      videoSrc={companionVideoSrc}
      placeholderLabel={t.videoPlaceholder}
      sectionTitle={t.title}
      tone="dark"
    />
  );
}

export function HomeLandingWorkSection({
  locale,
  copyLocale,
  works
}: {
  locale: Locale;
  copyLocale: Locale | MarketingLocale;
  works: MarketingShowcaseWorkDto[];
}) {
  return <LandingRecentWork locale={locale} copyLocale={copyLocale} works={works} />;
}

export function HomeLandingEscrowSection({
  locale,
  copyLocale
}: {
  locale: Locale;
  copyLocale: Locale | MarketingLocale;
}) {
  return (
    <>
      <CinematicEscrow locale={locale} copyLocale={copyLocale} />
      <LandingCta locale={locale} copyLocale={copyLocale} />
    </>
  );
}
