import { FaqPage } from "@/components/marketing/faq/faq-page";
import { getLocale, type SearchParams } from "@/lib/i18n";

export const revalidate = 3600;

export default async function FaqRoute({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  return <FaqPage locale={locale} />;
}
