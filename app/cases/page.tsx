import { CasesShowcasePage } from "@/components/marketing/cases/cases-showcase-page";
import { MarketingCasesShell } from "@/components/marketing/cases/marketing-cases-shell";
import { marketingShowcaseService } from "@/features/marketing-showcase/marketing-showcase.service";
import { casesCopy } from "@/lib/marketing/cases-copy";
import { marketingDocsMetadata } from "@/lib/marketing/marketing-docs-metadata";
import { getLocale, type SearchParams } from "@/lib/i18n";
import type { Metadata } from "next";

export const revalidate = 3600;

type CasesPageProps = {
  searchParams: Promise<SearchParams & { play?: string }>;
};

export async function generateMetadata({ searchParams }: CasesPageProps): Promise<Metadata> {
  const locale = getLocale(await searchParams);
  return marketingDocsMetadata(locale, "cases");
}

export default async function CasesPage({ searchParams }: CasesPageProps) {
  const params = await searchParams;
  const locale = getLocale(params);
  const copy = casesCopy(locale);
  const initialPlayId = typeof params.play === "string" ? params.play : undefined;
  const [works, categories] = await Promise.all([
    marketingShowcaseService.listPublished(),
    marketingShowcaseService.listCategories()
  ]);

  return (
    <MarketingCasesShell locale={locale} backLabel={copy.backHome}>
      <CasesShowcasePage
        locale={locale}
        copy={copy}
        works={works}
        categories={categories}
        initialPlayId={initialPlayId}
      />
    </MarketingCasesShell>
  );
}
