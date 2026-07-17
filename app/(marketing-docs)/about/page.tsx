import { AboutPage } from "@/components/marketing/about/about-page";
import { buildAboutJsonLdGraph } from "@/lib/marketing/structured-data/about";
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
  return buildMarketingDocsRouteMetadata("about", "/about", searchParams);
}

export default async function AboutRoute({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await resolveMarketingDocsRouteLocale(searchParams);

  return (
    <>
      <JsonLdScript data={buildAboutJsonLdGraph(locale)} />
      <AboutPage locale={locale} />
    </>
  );
}
