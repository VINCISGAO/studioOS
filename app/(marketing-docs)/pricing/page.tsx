import { PricingPageView } from "@/components/marketing/pricing/pricing-page";
import { JsonLdScript } from "@/lib/marketing/structured-data/json-ld-script";
import { buildPricingJsonLdGraph } from "@/lib/marketing/structured-data/pricing";
import {
  buildMarketingDocsRouteMetadata,
  resolveMarketingDocsRouteLocale
} from "@/lib/marketing/i18n/marketing-docs-route";
import type { SearchParams } from "@/lib/i18n";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  return buildMarketingDocsRouteMetadata("pricing", "/pricing", searchParams);
}

export default async function PricingRoute({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await resolveMarketingDocsRouteLocale(searchParams);

  return (
    <>
      <JsonLdScript data={buildPricingJsonLdGraph(locale)} />
      <PricingPageView locale={locale} />
    </>
  );
}
