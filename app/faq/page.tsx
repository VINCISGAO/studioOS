import { FaqPage } from "@/components/marketing/faq/faq-page";
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
  return marketingDocsMetadata(locale, "faq");
}

export default async function FaqRoute({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  return <FaqPage locale={locale} />;
}
