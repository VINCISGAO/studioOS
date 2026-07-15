"use client";

import {
  PartnersBenefitsSection,
  PartnersCommissionSection,
  PartnersFaqSection,
  PartnersHeroSection,
  PartnersStepsSection
} from "@/components/marketing/partners/partners-sections";
import type { PartnerCommissionTier } from "@/features/partner-program/partner-program.constants";
import { useMarketingPageLocale } from "@/hooks/use-marketing-page-locale";

type PartnerMarketingStats = {
  activePartners: number;
  totalPaidCommission: number;
  referredCustomers: number;
  satisfactionRate: number;
};

export function PartnersPageView({
  commissionTiers,
  stats
}: {
  commissionTiers: PartnerCommissionTier[];
  stats: PartnerMarketingStats;
}) {
  const locale = useMarketingPageLocale();

  return (
    <>
      <PartnersHeroSection locale={locale} />
      <PartnersBenefitsSection locale={locale} />
      <PartnersStepsSection locale={locale} />
      <PartnersCommissionSection locale={locale} tiers={commissionTiers} stats={stats} />
      <PartnersFaqSection locale={locale} />
    </>
  );
}
