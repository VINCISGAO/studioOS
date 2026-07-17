import { CasesPageClient } from "@/components/marketing/cases/cases-page-client";
import { marketingShowcaseService } from "@/features/marketing-showcase/marketing-showcase.service";
import { buildPortfolioJsonLdGraph } from "@/lib/marketing/structured-data/portfolio";
import { JsonLdScript } from "@/lib/marketing/structured-data/json-ld-script";
import { getMarketingPageLocale } from "@/lib/marketing/i18n/marketing-page-locale";
import { marketingSeoMetadata } from "@/lib/marketing/marketing-seo-metadata";
import type { SearchParams } from "@/lib/i18n";
import type { Metadata } from "next";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const locale = await getMarketingPageLocale(await searchParams);
  return marketingSeoMetadata(locale, "cases", "/cases");
}

export default async function CasesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [works, categories] = await Promise.all([
    marketingShowcaseService.listPublished(),
    marketingShowcaseService.listCategories()
  ]);

  return (
    <>
      <JsonLdScript data={buildPortfolioJsonLdGraph(works)} />
      <CasesPageClient works={works} categories={categories} />
    </>
  );
}
