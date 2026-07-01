import { Suspense } from "react";
import { BrandTeamHub } from "@/components/studioos/brand-team-hub";
import { getLocale, type SearchParams } from "@/lib/i18n";
import { BRAND_TEAM_DEMO_MEMBERS, buildBrandTeamStatCards } from "@/lib/studioos/brand-team-ui";

export default async function BrandTeamPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-zinc-100" />}>
      <BrandTeamHub
        locale={locale}
        members={BRAND_TEAM_DEMO_MEMBERS}
        statCards={buildBrandTeamStatCards(locale)}
      />
    </Suspense>
  );
}
