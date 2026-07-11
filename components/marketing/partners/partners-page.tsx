import { MarketingDocsShell } from "@/components/marketing/docs/marketing-docs-shell";
import {
  PartnersBenefitsSection,
  PartnersCommissionSection,
  PartnersFaqSection,
  PartnersHeroSection,
  PartnersStepsSection
} from "@/components/marketing/partners/partners-sections";
import { partnerProgramService } from "@/features/partner-program/partner-program.service";
import type { Locale } from "@/lib/i18n";

export async function PartnersPage({ locale }: { locale: Locale }) {
  const data = await partnerProgramService.getMarketingPageData();

  return (
    <MarketingDocsShell locale={locale} active="resources">
      <PartnersHeroSection locale={locale} />
      <PartnersBenefitsSection locale={locale} />
      <PartnersStepsSection locale={locale} />
      <PartnersCommissionSection locale={locale} tiers={data.commissionTiers} stats={data.stats} />
      <PartnersFaqSection locale={locale} />
    </MarketingDocsShell>
  );
}
