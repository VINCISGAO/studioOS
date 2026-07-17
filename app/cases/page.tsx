import { CasesPageClient } from "@/components/marketing/cases/cases-page-client";
import { marketingShowcaseService } from "@/features/marketing-showcase/marketing-showcase.service";
import { buildPortfolioJsonLdGraph } from "@/lib/marketing/structured-data/portfolio";
import { JsonLdScript } from "@/lib/marketing/structured-data/json-ld-script";
import { marketingSeoMetadata } from "@/lib/marketing/marketing-seo-metadata";
import type { Metadata } from "next";

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return marketingSeoMetadata("zh", "cases", "/cases");
}

export default async function CasesPage() {
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
