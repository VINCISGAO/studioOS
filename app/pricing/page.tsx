import { MarketingDocsShell } from "@/components/marketing/docs/marketing-docs-shell";
import {
  PricingBudgetSection,
  PricingClosingSection,
  PricingHeroSection,
  PricingPrinciplesSection,
  PricingServiceFeeSection,
  PricingTrustSection
} from "@/components/marketing/pricing/pricing-sections";
import { getLocale, type SearchParams } from "@/lib/i18n";

export const revalidate = 3600;

export default async function PricingPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);

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
