import { CreatorsShowcaseGallery } from "@/components/marketing/creators-showcase-gallery";
import { MarketingDocsHero } from "@/components/marketing/docs/marketing-docs-hero";
import { MarketingDocsShell } from "@/components/marketing/docs/marketing-docs-shell";
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
  const t = casesCopy(locale);
  const initialPlayId = typeof params.play === "string" ? params.play : undefined;
  const [works, categories] = await Promise.all([
    marketingShowcaseService.listPublished(),
    marketingShowcaseService.listCategories()
  ]);

  return (
    <MarketingDocsShell locale={locale} active="cases">
      <MarketingDocsHero eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} variant="white" />
      <div className="mt-6">
        <CreatorsShowcaseGallery
          locale={locale}
          works={works}
          categories={categories}
          initialPlayId={initialPlayId}
        />
      </div>
    </MarketingDocsShell>
  );
}
