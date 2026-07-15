import { CasesPageClient } from "@/components/marketing/cases/cases-page-client";
import { marketingShowcaseService } from "@/features/marketing-showcase/marketing-showcase.service";
import { marketingDocsMetadata } from "@/lib/marketing/marketing-docs-metadata";
import type { Metadata } from "next";

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return marketingDocsMetadata("zh", "cases");
}

export default async function CasesPage() {
  const [works, categories] = await Promise.all([
    marketingShowcaseService.listPublished(),
    marketingShowcaseService.listCategories()
  ]);

  return <CasesPageClient works={works} categories={categories} />;
}
