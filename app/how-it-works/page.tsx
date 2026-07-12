import { ProcessPage } from "@/components/marketing/process/process-page";
import { marketingDocsMetadata } from "@/lib/marketing/marketing-docs-metadata";
import { getLocale, type SearchParams } from "@/lib/i18n";
import type { Metadata } from "next";

export const revalidate = 3600;

type HowItWorksPageProps = {
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({ searchParams }: HowItWorksPageProps): Promise<Metadata> {
  const locale = getLocale(await searchParams);
  return marketingDocsMetadata(locale, "process");
}

export default async function HowItWorksPage({ searchParams }: HowItWorksPageProps) {
  const locale = getLocale(await searchParams);
  return <ProcessPage locale={locale} />;
}
