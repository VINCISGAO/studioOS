"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CasesShowcasePage } from "@/components/marketing/cases/cases-showcase-page";
import { MarketingCasesShell } from "@/components/marketing/cases/marketing-cases-shell";
import type { MarketingShowcaseWorkDto } from "@/features/marketing-showcase/marketing-showcase.types";
import { casesCopy } from "@/lib/marketing/cases-copy";
import { useMarketingPageLocale } from "@/hooks/use-marketing-page-locale";

function CasesPageInner({
  works,
  categories
}: {
  works: MarketingShowcaseWorkDto[];
  categories: string[];
}) {
  const locale = useMarketingPageLocale();
  const searchParams = useSearchParams();
  const copy = casesCopy(locale);
  const playParam = searchParams.get("play");
  const initialPlayId = playParam && playParam.length > 0 ? playParam : undefined;

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

export function CasesPageClient({
  works,
  categories
}: {
  works: MarketingShowcaseWorkDto[];
  categories: string[];
}) {
  return (
    <Suspense fallback={null}>
      <CasesPageInner works={works} categories={categories} />
    </Suspense>
  );
}
