import { MarketingDocsShell } from "@/components/marketing/docs/marketing-docs-shell";
import {
  AboutClosingSection,
  AboutContactPressSection
} from "@/components/marketing/about/about-sections-footer";
import {
  AboutHeroSection,
  AboutPlatformSection,
  AboutStatsSection,
  AboutStorySection
} from "@/components/marketing/about/about-sections";
import type { MarketingLocale } from "@/lib/i18n";

export function AboutPage({ locale }: { locale: MarketingLocale }) {
  return (
    <MarketingDocsShell locale={locale} active="about">
      <AboutHeroSection locale={locale} />
      <AboutStorySection locale={locale} />
      <AboutPlatformSection locale={locale} />
      <AboutStatsSection locale={locale} />
      <AboutContactPressSection locale={locale} />
      <AboutClosingSection locale={locale} />
    </MarketingDocsShell>
  );
}
