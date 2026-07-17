import { ProcessPage } from "@/components/marketing/process/process-page";
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
  return buildMarketingDocsRouteMetadata("process", "/how-it-works", searchParams);
}

export default async function HowItWorksRoute({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await resolveMarketingDocsRouteLocale(searchParams);
  return <ProcessPage locale={locale} />;
}
