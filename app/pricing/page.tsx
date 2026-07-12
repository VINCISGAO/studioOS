import { PricingPageView } from "@/components/marketing/pricing/pricing-page";
import { marketingDocsMetadata } from "@/lib/marketing/marketing-docs-metadata";
import { getLocale, type SearchParams } from "@/lib/i18n";
import type { Metadata } from "next";

export const revalidate = 3600;

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const locale = getLocale(await searchParams);
  return marketingDocsMetadata(locale, "pricing");
}

export default async function PricingPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  return <PricingPageView locale={locale} />;
}
