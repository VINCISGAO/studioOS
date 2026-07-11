import { PartnersPage } from "@/components/marketing/partners/partners-page";
import { getLocale, type SearchParams } from "@/lib/i18n";

export const revalidate = 3600;

export default async function ResourcesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  return <PartnersPage locale={locale} />;
}
