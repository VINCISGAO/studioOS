import { PartnersPage } from "@/components/marketing/partners/partners-page";
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
  return buildMarketingDocsRouteMetadata("resources", "/resources", searchParams);
}

export default async function ResourcesRoute({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await resolveMarketingDocsRouteLocale(searchParams);
  return <PartnersPage locale={locale} />;
}
