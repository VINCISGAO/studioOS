import { AboutPage } from "@/components/marketing/about/about-page";
import { marketingDocsMetadata } from "@/lib/marketing/marketing-docs-metadata";
import { getLocale, type SearchParams } from "@/lib/i18n";
import type { Metadata } from "next";

export const revalidate = 3600;

type AboutPageProps = {
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({ searchParams }: AboutPageProps): Promise<Metadata> {
  const locale = getLocale(await searchParams);
  return marketingDocsMetadata(locale, "about");
}

export default async function AboutRoute({ searchParams }: AboutPageProps) {
  const locale = getLocale(await searchParams);
  return <AboutPage locale={locale} />;
}
