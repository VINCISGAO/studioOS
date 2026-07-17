import { FaqPage } from "@/components/marketing/faq/faq-page";
import { buildMarketingFaqJsonLdGraph } from "@/lib/marketing/structured-data/faq-page";
import { JsonLdScript } from "@/lib/marketing/structured-data/json-ld-script";
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
  return buildMarketingDocsRouteMetadata("faq", "/faq", searchParams);
}

export default async function FaqRoute({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await resolveMarketingDocsRouteLocale(searchParams);

  return (
    <>
      <JsonLdScript data={buildMarketingFaqJsonLdGraph(locale)} />
      <FaqPage locale={locale} />
    </>
  );
}
