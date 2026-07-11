import { AboutPage } from "@/components/marketing/about/about-page";
import { getLocale, type SearchParams } from "@/lib/i18n";

export const revalidate = 3600;

type AboutPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function AboutRoute({ searchParams }: AboutPageProps) {
  const locale = getLocale(await searchParams);
  return <AboutPage locale={locale} />;
}
