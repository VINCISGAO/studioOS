import { MarketingDocsShell } from "@/components/marketing/docs/marketing-docs-shell";
import { FaqHeroSection } from "@/components/marketing/faq/faq-hero-section";
import { FaqPageView } from "@/components/marketing/faq/faq-page-view";
import type { MarketingLocale } from "@/lib/i18n";

export function FaqPage({ locale }: { locale: MarketingLocale }) {
  return (
    <MarketingDocsShell locale={locale} active="faq">
      <FaqHeroSection locale={locale} />
      <FaqPageView locale={locale} />
    </MarketingDocsShell>
  );
}
