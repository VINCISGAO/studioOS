import { PartnersPageView } from "@/components/marketing/partners/partners-page-view";
import { partnerProgramService } from "@/features/partner-program/partner-program.service";
import { marketingDocsMetadata } from "@/lib/marketing/marketing-docs-metadata";
import type { Metadata } from "next";

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return marketingDocsMetadata("zh", "resources");
}

export default async function ResourcesRoute() {
  const data = await partnerProgramService.getMarketingPageData();

  return (
    <PartnersPageView commissionTiers={data.commissionTiers} stats={data.stats} />
  );
}
