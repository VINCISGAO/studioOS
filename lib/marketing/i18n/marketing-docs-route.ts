import type { Metadata } from "next";
import type { SearchParams } from "@/lib/i18n";
import { getMarketingPageLocale } from "@/lib/marketing/i18n/marketing-page-locale";
import { marketingSeoMetadata } from "@/lib/marketing/marketing-seo-metadata";
import type { MarketingDocsNavKey } from "@/lib/marketing/marketing-docs-nav";

export async function buildMarketingDocsRouteMetadata(
  page: MarketingDocsNavKey,
  path: string,
  searchParams?: Promise<SearchParams>
): Promise<Metadata> {
  const locale = await getMarketingPageLocale(await searchParams);
  return marketingSeoMetadata(locale, page, path);
}

export async function resolveMarketingDocsRouteLocale(searchParams?: Promise<SearchParams>) {
  return getMarketingPageLocale(await searchParams);
}
