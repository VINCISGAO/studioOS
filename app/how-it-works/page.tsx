import { ProcessPage } from "@/components/marketing/process/process-page";
import { getLocale, type SearchParams } from "@/lib/i18n";

export const revalidate = 3600;

type HowItWorksPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function HowItWorksPage({ searchParams }: HowItWorksPageProps) {
  const locale = getLocale(await searchParams);
  return <ProcessPage locale={locale} />;
}
