import { MarketingDocsShell } from "@/components/marketing/docs/marketing-docs-shell";
import {
  PricingBudgetSection,
  PricingClosingSection,
  PricingHeroSection,
  PricingPrinciplesSection,
  PricingServiceFeeSection,
  PricingTrustSection
} from "@/components/marketing/pricing/pricing-sections";
import type { Locale } from "@/lib/i18n";

export function PricingPageView({ locale }: { locale: Locale }) {
  return (
    <MarketingDocsShell locale={locale} active="pricing">
      <PricingHeroSection locale={locale} />
      <PricingPrinciplesSection locale={locale} />
      <PricingServiceFeeSection locale={locale} />
      <PricingBudgetSection locale={locale} />
      <PricingTrustSection locale={locale} />
      <PricingClosingSection locale={locale} />
    </MarketingDocsShell>
  );
}
