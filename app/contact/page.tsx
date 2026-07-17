import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { contactCopy } from "@/lib/marketing/contact-copy.resolver";
import { buildContactJsonLdGraph } from "@/lib/marketing/structured-data/contact";
import { JsonLdScript } from "@/lib/marketing/structured-data/json-ld-script";
import { getMarketingPageLocale } from "@/lib/marketing/i18n/marketing-page-locale";
import { contactSeoMetadata } from "@/lib/marketing/marketing-seo-metadata";
import type { SearchParams } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { toUiLocale } from "@/lib/app-language.shared";
import type { Metadata } from "next";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const locale = await getMarketingPageLocale(await searchParams);
  return contactSeoMetadata(locale);
}

export default async function ContactPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getMarketingPageLocale(await searchParams);
  const copy = contactCopy(locale);
  const uiLocale = toUiLocale(locale);

  return (
    <>
      <JsonLdScript data={buildContactJsonLdGraph(locale)} />
      <MarketingShell locale={uiLocale}>
        <main className="mx-auto max-w-xl px-4 py-20 sm:px-6">
          <h1 className="text-4xl font-semibold tracking-tight">{copy.title}</h1>
          <p className="mt-4 text-zinc-500">{copy.subtitle}</p>
          <Card className="mt-10 border-zinc-200/80 shadow-none">
            <CardContent className="space-y-4 p-8">
              <p className="text-sm text-zinc-600">{copy.emailLabel}</p>
              <Button asChild className="w-full rounded-full">
                <Link href={withLocale("/brand/brief/new", uiLocale)}>{copy.cta}</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </MarketingShell>
    </>
  );
}
